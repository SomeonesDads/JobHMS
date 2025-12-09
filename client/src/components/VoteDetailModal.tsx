import React from 'react';

interface VoteDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    vote: {
        id: number;
        userName: string;
        userNim: string;
        userEmail: string;
        candidateName: string;
        ktmImage: string;
        selfImage: string;
    } | null;
}

const VoteDetailModal: React.FC<VoteDetailModalProps> = ({ isOpen, onClose, vote }) => {
    if (!isOpen || !vote) return null;

    return (
        <div
            className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50 animate-fadeIn"
            onClick={onClose}
        >
            <div
                className="bg-gray-800 rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto animate-slideIn"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-white">Detail Suara</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white text-2xl font-bold"
                    >
                        ×
                    </button>
                </div>

                <div className="space-y-4 mb-6">
                    <div>
                        <label className="text-sm text-gray-400">Nama Pemilih:</label>
                        <p className="text-lg font-semibold text-white">{vote.userName}</p>
                    </div>
                    <div>
                        <label className="text-sm text-gray-400">NIM:</label>
                        <p className="text-lg font-mono text-white">{vote.userNim}</p>
                    </div>
                    <div>
                        <label className="text-sm text-gray-400">Email:</label>
                        <p className="text-lg text-white">{vote.userEmail}</p>
                    </div>
                    <div>
                        <label className="text-sm text-gray-400">Memilih:</label>
                        <p className="text-lg font-bold text-blue-400">{vote.candidateName}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="text-sm text-gray-400 block mb-2">Foto KTM Saat Vote:</label>
                        <img
                            src={`http://localhost:8080/${vote.ktmImage}`}
                            alt="KTM"
                            className="w-full h-auto rounded-lg bg-gray-900"
                        />
                    </div>
                    <div>
                        <label className="text-sm text-gray-400 block mb-2">Foto Diri Saat Vote:</label>
                        <img
                            src={`http://localhost:8080/${vote.selfImage}`}
                            alt="Self"
                            className="w-full h-auto rounded-lg bg-gray-900"
                        />
                    </div>
                </div>

                <div className="mt-6 flex justify-end">
                    <button
                        onClick={onClose}
                        className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded font-bold text-white"
                    >
                        Tutup
                    </button>
                </div>
            </div>
        </div>
    );
};

export default VoteDetailModal;
