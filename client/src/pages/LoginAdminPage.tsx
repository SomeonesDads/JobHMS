import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

const LoginAdminPage = () => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const response = await api.post("/admin/login", { username, password });
            const user = response.data;
            if (user.Role !== 'admin') {
                setError("Access denied. Not an admin account.");
                return;
            }
            localStorage.setItem("user", JSON.stringify(user));
            navigate("/admin");
        } catch (err: any) {
            setError(err.response?.data?.error || "Login failed");
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900">
            <div className="flex flex-col bg-gray-800 p-8 rounded-lg shadow-md w-[500px] gap-4 text-white">
                <div className="flex justify-center items-center gap-5">
                    {/* Reusing logos if available, or just text */}
                    <img src="/logo_hms.png" alt="logo HMS" className="h-16 w-16 rounded-full"></img>
                    <img src="/logo192.png" alt="logo pemilu" className="h-16 w-16 rounded-full"></img>
                </div>
                <div className="gap-0">
                    <h2 className="text-4xl font-bold text-center text-white">
                        ADMIN LOGIN
                    </h2>
                    <h2 className="text-sm font-semibold text-center text-gray-400">
                        PEMILU HMS ITB 2025
                    </h2>
                </div>

                {error && (
                    <div className="bg-red-900 border border-red-700 text-red-200 p-2 rounded mb-4 text-sm">
                        {error}
                    </div>
                )}
                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-white placeholder-gray-400"
                            placeholder="Username"
                            required
                        />
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-white placeholder-gray-400"
                            placeholder="Password"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        Masuk sebagai Admin
                    </button>
                </form>
            </div>
        </div>
    );
};

export default LoginAdminPage;
