import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

const LoginAdminPage = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const response = await api.post("/admin/login", { email, password });
            const user = response.data;
            if (user.Role !== 'admin') {
                setError("Access denied. Not an admin account.");
                return;
            }
            localStorage.setItem("user", JSON.stringify(user));
            navigate("/admin");
        } catch (err: any) {
            setError(err.response?.data?.error || "Login failed");
        }
    };

    return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="bg-white p-10 rounded-2xl shadow-xl w-full max-w-md border border-slate-100">
        <div className="flex justify-center items-center gap-5 mb-8">
            <img src="/logo_hms.png" alt="logo HMS" className="h-16 w-16 drop-shadow-sm"></img>
            <img src="/logo192.png" alt="logo pemilu" className="h-16 w-16 drop-shadow-sm"></img>
        </div>
        
        <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
                Admin Portal
            </h2>
            <p className="text-slate-500 mt-2 text-sm font-medium uppercase tracking-wider">
                Authorized Access Only
            </p>
        </div>

        {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 text-sm mb-6">{error}</div>}

        <form onSubmit={handleLogin} className="space-y-5">
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input 
                    type="email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    required
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all text-sm"
                    placeholder="admin@hms.com"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                <input 
                    type="password" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    required
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all text-sm"
                    placeholder="••••••••"
                />
            </div>

            <button 
                type="submit" 
                className="w-full py-3 bg-slate-900 hover:bg-emerald-600 text-white font-semibold rounded-xl shadow-lg shadow-slate-900/20 hover:shadow-emerald-600/20 transition-all transform active:scale-95"
            >
                Start Admin Session
            </button>
        </form>
      </div>
    </div>
    );
};

export default LoginAdminPage;
