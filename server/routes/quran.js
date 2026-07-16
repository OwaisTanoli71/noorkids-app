import express from 'express';
import multer from 'multer';
import { getManifest, getSurah, gradeRecitation, proxyAudio } from '../controllers/quranController.js';

// Setup multer for temporary audio file storage
const upload = multer({ dest: 'temp_audio/' });

const router = express.Router();

router.get('/surahs', getManifest);
router.get('/surah/:number', getSurah);
router.get('/audio', proxyAudio);
router.post('/practice', upload.single('audio'), gradeRecitation);

export default router;
