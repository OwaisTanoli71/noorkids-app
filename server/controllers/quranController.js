import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import OpenAI from 'openai';
import { createReadStream } from 'fs';
import axios from 'axios';
import FormData from 'form-data';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const QURAN_DIR = path.join(__dirname, '..', 'output', 'quran');
const MANIFEST_FILE = path.join(QURAN_DIR, 'manifest.json');

// In-memory cache
let manifestCache = null;
const surahCache = new Map();

export const getManifest = async (req, res) => {
  try {
    if (!manifestCache) {
      if (await fs.pathExists(MANIFEST_FILE)) {
        manifestCache = await fs.readJson(MANIFEST_FILE);
      } else {
        return res.status(404).json({ error: "Quran data not built yet." });
      }
    }
    res.json(manifestCache);
  } catch (err) {
    console.error("Error serving manifest:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getSurah = async (req, res) => {
  try {
    const num = parseInt(req.params.number, 10);
    if (isNaN(num) || num < 1 || num > 114) {
      return res.status(400).json({ error: "Invalid surah number" });
    }

    if (surahCache.has(num)) {
      return res.json(surahCache.get(num));
    }

    const filepath = path.join(QURAN_DIR, `${num}.json`);
    if (await fs.pathExists(filepath)) {
      const data = await fs.readJson(filepath);
      surahCache.set(num, data);
      return res.json(data);
    } else {
      return res.status(404).json({ error: "Surah not found" });
    }
  } catch (err) {
    console.error(`Error serving surah ${req.params.number}:`, err);
    res.status(500).json({ error: "Internal server error" });
  }
};

import https from 'https';
import http from 'http';

export const proxyAudio = (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: "No URL provided" });

  const client = url.startsWith('https') ? https : http;
  
  client.get(url, (proxyRes) => {
    if (proxyRes.statusCode !== 200) {
      return res.status(proxyRes.statusCode).json({ error: "Failed to fetch audio" });
    }
    
    // Pass headers along with explicit CORS and caching
    res.set('Content-Type', proxyRes.headers['content-type'] || 'audio/mpeg');
    res.set('Accept-Ranges', 'bytes');
    res.set('Content-Length', proxyRes.headers['content-length']);
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
    
    proxyRes.pipe(res);
  }).on('error', (e) => {
    console.error("Proxy error:", e);
    res.status(500).json({ error: "Internal server error" });
  });
};

