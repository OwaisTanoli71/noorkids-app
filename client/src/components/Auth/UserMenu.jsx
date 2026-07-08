import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import { logoutUser } from '../../services/auth';

export default function UserMenu() {
  const { profile } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await logoutUser();
      navigate('/login');
    } catch (err) {
      console.error("Failed to log out:", err);
    }
  };


  return (
    <div className="relative" ref={menuRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 hover:bg-[#18345F] p-2 rounded-full transition"
      >
        <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center text-xl shadow-inner">
          {profile?.avatar || "👤"}
        </div>
        <span className="text-white font-bold hidden sm:block">{profile?.displayName || 'User'}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-[#18345F] rounded-2xl shadow-xl py-2 z-50 border border-slate-700">
          <Link 
            to="/profile" 
            className="block px-4 py-3 text-white hover:bg-slate-700 transition"
            onClick={() => setIsOpen(false)}
          >
            👤 My Profile
          </Link>
          <hr className="border-slate-700 my-1" />
          <button 
            onClick={handleLogout}
            className="w-full text-left px-4 py-3 text-red-400 hover:bg-slate-700 transition"
          >
            🚪 Log Out
          </button>
        </div>
      )}
    </div>
  );
}
