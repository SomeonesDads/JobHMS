import React, { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import api from "../api";
import { useToast } from "../contexts/ToastContext";
import CountdownTimer from "../components/CountdownTimer";



const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [deadline, setDeadline] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { success, error } = useToast();

  useEffect(() => {
    const fetchSettings = async () => {
        try {
            const res = await api.get("/settings");
            // If we have a startTime and it's in the future
            if (res.data && res.data.startTime) {
                setDeadline(res.data.startTime);
            }
        } catch (e) {
            console.error("Failed to load settings", e);
        }
    };
    fetchSettings();

    if (location.state?.message) {
      success(location.state.message);
    }
  }, [location, success]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await api.post("/login", { email, password });
      const user = response.data;
      localStorage.setItem("user", JSON.stringify(user));

      if (user.Role === 'admin') {
        success("Welcome back, Admin!");
        navigate("/admin");
      } else {
        if (user.HasVoted) {
          error("Account has already voted.");
        } else {
          success("Login successful!");
          navigate("/verif");
          // Or go to /vote if already verified?
          // Logic usually: if verified -> vote, if pending -> wait/verif status page?
          // For now, sending to verif as requested/implied flow
        }
      }
    } catch (err: any) {
      error(err.response?.data?.error || "Login failed. Check your credentials.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="bg-white p-10 rounded-2xl shadow-xl w-full max-w-md border border-slate-100">
        <div className="flex justify-center items-center gap-5 mb-8">
          <img src="/logo_hms.png" alt="logo HMS" className="h-16 w-16 drop-shadow-sm"></img>
          <img src="/logo192.png" alt="logo pemilu" className="h-16 w-16 drop-shadow-sm"></img>
        </div>
        
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
            Pemilu HMS 2025
          </h2>
          <p className="text-slate-500 mt-2 text-sm font-medium uppercase tracking-wider">
            Secure Voting Portal
          </p>
        </div>

        {deadline && (
            <div className="mb-6">
                 {/* @ts-ignore - JS component */}
                <CountdownTimer deadline={deadline} />
            </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all text-sm font-semibold text-slate-900"
              placeholder="email@gmail.com"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all text-sm font-mono"
              placeholder="••••••••"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow-lg shadow-emerald-600/20 transition-all transform active:scale-95"
          >
            Sign In
          </button>
        </form>

        <div className="mt-8 text-center pt-6 border-t border-slate-100">
          <p className="text-sm text-slate-500">
            No account yet? <Link to="/register" className="text-emerald-600 hover:text-emerald-700 font-semibold hover:underline">Create Account</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
