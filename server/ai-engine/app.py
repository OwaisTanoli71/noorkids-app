import os
import io
import torch
import librosa
from fastapi import FastAPI, UploadFile, File, Form
from pydantic import BaseModel
from transformers import WhisperProcessor, WhisperForConditionalGeneration
from fastapi.middleware.cors import CORSMiddleware
import traceback

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

MODEL_NAME = "tarteel-ai/whisper-base-ar-quran"

print(f"Loading Whisper model {MODEL_NAME}...")
try:
    processor = WhisperProcessor.from_pretrained(MODEL_NAME)
    model = WhisperForConditionalGeneration.from_pretrained(MODEL_NAME)
    model.config.forced_decoder_ids = None
    
    device = "cuda" if torch.cuda.is_available() else "cpu"
    model = model.to(device)
    print(f"Model loaded successfully on {device}!")
except Exception as e:
    print(f"Error loading model: {e}")
    # We allow the app to start even if model loading fails, for debugging.
    processor = None
    model = None

class EvaluateResponse(BaseModel):
    transcription: str
    error: str = None

@app.get("/")
def read_root():
    return {"status": "ok", "message": "NoorKids AI Engine Running"}

@app.post("/evaluate", response_model=EvaluateResponse)
async def evaluate_audio(
    audio: UploadFile = File(...),
    expected_text: str = Form(None)
):
    """
    Receives an audio file (typically webm or wav) and transcribes it using
    tarteel-ai/whisper-base-ar-quran.
    """
    if model is None or processor is None:
        return {"transcription": "", "error": "Model not loaded properly on the server."}
        
    try:
        audio_bytes = await audio.read()
        
        # Load audio using librosa (handles various formats via soundfile/audioread)
        # We need to resample to 16kHz for Whisper
        y, sr = librosa.load(io.BytesIO(audio_bytes), sr=16000)
        
        # Process input
        input_features = processor(
            y, sampling_rate=16000, return_tensors="pt"
        ).input_features.to(model.device)
        
        # Generate token ids
        predicted_ids = model.generate(input_features)
        
        # Decode token ids to text
        transcription = processor.batch_decode(predicted_ids, skip_special_tokens=True)[0]
        
        print(f"[EVALUATE] Transcribed: {transcription}")
        
        return {
            "transcription": transcription,
            "error": None
        }
        
    except Exception as e:
        print(f"Evaluation error: {traceback.format_exc()}")
        return {"transcription": "", "error": str(e)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="127.0.0.1", port=8000, reload=True)
