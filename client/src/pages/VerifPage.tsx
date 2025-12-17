import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import Steps from '../components/Steps';
import { UploadCloud, Check, User, CreditCard } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';

const VerifPage = () => {
    const navigate = useNavigate();
    const { success, error: showError } = useToast();
    const [user] = useState(() => {
        const saved = localStorage.getItem('user');
        return saved ? JSON.parse(saved) : null;
    });
    const [profileImg, setProfileImg] = useState<File | null>(null);
    const [ktmImg, setKtmImg] = useState<File | null>(null);
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
            showError("Both photos are required for verification");
            return;
        }

        setLoading(true);

        const formData = new FormData();
        formData.append('nim', user.NIM);
        formData.append('profile_image', profileImg);
        formData.append('ktm_image', ktmImg);

        try {
            await api.post('/upload-verification', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            success("Verification data uploaded successfully");
            navigate('/vote');
        } catch (err: any) {
            console.error(err);
            const errMsg = err.response?.data?.error || 'Upload failed';
            alert("Error: " + errMsg); // Force alert for debugging
            showError(errMsg);
        } finally {
            setLoading(false);
        }
    };

    const UploadBox = ({ id, label, icon, file, setFile }: { id: string, label: string, icon: any, file: File | null, setFile: any }) => (
        <div 
            className={`cursor-pointer group relative border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center transition-all bg-white
                ${file ? 'border-emerald-500 bg-emerald-50/30' : 'border-slate-300 hover:border-emerald-400 hover:bg-slate-50'}`}
            onClick={() => (document.getElementById(id) as HTMLInputElement).click()}
        >
            <input id={id} type="file" accept="image/*" className="hidden" 
                onChange={(e) => handleFileChange(e, setFile)} />
            
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-colors
                ${file ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-500'}`}>
                {file ? <Check size={32} /> : icon}
            </div>
            
            <h4 className="font-bold text-slate-700 mb-1">{label}</h4>
            <span className="text-sm text-slate-500 text-center max-w-[200px] truncate">
                {file ? file.name : "Click to select image"}
            </span>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50 p-6 md:p-12">
            <div className="max-w-4xl mx-auto">
                <Steps currentStep={1} />

                <div className="bg-white p-8 md:p-12 rounded-3xl shadow-xl border border-slate-100 mt-8 text-center">
                    <h3 className="text-emerald-600 font-bold tracking-widest uppercase text-sm mb-2">Identity Verification</h3>
                    <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Verify Your Eligiblity</h1>
                    <p className="text-slate-500 max-w-lg mx-auto mb-10">
                        To ensure a fair election, please upload a clear photo of yourself holding your Student ID (KTM) and a separate photo of your KTM.
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <UploadBox 
                                id="profileInput" 
                                label="Selfie with KTM" 
                                icon={<User size={32} />} 
                                file={profileImg} 
                                setFile={setProfileImg} 
                            />
                            <UploadBox 
                                id="ktmInput" 
                                label="KTM Photo" 
                                icon={<CreditCard size={32} />} 
                                file={ktmImg} 
                                setFile={setKtmImg} 
                            />
                        </div>

                        <div className="pt-4 max-w-md mx-auto">
                            <button type="submit" disabled={loading}
                                className="w-full bg-emerald-600 text-white py-4 rounded-xl font-bold hover:bg-emerald-700 disabled:opacity-50 transition-all shadow-lg shadow-emerald-200 hover:shadow-emerald-300 transform hover:-translate-y-1">
                                {loading ? 'Uploading Verification...' : 'Submit & Continue to Vote'}
                            </button>
                            <p className="text-xs text-slate-400 mt-4">
                                By submitting, you declare that the provided data is authentic.
                            </p>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default VerifPage;
