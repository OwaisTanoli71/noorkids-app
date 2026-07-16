import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const OUTPUT_DIR = path.join(__dirname, '..', 'output');
const INDEX_DIR = path.join(OUTPUT_DIR, 'stories-index');
const AUDIO_DIR = path.join(OUTPUT_DIR, 'audio');
const MANIFEST_FILE = path.join(OUTPUT_DIR, 'stories-manifest.json');

// Default ElevenLabs Voice ID (Adam or a default multilingual-compatible voice)
const VOICE_ID = "d0grukerEzs069eKIauC";

async function synthesizeSpeech(text) {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    throw new Error("ELEVENLABS_API_KEY is not defined in .env");
  }

  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}/with-timestamps?output_format=mp3_44100_128`, {
    method: 'POST',
    headers: {
      'xi-api-key': apiKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      text: text,
      model_id: "eleven_multilingual_v2",
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75
      }
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`ElevenLabs API Error: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  const audioBuffer = Buffer.from(data.audio_base64, 'base64');
  
  return {
    buffer: audioBuffer,
    alignment: data.alignment
  };
}

/**
 * Parse MP3 CBR frame headers to get exact audio duration in seconds.
 * This skips ID3 tags and counts actual audio frames.
 */
function getMp3Duration(buffer) {
  let offset = 0;
  // Skip ID3v2 tag if present
  if (buffer[0] === 0x49 && buffer[1] === 0x44 && buffer[2] === 0x33) {
    const id3Size =
      ((buffer[6] & 0x7f) << 21) |
      ((buffer[7] & 0x7f) << 14) |
      ((buffer[8] & 0x7f) << 7) |
      (buffer[9] & 0x7f);
    offset = 10 + id3Size;
  }
  let totalDuration = 0;
  while (offset + 4 < buffer.length) {
    const b0 = buffer[offset];
    const b1 = buffer[offset + 1];
    // MP3 sync word: 11 bits set
    if (b0 === 0xff && (b1 & 0xe0) === 0xe0) {
      const mpegVersion = (b1 >> 3) & 0x03;
      const layer = (b1 >> 1) & 0x03;
      const b2 = buffer[offset + 2];
      const bitrateIdx = (b2 >> 4) & 0x0f;
      const sampleRateIdx = (b2 >> 2) & 0x03;
      const padding = (b2 >> 1) & 0x01;

      const bitrateTable = [
        [0,32,64,96,128,160,192,224,256,288,320,352,384,416,448,0], // MPEG1 L1
        [0,32,48,56,64,80,96,112,128,160,192,224,256,320,384,0],   // MPEG1 L2
        [0,32,40,48,56,64,80,96,112,128,160,192,224,256,320,0],    // MPEG1 L3
      ];
      const sampleRateTable = [
        [44100, 48000, 32000], // MPEG1
        [22050, 24000, 16000], // MPEG2
        [11025, 12000, 8000],  // MPEG2.5
      ];

      const versionIdx = mpegVersion === 3 ? 0 : mpegVersion === 2 ? 1 : 2;
      const layerIdx = 3 - layer;
      if (layerIdx < 0 || layerIdx > 2 || bitrateIdx === 0 || bitrateIdx === 15) {
        offset++;
        continue;
      }
      const bitrate = bitrateTable[layerIdx][bitrateIdx] * 1000;
      const sampleRate = sampleRateTable[versionIdx][sampleRateIdx];
      if (!bitrate || !sampleRate) { offset++; continue; }

      const samplesPerFrame = layerIdx === 0 ? 384 : 1152;
      const frameSize = Math.floor((samplesPerFrame / 8) * bitrate / sampleRate) + padding;
      if (frameSize <= 0) { offset++; continue; }

      totalDuration += samplesPerFrame / sampleRate;
      offset += frameSize;
    } else {
      offset++;
    }
  }
  return totalDuration;
}

function extractWordTimings(alignment, timeOffset = 0) {
  const words = [];
  let currentWord = "";
  let wordStart = null;
  let wordEnd = null;

  if (!alignment || !alignment.characters) return words;

  for (let i = 0; i < alignment.characters.length; i++) {
    const char = alignment.characters[i];
    const isWhitespace = /[\s\n]/.test(char);

    if (currentWord === "") {
      wordStart = alignment.character_start_times_seconds[i];
    }
    wordEnd = alignment.character_end_times_seconds[i];
    currentWord += char;

    if (isWhitespace || i === alignment.characters.length - 1) {
      // Skip zero-duration words (ElevenLabs skipped them in synthesis)
      if (wordEnd > wordStart) {
        words.push({
          word: currentWord,
          start: wordStart + timeOffset,
          end: wordEnd + timeOffset
        });
      }
      currentWord = "";
      wordStart = null;
      wordEnd = null;
    }
  }
  return words;
}

