import { Link, useLocation } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import { Home, BookOpen, Sparkles, User, LogIn, BookHeart } from 'lucide-react';

function BottomNav() {
  const location = useLocation();
  const { user } = useAuth();
  
  if (!user) return null;

  const tabs = [
    { name: "Home", path: "/", icon: Home },
    { name: "Stories", path: "/stories", icon: BookOpen },
    { name: "Quran", path: "/quran", icon: BookHeart },
    { name: "AI", path: "/ai", icon: Sparkles },
    { name: user ? "Profile" : "Login", path: user ? "/profile" : "/login", icon: user ? User : LogIn }
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 glass-panel border-t border-white/10 flex justify-around py-4 z-50 rounded-t-3xl">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = location.pathname === tab.path;
        return (
          <Link
            key={tab.path}
            to={tab.path}
            className={`flex flex-col items-center text-xs font-medium transition-all duration-300 ${
              isActive
                ? "text-amber-400 scale-110 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Icon size={24} className="mb-1" strokeWidth={isActive ? 2.5 : 2} />
            {tab.name}
          </Link>
        )
      })}
    </div>
  );
}

export default BottomNav;