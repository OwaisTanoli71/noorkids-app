import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OUTPUT_DIR = path.join(__dirname, '..', 'output', 'quran');
const MANIFEST_FILE = path.join(OUTPUT_DIR, 'manifest.json');

const DELAY_MS = 1000; // Be gentle to the free API
const delay = ms => new Promise(res => setTimeout(res, ms));

async function fetchWithRetry(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      return await res.json();
    } catch (e) {
      console.warn(`Attempt ${i + 1} failed for ${url}: ${e.message}`);
      if (i === retries - 1) throw e;
      await delay(DELAY_MS * 2);
    }
  }
}

async function main() {
  await fs.ensureDir(OUTPUT_DIR);

  console.log("Fetching surah list from Al Quran Cloud...");
  const metaRes = await fetchWithRetry('https://api.alquran.cloud/v1/surah');
  if (metaRes.code !== 200) {
    throw new Error("Failed to fetch surah list");
  }

  const manifest = [];
  const totalSurahs = 114;
  
  // We want Tajweed, English (Asad), Urdu (Jalandhry), and Audio (Alafasy)
  const editions = 'quran-tajweed,en.asad,ur.jalandhry,ar.alafasy';

  for (let i = 1; i <= totalSurahs; i++) {
    const filename = path.join(OUTPUT_DIR, `${i}.json`);
    
    // Simple idempotency check
    if (await fs.pathExists(filename)) {
      console.log(`Skipping Surah ${i} (already exists)...`);
      // We still need it in manifest, so we read it
      const existing = await fs.readJson(filename);
      manifest.push({
        number: existing.number,
        name: existing.name,
        englishName: existing.englishName,
        englishNameTranslation: existing.englishNameTranslation,
        revelationType: existing.revelationType,
        numberOfAyahs: existing.numberOfAyahs,
      });
      continue;
    }

    console.log(`Fetching Surah ${i}/${totalSurahs}...`);
    const url = `https://api.alquran.cloud/v1/surah/${i}/editions/${editions}`;
    const data = await fetchWithRetry(url);

    if (data.code !== 200 || !data.data || data.data.length !== 4) {
      throw new Error(`Invalid response for surah ${i}`);
    }

    const [tajweedData, englishData, urduData, audioData] = data.data;

    // Combine ayahs
    const combinedAyahs = tajweedData.ayahs.map((ayah, index) => {
      return {
        number: ayah.number,
        numberInSurah: ayah.numberInSurah,
        juz: ayah.juz,
        manzil: ayah.manzil,
        page: ayah.page,
        ruku: ayah.ruku,
        hizbQuarter: ayah.hizbQuarter,
        sajda: ayah.sajda,
        text: ayah.text, // Contains tajweed tags
        translation: {
          en: englishData.ayahs[index].text,
          ur: urduData.ayahs[index].text
        },
        audio: audioData.ayahs[index].audio,
        audioSecondary: audioData.ayahs[index].audioSecondary
      };
    });

    const surahDoc = {
      number: tajweedData.number,
      name: tajweedData.name,
      englishName: tajweedData.englishName,
      englishNameTranslation: tajweedData.englishNameTranslation,
      revelationType: tajweedData.revelationType,
      numberOfAyahs: tajweedData.numberOfAyahs,
      ayahs: combinedAyahs
    };

    await fs.writeJson(filename, surahDoc, { spaces: 2 });
    
    manifest.push({
      number: surahDoc.number,
      name: surahDoc.name,
      englishName: surahDoc.englishName,
      englishNameTranslation: surahDoc.englishNameTranslation,
      revelationType: surahDoc.revelationType,
      numberOfAyahs: surahDoc.numberOfAyahs,
    });

    // Polite delay for the public API
    await delay(DELAY_MS);
  }

  await fs.writeJson(MANIFEST_FILE, manifest, { spaces: 2 });
  
  console.log(`\n=== Build Summary ===`);
  console.log(`Successfully processed ${manifest.length} surahs.`);
  console.log(`Manifest saved to ${MANIFEST_FILE}`);
}

main().catch(e => {
  console.error("Build failed:", e);
  process.exit(1);
});
