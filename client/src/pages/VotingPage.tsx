import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import Steps from '../components/Steps';
import { useToast } from '../contexts/ToastContext';
import { Ticket, AlertCircle, Clock, Calendar } from 'lucide-react';

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
    const [selectedCandidate, setSelectedCandidate] = useState<number | null>(null);
    const [selectedCandidateName, setSelectedCandidateName] = useState<string>("");
    const [voting, setVoting] = useState(false);
    
    // Election Status State
    const [electionStart, setElectionStart] = useState<Date | null>(null);
    const [isElectionOpen, setIsElectionOpen] = useState(false);
    const [loadingSettings, setLoadingSettings] = useState(true);

    // Timer State
    const [timeLeft, setTimeLeft] = useState(300); // 5 minutes default
    
    const navigate = useNavigate();
    const { success, error: showError } = useToast();

    // 1. Initial Data Fetch & User Check
    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (!storedUser) {
            navigate('/login');
            return;
        }
        setUser(JSON.parse(storedUser));
        fetchInitialData();
    }, [navigate]);

    const fetchInitialData = async () => {
        try {
            // Fetch Candidates
            const candRes = await api.get('/candidates');
            setCandidates(candRes.data);

            // Fetch Settings for Timing
            const setRes = await api.get('/settings');
            const settings = setRes.data;
            if (settings.startTime) {
                const start = new Date(settings.startTime);
                setElectionStart(start);
                checkElectionStatus(start);
            } else {
                // If no start time set, assume open
                setIsElectionOpen(true);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            // If error fetching settings, default to open to avoid blocking if not configured
            setIsElectionOpen(true);
        } finally {
            setLoadingSettings(false);
        }
    };

    const checkElectionStatus = (start: Date) => {
        const now = new Date();
        if (now >= start) {
            setIsElectionOpen(true);
        } else {
            setIsElectionOpen(false);
        }
    };

    // 2. Persistent Timer Logic
    useEffect(() => {
        if (!isElectionOpen || !user || user.HasVoted) return;

        const VOTING_DURATION_SEC = 5 * 60; // 5 minutes
        const STORAGE_KEY = `vote_entry_time_${user.ID}`;

        // Initialize or Retrieve Entry Time
        let entryTime = localStorage.getItem(STORAGE_KEY);
        if (!entryTime) {
            entryTime = Date.now().toString();
            localStorage.setItem(STORAGE_KEY, entryTime);
        }

        const calculateTimeLeft = () => {
            const now = Date.now();
            const elapsed = Math.floor((now - parseInt(entryTime!)) / 1000);
            const remaining = VOTING_DURATION_SEC - elapsed;
            return remaining > 0 ? remaining : 0;
        };

        // Set initial calculated time
        setTimeLeft(calculateTimeLeft());

        const timer = setInterval(() => {
            const remaining = calculateTimeLeft();
            setTimeLeft(remaining);

            if (remaining <= 0) {
                clearInterval(timer);
                handleAutoAbstain();
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [isElectionOpen, user]);

    const handleAutoAbstain = () => {
        // Prevent double submission if already voting
        if (voting) return;
        
        console.log("Timer expired. Auto-voting for Kotak Kosong.");
        handleSubmitVote(0, true); // 0 = Kotak Kosong
    };

    const handleVoteClick = (candidateId: number, candidateName: string) => {
        setSelectedCandidate(candidateId);
        setSelectedCandidateName(candidateName);
    };

    const handleSubmitVote = async (candidateId: number, isAuto: boolean = false) => {
        if (!user) return;
        setVoting(true);
        const data = new FormData();
        data.append('userId', user.ID.toString());
        data.append('candidateId', candidateId.toString());

        try {
            await api.post('/vote', data);
            
            // Clear timer storage
            localStorage.removeItem(`vote_entry_time_${user.ID}`);
            localStorage.removeItem('user');
            
            const msg = isAuto 
                ? 'Waktu habis! Anda otomatis memilih Kotak Kosong.' 
                : 'Suara Anda berhasil dikirim!';
            
            if (isAuto) showError(msg);
            else success(msg);

            navigate('/login', { state: { message: msg } });

        } catch (error: any) {
            console.error('Error voting:', error);
            showError(error.response?.data?.error || 'Gagal mengirim suara.');
            setVoting(false);
        }
    };

    const handleConfirmVote = async (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedCandidate === null) return;
        await handleSubmitVote(selectedCandidate);
    };

    // Format Time Display
    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    // Render Loading
    if (loadingSettings) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
            </div>
        );
    }

    // Render Waiting for Election
    if (!isElectionOpen && electionStart) {
        return (
            <div className="min-h-screen bg-slate-50 p-6 md:p-12 font-sans">
                 <div className="max-w-4xl mx-auto">
                    <Steps currentStep={2} />
                    
                    <div className="mt-12 bg-white p-12 rounded-[2.5rem] shadow-xl text-center border border-slate-100 max-w-2xl mx-auto">
                        <div className="w-24 h-24 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                            <Calendar size={48} />
                        </div>
                        <h1 className="text-3xl font-bold text-slate-800 mb-4">Election Has Not Started</h1>
                        <p className="text-slate-500 text-lg mb-8">
                            Please wait until the election officially begins on:
                        </p>
                        <div className="bg-slate-50 py-4 px-8 rounded-2xl inline-block border border-slate-200">
                             <span className="text-2xl font-mono font-bold text-slate-700">
                                {electionStart.toLocaleString('id-ID', { 
                                    dateStyle: 'full', 
                                    timeStyle: 'short' 
                                })}
                            </span>
                        </div>
                        <p className="mt-8 text-sm text-slate-400">
                            You can refresh this page when the time comes.
                        </p>
                        <button 
                            onClick={() => window.location.reload()}
                            className="mt-6 px-6 py-2 bg-emerald-600 text-white rounded-full font-bold hover:bg-emerald-700 transition"
                        >
                            Refresh Page
                        </button>
                    </div>
                 </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 p-6 md:p-12 font-sans">
            <div className="max-w-7xl mx-auto">
                <Steps currentStep={2} />

                {/* Timer Display */}
                {!user?.HasVoted && timeLeft > 0 && (
                    <div className="fixed top-4 right-4 z-50 animate-bounce-in">
                        <div className={`flex items-center gap-2 px-4 py-2 rounded-full font-mono font-bold shadow-lg border-2 ${
                            timeLeft < 60 ? 'bg-red-50 text-red-600 border-red-200 animate-pulse' : 'bg-white text-slate-700 border-slate-200'
                        }`}>
                            <Clock size={18} />
                            <span>{formatTime(timeLeft)}</span>
                        </div>
                    </div>
                )}

                <div className="text-center mb-16 animate-fade-in-up">
                    <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-2 inline-block">Official Ballot</span>
                    <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-4 tracking-tight">Cast Your Vote</h1>
                    <p className="text-slate-500 max-w-2xl mx-auto text-lg leading-relaxed">
                        Select your preferred candidate for the <strong>Chairman of BP HMS 2025/2026</strong>.
                        Choose wisely, as your vote cannot be changed once submitted.
                    </p>
                </div>

                {user?.HasVoted ? (
                    <div className="bg-emerald-50 border border-emerald-200 p-12 rounded-3xl text-center max-w-2xl mx-auto shadow-sm">
                        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Ticket size={32} />
                        </div>
                        <h2 className="text-2xl font-bold text-emerald-800 mb-2">Vote Recorded</h2>
                        <p className="text-emerald-700">Terima kasih! Suara Anda telah direkam.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-4 md:px-0">
                        {candidates.map((candidate, index) => (
                            <div
                                key={candidate.ID}
                                className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/60 overflow-hidden flex flex-col hover:shadow-2xl hover:shadow-emerald-100/50 hover:-translate-y-2 transition-all duration-300 border border-slate-100 relative group"
                                style={{ animationDelay: `${index * 0.1}s` }}
                            >
                                <div className="absolute top-0 w-full h-32 bg-gradient-to-b from-emerald-50 to-transparent z-0 opacity-0 group-hover:opacity-100 transition-opacity" />

                                <div className="p-8 flex-1 flex flex-col items-center z-10">
                                    <div className="w-48 h-48 rounded-full p-1.5 bg-gradient-to-tr from-emerald-400 to-emerald-600 shadow-lg mb-6 group-hover:scale-105 transition-transform duration-500">
                                        <div className="w-full h-full rounded-full border-4 border-white overflow-hidden bg-slate-200 relative">
                                            <img
                                                src={
                                                    candidate.ImageURL?.startsWith('http')
                                                        ? candidate.ImageURL
                                                        : `${process.env.REACT_APP_API_URL || 'http://localhost:8080'}${candidate.ImageURL}`
                                                }
                                                alt={candidate.Name}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    </div>

                                    <h3 className="text-2xl font-bold text-slate-900 mb-6 text-center leading-tight">{candidate.Name}</h3>

                                    <div className="w-full space-y-4 mb-4">
                                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 hover:border-emerald-100 transition-colors">
                                            <h4 className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-2 text-center">Vision</h4>
                                            <p className="text-sm text-slate-600 text-center leading-relaxed line-clamp-3">{candidate.Visi || '-'}</p>
                                        </div>
                                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 hover:border-emerald-100 transition-colors">
                                            <h4 className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-2 text-center">Mission</h4>
                                            <p className="text-sm text-slate-600 text-center leading-relaxed line-clamp-3">{candidate.Misi || '-'}</p>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={() => handleVoteClick(candidate.ID, candidate.Name)}
                                    className="w-full py-5 bg-slate-900 hover:bg-emerald-600 text-white font-bold text-lg transition-colors flex items-center justify-center gap-2 group-hover:pb-6"
                                >
                                    <Ticket size={20} className="opacity-50 group-hover:opacity-100" />
                                    Vote Candidate
                                </button>
                            </div>
                        ))}

                        {/* Kotak Kosong */}
                        <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/60 overflow-hidden flex flex-col hover:shadow-2xl hover:shadow-slate-300/50 hover:-translate-y-2 transition-all duration-300 border border-slate-100 relative group">

                            <div className="p-8 flex-1 flex flex-col items-center z-10">
                                <div className="w-48 h-48 rounded-full p-1.5 bg-slate-200 shadow-inner mb-6 flex items-center justify-center group-hover:bg-slate-300 transition-colors">
                                    <div className="w-full h-full rounded-full border-4 border-white bg-slate-100 flex items-center justify-center overflow-hidden">
                                        <div className="w-24 h-24 border-4 border-dashed border-slate-300 rounded-lg"></div>
                                    </div>
                                </div>

                                <h2 className="text-2xl font-bold text-slate-900 mb-4 text-center">Abstain / Empty Box</h2>
                                <p className="text-slate-500 text-sm text-center mb-6 leading-relaxed px-4">
                                    By selecting this option, you verify your attendance but choose not to vote for any of the available candidates.
                                </p>
                            </div>

                            <button
                                onClick={() => handleVoteClick(0, "Kotak Kosong")}
                                className="w-full py-5 bg-slate-200 hover:bg-slate-800 hover:text-white text-slate-500 font-bold text-lg transition-all flex items-center justify-center gap-2 group-hover:pb-6 mt-auto"
                            >
                                <span className="w-5 h-5 border-2 border-current rounded-sm"></span>
                                Select Empty Box
                            </button>
                        </div>
                    </div>

                )}
            </div>

            {/* Voting Verification Modal */}
            {selectedCandidate !== null && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
                    <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl transform scale-100 animate-scale-in">
                        <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4 mx-auto">
                            <Ticket size={24} />
                        </div>
                        <h2 className="text-2xl font-bold mb-2 text-center text-slate-900">Confirm Vote</h2>
                        <p className="text-slate-500 mb-8 text-center leading-relaxed">
                            Are you sure you want to cast your vote for <strong className="text-slate-900 block mt-1 text-lg">{selectedCandidateName}</strong>?
                        </p>

                        <div className="bg-amber-50 border border-amber-100 p-3 rounded-xl flex items-start gap-3 mb-6">
                            <AlertCircle className="text-amber-500 shrink-0 mt-0.5" size={18} />
                            <p className="text-xs text-amber-700 text-left">This action is final and cannot be undone once submitted.</p>
                        </div>

                        <form onSubmit={handleConfirmVote} className="space-y-3">
                            <button type="submit" disabled={voting} className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 rounded-xl font-bold text-white shadow-lg shadow-emerald-200 transition-all disabled:opacity-70">
                                {voting ? 'Submitting...' : 'Yes, Submit Vote'}
                            </button>
                            <button type="button" onClick={() => setSelectedCandidate(null)} className="w-full py-3.5 border border-slate-200 hover:bg-slate-50 rounded-xl font-bold text-slate-600 transition-colors">
                                Cancel
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VotingPage;
