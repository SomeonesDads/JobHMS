import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const VotingPage = () => {
    const [candidates, setCandidates] = useState([]);
    const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')));
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }
        fetchCandidates();
    }, [user, navigate]);

    const fetchCandidates = async () => {
        try {
            const response = await api.get('/candidates');
            setCandidates(response.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleVote = async (candidateId) => {
        try {
            await api.post('/vote', { userId: user.ID, candidateId }); // Note: Golang struct field is ID (uppercase) but JSON defaults to fields. Wait, I used BindJSON which uses struct tags. My struct helper models.User had ID, candidates had ID. 
            // Checking my handlers.go, I used `json:"userId"` in the struct definition inside Vote handler.
            // And in models.go, User has `ID uint`. When JSON marshalled, it is usually `ID` unless tagged. 
            // Let me just check my handlers.go content again mentally or via artifact.
            // In handlers.go: Vote struct has `json:"userId"`. User struct in models.go has `ID`.
            // The return value of Login is `c.JSON(http.StatusOK, user)`.
            // So the localStorage user will have keys matching the struct fields in models.go.
            // If models.go didn't have json tags, it defaults to field name (e.g. "ID").
            // So user.ID is correct. 
            setMessage('Vote cast successfully!');
            setError('');
            // Update local user state to reflect hasVoted to prevent immediate re-vote in UI
            const updatedUser = { ...user, HasVoted: true };
            setUser(updatedUser);
            localStorage.setItem('user', JSON.stringify(updatedUser));
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to vote');
            setMessage('');
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('user');
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-gray-100 p-8">
            <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-800">Vote for Your Candidate</h1>
                    <button onClick={handleLogout} className="text-sm text-red-600 hover:text-red-800">Logout</button>
                </div>

                {message && <div className="bg-green-100 text-green-700 p-4 rounded mb-4">{message}</div>}
                {error && <div className="bg-red-100 text-red-700 p-4 rounded mb-4">{error}</div>}
                {user?.HasVoted && <div className="bg-blue-100 text-blue-700 p-4 rounded mb-4">You have already voted. Thank you!</div>}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {candidates.map((candidate) => (
                        <div key={candidate.ID} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
                            <img src={candidate.ImageURL} alt={candidate.Name} className="w-full h-48 object-cover" />
                            <div className="p-6">
                                <h3 className="text-xl font-bold mb-2">{candidate.Name}</h3>
                                <p className="text-gray-600 mb-4">{candidate.Description}</p>
                                <button
                                    onClick={() => handleVote(candidate.ID)}
                                    disabled={user?.HasVoted}
                                    className={`w-full py-2 px-4 rounded font-medium text-white transition-colors duration-200 ${user?.HasVoted
                                            ? 'bg-gray-400 cursor-not-allowed'
                                            : 'bg-blue-600 hover:bg-blue-700'
                                        }`}
                                >
                                    {user?.HasVoted ? 'Voted' : 'Vote'}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default VotingPage;
