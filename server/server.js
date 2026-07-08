import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

import aiRoutes from "./routes/ai.js";
import storiesRoutes from "./routes/stories.js";
import quizRoutes from "./routes/quiz.js";
import quranRoutes from "./routes/quran.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("🚀 NoorKids AI Server Running");
});

app.use("/api/ai", aiRoutes);
app.use("/api/stories", storiesRoutes);
app.use("/api/quiz", quizRoutes);
app.use("/api/quran", quranRoutes);

const PORT = 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});