import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import Steps from '../components/Steps';

const VerifPage = () => {
    const navigate = useNavigate();
    const [user] = useState(() => {
        const saved = localStorage.getItem('user');
        return saved ? JSON.parse(saved) : null;
    });
    const [profileImg, setProfileImg] = useState<File | null>(null);
    const [ktmImg, setKtmImg] = useState<File | null>(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!user) {
            navigate('/login');
        }
    }, [user, navigate]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<File | null>>) => {
        if (e.target.files && e.target.files[0]) {
            setter(e.target.files[0]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!profileImg || !ktmImg) {
            setError("Both check images are required");
            return;
        }

        setError('');
        setLoading(true);

        const formData = new FormData();
        formData.append('nim', user.NIM);
        formData.append('profile_image', profileImg);
        formData.append('ktm_image', ktmImg);

        try {
            await api.post('/upload-verification', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            navigate('/vote');
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.error || 'Upload failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 p-8 flex flex-col items-center">
            <div className="w-full max-w-3xl">
                <Steps currentStep={2} /> {/* Note: Registrasi is step 1, Verif is 2 */}
                
                <div className="bg-white p-10 rounded-2xl shadow-xl w-full border border-slate-100">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">Verification</h1>
                        <p className="text-slate-500 text-sm">
                            Upload a selfie and your Student ID (KTM) to proceed.
                        </p>
                    </div>

                    <div className="bg-amber-50 border-l-4 border-amber-400 p-4 mb-8 rounded-r-lg">
                        <div className="flex">
                            <div className="ml-3">
                                <p className="text-sm text-amber-800">
                                    <span className="font-bold">ATTENTION:</span> You will have exactly <span className="font-bold">5 MINUTES</span> to vote after uploading your verification. Be ready!
                                </p>
                            </div>
                        </div>
                    </div>

                    {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 text-sm mb-6">{error}</div>}

                    <form onSubmit={handleSubmit} className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Profile Image Input */}
                            <div className="group relative border-2 border-dashed border-slate-300 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 hover:border-emerald-500 transition-all duration-300 h-64 gap-4"
                                onClick={() => (document.getElementById('profileInput') as HTMLInputElement).click()}>
                                <input id="profileInput" type="file" accept="image/*" className="hidden"
                                    onChange={(e) => handleFileChange(e, setProfileImg)} />
                                <div className="bg-emerald-50 p-4 rounded-full group-hover:bg-emerald-100 transition-colors">
                                    <img src="/self.png" alt="foto diri" className="h-12 w-12 opacity-60 group-hover:opacity-100 transition-opacity"></img>
                                </div>
                                <div className="text-center space-y-1">
                                    <p className="text-slate-700 font-medium">Your Selfie</p>
                                    <p className="text-slate-400 text-sm overflow-hidden text-ellipsis px-4 max-w-xs">
                                        {profileImg ? profileImg.name : "Click to upload"}
                                    </p>
                                </div>
                            </div>

                            {/* KTM Image Input */}
                            <div className="group relative border-2 border-dashed border-slate-300 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 hover:border-emerald-500 transition-all duration-300 h-64 gap-4"
                                onClick={() => (document.getElementById('ktmInput') as HTMLInputElement).click()}>
                                <input id="ktmInput" type="file" accept="image/*" className="hidden"
                                    onChange={(e) => handleFileChange(e, setKtmImg)} />
                                <div className="bg-amber-50 p-4 rounded-full group-hover:bg-amber-100 transition-colors">
                                    <img src="/id.png" alt="ktm" className="h-12 w-12 opacity-60 group-hover:opacity-100 transition-opacity"></img>
                                </div>
                                <div className="text-center space-y-1">
                                    <p className="text-slate-700 font-medium">KTM Photo</p>
                                    <p className="text-slate-400 text-sm overflow-hidden text-ellipsis px-4 max-w-xs">
                                        {ktmImg ? ktmImg.name : "Click to upload"}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-center pt-4">
                            <button type="submit" disabled={loading}
                                className="w-full md:w-2/3 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/20 transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed">
                                {loading ? 'Uploading...' : 'Submit Verification'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default VerifPage;