// ElevenLabs v3 model often skips text if chunks are too long, especially for Urdu.
// We must keep chunks under ~2000 chars to ensure full synthesis.
function chunkUrduText(text, maxChars = 1500) {
  const chunks = [];
  let currentChunk = '';
  
  // Split by common Urdu/Arabic punctuation marks (full stop, question mark) or newlines
  const sentences = text.split(/([۔؟!:\n]+)/);

  for (let i = 0; i < sentences.length; i++) {
    const sentence = sentences[i];
    if (currentChunk.length + sentence.length > maxChars) {
      if (currentChunk.trim()) chunks.push(currentChunk.trim());
      currentChunk = sentence;
    } else {
      currentChunk += sentence;
    }
  }
  
  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

/**
 * Strip the ID3v2 tag from the beginning of an MP3 buffer.
 * Chunks 2+ must have ID3 stripped before concatenation, otherwise
 * the browser's audio timeline will drift from our calculated offsets.
 */
function stripId3(buffer) {
  if (buffer[0] === 0x49 && buffer[1] === 0x44 && buffer[2] === 0x33) {
    const id3Size =
      ((buffer[6] & 0x7f) << 21) |
      ((buffer[7] & 0x7f) << 14) |
      ((buffer[8] & 0x7f) << 7) |
      (buffer[9] & 0x7f);
    return buffer.slice(10 + id3Size);
  }
  return buffer;
}

export async function generateAudioForStory(storyId, slug, fullText, force = false) {
  const outputFile = path.join(AUDIO_DIR, `${storyId}.mp3`);
  const timingFile = path.join(AUDIO_DIR, `${storyId}-timing.json`);
  
  if (!force && await fs.pathExists(outputFile) && await fs.pathExists(timingFile)) {
    console.log(`[SKIP] Audio already exists for ${slug}`);
    return { status: 'skipped', chars: 0 };
  }

  console.log(`[PROCESS] Generating audio for ${slug}...`);
  
  // Strip the title (everything before "پیارے") so it's not read out loud
  let audioText = fullText;
  if (audioText.includes("پیارے") && audioText.indexOf("پیارے") < 150) {
    const parts = audioText.split("پیارے");
    audioText = "پیارے" + parts.slice(1).join("پیارے");
  }
  
  const chunks = chunkUrduText(audioText);
  const audioBuffers = [];
  const allWordTimings = [];
  let charCount = 0;
  let timeOffset = 0;

  for (let i = 0; i < chunks.length; i++) {
    console.log(`  -> Synthesizing chunk ${i + 1}/${chunks.length} using ElevenLabs...`);
    const { buffer, alignment } = await synthesizeSpeech(chunks[i]);
    audioBuffers.push(buffer);
    
    if (alignment && alignment.characters) {
      const words = extractWordTimings(alignment, timeOffset);
      allWordTimings.push(...words);
    }
    
    // Use actual MP3 frame parsing for accurate duration
    const chunkDuration = getMp3Duration(buffer);
    console.log(`     Chunk ${i+1} actual duration: ${chunkDuration.toFixed(3)}s`);
    timeOffset += chunkDuration;
    charCount += chunks[i].length;
  }

  // Keep ID3 header from first chunk only; strip from subsequent chunks.
  // Multiple ID3 tags in a stream confuse browser MP3 decoders and cause timeline drift.
  const buffersToConcat = audioBuffers.map((buf, i) => i === 0 ? buf : stripId3(buf));
  const finalBuffer = Buffer.concat(buffersToConcat);
  await fs.writeFile(outputFile, finalBuffer);
  await fs.writeFile(timingFile, JSON.stringify(allWordTimings, null, 2));
  
  console.log(`[SUCCESS] Saved ${storyId}.mp3 and timing data`);
  return { status: 'success', chars: charCount };
}

export async function generateAudio(storyId) {
  await fs.ensureDir(AUDIO_DIR);
  
  if (!await fs.pathExists(MANIFEST_FILE)) {
    throw new Error("stories-manifest.json not found.");
  }
  
  const manifest = await fs.readJson(MANIFEST_FILE);
  const story = manifest.find(s => s.id === storyId || s.slug === storyId);
  
  if (!story) {
    throw new Error(`Story ${storyId} not found in manifest.`);
  }

  const indexPath = path.join(INDEX_DIR, `${story.slug}.json`);
  if (!await fs.pathExists(indexPath)) {
    throw new Error("Story index file missing");
  }
  
  const indexData = await fs.readJson(indexPath);
  const storyText = indexData.fullText;
  
  const result = await generateAudioForStory(story.id, story.slug, storyText, true); // Admin generation forces update
  return result;
}

async function main() {
  await fs.ensureDir(AUDIO_DIR);

  const args = process.argv.slice(2);
  const force = args.includes('--force');
  const targetStorySlug = args.find(a => !a.startsWith('--'));

  if (!await fs.pathExists(MANIFEST_FILE)) {
    console.error("Manifest file not found. Run build:stories first.");
    return;
  }

  const manifest = await fs.readJson(MANIFEST_FILE);
  let totalCharsUsed = 0;
  let successCount = 0;
  let skipCount = 0;
  let failCount = 0;

  for (const story of manifest) {
    if (targetStorySlug && story.slug !== targetStorySlug) continue;

    const indexFile = path.join(INDEX_DIR, `${story.slug}.json`);
    if (!await fs.pathExists(indexFile)) continue;

    const storyData = await fs.readJson(indexFile);
    try {
      const result = await generateAudioForStory(story.id, story.slug, storyData.fullText, force);
      if (result.status === 'success') successCount++;
      if (result.status === 'skipped') skipCount++;
      totalCharsUsed += result.chars;
    } catch (err) {
      console.error(`[ERROR] Failed to process ${story.slug}:`, err.message);
      failCount++;
    }
  }

  console.log(`\n=== Audio Build Summary ===`);
  console.log(`Generated: ${successCount}`);
  console.log(`Skipped:   ${skipCount}`);
  console.log(`Failed:    ${failCount}`);
  console.log(`\nCumulative characters used this run: ${totalCharsUsed}`);
}

if (process.argv[1] === __filename) {
  main().catch(console.error);
}
