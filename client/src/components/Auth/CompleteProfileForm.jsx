import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import { updateUserProfile, createUserProfile } from '../../services/profile';

const AVATARS = ["👦", "👧", "🦁", "🐢", "🐦", "🌙", "⭐", "🚀"];

export default function CompleteProfileForm() {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState(profile?.displayName || '');
  const [age, setAge] = useState(profile?.age || '');
  const [avatar, setAvatar] = useState(profile?.avatar || AVATARS[0]);
  const [parentEmail, setParentEmail] = useState(profile?.parentEmail || '');
  const [preferredLanguage, setPreferredLanguage] = useState(profile?.preferredLanguage || 'en');
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};
    if (!displayName.trim()) newErrors.displayName = "Name is required.";
    
    if (!age) newErrors.age = "Age is required.";
    else if (isNaN(age) || age < 3 || age > 18) newErrors.age = "Age must be between 3 and 18.";
    
    if (parentEmail && !/\S+@\S+\.\S+/.test(parentEmail)) {
      newErrors.parentEmail = "Parent email is invalid.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    
    try {
      setLoading(true);
      const profileData = {
        displayName,
        age: Number(age),
        avatar,
        parentEmail,
        preferredLanguage,
        profileComplete: true
      };
      
      if (!profile) {
        // First time (e.g. from Google Auth)
        await createUserProfile(user.id, {
          email: user.email,
          ...profileData
        });
      } else {
        await updateUserProfile(user.id, profileData);
      }
      
      await refreshProfile();
      
      // Delay navigation slightly so AuthContext state updates first
      setTimeout(() => {
        navigate('/');
      }, 100);
    } catch (err) {
      console.error(err);
      setErrors({ global: "Failed to save profile. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#18345F] p-8 rounded-3xl shadow-xl w-full max-w-lg mx-auto text-white mt-10">
      <h2 className="text-3xl font-bold mb-2 text-center text-blue-300">Complete Your Profile! 🚀</h2>
      <p className="text-center text-slate-300 mb-8">Just a few quick things before we start exploring.</p>
      
      {errors.global && <div className="bg-red-500/20 text-red-200 p-3 rounded-lg mb-4 text-sm">{errors.global}</div>}
      
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        
        {/* Avatar Picker */}
        <div>
          <label className="block text-sm font-medium mb-2">Choose an Avatar</label>
          <div className="flex flex-wrap gap-2 justify-center bg-slate-800 p-4 rounded-2xl">
            {AVATARS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => setAvatar(emoji)}
                className={`text-3xl p-3 rounded-full transition-transform ${avatar === emoji ? 'bg-blue-500 scale-110 shadow-lg' : 'hover:bg-slate-700 opacity-70'}`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Kid's Name or Nickname</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className={`w-full px-4 py-3 rounded-xl bg-slate-700 border ${errors.displayName ? 'border-red-400' : 'border-slate-600'} focus:outline-none focus:border-blue-400 text-white`}
              placeholder="Ali"
            />
            {errors.displayName && <p className="text-red-400 text-xs mt-1">{errors.displayName}</p>}
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Age</label>
            <input
              type="number"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              className={`w-full px-4 py-3 rounded-xl bg-slate-700 border ${errors.age ? 'border-red-400' : 'border-slate-600'} focus:outline-none focus:border-blue-400 text-white`}
              placeholder="8"
            />
            {errors.age && <p className="text-red-400 text-xs mt-1">{errors.age}</p>}
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Language</label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input 
                type="radio" 
                name="language" 
                value="en" 
                checked={preferredLanguage === 'en'}
                onChange={() => setPreferredLanguage('en')}
                className="w-5 h-5 accent-blue-500"
              />
              English
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input 
                type="radio" 
                name="language" 
                value="ur" 
                checked={preferredLanguage === 'ur'}
                onChange={() => setPreferredLanguage('ur')}
                className="w-5 h-5 accent-blue-500"
              />
              Urdu
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Parent's Email (Optional)</label>
          <input
            type="email"
            value={parentEmail}
            onChange={(e) => setParentEmail(e.target.value)}
            className={`w-full px-4 py-3 rounded-xl bg-slate-700 border ${errors.parentEmail ? 'border-red-400' : 'border-slate-600'} focus:outline-none focus:border-blue-400 text-white`}
            placeholder="parent@email.com"
          />
          {errors.parentEmail && <p className="text-red-400 text-xs mt-1">{errors.parentEmail}</p>}
        </div>
        
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-500 text-white py-4 rounded-full hover:bg-blue-400 transition font-bold text-lg shadow-lg disabled:opacity-50 mt-2"
        >
          {loading ? "Saving..." : "Start Exploring! 🌟"}
        </button>
      </form>
    </div>
  );
}
