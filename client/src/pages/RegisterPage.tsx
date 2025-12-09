import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';

const RegisterPage = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        nim: '',
        email: ''
    });
    const [profileImg, setProfileImg] = useState<File | null>(null);
    const [ktmImg, setKtmImg] = useState<File | null>(null);
    const [error, setError] = useState('');
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
        setError('');

        if (!profileImg || !ktmImg) {
            setError('Please upload both Profile and KTM photos.');
            return;
        }

        setLoading(true);
        const data = new FormData();
        data.append('name', formData.name);
        data.append('nim', formData.nim);
        data.append('email', formData.email);
        data.append('profile_image', profileImg);
        data.append('ktm_image', ktmImg);

        try {
            await api.post('/register', data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            alert('Registration successful! Please login.');
            navigate('/login');
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.error || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-200 flex items-center justify-center p-4">
            <div className="bg-white bg-opacity-75 p-8 rounded-lg shadow-md w-full max-w-lg">
                <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">Register</h2>

                {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Nama</label>
                        <input type="text" name="name" value={formData.name} onChange={handleInputChange} required
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">NIM</label>
                        <input type="text" name="nim" value={formData.nim} onChange={handleInputChange} required
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Email</label>
                        <input type="email" name="email" value={formData.email} onChange={handleInputChange} required
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Foto diri dengan KTM</label>
                            <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, setProfileImg)} required
                                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-950 hover:file:bg-blue-100" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Foto KTM</label>
                            <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, setKtmImg)} required
                                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-950 hover:file:bg-blue-100" />
                        </div>
                    </div>

                    <button type="submit" disabled={loading}
                        className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-900 hover:bg-green-950 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50">
                        {loading ? 'Registering...' : 'Register'}
                    </button>
                </form>

                <div className="mt-4 text-center">
                    <p className="text-sm text-gray-600">
                        Sudah ada akun? <Link to="/login" className="text-blue-600 hover:underline">Login disini</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;
