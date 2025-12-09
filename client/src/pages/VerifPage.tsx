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
        <div className="min-h-screen bg-gray-200 p-8">
            <div className="max-w-3xl mx-auto">
                <Steps currentStep={1} />

                <div className="bg-white bg-opacity-75 p-8 rounded-lg shadow-md">
                    <h3 className="text-xl font-bold text-center text-gray-800">Pemilu HMS ITB 2025</h3>
                    <h1 className="text-4xl font-bold text-center text-gray-800">Verifikasi Data</h1>
                    <p className="text-center text-sm text-gray-600 mb-8">Upload foto diri dengan KTM untuk lanjut dengan pemilihan</p>

                    {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-6">{error}</div>}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Profile Image Input */}
                            <div className="border-2 border-dashed border-green-900 rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition h-48 gap-4"
                                onClick={() => (document.getElementById('profileInput') as HTMLInputElement).click()}>
                                <input id="profileInput" type="file" accept="image/*" className="hidden"
                                    onChange={(e) => handleFileChange(e, setProfileImg)} />
                                <img src="/self.png" alt="foto diri" className="h-24 opacity-50"></img>
                                <div className="text-gray-500 font-medium text-center">
                                    {profileImg ? profileImg.name : "Klik untuk mengunggah foto diri"}
                                </div>
                            </div>

                            {/* KTM Image Input */}
                            <div className="border-2 border-dashed border-green-900 rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition h-48 gap-4"
                                onClick={() => (document.getElementById('ktmInput') as HTMLInputElement).click()}>
                                <input id="ktmInput" type="file" accept="image/*" className="hidden"
                                    onChange={(e) => handleFileChange(e, setKtmImg)} />
                                <img src="/id.png" alt="ktm" className="h-24 opacity-75"></img>
                                <div className="text-gray-500 font-medium text-center">
                                    {ktmImg ? ktmImg.name : "Klik untuk menggunggah foto ktm"}
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-center mt-8">
                            <button type="submit" disabled={loading}
                                className="w-full md:w-1/2 bg-green-900 text-white py-3 rounded-lg font-semibold hover:bg-green-950 disabled:opacity-50 transition duration-200 shadow-md">
                                {loading ? 'Uploading...' : 'Submit Verifikasi'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default VerifPage;
