import Background from "./components/Background";
import Navbar from "./components/Navbar";
import BottomNav from "./components/BottomNav";

import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";

import Home from "./pages/Home";
import Stories from "./pages/Stories";
import StoryDetails from "./pages/StoryDetails";
import AI from "./pages/AI";
import Quiz from "./pages/Quiz";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Quran from "./pages/Quran";
import SurahDetails from "./pages/SurahDetails";

import ProtectedRoute from "./components/Auth/ProtectedRoute";
import CompleteProfileForm from "./components/Auth/CompleteProfileForm";
import { AuthProvider } from "./context/AuthContext";

function AppContent() {
  const location = useLocation();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';

  return (
    <>
      <Background />

      <div className="relative z-10 pb-24">
        {!isAuthPage && <Navbar />}

        <Routes>
          {/* Protected Main Routes */}
          <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
          <Route path="/stories" element={<ProtectedRoute><Stories /></ProtectedRoute>} />
          <Route path="/story/:id" element={<ProtectedRoute><StoryDetails /></ProtectedRoute>} />
          <Route path="/ai" element={<ProtectedRoute><AI /></ProtectedRoute>} />
          <Route path="/ai/:storyId" element={<ProtectedRoute><AI /></ProtectedRoute>} />
          <Route path="/quiz/:storyId" element={<ProtectedRoute><Quiz /></ProtectedRoute>} />

          {/* Quran */}
          <Route path="/quran" element={<ProtectedRoute><Quran /></ProtectedRoute>} />
          <Route path="/quran/:id" element={<ProtectedRoute><SurahDetails /></ProtectedRoute>} />

          {/* Authentication */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Routes */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/complete-profile"
            element={
              <ProtectedRoute>
                <div className="pt-20 px-4 pb-32">
                  <CompleteProfileForm />
                </div>
              </ProtectedRoute>
            }
          />

          {/* Settings */}
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        </Routes>

        {!isAuthPage && <BottomNav />}
      </div>
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;