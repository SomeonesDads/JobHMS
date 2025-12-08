import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

const LoginPage = () => {
  const [nim, setNim] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post("/login", { nim, email });
      localStorage.setItem("user", JSON.stringify(response.data));
      if (response.data.Role === "admin") {
        navigate("/admin");
      } else {
        navigate("/vote");
      }
    } catch (err) {
      setError(err.response?.data?.error || "Login failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="flex flex-col bg-white p-8 rounded-lg shadow-md w-[500px] gap-4">
        <div className="flex justify-center items-center gap-5">
          <img src="/logo_hms.png" alt="logo HMS" className="h-16 w-16 rounded-full"></img>
          <img src="/logo192.png" alt="logo pemilu" className="h-16 w-16 rounded-full"></img>
        </div>
        <div className="gap-0">
          <h2 className="text-4xl font-bold text-center text-gray-800">
          PEMILU HMS ITB 2025
          </h2>
          <h2 className="text-sm font-semibold text-center text-gray-400">
            PEMILIHAN KETUA UMUM BP ITB 2025/2026
          </h2>
        </div>
        
        {error && (
          <div className="bg-red-100 text-red-700 p-2 rounded mb-4 text-sm">
            {error}
          </div>
        )}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <input
              type="text"
              value={nim}
              onChange={(e) => setNim(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="NIM"
              required
            />  
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="TOKEN"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-800 hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            masuk
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
