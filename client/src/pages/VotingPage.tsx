import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import Steps from '../components/Steps';

interface Candidate {
    ID: number;
    Name: string;
    Visi: string;
    Misi: string;
    ImageURL: string;
}

interface User {
    ID: number;
    HasVoted: boolean;
}

const VotingPage = () => {
    const [candidates, setCandidates] = useState<Candidate[]>([]);
    const [user, setUser] = useState<User | null>(null);
    const [selectedCandidate, setSelectedCandidate] = useState<number | null>(null); // For Modal
    const [ktmImg, setKtmImg] = useState<File | null>(null);
    const [selfImg, setSelfImg] = useState<File | null>(null);
    const [voting, setVoting] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (!storedUser) {
            navigate('/login');
        } else {
            setUser(JSON.parse(storedUser));
            fetchCandidates();
        }
    }, [navigate]);

    const fetchCandidates = async () => {
        try {
            const response = await api.get('/candidates');
            setCandidates(response.data);
        } catch (error) {
            console.error('Error fetching candidates:', error);
        }
    };

    const handleVoteClick = (candidateId: number) => {
        setSelectedCandidate(candidateId);
    };

    const handleConfirmVote = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!ktmImg || !selfImg || !user || !selectedCandidate) {
            alert("Harap upload kedua foto (KTM dan Diri Sendiri) untuk verifikasi ulang.");
            return;
        }

        setVoting(true);
        const data = new FormData();
        data.append('userId', user.ID.toString());
        data.append('candidateId', selectedCandidate.toString());
        data.append('ktm_image', ktmImg);
        data.append('self_image', selfImg);

        try {
            await api.post('/vote', data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            // Update local user state
            const updatedUser = { ...user, HasVoted: true };
            localStorage.setItem('user', JSON.stringify(updatedUser));
            setUser(updatedUser);
            setSelectedCandidate(null); // Close modal
            alert('Suara berhasil dikirim! Menunggu verifikasi admin.');
        } catch (error: any) {
            console.error('Error voting:', error);
            alert(error.response?.data?.error || 'Gagal mengirim suara.');
        } finally {
            setVoting(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('user');
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-gray-200 bg-radial p-8">
            <div className="max-w-3xl mx-auto">
                <Steps currentStep={2} />
                <h3 className="text-xl font-bold text-center text-gray-800">Pemilu HMS ITB 2025</h3>
                <h1 className="text-3xl font-bold text-center text-gray-800">Pemilihan Ketua BP HMS 2025/2026</h1>
                <p className="text-center text-sm text-gray-600 mb-8">Pilih kandidat yang menurut anda cocok untuk menjadi Ketua Umum BP Himpunan</p>

                {user?.HasVoted ? (
                    <div className="bg-green-100 text-green-700 p-8 rounded-lg text-center text-xl font-bold shadow">
                        Terima kasih! Suara Anda telah direkam dan sedang menunggu verifikasi akhir oleh panitia.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {candidates.map((candidate) => (
                            <div key={candidate.ID} className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col hover:shadow-lg transition-shadow">
                                <div className="p-6 flex-1 flex flex-col items-center justify-center">
                                    <div className="w-32 h-32 bg-gray-200 overflow-hidden rounded-full">
                                        <img
                                            src={`http://localhost:8080${candidate.ImageURL}`}
                                            alt={candidate.Name}
                                            className="w-32 h-32 rounded-full object-cover"
                                            onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300?text=No+Image'; }} // Fallback
                                        />
                                    </div>
                                    <div className="p-6 flex-1 flex flex-col items-center justify-center">
                                        <h3 className="text-2xl font-bold mb-2 text-gray-800">{candidate.Name}</h3>
                                        <div className="mb-6 space-y-2 flex-1 items-center justify-center">
                                            <div className="rounded text-sm">
                                                <strong className="block text-blue-700 mb-1 text-center">Visi:</strong>
                                                <p className="text-center">{candidate.Visi || '-'}</p>
                                            </div>
                                            <div className="rounded text-sm">
                                                <strong className="block text-green-700 mb-1 text-center">Misi:</strong>
                                                <p className="text-center">{candidate.Misi || '-'}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleVoteClick(candidate.ID)}
                                    className="w-full py-3 bg-green-900 hover:bg-green-950 text-white font-bold rounded-b-lg transition-colors"
                                >
                                    Pilih {candidate.Name}
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Voting Verification Modal */}
            {selectedCandidate && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full">
                        <h2 className="text-xl font-bold mb-4">Verifikasi Suara</h2>
                        <p className="text-gray-600 mb-4 text-sm">
                            Untuk validasi suara, harap unggah kembali foto KTM dan Foto Diri Anda.
                        </p>
                        <form onSubmit={handleConfirmVote} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Foto KTM</label>
                                <input type="file" accept="image/*" onChange={(e) => e.target.files && setKtmImg(e.target.files[0])} required
                                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-blue-50 file:text-blue-700" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Foto Diri</label>
                                <input type="file" accept="image/*" onChange={(e) => e.target.files && setSelfImg(e.target.files[0])} required
                                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-blue-50 file:text-blue-700" />
                            </div>
                            <div className="flex gap-3 mt-6">
                                <button type="button" onClick={() => setSelectedCandidate(null)} className="flex-1 py-2 border border-gray-300 rounded font-bold text-gray-700 hover:bg-gray-50">
                                    Batal
                                </button>
                                <button type="submit" disabled={voting} className="flex-1 py-2 bg-green-600 hover:bg-green-700 rounded font-bold text-white disabled:opacity-50">
                                    {voting ? 'Mengirim...' : 'Konfirmasi Suara'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VotingPage;
