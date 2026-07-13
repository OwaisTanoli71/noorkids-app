import { useState, useEffect } from "react";
import { useAdminTheme } from "./context/AdminThemeContext";
import { MessageSquare, CheckCircle, XCircle, Trash2, Loader2, Star } from "lucide-react";

export default function AdminReviews() {
  const { adminTheme } = useAdminTheme();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchReviews = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch("http://localhost:5000/api/admin/reviews", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setReviews(data);
        } else {
          setReviews([]);
        }
      }
    } catch (err) {
      console.error("Failed to fetch reviews:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleApprove = async (id) => {
    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch(`http://localhost:5000/api/admin/reviews/${id}/approve`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setReviews(reviews.map(r => r.id === id ? { ...r, is_approved: true } : r));
      }
    } catch (err) {
      console.error("Failed to approve review:", err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this review?")) return;
    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch(`http://localhost:5000/api/admin/reviews/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setReviews(reviews.filter(r => r.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete review:", err);
    }
  };

  if (loading) {
    return (
      <div className={`p-8 min-h-screen flex items-center justify-center ${adminTheme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className={`p-8 min-h-screen ${adminTheme === 'dark' ? 'bg-[#0a0f1d] text-white' : 'bg-slate-50 text-slate-900'}`}>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black mb-2 flex items-center gap-3">
            <MessageSquare className="text-indigo-500 w-8 h-8" />
            Manage Reviews
          </h1>
          <p className={adminTheme === 'dark' ? 'text-slate-400' : 'text-slate-500'}>
            Approve or reject parent testimonials before they appear on the landing page.
          </p>
        </div>
      </div>

      {reviews.length === 0 ? (
        <div className={`flex flex-col items-center justify-center py-20 px-4 text-center rounded-2xl border border-dashed ${adminTheme === 'dark' ? 'bg-[var(--admin-surface)] border-[var(--admin-border)]' : 'bg-white border-slate-300'}`}>
          <div className="w-16 h-16 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mb-4 shadow-sm">
            <MessageSquare size={28} />
          </div>
          <h3 className="text-xl font-bold text-[var(--admin-text-primary)] mb-2">No Reviews Yet</h3>
          <p className="text-[var(--admin-text-secondary)] max-w-sm mx-auto">
            When parents submit their feedback and reviews on the landing page, they will appear here for your approval.
          </p>
        </div>
      ) : (
        <div className="grid gap-6">
          {reviews.map(review => (
            <div 
              key={review.id} 
              className={`p-6 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all ${
                adminTheme === 'dark' ? 'bg-[#131b2f] border-slate-800 hover:border-indigo-500/30' : 'bg-white border-slate-200 hover:border-indigo-200 shadow-sm'
              }`}
            >
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-bold text-lg">{review.name}</h3>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${review.is_approved ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                    {review.is_approved ? 'Approved' : 'Pending Approval'}
                  </span>
                </div>
                <p className={`text-sm mb-3 ${adminTheme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>{review.email}</p>
                <div className="flex gap-1 mb-3 text-amber-400">
                  {[...Array(5)].map((_, i) => <Star key={i} size={16} fill={i < review.rating ? "currentColor" : "none"} strokeWidth={i < review.rating ? 0 : 2} className={i >= review.rating ? "text-slate-600" : ""} />)}
                </div>
                <p className={`italic leading-relaxed ${adminTheme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>"{review.text}"</p>
              </div>

              <div className="flex items-center gap-3 md:flex-col justify-center">
                {!review.is_approved && (
                  <button 
                    onClick={() => handleApprove(review.id)}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 rounded-xl font-bold transition-colors w-full justify-center"
                  >
                    <CheckCircle size={18} /> Approve
                  </button>
                )}
                <button 
                  onClick={() => handleDelete(review.id)}
                  className="flex items-center gap-2 px-4 py-2 bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 rounded-xl font-bold transition-colors w-full justify-center"
                >
                  <Trash2 size={18} /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
