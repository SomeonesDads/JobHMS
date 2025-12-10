import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import Steps from '../components/Steps';
import { useToast } from '../contexts/ToastContext';
import { Ticket, AlertCircle } from 'lucide-react';

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
    const navigate = useNavigate();
    const { success, error: showError } = useToast();

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

    const handleVoteClick = (candidateId: number, candidateName: string) => {
        setSelectedCandidate(candidateId);
        setSelectedCandidateName(candidateName);
    };

    const handleConfirmVote = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || selectedCandidate === null) return;

        setVoting(true);
        const data = new FormData();
        data.append('userId', user.ID.toString());
        data.append('candidateId', selectedCandidate.toString());

        try {
            await api.post('/vote', data);
            localStorage.removeItem('user');
            success('Your vote has been cast successfully!');
            navigate('/login', { state: { message: 'Suara berhasil dikirim! Terima kasih telah berpartisipasi.' } });

        } catch (error: any) {
            console.error('Error voting:', error);
            showError(error.response?.data?.error || 'Failed to submit vote.');
            setVoting(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 p-6 md:p-12 font-sans">
            <div className="max-w-7xl mx-auto">
                <Steps currentStep={2} />
                
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
                                                src={`http://localhost:8080${candidate.ImageURL}`}
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
