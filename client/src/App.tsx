import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import VotingPage from './pages/VotingPage';
import AdminPage from './pages/AdminPage';
import VerifPage from './pages/VerifPage';
import LoginAdminPage from './pages/LoginAdminPage';
import RegisterPage from './pages/RegisterPage';

function App() {
  return (
    <div className="App">
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/vote" element={<VotingPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/loginadmin" element={<LoginAdminPage />} />
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/verif" element={<VerifPage />} />
      </Routes>
    </div>
  );
}

export default App;
