import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { OpenAI } from 'openai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY || "YOUR_GROQ_API_KEY", 
  baseURL: "https://api.groq.com/openai/v1",
});

const MANIFEST_PATH = path.join(__dirname, 'output', 'stories-manifest.json');
const QUIZ_DIR = path.join(__dirname, 'output', 'quizzes');

const delay = (ms) => new Promise(res => setTimeout(res, ms));

async function generateQuizForStory(story) {
  const quizPath = path.join(QUIZ_DIR, `${story.id}.json`);
  
  // Check if it already has 30 questions
  if (await fs.pathExists(quizPath)) {
    try {
      const existing = await fs.readJson(quizPath);
      if (existing.questions && existing.questions.length >= 30) {
        console.log(`Skipping ${story.title} - already has 30 questions`);
        return;
      }
    } catch (e) {
      console.log(`Corrupt quiz for ${story.title}, regenerating...`);
    }
  }

  console.log(`Generating 30 questions for: ${story.title}`);

  const slug = story.slug;
  const indexFile = path.join(__dirname, 'output', 'stories-index', `${slug}.json`);
  let storyContent = "Content not found.";
  if (await fs.pathExists(indexFile)) {
    const idx = await fs.readJson(indexFile);
    storyContent = idx.fullText || "Content missing.";
  }

  const prompt = `
You are an expert Islamic educator and curriculum developer for children.
I will provide you with a children's story in Urdu.
Your task is to generate EXACTLY 30 multiple-choice questions (MCQs) based STRICTLY on the text provided. Do not use outside knowledge.

Requirements:
1. The questions and options MUST be in correct Urdu text (not roman Urdu).
2. The questions should test comprehension, moral lessons, and specific details from the story.
3. Each question must have EXACTLY 4 options.
4. Provide the correct index (0 to 3).
5. Provide a short explanation (1-2 sentences) in Urdu of why the answer is correct based on the text.
6. YOU MUST OUTPUT ONLY VALID JSON! No markdown blocks, no text before or after.

JSON Format:
{
  "questions": [
    {
      "id": "q1",
      "question": "اردو سوال...",
      "options": [
        "پہلا آپشن",
        "دوسرا آپشن",
        "تیسرا آپشن",
        "چوتھا آپشن"
      ],
      "correctIndex": 0,
      "explanation": "اردو میں وضاحت..."
    }
  ]
}

Story Content:
Title: ${story.title}
Category: ${story.category}
Content:
${storyContent}
  `.trim();

  try {
    const response = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.3,
      response_format: { type: "json_object" },
    });

    let rawJson = response.choices[0].message.content.trim();
    const parsed = JSON.parse(rawJson);

    if (!parsed.questions || !Array.isArray(parsed.questions)) {
      throw new Error("Invalid format returned from AI.");
    }

    // Add unique IDs
    parsed.questions = parsed.questions.map((q, idx) => ({
      id: `q${idx + 1}`,
      question: q.question,
      options: q.options,
      correctIndex: q.correctIndex,
      explanation: q.explanation
    }));

    const finalQuiz = {
      storyId: story.id,
      questions: parsed.questions
    };

    await fs.ensureDir(QUIZ_DIR);
    await fs.writeJson(quizPath, finalQuiz, { spaces: 2 });
    console.log(`SUCCESS: Saved ${parsed.questions.length} questions for ${story.title}`);
    
  } catch (error) {
    console.error(`FAILED to generate quiz for ${story.title}:`, error.message);
  }
}

async function run() {
  const stories = await fs.readJson(MANIFEST_PATH);
  console.log(`Found ${stories.length} stories.`);

  for (let i = 0; i < stories.length; i++) {
    await generateQuizForStory(stories[i]);
    // Sleep to avoid rate limits
    await delay(3000);
  }
  
  console.log("All quizzes generated successfully!");
}

run();
