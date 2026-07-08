import { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getQuiz, submitQuiz } from "../services/quiz";
import { AuthContext } from "../context/AuthContext";
import { updateUserProfile } from "../services/profile";
import { Loader2, AlertCircle, ArrowLeft, Trophy, Star, BookOpen, CheckCircle2, XCircle } from "lucide-react";

function Quiz() {
  const { storyId } = useParams();
  const navigate = useNavigate();
  const { user, profile } = useContext(AuthContext);
  
  const [quizData, setQuizData] = useState(null);
  const [story, setStory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);
  
  // Track all results for the final screen
  const [allResults, setAllResults] = useState([]);
  const [isFinished, setIsFinished] = useState(false);
  const [hasSavedProgress, setHasSavedProgress] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        // Fetch both quiz and story metadata
        const [quiz, storyRes] = await Promise.all([
          getQuiz(storyId),
          fetch(`http://localhost:5000/api/stories/${storyId}`).then(r => r.ok ? r.json() : null)
        ]);
        
        setQuizData(quiz);
        setStory(storyRes);
      } catch (err) {
        if (err.response && err.response.status === 404) {
          setError("Quiz for this story isn't ready yet!");
        } else {
          setError("Something went wrong loading the quiz.");
        }
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [storyId]);

  const handleOptionSelect = async (index) => {
    if (feedback || isSubmitting) return; 
    setSelectedOption(index);
    setIsSubmitting(true);
    
    const questionId = quizData.questions[currentQuestionIndex].id;
    
    try {
      const response = await submitQuiz(storyId, [{ questionId, selectedIndex: index }]);
      const result = response.results[0];
      setFeedback(result);
      setAllResults(prev => [...prev, result]);
    } catch (err) {
      console.error("Failed to check answer", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < quizData.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedOption(null);
      setFeedback(null);
    } else {
      setIsFinished(true);
    }
  };

  const handleTryAgain = () => {
    setCurrentQuestionIndex(0);
    setSelectedOption(null);
    setFeedback(null);
    setAllResults([]);
    setIsFinished(false);
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col justify-center items-center text-white">
        <Loader2 size={64} className="text-amber-400 animate-spin mb-6" />
        <h2 className="text-2xl font-bold text-amber-300">Getting your quiz ready...</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[70vh] flex flex-col justify-center items-center text-white text-center px-4">
        <AlertCircle size={80} className="text-red-400 mb-6" />
        <h2 className="text-3xl font-bold text-amber-300 mb-8">{error}</h2>
        <button 
          onClick={() => navigate(`/story/${storyId}`)}
          className="flex items-center gap-2 bg-white/10 border border-white/20 px-8 py-4 rounded-full hover:bg-white/20 font-bold transition-all"
        >
          <ArrowLeft size={20} /> Back to Story
        </button>
      </div>
    );
  }

  // --- RESULTS SCREEN ---
  useEffect(() => {
    if (isFinished && !hasSavedProgress && profile) {
      setHasSavedProgress(true);
      const score = allResults.filter(r => r.correct).length;
      const earnedXp = score * 10;
      
      updateUserProfile(user.id, {
        xp: (profile.xp || 0) + earnedXp,
        storiesRead: (profile.storiesRead || 0) + 1
      }).catch(err => console.error("Failed to save progress", err));
    }
  }, [isFinished, hasSavedProgress, profile, allResults, user?.id]);

  if (isFinished) {
    const score = allResults.filter(r => r.correct).length;
    const total = quizData.questions.length;
    
    let message = "";
    if (score === total) {
      message = "Amazing! You really know this story!";
    } else if (score >= total / 2) {
      message = "Great job! You remembered a lot!";
    } else {
      message = "Nice try! Want to read the story again and try once more?";
    }

    return (
      <div className="max-w-2xl mx-auto p-4 md:p-10 mt-10">
        <div className="glass-panel rounded-[3rem] p-10 text-center text-white">
          <div className="w-32 h-32 mx-auto bg-amber-400/20 rounded-full flex items-center justify-center mb-8 border border-amber-400/30 shadow-[0_0_50px_rgba(251,191,36,0.3)]">
            <Trophy size={64} className="text-amber-400" />
          </div>
          <h1 className="text-4xl font-bold text-amber-300 mb-2">Quiz Complete!</h1>
          <h2 className="text-6xl font-black text-white mb-6 drop-shadow-md">{score} / {total}</h2>
          <p className="text-xl mb-12 text-slate-300 font-medium">{message}</p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={handleTryAgain}
              className="flex-1 flex items-center justify-center gap-2 bg-white/10 border border-white/20 px-8 py-4 rounded-full text-lg font-bold hover:bg-white/20 transition-all"
            >
              Try Again
            </button>
            <button 
              onClick={() => navigate(`/story/${storyId}`)}
              className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-amber-400 to-amber-500 text-slate-900 px-8 py-4 rounded-full text-lg font-bold hover:scale-105 transition-all shadow-lg"
            >
              <BookOpen size={20} /> Back to Story
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- QUESTION FLOW ---
  const currentQuestion = quizData.questions[currentQuestionIndex];
  const progressPercent = ((currentQuestionIndex) / quizData.questions.length) * 100;

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-10 mt-4 md:mt-8">
      
      {/* Header */}
      <div className="mb-8 text-white">
        <h1 className="text-2xl md:text-3xl font-bold text-amber-400 mb-4 flex items-center gap-3">
          <BookOpen className="text-amber-400" /> {story ? story.title : "Quiz"}
        </h1>
        <div className="flex justify-between items-center text-sm font-bold text-slate-400 mb-3 uppercase tracking-wider">
          <span>Question {currentQuestionIndex + 1} of {quizData.questions.length}</span>
        </div>
        <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden border border-white/5">
          <div 
            className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Question Card */}
      <div className="glass-panel rounded-[2.5rem] p-6 md:p-10 text-white" dir="auto">
        <h2 className="text-2xl md:text-3xl font-bold mb-10 leading-snug text-slate-100">
          {currentQuestion.question}
        </h2>

        <div className="flex flex-col gap-4 mb-8">
          {currentQuestion.options.map((opt, index) => {
            
            let btnClass = "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20 text-slate-200";
            let Icon = null;
            
            if (feedback) {
              if (index === feedback.correctIndex) {
                btnClass = "bg-emerald-500/20 border-emerald-500/50 text-emerald-300"; 
                Icon = CheckCircle2;
              } else if (index === selectedOption && !feedback.correct) {
                btnClass = "bg-rose-500/20 border-rose-500/50 text-rose-300";
                Icon = XCircle;
              } else {
                btnClass = "bg-white/5 opacity-40 border-transparent text-slate-400"; 
              }
            } else if (selectedOption === index) {
              btnClass = "bg-amber-500/20 border-amber-500/50 text-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.2)] scale-[1.02]";
            }

            return (
              <button
                key={index}
                onClick={() => handleOptionSelect(index)}
                disabled={!!feedback || isSubmitting}
                className={`
                  w-full flex items-center justify-between p-5 rounded-2xl border-2 text-lg md:text-xl font-medium
                  transition-all duration-300 ease-out
                  ${btnClass}
                `}
                dir="auto"
              >
                <span>{opt}</span>
                {Icon && <Icon className="shrink-0 ml-4" />}
              </button>
            );
          })}
        </div>

        {/* Feedback Section */}
        {feedback && (
          <div className={`p-6 rounded-2xl mb-8 border animate-in fade-in slide-in-from-bottom-4 duration-300 ${feedback.correct ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-rose-500/10 border-rose-500/30'}`}>
            <h3 className={`text-xl md:text-2xl font-bold mb-3 flex items-center gap-2 ${feedback.correct ? 'text-emerald-400' : 'text-rose-400'}`}>
              {feedback.correct ? (
                <><Star className="fill-emerald-400" /> Brilliant!</>
              ) : (
                <><BookOpen /> Let's learn!</>
              )}
            </h3>
            <p className="text-lg md:text-xl text-slate-200 leading-relaxed font-medium">{feedback.explanation}</p>
          </div>
        )}

        {/* Action Button */}
        <div className="flex justify-end mt-4">
          {feedback && (
            <button
              onClick={handleNextQuestion}
              className="bg-gradient-to-r from-amber-400 to-amber-500 text-slate-900 px-8 py-4 rounded-full text-lg font-bold hover:scale-105 transition-all shadow-lg flex items-center gap-2"
            >
              {currentQuestionIndex < quizData.questions.length - 1 ? "Next Question" : "See Results"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default Quiz;