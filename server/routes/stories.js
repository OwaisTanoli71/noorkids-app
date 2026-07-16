import express from "express";
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MANIFEST_FILE = path.join(__dirname, '..', 'output', 'stories-manifest.json');

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    if (await fs.pathExists(MANIFEST_FILE)) {
      const manifest = await fs.readJson(MANIFEST_FILE);
      res.json(manifest);
    } else {
      res.json([]);
    }
  } catch (error) {
    console.error("Error reading manifest:", error);
    res.status(500).json({ error: "Failed to load stories" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    if (await fs.pathExists(MANIFEST_FILE)) {
      const manifest = await fs.readJson(MANIFEST_FILE);
      const story = manifest.find(s => s.id === req.params.id);
      if (story) {
        const indexFile = path.join(__dirname, '..', 'output', 'stories-index', `${story.slug}.json`);
        if (await fs.pathExists(indexFile)) {
          const storyData = await fs.readJson(indexFile);
          res.json({ 
            ...story, 
            content: storyData.fullText,
            englishContent: storyData.englishContent,
            englishTitle: storyData.englishTitle
          });
        } else {
          res.json(story);
        }
      } else {
        res.status(404).json({ error: "Story not found" });
      }
    } else {
      res.status(404).json({ error: "Story not found" });
    }
  } catch (error) {
    console.error("Error reading manifest:", error);
    res.status(500).json({ error: "Failed to load story" });
  }
});

router.get("/:id/audio", async (req, res) => {
  try {
    const audioPath = path.join(__dirname, '..', 'output', 'audio', `${req.params.id}.mp3`);
    
    if (!await fs.pathExists(audioPath)) {
      return res.status(404).json({ error: "Audio for this story isn't ready yet." });
    }

    const stat = await fs.stat(audioPath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      
      if (start >= fileSize) {
        res.status(416).send('Requested range not satisfiable\n'+start+' >= '+fileSize);
        return;
      }

      const chunksize = (end - start) + 1;
      const file = fs.createReadStream(audioPath, { start, end });
      const head = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': 'audio/mpeg',
      };

      res.writeHead(206, head);
      file.pipe(res);
    } else {
      const head = {
        'Content-Length': fileSize,
        'Content-Type': 'audio/mpeg',
      };
      res.writeHead(200, head);
      fs.createReadStream(audioPath).pipe(res);
    }
  } catch (error) {
    console.error("Error streaming audio:", error);
    res.status(500).json({ error: "Failed to stream audio" });
  }
});

router.get("/:id/timing", async (req, res) => {
  try {
    const timingPath = path.join(__dirname, '..', 'output', 'audio', `${req.params.id}-timing.json`);
    
    if (!await fs.pathExists(timingPath)) {
      return res.status(404).json({ error: "Timing data for this story isn't ready yet." });
    }

    const timingData = await fs.readJson(timingPath);
    res.json(timingData);
  } catch (error) {
    console.error("Error sending timing data:", error);
    res.status(500).json({ error: "Failed to load timing data" });
  }
});

export default router;
