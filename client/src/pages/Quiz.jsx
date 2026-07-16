import { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getQuiz, submitQuiz } from "../services/quiz";
import { AuthContext } from "../context/AuthContext";
import { updateUserProfile } from "../services/profile";
import { Loader2, AlertCircle, ArrowLeft, Trophy, Star, BookOpen, CheckCircle2, XCircle } from "lucide-react";

function Quiz() {
  const { storyId } = useParams();
  const navigate = useNavigate();
  const { user, profile, refreshProfile } = useContext(AuthContext);
  
  const [quizData, setQuizData] = useState(null);
  const [story, setStory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lang, setLang] = useState('ur');
  
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
          getQuiz(storyId, lang),
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
  }, [storyId, lang]);

  // Load saved progress
  useEffect(() => {
    if (quizData && user) {
      const savedState = localStorage.getItem(`quizState_${user.id}_${storyId}`);
      if (savedState) {
        try {
          const { savedIndex, savedResults } = JSON.parse(savedState);
          setCurrentQuestionIndex(savedIndex || 0);
          setAllResults(savedResults || []);
        } catch(e) {}
      }
    }
  }, [quizData, user, storyId]);

  // Save progress on change
  useEffect(() => {
    if (user && storyId && !isFinished) {
      // Only save if they actually started the quiz (index > 0 or they answered the first question)
      if (currentQuestionIndex > 0 || allResults.length > 0) {
        localStorage.setItem(`quizState_${user.id}_${storyId}`, JSON.stringify({
          savedIndex: currentQuestionIndex,
          savedResults: allResults
        }));
      }
    }
  }, [currentQuestionIndex, allResults, user, storyId, isFinished]);

  const handleOptionSelect = async (index) => {
    if (feedback || isSubmitting) return; 
    setSelectedOption(index);
    setIsSubmitting(true);
    
    const questionId = quizData.questions[currentQuestionIndex].id;
    
    try {
      const response = await submitQuiz(storyId, [{ questionId, selectedIndex: index }], lang);
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
    if (user) {
      localStorage.removeItem(`quizState_${user.id}_${storyId}`);
    }
  };

  // --- RESULTS SCREEN EFFECT ---
  // MUST be before early returns to obey Rules of Hooks!
  useEffect(() => {
    if (isFinished && !hasSavedProgress && profile) {
      setHasSavedProgress(true);
      const score = allResults.filter(r => r.correct).length;
      
      // They get 50 XP for reading + 10 XP per correct question
      const earnedXp = 50 + (score * 10);
      
      // Calculate streak
      const today = new Date().toISOString().split('T')[0];
      const storedLastRead = localStorage.getItem(`lastReadDate_${user.id}`);
      const lastRead = storedLastRead ? new Date(storedLastRead).toISOString().split('T')[0] : null;
      
      let newStreak = profile.streak || 0;
      if (lastRead !== today) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        
        if (lastRead === yesterdayStr) {
          newStreak += 1;
        } else {
          newStreak = 1;
        }
      }
      
      // Mark quiz as completed in localStorage (legacy simple array)
      const finishedQuizzes = JSON.parse(localStorage.getItem('completedQuizzes') || '[]');
      if (!finishedQuizzes.includes(storyId)) {
        localStorage.setItem('completedQuizzes', JSON.stringify([...finishedQuizzes, storyId]));
      }

      // Save detailed quiz record for the history page
      const quizRecords = JSON.parse(localStorage.getItem('quizRecords') || '[]');
      const newRecord = {
        storyId,
        title: story ? story.title : "Story Quiz",
        score,
        total: quizData.questions.length,
        date: new Date().toISOString()
      };
      localStorage.setItem('quizRecords', JSON.stringify([newRecord, ...quizRecords]));
      
      // Save lastReadDate locally since the db column is missing
      localStorage.setItem(`lastReadDate_${user.id}`, new Date().toISOString());

      // Clear the saved progress so they can retake from scratch next time
      localStorage.removeItem(`quizState_${user.id}_${storyId}`);

      updateUserProfile(user.id, {
        xp: (profile.xp || 0) + earnedXp,
        streak: newStreak
      })
      .then(() => {
        if (refreshProfile) refreshProfile();
      })
      .catch(err => console.error("Failed to save progress", err));
    }
  }, [isFinished, hasSavedProgress, profile, allResults, user?.id, storyId]);

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

  // --- RESULTS SCREEN RENDER ---
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
  const currentQuestion = quizData?.questions?.[currentQuestionIndex];
  
  if (!quizData || !currentQuestion) {
    return (
      <div className="min-h-[70vh] flex flex-col justify-center items-center text-white">
        <AlertCircle size={80} className="text-red-400 mb-6" />
        <h2 className="text-3xl font-bold text-amber-300 mb-8">No questions found in this quiz!</h2>
        <button 
          onClick={() => navigate(`/story/${storyId}`)}
          className="flex items-center gap-2 bg-white/10 border border-white/20 px-8 py-4 rounded-full hover:bg-white/20 font-bold transition-all"
        >
          <ArrowLeft size={20} /> Back to Story
        </button>
      </div>
    );
  }

  const progressPercent = ((currentQuestionIndex) / quizData.questions.length) * 100;

  return (
    <div className="max-w-3xl mx-auto p-4 md:px-6 md:py-4 mt-2 md:mt-4">
      
      {/* Header */}
      <div className="mb-4 text-white">
        <h1 className="text-xl md:text-2xl font-bold text-amber-400 mb-2 flex items-center gap-2">
          <BookOpen className="text-amber-400" size={20} /> {story ? story.title : "Quiz"}
        </h1>
        <div className="flex justify-between items-center text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">
          <span>Question {currentQuestionIndex + 1} of {quizData.questions.length}</span>
          
          {/* Language Toggle */}
          <div className="flex bg-white/10 rounded-lg p-1 border border-white/5 shadow-inner scale-90 origin-right">
            <button
              onClick={() => {
                if (lang !== 'ur') {
                  setLang('ur');
                  setFeedback(null);
                  setSelectedOption(null);
                }
              }}
              className={`px-3 py-1 rounded-md transition-all text-xs font-bold ${lang === 'ur' ? 'bg-amber-500 text-slate-900 shadow-sm' : 'text-slate-400 hover:text-white'}`}
            >
              اردو
            </button>
            <button
              onClick={() => {
                if (lang !== 'en') {
                  setLang('en');
                  setFeedback(null);
                  setSelectedOption(null);
                }
              }}
              className={`px-3 py-1 rounded-md transition-all text-xs font-bold ${lang === 'en' ? 'bg-indigo-500 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
            >
              EN
            </button>
          </div>
        </div>
        <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden border border-white/5">
          <div 
            className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Question Card */}
      <div className="bg-slate-900/95 border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.3)] backdrop-blur-none rounded-[2rem] p-5 md:p-8 text-white" dir={lang === 'ur' ? 'rtl' : 'ltr'}>
        <h2 className={`mb-6 text-slate-100 text-start ${lang === 'ur' ? 'font-urdu text-[1.4rem] md:text-[1.8rem] leading-[2.2rem] md:leading-[3rem]' : 'text-xl md:text-2xl font-bold leading-snug font-sans'}`}>
          {currentQuestion.question}
        </h2>

        <div className="flex flex-col gap-3 mb-4">
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
              btnClass = "bg-amber-500/20 border-amber-500/50 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.2)] scale-[1.01]";
            }

            return (
              <button
                key={index}
                onClick={() => handleOptionSelect(index)}
                disabled={feedback !== null || isSubmitting}
                className={`relative w-full text-start px-5 py-3 rounded-xl border-2 transition-all flex items-center justify-between ${btnClass} ${lang === 'ur' ? 'font-urdu text-[1.1rem] md:text-[1.25rem] leading-[1.6rem] md:leading-[2rem]' : 'font-sans text-sm font-medium'}`}
                dir={lang === 'ur' ? 'rtl' : 'ltr'}
              >
                <span>{opt}</span>
                {Icon && <Icon className="shrink-0 ml-3" size={18} />}
              </button>
            );
          })}
        </div>

        {/* Feedback Section */}
        {feedback && (
          <div className={`mt-4 p-4 rounded-xl border-2 animate-in fade-in slide-in-from-bottom-2 ${
              feedback.correct 
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-100' 
                : 'bg-red-500/10 border-red-500/20 text-red-100'
            }`}>
              <div className="flex items-start gap-3">
                <div className={`mt-0.5 shrink-0 ${feedback.correct ? 'text-emerald-400' : 'text-red-400'}`}>
                  {feedback.correct ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
                </div>
                <div>
                  <h3 className={`font-bold mb-1 ${feedback.correct ? 'text-emerald-400' : 'text-red-400'} ${lang === 'ur' ? 'font-urdu text-[1.4rem] md:text-[1.6rem]' : 'text-base'}`}>
                    {feedback.correct 
                      ? (lang === 'ur' ? 'بہت خوب! صحیح جواب!' : 'Awesome! Correct Answer!') 
                      : (lang === 'ur' ? 'غلط جواب!' : 'Incorrect!')}
                  </h3>
                  <p className={`text-slate-300 leading-snug ${lang === 'ur' ? 'font-urdu text-[1.2rem] md:text-[1.4rem] leading-relaxed' : 'font-sans text-sm'}`}>
                    {feedback.explanation}
                  </p>
                </div>
              </div>
            </div>
        )}

        {/* Action Button */}
        <div className="flex justify-end mt-4">
          {feedback && (
            <button
              onClick={handleNextQuestion}
              className="bg-gradient-to-r from-amber-400 to-amber-500 text-slate-900 px-6 py-2.5 rounded-full text-base font-bold hover:scale-105 transition-all shadow-md flex items-center gap-2"
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