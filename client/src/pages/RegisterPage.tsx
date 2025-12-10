import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';
import { useToast } from '../contexts/ToastContext';

const RegisterPage = () => {
    const navigate = useNavigate();
    const { success, error } = useToast();
    const [formData, setFormData] = useState({
        name: '',
        nim: '',
        email: '',
        password: ''
    });
    const [profileImg, setProfileImg] = useState<File | null>(null);
    const [ktmImg, setKtmImg] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<File | null>>) => {
        if (e.target.files && e.target.files[0]) {
            setter(e.target.files[0]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!profileImg || !ktmImg) {
            error('Please upload both Profile and KTM photos.');
            return;
        }

        setLoading(true);
        const data = new FormData();
        data.append('name', formData.name);
        data.append('nim', formData.nim);
        data.append('email', formData.email);
        data.append('password', formData.password);
        data.append('profile_image', profileImg);
        data.append('ktm_image', ktmImg);

        try {
            await api.post('/register', data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            success('Registration successful! Please login.');
            navigate('/login');
        } catch (err: any) {
            console.error(err);
            error(err.response?.data?.error || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="bg-white p-10 rounded-2xl shadow-xl w-full max-w-lg border border-slate-100">
                <div className="text-center mb-10">
                    <h2 className="text-3xl font-bold text-slate-900">Create Account</h2>
                    <p className="text-slate-500 mt-2">Join the HMS Election 2025</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                            <input type="text" name="name" value={formData.name} onChange={handleInputChange} required
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                                placeholder="John Doe"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">NIM</label>
                                <input type="text" name="nim" value={formData.nim} onChange={handleInputChange} required
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                                    placeholder="13321xxx"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                                <input type="email" name="email" value={formData.email} onChange={handleInputChange} required
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                                    placeholder="email@gmail.com"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                            <input type="password" name="password" value={formData.password} onChange={handleInputChange} required
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                                placeholder="Create a strong password"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-2">
                        <div className="group">
                            <label className="block text-sm font-medium text-slate-700 mb-2">Selfie with KTM</label>
                            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer bg-slate-50 hover:bg-emerald-50 hover:border-emerald-400 transition-colors">
                                <span className="text-xs text-slate-500 font-medium">{profileImg ? profileImg.name : "Upload Photo"}</span>
                                <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, setProfileImg)} required className="hidden" />
                            </label>
                        </div>
                        <div className="group">
                            <label className="block text-sm font-medium text-slate-700 mb-2">KTM Scan/Photo</label>
                            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer bg-slate-50 hover:bg-emerald-50 hover:border-emerald-400 transition-colors">
                                <span className="text-xs text-slate-500 font-medium">{ktmImg ? ktmImg.name : "Upload KTM"}</span>
                                <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, setKtmImg)} required className="hidden" />
                            </label>
                        </div>
                    </div>

                    <button type="submit" disabled={loading}
                        className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-200 transition-all transform active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed mt-4">
                        {loading ? 'Creating Account...' : 'Register Now'}
                    </button>
                </form>

                <div className="mt-8 text-center pt-6 border-t border-slate-100">
                    <p className="text-sm text-slate-500">
                        Already have an account? <Link to="/login" className="text-emerald-600 hover:text-emerald-700 font-semibold hover:underline">Sign In</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;
