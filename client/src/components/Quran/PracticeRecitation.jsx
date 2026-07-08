import { useState, useRef } from 'react';
import { Mic, Square, Loader2, AlertCircle } from 'lucide-react';

export default function PracticeRecitation({ surahNumber, ayahNumber, targetText }) {
  const [isRecording, setIsRecording] = useState(false);
  const [isGrading, setIsGrading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [attemptCount, setAttemptCount] = useState(0);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const toggleRecording = async () => {
    if (isRecording) {
      // Stop recording
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
      }
      setIsRecording(false);
    } else {
      // Start recording
      setError(null);
      setResult(null);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.onstop = async () => {
          // Send to backend
          setIsGrading(true);
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          
          const formData = new FormData();
          // Provide a fake filename ending in .webm so multer handles it nicely
          formData.append('audio', audioBlob, 'recitation.webm');
          formData.append('targetText', targetText);

          try {
            const response = await fetch('http://localhost:5000/api/quran/practice', {
              method: 'POST',
              body: formData,
            });
            const data = await response.json();
            
            if (!response.ok) {
              throw new Error(data.error || "Failed to grade recitation");
            }
            
            setResult(data);
          } catch (err) {
            console.error("Grading error:", err);
            setError(err.message);
          } finally {
            setIsGrading(false);
            // Stop tracks to release microphone
            stream.getTracks().forEach(track => track.stop());
          }
        };

        mediaRecorder.start();
        setIsRecording(true);
        setAttemptCount(prev => prev + 1);
      } catch (err) {
        console.error("Mic access denied or error:", err);
        setError("Could not access microphone. Please allow permissions.");
      }
    }
  };

  return (
    <div className="bg-[#141824] rounded-2xl p-4 mt-4 border border-white/5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="font-semibold text-white">Practice Recitation</h4>
          <p className="text-xs text-slate-400">Read the Ayah out loud to check your accuracy.</p>
        </div>
        <button 
          onClick={toggleRecording}
          disabled={isGrading}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
            isRecording 
              ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-[0_0_15px_rgba(243,24,96,0.4)] animate-pulse' 
              : 'bg-amber-500 hover:bg-amber-600 text-slate-900 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
          }`}
        >
          {isGrading ? <Loader2 className="animate-spin" size={20} /> : isRecording ? <Square size={20} fill="currentColor" /> : <Mic size={20} fill="currentColor" />}
        </button>
      </div>

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 mt-4 flex items-center gap-3">
          <AlertCircle className="text-rose-400" />
          <p className="text-sm text-rose-300">{error}</p>
        </div>
      )}

      {result && (
        <div className="bg-[#0A0D14] rounded-xl p-5 mt-4 border border-white/5 space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
          
          {/* Header & Score */}
          <div className="flex items-start justify-between border-b border-white/5 pb-4">
            <div>
              <h5 className="text-white font-medium flex items-center gap-2 mb-1">
                {result.score > 80 ? '✨ Excellent!' : '⚠️ Good effort!'} 
                <span className="text-xs text-slate-500 font-normal">(Attempt #{attemptCount})</span>
              </h5>
              <p className="text-sm text-slate-400">
                {result.score > 80 
                  ? "Your pronunciation is highly accurate." 
                  : "You're close! Focus on pronunciation and rhythm."}
              </p>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-xs text-slate-500 mb-1">Accuracy Score</span>
              <span className={`text-2xl font-bold ${result.score > 80 ? 'text-emerald-400' : 'text-amber-500'}`}>
                {result.score}%
              </span>
            </div>
          </div>

          {/* Word Matching Visualization */}
          <div className="bg-white/[0.02] p-4 rounded-lg">
            <div className="flex flex-wrap gap-2 text-2xl font-nastaliq justify-end leading-loose" dir="rtl">
              {result.words.map((w, i) => (
                <span key={i} className={w.matched ? 'text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.3)]' : 'text-amber-500 opacity-60'}>
                  {w.word}
                </span>
              ))}
            </div>
          </div>

          {/* Tips Section */}
          <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-lg p-4">
            <h6 className="text-indigo-300 font-medium text-sm flex items-center gap-2 mb-3">
              💡 Tips:
            </h6>
            <ul className="text-sm text-slate-300 space-y-2 list-disc pl-5">
              <li>Listen to the reference pronunciation</li>
              <li>Speak clearly into the microphone</li>
              <li>Match the rhythm and tone</li>
              <li>Practice makes perfect!</li>
            </ul>
          </div>

          {/* Demo Footnote */}
          <div className="pt-2 border-t border-white/5 flex justify-center">
            <span className="text-[10px] text-slate-600 font-mono tracking-wider">
              Analyzed using MFCC + DTW + Cosine Similarity
            </span>
          </div>

        </div>
      )}
    </div>
  );
}
