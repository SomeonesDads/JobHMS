import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import Steps from '../components/Steps';
import { useToast } from "../contexts/ToastContext";

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
    VerificationStatus: string;
}

const VotingPage = () => {
    const [candidates, setCandidates] = useState<Candidate[]>([]);
    const [user, setUser] = useState<User | null>(null);
    const [selectedCandidate, setSelectedCandidate] = useState<number | null>(null); // For Modal
    const [ktmImg, setKtmImg] = useState<File | null>(null);
    const [selfImg, setSelfImg] = useState<File | null>(null);
    const [voting, setVoting] = useState(false);
    const [electionStatus, setElectionStatus] = useState<"loading" | "coming_soon" | "active" | "ended">("loading");
    const [settings, setSettings] = useState<any>(null);
    const [timeRemaining, setTimeRemaining] = useState<string>("");
    const navigate = useNavigate();

    useEffect(() => {
        const init = async () => {
            const storedUser = localStorage.getItem('user');
            if (!storedUser) {
                navigate('/login');
                return;
            }
            // Refresh user to get KTMUploadedAt
            // We need an endpoint for 'me' or just login again? 
            // Or assume login returns fresh data if we just logged in.
            // But if they refreshed page, we need fresh data.
            // Let's use the stored user ID to fetch user details?
            // Actually, we can just fetch candidates and settings first.
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);

            try {
                const [candRes, setRes] = await Promise.all([
                    api.get('/candidates'),
                    api.get('/settings')
                ]);
                setCandidates(candRes.data);
                setSettings(setRes.data);
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };
        init();
    }, [navigate]);

    // Timer Logic
    useEffect(() => {
        if (!settings) return;

        const interval = setInterval(() => {
            const now = new Date().getTime();
            const start = new Date(settings.StartTime).getTime();
            const end = new Date(settings.EndTime).getTime();

            if (now < start) {
                setElectionStatus("coming_soon");
                // Calculate countdown
                const diff = start - now;
                const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((diff % (1000 * 60)) / 1000);
                setTimeRemaining(`${days}d ${hours}h ${minutes}m ${seconds}s`);
            } else if (now > end) {
                setElectionStatus("ended");
            } else {
                setElectionStatus("active");
                // If active, check if user needs verification
                // We access the latest user state
                if (user && user.VerificationStatus === 'none') {
                     navigate('/verif');
                }
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [settings, user, navigate]); // Added navigate

    const fetchCandidates = async () => {
        // moved to init
    };

    const handleVoteClick = (candidateId: number) => {
        setSelectedCandidate(candidateId);
    };

    const { success, error: showError } = useToast();

    const handleConfirmVote = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!ktmImg || !selfImg || !user || !selectedCandidate) {
            showError("Harap upload kedua foto (KTM dan Diri Sendiri) untuk verifikasi ulang.");
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
            success('Suara berhasil dikirim! Menunggu verifikasi admin.');
        } catch (error: any) {
            console.error('Error voting:', error);
            showError(error.response?.data?.error || 'Gagal mengirim suara.');
        } finally {
            setVoting(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('user');
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-slate-50 p-8">
            <div className="max-w-5xl mx-auto">
                <Steps currentStep={3} />
                
                <div className="text-center mb-12">
                     <h2 className="text-3xl font-bold text-slate-900">Election 2025</h2>
                     <p className="text-slate-500 mt-2">Choose the next leader for Himpunan Mahasiswa Sipil ITB</p>
                </div>

            {/* Content Switcher */}
            {electionStatus === "loading" && (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
                </div>
            )}

            {electionStatus === "coming_soon" && (
                 <div className="flex flex-col items-center justify-center p-16 bg-white rounded-3xl shadow-xl border border-slate-100 max-w-2xl mx-auto">
                    <h2 className="text-3xl font-bold text-slate-800 mb-6">Voting Starts In</h2>
                    <div className="text-6xl font-mono text-emerald-600 font-bold mb-8 tracking-wider bg-emerald-50 px-8 py-4 rounded-2xl">
                        {timeRemaining}
                    </div>
                    <p className="text-slate-500 text-center">
                        Please check back when the countdown finishes.
                    </p>
                 </div>
            )}

            {electionStatus === "ended" && (
                <div className="flex flex-col items-center justify-center p-16 bg-white rounded-3xl shadow-xl border border-slate-100 max-w-2xl mx-auto">
                    <h2 className="text-4xl font-bold text-slate-900 mb-4">Election Ended</h2>
                    <p className="text-slate-500 text-lg">Thank you for participating in this democratic process.</p>
                </div>
            )}

            {electionStatus === "active" && (
                <>
                {user?.HasVoted ? (
                    <div className="bg-emerald-50 text-emerald-800 p-10 rounded-3xl text-center shadow-lg border border-emerald-100 max-w-2xl mx-auto">
                         <div className="flex justify-center mb-4">
                            <span className="bg-emerald-200 text-emerald-700 p-4 rounded-full">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </span>
                         </div>
                        <h3 className="text-2xl font-bold mb-2">Vote Recorded!</h3>
                        <p className="text-emerald-700">
                            Thank you for voting. Your choice has been securely recorded and is pending final verification.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {candidates.map((candidate) => (
                            <div key={candidate.ID} className="bg-white rounded-3xl shadow-lg border border-slate-100 overflow-hidden flex flex-col hover:shadow-2xl hover:border-emerald-200 transition-all duration-300 transform hover:-translate-y-1">
                                <div className="p-8 flex-1 flex flex-col items-center">
                                    <div className="w-40 h-40 bg-slate-100 rounded-full p-1 mb-6 shadow-inner relative">
                                        <img
                                            src={`http://localhost:8080${candidate.ImageURL}`}
                                            alt={candidate.Name}
                                            className="w-full h-full rounded-full object-cover shadow-sm"
                                            onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300?text=No+Image'; }}
                                        />
                                        <div className="absolute top-0 right-0 bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">
                                            #{candidate.ID}
                                        </div>
                                    </div>
                                    
                                    <h3 className="text-2xl font-bold mb-6 text-slate-900 text-center">{candidate.Name}</h3>
                                    
                                    <div className="w-full space-y-4">
                                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                            <h4 className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-1 text-center">Vision</h4>
                                            <p className="text-center text-slate-600 text-sm">{candidate.Visi || '-'}</p>
                                        </div>
                                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                            <h4 className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-1 text-center">Mission</h4>
                                            <p className="text-center text-slate-600 text-sm line-clamp-3">{candidate.Misi || '-'}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-6 pt-0">
                                    <button
                                        onClick={() => handleVoteClick(candidate.ID)}
                                        className="w-full py-4 bg-slate-900 hover:bg-emerald-600 text-white font-bold rounded-2xl transition-colors shadow-lg shadow-slate-900/10 hover:shadow-emerald-600/20"
                                    >
                                        Vote for Candidate
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                </>
            )}
            </div>

            {/* Voting Verification Modal */}
            {selectedCandidate && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
                    <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl scale-100 transition-transform">
                        <div className="text-center mb-6">
                            <h2 className="text-2xl font-bold text-slate-900">Final Verification</h2>
                            <p className="text-slate-500 mt-2 text-sm">
                                Confirm your identity to cast your vote.
                            </p>
                        </div>
                        
                        <form onSubmit={handleConfirmVote} className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Upload KTM Photo</label>
                                <input type="file" accept="image/*" onChange={(e) => e.target.files && setKtmImg(e.target.files[0])} required
                                    className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 transition-colors" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Upload Selfie</label>
                                <input type="file" accept="image/*" onChange={(e) => e.target.files && setSelfImg(e.target.files[0])} required
                                    className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 transition-colors" />
                            </div>
                            <div className="grid grid-cols-2 gap-4 mt-8">
                                <button type="button" onClick={() => setSelectedCandidate(null)} className="py-3 border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold rounded-xl transition-colors">
                                    Cancel
                                </button>
                                <button type="submit" disabled={voting} className="py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                                    {voting ? 'Submitting...' : 'Confirm Vote'}
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
