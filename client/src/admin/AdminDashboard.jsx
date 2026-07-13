import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Users, BookOpen, Clock, AlertCircle, CheckCircle, Volume2, Activity, Loader2, RefreshCw, Download, TrendingUp, MessageSquare } from 'lucide-react';
import { supabase } from '../supabase/supabaseClient';

const AdminDashboard = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalStories: 0,
    totalReadingTime: 0,
    storiesMissingContent: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        if (!token) throw new Error("No authentication token found");
        
        const [usersRes, storiesRes] = await Promise.all([
          fetch('http://localhost:5000/api/admin/users', {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          fetch('http://localhost:5000/api/admin/stories', {
            headers: { 'Authorization': `Bearer ${token}` }
          })
        ]);

        if (!usersRes.ok || !storiesRes.ok) throw new Error("Failed to fetch dashboard data");

        const usersData = await usersRes.json();
        const storiesData = await storiesRes.json();

        let totalReadingTime = 0;
        usersData.forEach(u => {
          if (u.user_stats && u.user_stats[0]) {
            totalReadingTime += u.user_stats[0].total_reading_time || 0;
          }
        });

        const storiesWithQuizzes = storiesData.filter(s => s.hasQuiz).length;
        const storiesWithAudio = storiesData.filter(s => s.hasAudio).length;

        setStats({
          totalUsers: usersData.length,
          totalStories: storiesData.length,
          totalReadingTime: Math.round(totalReadingTime / 60),
          storiesWithQuizzes,
          storiesWithAudio
        });

      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse p-4 md:p-8">
        <div className="h-10 w-64 bg-[var(--admin-surface)] rounded-lg"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-32 bg-[var(--admin-surface)] rounded-2xl border border-[var(--admin-border)]"></div>
          ))}
        </div>
        <div className="h-64 bg-[var(--admin-surface)] rounded-2xl border border-[var(--admin-border)] mt-8"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 m-8 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-2xl flex items-center gap-3">
        <AlertCircle size={24} />
        <div>
          <h3 className="font-bold">Error Loading Dashboard</h3>
          <p className="text-sm opacity-80">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col transition-colors duration-300">
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[var(--admin-text-primary)] mb-2 tracking-tight">Dashboard Overview</h1>
          <p className="text-[var(--admin-text-secondary)] text-sm">Welcome back. Here's what's happening with your platform today.</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 bg-[var(--admin-surface)] text-[var(--admin-text-secondary)] px-4 py-2.5 rounded-xl text-sm font-medium hover:text-[var(--admin-text-primary)] hover:bg-[var(--admin-surface-hover)] transition-colors border border-[var(--admin-border)] shadow-sm">
            <RefreshCw size={16} /> Refresh
          </button>
        </div>
      </div>

      {/* Premium Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        
        {/* Card 1: Total Users */}
        <div className="bg-[var(--admin-surface)] rounded-3xl p-6 border border-[var(--admin-border)] shadow-sm overflow-hidden group hover:-translate-y-1 hover:shadow-md transition-all duration-300 cursor-default">
          <div className="flex justify-between items-start mb-6">
            <div className="w-14 h-14 bg-[var(--admin-accent-bg)] rounded-2xl flex items-center justify-center text-[var(--admin-accent)] border border-[var(--admin-accent)]/20 group-hover:scale-110 transition-transform duration-300">
              <Users size={28} />
            </div>
            <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-500/10 px-3 py-1.5 rounded-full text-xs font-bold border border-emerald-500/20 shadow-sm">
              <TrendingUp size={14} /> +12.5%
            </div>
          </div>
          
          <div>
            <h3 className="text-4xl font-extrabold text-[var(--admin-text-primary)] tracking-tight mb-1">{stats.totalUsers}</h3>
            <p className="text-[var(--admin-text-secondary)] font-medium text-sm tracking-wide uppercase">Total Active Users</p>
          </div>
        </div>

        {/* Card 2: Total Stories */}
        <div className="bg-[var(--admin-surface)] rounded-3xl p-6 border border-[var(--admin-border)] shadow-sm overflow-hidden group hover:-translate-y-1 hover:shadow-md transition-all duration-300 cursor-default">
          <div className="flex justify-between items-start mb-6">
            <div className="w-14 h-14 bg-[var(--admin-accent-bg)] rounded-2xl flex items-center justify-center text-[var(--admin-accent)] border border-[var(--admin-accent)]/20 group-hover:scale-110 transition-transform duration-300">
              <BookOpen size={28} />
            </div>
            <Activity className="text-[var(--admin-text-secondary)]/50" size={24} />
          </div>
          
          <div>
            <h3 className="text-4xl font-extrabold text-[var(--admin-text-primary)] tracking-tight mb-1">{stats.totalStories}</h3>
            <p className="text-[var(--admin-text-secondary)] font-medium text-sm tracking-wide uppercase">Total Stories</p>
          </div>
        </div>

        {/* Card 3: Stories with Quizzes */}
        <div className="bg-[var(--admin-surface)] rounded-3xl p-6 border border-[var(--admin-border)] shadow-sm overflow-hidden group hover:-translate-y-1 hover:shadow-md transition-all duration-300 cursor-default">
          <div className="flex justify-between items-start mb-6">
            <div className="w-14 h-14 bg-[var(--admin-accent-bg)] rounded-2xl flex items-center justify-center text-[var(--admin-accent)] border border-[var(--admin-accent)]/20 group-hover:scale-110 transition-transform duration-300">
              <CheckCircle size={28} />
            </div>
            <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-500/10 px-3 py-1.5 rounded-full text-xs font-bold border border-emerald-500/20 shadow-sm">
              <TrendingUp size={14} /> 5%
            </div>
          </div>
          
          <div>
            <h3 className="text-4xl font-extrabold text-[var(--admin-text-primary)] tracking-tight mb-1">{stats.storiesWithQuizzes}</h3>
            <p className="text-[var(--admin-text-secondary)] font-medium text-sm tracking-wide uppercase">Stories w/ Quizzes</p>
          </div>
        </div>

        {/* Card 4: Stories with Audio */}
        <div className="bg-[var(--admin-surface)] rounded-3xl p-6 border border-[var(--admin-border)] shadow-sm overflow-hidden group hover:-translate-y-1 hover:shadow-md transition-all duration-300 cursor-default">
          <div className="flex justify-between items-start mb-6">
            <div className="w-14 h-14 bg-[var(--admin-accent-bg)] rounded-2xl flex items-center justify-center text-[var(--admin-accent)] border border-[var(--admin-accent)]/20 group-hover:scale-110 transition-transform duration-300">
              <Volume2 size={28} />
            </div>
            <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-500/10 px-3 py-1.5 rounded-full text-xs font-bold border border-emerald-500/20 shadow-sm">
              <TrendingUp size={14} /> 2%
            </div>
          </div>
          
          <div>
            <h3 className="text-4xl font-extrabold text-[var(--admin-text-primary)] tracking-tight mb-1">{stats.storiesWithAudio}</h3>
            <p className="text-[var(--admin-text-secondary)] font-medium text-sm tracking-wide uppercase">Stories w/ Audio</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity List */}
        <div className="lg:col-span-2 bg-[var(--admin-surface)] rounded-3xl p-6 border border-[var(--admin-border)] shadow-sm transition-all duration-300 overflow-hidden group">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-[var(--admin-text-primary)]">Recent System Activity</h3>
            <button className="text-sm font-medium text-[var(--admin-accent)] hover:opacity-80 transition-opacity">View All</button>
          </div>
          
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-[var(--admin-surface)] hover:bg-[var(--admin-surface-hover)] border border-[var(--admin-border)] transition-all cursor-default group/item shadow-sm hover:shadow-md">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-[var(--admin-accent-bg)] flex items-center justify-center border border-[var(--admin-accent)]/20 text-[var(--admin-accent)] group-hover/item:scale-110 transition-transform duration-300">
                    <CheckCircle size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[var(--admin-text-primary)] transition-colors">Story processing completed</p>
                    <p className="text-xs text-[var(--admin-text-secondary)] mt-0.5">Hazrat Ayub AS - Quiz & Audio generated</p>
                  </div>
                </div>
                <div className="text-xs text-[var(--admin-text-secondary)] font-medium bg-[var(--admin-surface-hover)] px-3 py-1.5 rounded-lg border border-[var(--admin-border)]">
                  {i * 15} mins ago
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-[var(--admin-surface)] p-6 rounded-3xl border border-[var(--admin-border)] shadow-sm flex flex-col transition-all duration-300 overflow-hidden">
          <h2 className="text-lg font-bold text-[var(--admin-text-primary)] mb-6">Quick Actions</h2>
          <div className="space-y-3 flex-1">
            <button 
              onClick={() => navigate('/admin/stories')}
              className="w-full flex items-center justify-between p-4 rounded-2xl bg-[var(--admin-surface)] hover:bg-[var(--admin-surface-hover)] border border-[var(--admin-border)] transition-all group shadow-sm hover:shadow-md hover:-translate-y-0.5"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-[var(--admin-accent-bg)] text-[var(--admin-accent)] rounded-xl group-hover:bg-[var(--admin-accent)] group-hover:text-white transition-colors duration-300">
                  <BookOpen size={20} />
                </div>
                <span className="text-sm font-bold text-[var(--admin-text-secondary)] group-hover:text-[var(--admin-text-primary)] transition-colors">Manage & Upload Stories</span>
              </div>
            </button>
            <button 
              onClick={() => navigate('/admin/users')}
              className="w-full flex items-center justify-between p-4 rounded-2xl bg-[var(--admin-surface)] hover:bg-[var(--admin-surface-hover)] border border-[var(--admin-border)] transition-all group shadow-sm hover:shadow-md hover:-translate-y-0.5"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-[var(--admin-accent-bg)] text-[var(--admin-accent)] rounded-xl group-hover:bg-[var(--admin-accent)] group-hover:text-white transition-colors duration-300">
                  <Users size={20} />
                </div>
                <span className="text-sm font-bold text-[var(--admin-text-secondary)] group-hover:text-[var(--admin-text-primary)] transition-colors">Manage Users</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
