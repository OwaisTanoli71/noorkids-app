import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import OpenAI from 'openai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const INDEX_DIR = path.join(__dirname, '../output/stories-index');
const MANIFEST_PATH = path.join(__dirname, '../output/stories-manifest.json');

async function translateText(text) {
  if (!text || text.trim() === '') return '';
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a professional translator. Translate the following Urdu text into engaging, easy-to-understand English suitable for children." },
        { role: "user", content: text }
      ],
      temperature: 0.3,
    });
    return response.choices[0].message.content.trim();
  } catch (error) {
    console.error("Error translating text:", error.message);
    return text;
  }
}

async function main() {
  console.log("Starting translation process...");
  
  if (!fs.existsSync(INDEX_DIR)) {
    console.error("Stories index directory not found:", INDEX_DIR);
    return;
  }

  const files = fs.readdirSync(INDEX_DIR).filter(f => f.endsWith('.json') && f !== '.json');
  let updatedCount = 0;

  for (const file of files) {
    const filePath = path.join(INDEX_DIR, file);
    try {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      let modified = false;

      // Translate Content - Re-translate if it's the exact same as fullText (failed groq run)
      if (!data.englishContent || data.englishContent === data.fullText) {
        console.log(`Translating content for: ${data.title}`);
        data.englishContent = await translateText(data.fullText);
        modified = true;
      }

      // Translate Moral Lesson
      if (!data.englishMoralLesson || data.englishMoralLesson === data.moralLesson) {
        console.log(`Translating moral lesson for: ${data.title}`);
        data.englishMoralLesson = await translateText(data.moralLesson);
        modified = true;
      }

      if (modified) {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
        console.log(`Saved translations for: ${data.title}`);
        updatedCount++;
      }
    } catch (err) {
      console.error(`Error processing file ${file}:`, err);
    }
  }

  console.log(`Successfully updated ${updatedCount} story files.`);

  // Also update manifest
  if (fs.existsSync(MANIFEST_PATH)) {
    console.log("Updating manifest...");
    try {
      const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
      let manifestModified = false;
      for (const item of manifest) {
        const filePath = path.join(INDEX_DIR, `${item.slug || item.id}.json`);
        if (fs.existsSync(filePath)) {
          const fileData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
          if (fileData.englishMoralLesson && item.englishMoralLesson !== fileData.englishMoralLesson) {
             item.englishMoralLesson = fileData.englishMoralLesson;
             manifestModified = true;
          }
        }
      }
      if (manifestModified) {
        fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2), 'utf8');
        console.log("Manifest updated successfully.");
      }
    } catch (err) {
      console.error("Error updating manifest:", err);
    }
  }
}

main().catch(console.error);
