import express from 'express';
import multer from 'multer';
import { getManifest, getSurah, gradeRecitation } from '../controllers/quranController.js';

// Setup multer for temporary audio file storage
const upload = multer({ dest: 'temp_audio/' });

const router = express.Router();

router.get('/surahs', getManifest);
router.get('/surah/:number', getSurah);
router.post('/practice', upload.single('audio'), gradeRecitation);

export default router;
