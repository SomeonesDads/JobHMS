import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const AdminPage = () => {
    const [verifications, setVerifications] = useState([]);
    const [results, setResults] = useState([]);
    const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')));
    const navigate = useNavigate();

    useEffect(() => {
        if (!user || user.Role !== 'admin') {
            navigate('/login');
            return;
        }
        fetchData();
        const interval = setInterval(fetchData, 5000); // Poll every 5 seconds
        return () => clearInterval(interval);
    }, [user, navigate]);

    const fetchData = () => {
        fetchResults();
        fetchVerifications();
    };

    const fetchResults = async () => {
        try {
            const response = await api.get('/admin/results');
            setResults(response.data);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchVerifications = async () => {
        try {
            const response = await api.get('/admin/verifications');
            setVerifications(response.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleVerify = async (userId, action) => {
        try {
            await api.post('/admin/verify', { userId, action });
            fetchData();
        } catch (err) {
            console.error(err);
            alert("Failed to update status");
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('user');
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white p-8">
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold">Admin Dashboard</h1>
                    <button onClick={handleLogout} className="text-sm text-red-400 hover:text-red-300">Logout</button>
                </div>

                {/* Pending Verifications Section */}
                <div className="mb-12">
                    <h2 className="text-2xl font-bold mb-6 border-b border-gray-700 pb-2">Pending Verifications</h2>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {verifications.map((v) => (
                            <div key={v.ID} className="bg-gray-800 rounded-lg p-6 shadow-lg flex flex-col md:flex-row gap-6 items-start">
                                <div className="flex-1 space-y-4 w-full">
                                    <div>
                                        <label className="text-gray-400 text-sm">NIM</label>
                                        <div className="font-mono text-xl">{v.NIM}</div>
                                    </div>
                                    <div className="flex gap-4">
                                        <div>
                                            <p className="text-xs text-gray-500 mb-1">Profile</p>
                                            <a href={`http://localhost:8080/${v.ProfileImage}`} target="_blank" rel="noopener noreferrer">
                                                <img src={`http://localhost:8080/${v.ProfileImage}`} alt="Profile" className="w-24 h-24 object-cover rounded bg-gray-700 hover:opacity-80 transition" />
                                            </a>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 mb-1">KTM</p>
                                            <a href={`http://localhost:8080/${v.KTMImage}`} target="_blank" rel="noopener noreferrer">
                                                <img src={`http://localhost:8080/${v.KTMImage}`} alt="KTM" className="w-24 h-24 object-cover rounded bg-gray-700 hover:opacity-80 transition" />
                                            </a>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-row md:flex-col gap-3 justify-end mt-2 md:mt-0">
                                    <button
                                        onClick={() => handleVerify(v.ID, 'approve')}
                                        className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded font-medium transition"
                                    >
                                        Approve
                                    </button>
                                    <button
                                        onClick={() => handleVerify(v.ID, 'reject')}
                                        className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded font-medium transition"
                                    >
                                        Reject
                                    </button>
                                </div>
                            </div>
                        ))}
                        {verifications.length === 0 && (
                            <div className="col-span-full text-center py-12 bg-gray-800 rounded-lg text-gray-500">
                                No pending verifications
                            </div>
                        )}
                    </div>
                </div>

                <h2 className="text-2xl font-bold mb-6 border-b border-gray-700 pb-2">Vote Results</h2>
                <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-gray-700">
                            <tr>
                                <th className="p-4">Candidate ID</th>
                                <th className="p-4">Name</th>
                                <th className="p-4 text-right">Votes (Verified)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {results.map((result, index) => (
                                <tr key={index} className="border-b border-gray-700 hover:bg-gray-750">
                                    <td className="p-4">{result.CandidateID}</td>
                                    <td className="p-4">{result.Name}</td>
                                    <td className="p-4 text-right font-bold text-xl text-green-400">{result.Count}</td>
                                </tr>
                            ))}
                            {results.length === 0 && (
                                <tr>
                                    <td colSpan="3" className="p-4 text-center text-gray-500">No votes yet</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminPage;
