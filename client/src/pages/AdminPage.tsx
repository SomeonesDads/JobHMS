import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

interface User {
  ID: number;
  Name: string;
  NIM: string;
  Email: string;
  Role: string;
  ProfileImage: string;
  KTMImage: string;
}

interface Verification {
  ID: number;
  Name: string;
  NIM: string;
  Email: string;
  ProfileImage: string;
  KTMImage: string;
}

interface VoteRequest {
  ID: number;
  UserName: string;
  CandidateName: string;
  KTMImage: string;
  SelfImage: string;
}

interface Candidate {
  ID: number;
  Name: string;
  Visi: string;
  Misi: string;
  ImageURL: string;
}

interface Result {
  CandidateID: number;
  Name: string;
  Count: number;
}

const AdminPage = () => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem("user");
    return saved ? JSON.parse(saved) : null;
  });
  const [activeTab, setActiveTab] = useState("mahasiswa");
  const navigate = useNavigate();

  // Data States
  const [verifications, setVerifications] = useState<Verification[]>([]); // User Reg Verifications
  const [pendingVotes, setPendingVotes] = useState<VoteRequest[]>([]); // Vote Verifications
  const [results, setResults] = useState<Result[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);

  // Candidate Form State
  const [newCandidate, setNewCandidate] = useState({
    name: "",
    visi: "",
    misi: "",
  });
  const [candidateImg, setCandidateImg] = useState<File | null>(null);
  const [candidateLoading, setCandidateLoading] = useState(false);

  useEffect(() => {
    if (!user || user.Role !== "admin") {
      navigate("/login");
      return;
    }
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [user, navigate, activeTab]);

  const fetchData = () => {
    if (activeTab === "mahasiswa") fetchVerifications();
    if (activeTab === "verifikasi_suara") fetchPendingVotes();
    if (activeTab === "kandidat") fetchCandidates();
    if (activeTab === "recap") fetchResults();
  };

  const fetchVerifications = async () => {
    try {
      const res = await api.get("/admin/users/pending");
      setVerifications(res.data);
    } catch (err) {
      console.error(err);
    }
  };
  const fetchPendingVotes = async () => {
    try {
      const res = await api.get("/admin/votes/pending");
      setPendingVotes(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
      setPendingVotes([]);
    }
  };
  const fetchResults = async () => {
    try {
      const res = await api.get("/admin/results");
      setResults(res.data);
    } catch (err) {
      console.error(err);
    }
  };
  const fetchCandidates = async () => {
    try {
      const res = await api.get("/candidates");
      setCandidates(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleVerifyUser = async (userId: number, action: string) => {
    try {
      await api.post("/admin/verify", { userId, action });
      fetchVerifications();
    } catch (err) {
      alert("Failed");
    }
  };
  const handleVerifyVote = async (voteId: number, action: string) => {
    try {
      await api.post("/admin/votes/verify", { voteId, action });
      fetchPendingVotes();
    } catch (err) {
      alert("Failed");
    }
  };
  const handleDeleteCandidate = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this candidate?"))
      return;
    try {
      await api.delete(`/admin/candidates/${id}`);
      fetchCandidates();
    } catch (err) {
      alert("Failed to delete");
    }
  };

  const handleAddCandidate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCandidateLoading(true);
    const data = new FormData();
    data.append("name", newCandidate.name);
    data.append("visi", newCandidate.visi);
    data.append("misi", newCandidate.misi);
    if (candidateImg) data.append("image", candidateImg);

    try {
      await api.post("/admin/candidates", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      alert("Candidate added!");
      setNewCandidate({ name: "", visi: "", misi: "" });
      setCandidateImg(null);
      fetchCandidates();
    } catch (err) {
      alert("Failed");
    } finally {
      setCandidateLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/login");
  };

  const TabButton = ({ id, label }: { id: string; label: string }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`px-4 py-3 font-medium transition-colors whitespace-nowrap
            ${
              activeTab === id
                ? "bg-blue-600 text-white border-b-2 border-blue-400"
                : "bg-gray-800 text-gray-400 hover:bg-gray-700"
            }`}
    >
      {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <button
            onClick={handleLogout}
            className="text-sm text-red-400 hover:text-red-300 border border-red-400 px-3 py-1 rounded"
          >
            Logout
          </button>
        </div>

        <div className="flex border-b border-gray-700 mb-8 overflow-x-auto">
          <TabButton id="mahasiswa" label="Mahasiswa (Reg)" />
          <TabButton id="verifikasi_suara" label="Verifikasi Suara" />
          <TabButton id="kandidat" label="Kandidat" />
          <TabButton id="recap" label="Recap (Hasil)" />
        </div>

        <div className="bg-gray-800 rounded-lg p-6 shadow-xl min-h-[400px]">
          {/* --- MAHASISWA TAB (Registration) --- */}
          {activeTab === "mahasiswa" && (
            <div>
              <h2 className="text-xl font-bold mb-4">
                Verifikasi Registrasi Mahasiswa
              </h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {verifications.map((v) => (
                  <div
                    key={v.ID}
                    className="bg-gray-700 rounded-lg p-4 flex flex-col gap-4"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-bold text-lg">
                          {v.Name || "No Name"}
                        </div>
                        <div className="font-mono text-gray-400">{v.NIM}</div>
                        <div className="text-sm text-gray-500">{v.Email}</div>
                      </div>
                      <div className="flex gap-2">
                        <a
                          href={`http://localhost:8080/${v.ProfileImage}`}
                          target="_blank"
                          rel="noreferrer"
                          className="w-16 h-16 bg-black rounded block overflow-hidden"
                        >
                          <img
                            src={`http://localhost:8080/${v.ProfileImage}`}
                            className="w-full h-full object-cover"
                          />
                        </a>
                        <a
                          href={`http://localhost:8080/${v.KTMImage}`}
                          target="_blank"
                          rel="noreferrer"
                          className="w-16 h-16 bg-black rounded block overflow-hidden"
                        >
                          <img
                            src={`http://localhost:8080/${v.KTMImage}`}
                            className="w-full h-full object-cover"
                          />
                        </a>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleVerifyUser(v.ID, "approve")}
                        className="flex-1 bg-green-600 hover:bg-green-700 py-2 rounded font-bold"
                      >
                        Approve & Send Token
                      </button>
                      <button
                        onClick={() => handleVerifyUser(v.ID, "reject")}
                        className="flex-1 bg-red-600 hover:bg-red-700 py-2 rounded font-bold"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
                {verifications.length === 0 && (
                  <p className="text-gray-500 italic">
                    Tidak ada antrian registrasi.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* --- VERIFIKASI SUARA TAB (New) --- */}
          {activeTab === "verifikasi_suara" && (
            <div>
              <h2 className="text-xl font-bold mb-4">Verifikasi Suara Masuk</h2>
              <div className="grid grid-cols-1 gap-6">
                {pendingVotes.map((v) => (
                  <div
                    key={v.ID}
                    className="bg-gray-700 rounded-lg p-4 flex flex-col md:flex-row gap-6 items-center"
                  >
                    <div className="flex-1">
                      <div className="text-sm text-gray-400">Pemilih:</div>
                      <div className="font-bold text-lg">{v.UserName}</div>
                    </div>
                    <div className="flex-1">
                      <div className="text-sm text-gray-400">Memilih:</div>
                      <div className="font-bold text-blue-400">
                        {v.CandidateName}
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <div className="text-center">
                        <div className="text-xs mb-1">KTM Saat Vote</div>
                        <a
                          href={`http://localhost:8080/${v.KTMImage}`}
                          target="_blank"
                          rel="noreferrer"
                          className="block w-24 h-16 bg-black rounded overflow-hidden"
                        >
                          <img
                            src={`http://localhost:8080/${v.KTMImage}`}
                            className="w-full h-full object-cover"
                          />
                        </a>
                      </div>
                      <div className="text-center">
                        <div className="text-xs mb-1">Foto Diri Saat Vote</div>
                        <a
                          href={`http://localhost:8080/${v.SelfImage}`}
                          target="_blank"
                          rel="noreferrer"
                          className="block w-24 h-16 bg-black rounded overflow-hidden"
                        >
                          <img
                            src={`http://localhost:8080/${v.SelfImage}`}
                            className="w-full h-full object-cover"
                          />
                        </a>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 w-full md:w-auto">
                      <button
                        onClick={() => handleVerifyVote(v.ID, "approve")}
                        className="bg-green-600 hover:bg-green-700 px-6 py-2 rounded font-bold"
                      >
                        Sah-kan
                      </button>
                      <button
                        onClick={() => handleVerifyVote(v.ID, "reject")}
                        className="bg-red-600 hover:bg-red-700 px-6 py-2 rounded font-bold"
                      >
                        Tolak
                      </button>
                    </div>
                  </div>
                ))}
                {pendingVotes.length === 0 && (
                  <p className="text-gray-500 italic">
                    Tidak ada suara pending.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* --- KANDIDAT TAB --- */}
          {activeTab === "kandidat" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="bg-gray-700 p-4 rounded-lg h-fit">
                <h3 className="text-lg font-bold mb-4">Tambah Kandidat</h3>
                <form onSubmit={handleAddCandidate} className="space-y-3">
                  <input
                    placeholder="Nama Kandidat"
                    className="w-full bg-gray-800 border border-gray-600 p-2 rounded text-white"
                    value={newCandidate.name}
                    onChange={(e) =>
                      setNewCandidate({ ...newCandidate, name: e.target.value })
                    }
                    required
                  />
                  {/* Description field removed */}
                  <textarea
                    placeholder="Visi"
                    className="w-full bg-gray-800 border border-gray-600 p-2 rounded text-white"
                    value={newCandidate.visi}
                    onChange={(e) =>
                      setNewCandidate({ ...newCandidate, visi: e.target.value })
                    }
                    required
                  />
                  <textarea
                    placeholder="Misi"
                    className="w-full bg-gray-800 border border-gray-600 p-2 rounded text-white"
                    value={newCandidate.misi}
                    onChange={(e) =>
                      setNewCandidate({ ...newCandidate, misi: e.target.value })
                    }
                    required
                  />
                  <input
                    type="file"
                    onChange={(e) =>
                      e.target.files && setCandidateImg(e.target.files[0])
                    }
                    required
                    className="text-sm text-gray-400 file:bg-gray-600 file:border-0 file:rounded file:text-white file:px-2 file:py-1 hover:file:bg-gray-500"
                  />
                  <button
                    type="submit"
                    disabled={candidateLoading}
                    className="w-full bg-blue-600 hover:bg-blue-700 py-2 rounded font-bold disabled:opacity-50"
                  >
                    {candidateLoading ? "Saving..." : "Simpan Kandidat"}
                  </button>
                </form>
              </div>
              <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                {candidates.map((c) => (
                  <div
                    key={c.ID}
                    className="bg-gray-700 p-4 rounded-lg flex gap-4"
                  >
                    <img
                      src={`http://localhost:8080${c.ImageURL}`}
                      alt={c.Name}
                      className="w-24 h-24 object-cover rounded bg-gray-800"
                    />
                    <div>
                      <h4 className="font-bold text-lg">{c.Name}</h4>
                      <div className="text-xs text-gray-400 mt-2 space-y-1">
                        <p>
                          <strong>Visi:</strong> {c.Visi || "-"}
                        </p>
                        <p>
                          <strong>Misi:</strong> {c.Misi || "-"}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDeleteCandidate(c.ID)}
                        className="mt-2 text-xs text-red-400 hover:text-red-300 border border-red-500 px-2 py-1 rounded"
                      >
                        Delete Candidate
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* --- RECAP TAB (Formerly Suara) --- */}
          {activeTab === "recap" && (
            <div>
              <h2 className="text-xl font-bold mb-4">
                Hasil Perolehan Suara (Live Recap)
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left bg-gray-700 rounded-lg overflow-hidden">
                  <thead className="bg-gray-600">
                    <tr>
                      <th className="p-4 w-16">ID</th>
                      <th className="p-4">Kandidat</th>
                      <th className="p-4 text-right">Suara Sah (Approved)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((r) => (
                      <tr
                        key={r.CandidateID}
                        className="border-b border-gray-600 hover:bg-gray-600"
                      >
                        <td className="p-4 text-gray-400">{r.CandidateID}</td>
                        <td className="p-4 font-bold">{r.Name}</td>
                        <td className="p-4 text-right text-2xl font-bold text-green-400">
                          {r.Count}
                        </td>
                      </tr>
                    ))}
                    {results.length === 0 && (
                      <tr>
                        <td
                          colSpan={3}
                          className="p-8 text-center text-gray-400"
                        >
                          Belum ada suara yang disahkan.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
