import RegisterForm from "../components/Auth/RegisterForm";
import { Moon, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

function Register() {
  return (
    <div className="h-screen flex items-center justify-center p-4 md:p-8 bg-[#050b18] relative overflow-hidden">
      
      {/* Background ambient glow */}
      <div className="absolute top-0 left-0 w-[800px] h-[800px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none mix-blend-screen -translate-x-1/3 -translate-y-1/3"></div>
      <div className="absolute bottom-0 right-0 w-[800px] h-[800px] bg-amber-500/10 rounded-full blur-[120px] pointer-events-none mix-blend-screen translate-x-1/3 translate-y-1/3"></div>

      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 bg-[#0a1128]/80 backdrop-blur-2xl border border-white/5 rounded-[2rem] shadow-2xl relative z-10 max-h-[90vh] overflow-hidden animate-fade-in-up">
        
        {/* Left Side - Brand Moment (Desktop Only) */}
        <div className="hidden lg:flex flex-col items-center justify-center relative p-8 bg-gradient-to-br from-indigo-900/30 via-[#0a1128] to-amber-900/10 border-r border-white/5 overflow-hidden">
          
          {/* Animated Night Sky Elements */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-500/5 via-transparent to-transparent opacity-80"></div>
          
          <div className="relative w-full max-w-sm flex flex-col items-center text-center z-10">
            
            {/* Glowing Moon Illustration */}
            <div className="relative w-36 h-36 mx-auto flex items-center justify-center mb-10 animate-pulse-slow">
              <div className="absolute inset-0 bg-amber-500/20 rounded-full blur-3xl"></div>
              <Moon className="w-32 h-32 text-amber-400 drop-shadow-[0_0_40px_rgba(251,191,36,0.6)] fill-amber-400/20 z-10" strokeWidth={1.5} />
              <Sparkles className="absolute -top-4 -right-4 w-10 h-10 text-amber-300 animate-pulse" />
              <Sparkles className="absolute bottom-4 left-4 w-6 h-6 text-indigo-300 animate-pulse delay-700" />
            </div>

            {/* Brand Text */}
            <h2 className="text-2xl font-semibold text-white mb-3">
              Join Our Community
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed max-w-xs mx-auto mb-8">
              Create a parent account to start your family's experience with NoorKids.
            </p>

            {/* Navigation back home */}
            <Link to="/" className="text-amber-500 hover:text-amber-400 transition-colors text-sm font-medium flex items-center gap-2 group">
              <span className="group-hover:-translate-x-1 transition-transform">←</span> Return to Home
            </Link>

          </div>
        </div>

        {/* Mobile-only Header */}
        <div className="lg:hidden flex flex-col items-center justify-center pt-10 pb-4 px-6 text-center border-b border-white/5 bg-gradient-to-br from-indigo-900/20 to-[#0a1128]">
          <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center mb-4">
            <Moon className="text-amber-400 w-8 h-8 fill-amber-400/20 drop-shadow-[0_0_15px_rgba(251,191,36,0.5)]" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Join NoorKids</h1>
          <p className="text-slate-400 text-sm">Create a parent account to begin</p>
        </div>

        {/* Right Side - Form Area */}
        <div className="p-6 md:p-10 lg:p-12 flex flex-col justify-center relative overflow-y-auto custom-scrollbar">
          <div className="max-w-sm w-full mx-auto">
            
            {/* Desktop-only Title */}
            <div className="hidden lg:block mb-8">
              <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">
                Create account
              </h1>
              <p className="text-slate-400 text-sm">
                Sign up to start your journey.
              </p>
            </div>

            <RegisterForm />
          </div>
        </div>

      </div>
    </div>
  );
}

export default Register;