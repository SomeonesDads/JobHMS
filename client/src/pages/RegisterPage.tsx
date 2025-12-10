import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';
import { useToast } from "../contexts/ToastContext";

const RegisterPage = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        nim: '',
        email: '',
        password: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const { success, error: showError } = useToast();

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true); // Set loading at the start of the async operation

        try {
            // Basic validation
            if (formData.password.length < 6) {
                const msg = "Password must be at least 6 characters";
                setError(msg);
                showError(msg);
                setLoading(false); // Reset loading if validation fails
                return;
            }

            await api.post("/register", {
                name: formData.name,
                nim: formData.nim,
                email: formData.email,
                password: formData.password
            }, {
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
            });
            success("Registration successful! Please login.");
            navigate("/login");
        } catch (err: any) {
            console.error(err);
            const msg = err.response?.data?.error || "Registration failed";
            setError(msg);
            showError(msg);
        } finally {
            setLoading(false); // Always reset loading state
        }
    };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="bg-white p-10 rounded-2xl shadow-xl w-full max-w-md border border-slate-100">
        <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
                Create Account
            </h2>
            <p className="text-slate-500 mt-2 text-sm">
                Bergabung untuk mengikuti Pemilu HMS ITB 2025
            </p>
        </div>

        {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 text-sm mb-6">{error}</div>}

        <form onSubmit={handleRegister} className="space-y-5">
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                <input 
                    type="text" 
                    name="name" 
                    value={formData.name} 
                    onChange={handleInputChange} 
                    required
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all text-sm"
                    placeholder="John Doe"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">NIM</label>
                <input 
                    type="text" 
                    name="nim" 
                    value={formData.nim} 
                    onChange={handleInputChange} 
                    required
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all text-sm"
                    placeholder="135xxxxx"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input 
                    type="email" 
                    name="email" 
                    value={formData.email} 
                    onChange={handleInputChange} 
                    required
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all text-sm"
                    placeholder="name@example.com"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                <input 
                    type="password" 
                    name="password" 
                    value={formData.password} 
                    onChange={handleInputChange} 
                    required
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all text-sm"
                    placeholder="••••••••"
                />
            </div>

            <div className="pt-2">
                <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow-lg shadow-emerald-600/20 transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? 'Creating Account...' : 'Sign Up'}
                </button>
            </div>
        </form>

        <div className="mt-8 text-center">
            <p className="text-sm text-slate-500">
                Already have an account?{' '}
                <Link to="/login" className="text-emerald-600 font-semibold hover:text-emerald-700 transition-colors">
                    Sign In
                </Link>
            </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
