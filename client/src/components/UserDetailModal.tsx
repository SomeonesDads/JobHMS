import React from 'react';

interface UserDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: {
        Name: string;
        NIM: string;
        Email: string;
        ProfileImage: string;
        KTMImage: string;
    } | null;
}

const UserDetailModal: React.FC<UserDetailModalProps> = ({ isOpen, onClose, user }) => {
    if (!isOpen || !user) return null;

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
                    <h2 className="text-2xl font-bold text-white">Detail Mahasiswa</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white text-2xl font-bold"
                    >
                        ×
                    </button>
                </div>

                <div className="space-y-4 mb-6">
                    <div>
                        <label className="text-sm text-gray-400">Nama:</label>
                        <p className="text-lg font-semibold text-white">{user.Name}</p>
                    </div>
                    <div>
                        <label className="text-sm text-gray-400">NIM:</label>
                        <p className="text-lg font-mono text-white">{user.NIM}</p>
                    </div>
                    <div>
                        <label className="text-sm text-gray-400">Email:</label>
                        <p className="text-lg text-white">{user.Email}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="text-sm text-gray-400 block mb-2">Foto Profil:</label>
                        <img
                            src={`http://localhost:8080/${user.ProfileImage}`}
                            alt="Profile"
                            className="w-full h-auto rounded-lg bg-gray-900"
                        />
                    </div>
                    <div>
                        <label className="text-sm text-gray-400 block mb-2">Foto KTM:</label>
                        <img
                            src={`http://localhost:8080/${user.KTMImage}`}
                            alt="KTM"
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

export default UserDetailModal;
