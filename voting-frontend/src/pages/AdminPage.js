import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const AdminPage = () => {
    const [results, setResults] = useState([]);
    const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')));
    const navigate = useNavigate();

    useEffect(() => {
        if (!user || user.Role !== 'admin') {
            navigate('/login');
            return;
        }
        fetchResults();
        const interval = setInterval(fetchResults, 5000); // Poll every 5 seconds
        return () => clearInterval(interval);
    }, [user, navigate]);

    const fetchResults = async () => {
        try {
            const response = await api.get('/admin/results');
            setResults(response.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('user');
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white p-8">
            <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold">Admin Dashboard</h1>
                    <button onClick={handleLogout} className="text-sm text-red-400 hover:text-red-300">Logout</button>
                </div>

                <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-gray-700">
                            <tr>
                                <th className="p-4">Candidate ID</th>
                                <th className="p-4">Name</th>
                                <th className="p-4 text-right">Votes</th>
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
