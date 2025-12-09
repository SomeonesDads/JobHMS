import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api";

const LoginPage = () => {
  const [nim, setNim] = useState("");
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await api.post("/login", { nim, token });
      localStorage.setItem("user", JSON.stringify(response.data));
      navigate("/verif");
    } catch (err: any) {
      setError(err.response?.data?.error || "Login failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-200">
      <div className="flex flex-col bg-white bg-opacity-75 p-8 rounded-lg shadow-md w-[500px] gap-4">
        <div className="flex justify-center items-center gap-5">
          <img src="/logo_hms.png" alt="logo HMS" className="h-16 w-16 rounded-full"></img>
          <img src="/logopanit.png" alt="logo panitia" className="h-16 w-16 rounded-full"></img>
        </div>
        <div className="gap-0">
          <h2 className="text-4xl font-bold text-center text-gray-800">
            PEMILU HMS ITB 2025
          </h2>
          <h2 className="text-lg font-bold text-center text-gray-800">
            Pemilihan Ketua Umum BP ITB 2025/2026
          </h2>
        </div>

        {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 uppercase">
              NIM
            </label>
            <input
              type="text"
              value={nim}
              onChange={(e) => setNim(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-black rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm"
              placeholder="150xxxxx"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 uppercase">
              TOKEN
            </label>
            <input
              type="text"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-black rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm"
              placeholder="Masukkan Token dari Email"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-900 hover:bg-green-950 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 uppercase"
          >
            masuk
          </button>
        </form>

        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600">
            Belum punya akun? <Link to="/register" className="text-blue-600 hover:underline">Daftar di sini</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
