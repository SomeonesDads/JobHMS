import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import Steps from '../components/Steps';

const VerifPage = () => {
    const navigate = useNavigate();
    const [user] = useState(JSON.parse(localStorage.getItem('user')));
    const [profileImg, setProfileImg] = useState(null);
    const [ktmImg, setKtmImg] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!user) {
            navigate('/login');
        }
    }, [user, navigate]);

    const handleFileChange = (e, setter) => {
        if (e.target.files && e.target.files[0]) {
            setter(e.target.files[0]);
        }
    };

    const handleSubmit = async (e) => {
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
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.error || 'Upload failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 p-8">
            <div className="max-w-3xl mx-auto">
                <Steps currentStep={1} />

                <div className="bg-white p-8 rounded-lg shadow-md">
                    <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Verification Step</h2>
                    <p className="text-center text-gray-600 mb-8">Please upload your photo and KTM to proceed.</p>

                    {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-6">{error}</div>}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Profile Image Input */}
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition h-48"
                                onClick={() => document.getElementById('profileInput').click()}>
                                <input id="profileInput" type="file" accept="image/*" className="hidden"
                                    onChange={(e) => handleFileChange(e, setProfileImg)} />
                                <div className="text-4xl mb-2">📸</div>
                                <div className="text-gray-500 font-medium text-center">
                                    {profileImg ? profileImg.name : "Klik untuk mengunggah foto profil"}
                                </div>
                            </div>

                            {/* KTM Image Input */}
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition h-48"
                                onClick={() => document.getElementById('ktmInput').click()}>
                                <input id="ktmInput" type="file" accept="image/*" className="hidden"
                                    onChange={(e) => handleFileChange(e, setKtmImg)} />
                                <div className="text-4xl mb-2">🆔</div>
                                <div className="text-gray-500 font-medium text-center">
                                    {ktmImg ? ktmImg.name : "Klik untuk menggunggah foto ktm"}
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-center mt-8">
                            <button type="submit" disabled={loading}
                                className="w-full md:w-1/2 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 transition duration-200 shadow-md">
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