// Normalization function
function normalizeArabic(text) {
  if (!text) return "";
  
  // Remove tajweed tags if any (from the original text)
  let cleanText = text.replace(/<[^>]*>/g, '');
  
  // Remove custom Tajweed bracket syntax (e.g. [h:1[ٱ] or [l[ل] or ])
  cleanText = cleanText.replace(/\[[a-zA-Z]+(:\d+)?\[/g, '');
  cleanText = cleanText.replace(/\]/g, '');
  
  // Specific Uthmani orthography mappings BEFORE stripping diacritics
  cleanText = cleanText.replace(/\u0648\u0670/g, '\u0627'); // Waw + Dagger Alif -> Alif
  cleanText = cleanText.replace(/\u064A\u0670/g, '\u0627'); // Ya + Dagger Alif -> Alif
  cleanText = cleanText.replace(/\u0670/g, '\u0627'); // Dagger Alif -> Alif
  
  // Remove diacritics (tashkeel)
  cleanText = cleanText.replace(/[\u064B-\u065F\u06D6-\u06ED]/g, '');
  
  // Normalize visually similar characters
  cleanText = cleanText.replace(/[\u0622\u0623\u0625\u0671\u0672\u0673]/g, '\u0627'); // Alif variants to Alif
  cleanText = cleanText.replace(/\u0629/g, '\u0647'); // Ta Marbuta to Ha
  cleanText = cleanText.replace(/\u064A/g, '\u0649'); // Ya to Alif Maqsura (or vice versa, just consistency)
  cleanText = cleanText.replace(/\u0624/g, '\u0648'); // Waw with Hamza to Waw
  cleanText = cleanText.replace(/\u0626/g, '\u064A'); // Ya with Hamza to Ya
  
  // Remove Tatweel (Kashida)
  cleanText = cleanText.replace(/\u0640/g, '');
  
  // Remove Arabic punctuation (comma, semicolon, question mark) and standard punctuation
  cleanText = cleanText.replace(/[\u060C\u061B\u061F\.,!\?]/g, '');
  
  // Remove all non-arabic word characters, just keep spaces
  cleanText = cleanText.replace(/[^\u0600-\u06FF\s]/g, '');
  
  return cleanText.trim();
}

// Simple sequence alignment (diff) function word by word
function alignWords(expectedNorm, actualNorm, expectedOriginal) {
  const expWords = expectedNorm.split(/\s+/).filter(Boolean);
  const actWords = actualNorm.split(/\s+/).filter(Boolean);
  
  // Strip the bracket syntax from expectedOriginal for UI display only (so it doesn't look garbled)
  let cleanOriginal = expectedOriginal;
  cleanOriginal = cleanOriginal.replace(/\[[a-zA-Z]+(:\d+)?\[/g, '');
  cleanOriginal = cleanOriginal.replace(/\]/g, '');
  const origWords = cleanOriginal.split(/\s+/).filter(Boolean);
  
  const result = [];
  let actIndex = 0;
  let correctCount = 0;
  
  for (let i = 0; i < expWords.length; i++) {
    const e = expWords[i];
    let matched = false;
    
    // Look ahead a bit to find a match (tolerate missing words)
    for (let j = actIndex; j < Math.min(actWords.length, actIndex + 3); j++) {
      if (e === actWords[j]) {
        matched = true;
        actIndex = j + 1; // Move pointer past the matched word
        break;
      }
    }
    
    // Fallback if origWords doesn't line up perfectly due to spacing
    const displayWord = origWords[i] || e;
    
    if (matched) {
      result.push({ word: displayWord, matched: true, index: i });
      correctCount++;
    } else {
      result.push({ word: displayWord, matched: false, index: i });
    }
  }
  
  const score = expWords.length > 0 ? Math.round((correctCount / expWords.length) * 100) : 0;
  return { result, score };
}

export const gradeRecitation = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No audio file provided." });
    }
    
    const { targetText } = req.body;
    if (!targetText) {
      return res.status(400).json({ error: "Target text is required." });
    }

    if (!process.env.OPENAI_API_KEY) {
      // Mock response if no key is present to prevent breaking
      return res.json({
        score: 85,
        transcript: "Mock transcript due to missing OpenAI key",
        words: alignWords(normalizeArabic(targetText), normalizeArabic(targetText)).result
      });
    }

    // OpenAI requires the file to have a valid audio extension
    const tempPathWithExt = req.file.path + '.webm';
    await fs.rename(req.file.path, tempPathWithExt);
    const audioStream = createReadStream(tempPathWithExt);

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    const cleanPromptText = normalizeArabic(targetText);

    let transcription = "";
    try {
      const formData = new FormData();
      formData.append('audio', createReadStream(tempPathWithExt));
      formData.append('expected_text', cleanPromptText);

      console.log("Sending audio to local AI Engine for evaluation...");
      const aiResponse = await axios.post('http://127.0.0.1:8000/evaluate', formData, {
        headers: {
          ...formData.getHeaders()
        }
      });
      
      transcription = aiResponse.data.transcription;
      if (aiResponse.data.error) {
         console.warn("AI Engine Warning:", aiResponse.data.error);
      }
    } catch (aiError) {
      console.error("AI Engine Error, falling back to mock:", aiError.message);
      // Fallback if python server is not running
      transcription = "Mock transcript due to AI engine failure";
    }

    const normalizedTarget = normalizeArabic(targetText);
    const normalizedActual = normalizeArabic(transcription);
    
    console.log("=== RECITATION GRADING DEBUG ===");
    console.log("Target Original:", targetText);
    console.log("Cleaned Prompt:", cleanPromptText);
    console.log("Whisper Output:", transcription);
    console.log("Norm Target:", normalizedTarget);
    console.log("Norm Actual:", normalizedActual);

    const { result, score } = alignWords(normalizedTarget, normalizedActual, targetText);
    console.log("Final Score:", score);
    console.log("================================");

    // Clean up temp file
    fs.unlink(tempPathWithExt, (err) => {
      if (err) console.error("Error deleting temp audio file:", err);
    });

    res.json({
      score,
      transcript: transcription,
      words: result
    });

  } catch (err) {
    console.error("Error grading recitation:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};
