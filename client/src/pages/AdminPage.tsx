import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../api";
import AdminLayout from "../components/AdminLayout";
import { useToast } from "../contexts/ToastContext";
import {
  CheckCircle2,
  XCircle,
  Plus,
  Trash2,
  MoreHorizontal,
  Search,
  RefreshCw,
} from "lucide-react";

// --- Interfaces ---
interface User {
  ID: number;
  Name: string;
  NIM: string;
  Email: string;
  Role: string;
  ProfileImage: string;
  KTMImage: string;
  VerificationStatus: string;
}

interface VoteRequest {
  ID: number;
  UserName: string;
  CandidateName: string;
  KTMImage: string;
  SelfImage: string;
  user_name?: string; // from join
  candidate_name?: string; // from join
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
  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "recap";

  // Data States
  const [verifications, setVerifications] = useState<User[]>([]);
  const [pendingVotes, setPendingVotes] = useState<VoteRequest[]>([]);
  const [results, setResults] = useState<Result[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(false);

  // Stats
  const [stats, setStats] = useState({
    totalPendingUsers: 0,
    totalPendingVotes: 0,
    totalVotes: 0,
  });

  // Candidate Form
  const [isAddCandidateOpen, setIsAddCandidateOpen] = useState(false);
  const [newCandidate, setNewCandidate] = useState({
    name: "",
    visi: "",
    misi: "",
  });
  const [candidateImg, setCandidateImg] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Settings
  const [electionSettings, setElectionSettings] = useState({
    startTime: "",
    endTime: ""
  });

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 8000); // Poll every 8s
    return () => clearInterval(interval);
  }, [activeTab]);

  const fetchData = async () => {
    // We could optimize to only fetch relevant tab data, but simple is fine for now
    // Actually, let's fetch based on tab to save bandwidth
    try {
      if (activeTab === "mahasiswa") {
        const res = await api.get("/admin/users/pending");
        setVerifications(res.data || []);
      }
      if (activeTab === "verifikasi_suara") {
        const res = await api.get("/admin/votes/pending");
        setPendingVotes(res.data || []);
      }
      if (activeTab === "kandidat") {
        const res = await api.get("/candidates");
        setCandidates(res.data || []);
      }
      if (activeTab === "recap") {
        const res = await api.get("/admin/results");
        setResults(res.data || []);
      }
      if (activeTab === "settings") {
        const res = await api.get("/settings");
        // Convert to local datetime-local string format: YYYY-MM-DDTHH:mm
        // API returns ISO string (e.g. 2023-12-01T10:00:00Z)
        // We need to keep it compatible with input type="datetime-local"
        const formatTime = (iso: string) => {
             if (!iso) return "";
             const d = new Date(iso);
             // handle timezone offset
             const pad = (n: number) => n < 10 ? '0' + n : n;
             return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
        };
        setElectionSettings({
             startTime: formatTime(res.data.StartTime),
             endTime: formatTime(res.data.EndTime)
        });
      }
    } catch (err) {
      console.error("Fetch error:", err);
    }
  };

  // --- Handlers ---

  const { success, error: showError } = useToast();



  const handleVerifyUser = async (userId: number, action: string) => {
    if (!window.confirm(`Are you sure you want to ${action} this user?`)) return;
    try {
      await api.post("/admin/verify", { userId, action });
      fetchData();
      success(`User ${action}ed successfully`);
    } catch (err) {
      showError(`Failed to ${action} user`);
    }
  };

  const handleVerifyVote = async (voteId: number, action: string) => {
    if (!window.confirm(`Are you sure you want to ${action} this vote?`)) return;
    try {
      await api.post("/admin/votes/verify", { voteId, action });
      fetchData();
      success(`Vote ${action}ed`);
    } catch (err) {
      showError(`Failed to ${action} vote`);
    }
  };

  const handleDeleteCandidate = async (id: number) => {
    if (!window.confirm("Delete this candidate? Cannot be undone.")) return;
    try {
      await api.delete(`/admin/candidates/${id}`);
      fetchData();
    } catch (err) {
      alert("Failed to delete");
    }
  };



  const handleAddCandidate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const data = new FormData();
    data.append("name", newCandidate.name);
    data.append("visi", newCandidate.visi);
    data.append("misi", newCandidate.misi);
    if (candidateImg) data.append("image", candidateImg);

    try {
      await api.post("/admin/candidates", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setIsAddCandidateOpen(false);
      setNewCandidate({ name: "", visi: "", misi: "" });
      setCandidateImg(null);
      fetchData();
      success("Candidate added successfully");
    } catch (err: any) {
      showError(err.response?.data?.error || "Failed to add candidate");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!window.confirm("Update election timing?")) return;
    try {
        const start = new Date(electionSettings.startTime);
        const end = new Date(electionSettings.endTime);
        
        await api.post("/admin/settings", {
            startTime: start.toISOString(),
            endTime: end.toISOString()
        });
        success("Settings updated");
    } catch (err: any) {
        showError("Failed to update settings");
    }
  };

  const getImageSrc = (path: string) => {
    if (!path) return "";
    if (path.startsWith("http")) return path;
    return `http://localhost:8080${path.startsWith("/") ? "" : "/"}${path}`;
  };

  // --- Sub-Components ---

  const StatCard = ({ label, value, color, icon }: any) => (
    <div className="bg-white border border-slate-200 p-6 rounded-2xl flex flex-col shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
          <span className="text-slate-500 text-sm font-semibold uppercase tracking-wider">
            {label}
          </span>
          {icon && <div className={`p-2 rounded-lg bg-slate-50 text-slate-400`}>{icon}</div>}
      </div>
      <span className={`text-4xl font-bold ${color}`}>{value}</span>
    </div>
  );

  return (
    <AdminLayout>
      {/* Header Area */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            {activeTab === "recap" && "Dashboard Overview"}
            {activeTab === "mahasiswa" && "User Registrations"}
            {activeTab === "verifikasi_suara" && "Vote Verification"}
            {activeTab === "kandidat" && "Candidate Management"}
            {activeTab === "settings" && "Election Settings"}
          </h1>
          <p className="text-slate-500 text-sm">
            Manage your election system efficiently.
          </p>
        </div>
        <button
          onClick={fetchData}
           className="p-3 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-slate-500 hover:text-emerald-600 shadow-sm"
          title="Refresh Data"
        >
          <RefreshCw size={20} />
        </button>
      </div>

      {/* --- RECAP TAB --- */}
      {activeTab === "recap" && (
        <div className="space-y-8 animate-fade-in-up">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard
              label="Total Votes Cast"
              value={results.reduce((acc, curr) => acc + curr.Count, 0)}
              color="text-emerald-600"
            />
            {/* We could fetch more stats if the API supported it */}
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-6 border-b border-slate-100">
              <h3 className="font-bold text-lg text-slate-900">Live Results</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider">
                  <tr>
                    <th className="p-5">Candidate</th>
                    <th className="p-5 text-right">Votes</th>
                    <th className="p-5 text-right">Percentage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {results.map((r) => {
                    const total = results.reduce(
                      (acc, curr) => acc + curr.Count,
                      0
                    );
                    const percent =
                      total > 0 ? ((r.Count / total) * 100).toFixed(1) : "0";
                    return (
                      <tr key={r.CandidateID} className="hover:bg-slate-50 transition-colors">
                        <td className="p-5 font-medium text-slate-900">{r.Name}</td>
                        <td className="p-5 text-right font-mono text-xl text-emerald-600 font-bold">
                          {r.Count}
                        </td>
                        <td className="p-5 text-right text-slate-500">
                          {percent}%
                        </td>
                      </tr>
                    );
                  })}
                  {results.length === 0 && (
                    <tr>
                      <td colSpan={3} className="p-8 text-center text-slate-500">
                        No votes recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --- MAHASISWA TAB --- */}
      {activeTab === "mahasiswa" && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm min-h-[400px]">
             {/* If we had search, it would be here */}
            {verifications.length === 0 ? (
              <div className="p-12 text-center flex flex-col items-center justify-center h-full text-slate-400">
                <CheckCircle2 size={48} className="mb-4 text-emerald-100" />
                <p>All clear! No pending registrations.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 p-6">
                {verifications.map((v) => (
                  <div
                    key={v.ID}
                    className="bg-slate-50 border border-slate-200 rounded-xl p-5 flex flex-col lg:flex-row gap-6 items-start lg:items-center hover:border-emerald-200 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-2">
                        <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-200 border border-slate-300">
                          <img
                            src={getImageSrc(v.ProfileImage)}
                            className="w-full h-full object-cover"
                            alt="Profile"
                          />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 text-lg">
                            {v.Name}
                          </h4>
                          <span className="text-slate-500 font-mono text-sm bg-white border border-slate-200 px-2 py-0.5 rounded">
                            {v.NIM}
                          </span>
                        </div>
                      </div>
                      <p className="text-slate-500 text-sm ml-16">{v.Email}</p>
                    </div>

                    <div className="flex gap-4">
                      {/* Images Preview */}
                      <a
                        href={getImageSrc(v.KTMImage)}
                        target="_blank"
                        rel="noreferrer"
                        className="group relative block w-32 h-20 bg-slate-100 rounded-lg overflow-hidden border border-slate-200 hover:border-emerald-500 transition-colors"
                      >
                         <img src={getImageSrc(v.KTMImage)} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" />
                         <span className="absolute bottom-0 left-0 bg-slate-900/70 text-white text-[10px] w-full text-center py-1 backdrop-blur-sm">View KTM</span>
                      </a>
                    </div>

                    <div className="flex gap-2 w-full lg:w-auto mt-4 lg:mt-0">
                      <button
                        onClick={() => handleVerifyUser(v.ID, "approve")}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors shadow-sm"
                      >
                        <CheckCircle2 size={16} /> Approve
                      </button>
                      <button
                        onClick={() => handleVerifyUser(v.ID, "reject")}
                        className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-red-50 text-red-500 border border-red-200 hover:border-red-300 rounded-lg font-medium transition-all"
                      >
                        <XCircle size={16} /> Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- VERIFIKASI SUARA TAB --- */}
      {activeTab === "verifikasi_suara" && (
        <div className="space-y-6">
          {pendingVotes.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400">
              No pending votes to verify.
            </div>
          ) : (
            <div className="space-y-4">
              {pendingVotes.map((v) => (
                <div
                  key={v.ID}
                  className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col md:flex-row gap-8 items-center shadow-sm"
                >
                  <div className="flex-1">
                    <h4 className="text-slate-400 text-xs uppercase tracking-wider mb-1 font-bold">
                      Voter
                    </h4>
                    <p className="font-bold text-lg text-slate-900">
                      {v.user_name || v.UserName}
                    </p>
                  </div>
                  <div className="flex-1 border-l border-slate-100 pl-8">
                     <h4 className="text-slate-400 text-xs uppercase tracking-wider mb-1 font-bold">
                      Voted For
                    </h4>
                    <p className="font-bold text-lg text-emerald-600">
                      {v.candidate_name || v.CandidateName}
                    </p>
                  </div>

                  <div className="flex gap-4">
                    <div className="text-center">
                      <span className="text-[10px] text-slate-400 mb-1 block uppercase font-bold">KTM Record</span>
                       <a href={getImageSrc(v.KTMImage)} target="_blank" className="block w-20 h-20 bg-slate-100 rounded-lg border border-slate-200 overflow-hidden hover:scale-105 transition-transform shadow-sm">
                          <img src={getImageSrc(v.KTMImage)} className="w-full h-full object-cover" />
                       </a>
                    </div>
                    <div className="text-center">
                      <span className="text-[10px] text-slate-400 mb-1 block uppercase font-bold">Verification</span>
                       <a href={getImageSrc(v.SelfImage)} target="_blank" className="block w-20 h-20 bg-slate-100 rounded-lg border border-slate-200 overflow-hidden hover:scale-105 transition-transform shadow-sm">
                          <img src={getImageSrc(v.SelfImage)} className="w-full h-full object-cover" />
                       </a>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 min-w-[140px]">
                     <button
                        onClick={() => handleVerifyVote(v.ID, "approve")}
                        className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-emerald-200 shadow-md transition-all"
                      >
                        VALIDATE
                      </button>
                      <button
                        onClick={() => handleVerifyVote(v.ID, "reject")}
                        className="w-full py-2 bg-white hover:bg-red-50 text-slate-500 hover:text-red-500 border border-slate-200 hover:border-red-200 rounded-lg transition-all"
                      >
                        INVALID
                      </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* --- KANDIDAT TAB --- */}
      {activeTab === "kandidat" && (
        <div className="space-y-8">
          <div className="flex justify-between items-center bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
             <h2 className="font-bold text-xl ml-2 text-slate-900">Candidates</h2>
             <button
                onClick={() => setIsAddCandidateOpen(!isAddCandidateOpen)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-colors ${isAddCandidateOpen ? 'bg-red-50 text-red-600' : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-200'}`}
             >
                {isAddCandidateOpen ? <><XCircle size={18}/> Cancel</> : <><Plus size={18}/> Add Candidate</>}
             </button>
          </div>

          {isAddCandidateOpen && (
            <div className="bg-white border border-slate-200 p-8 rounded-2xl max-w-2xl mx-auto shadow-xl animate-fade-in">
                <h3 className="text-2xl font-bold mb-8 text-slate-900 text-center">New Candidate</h3>
                <form onSubmit={handleAddCandidate} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Name</label>
                    <input
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                      placeholder="Candidate Name"
                      value={newCandidate.name}
                      onChange={e => setNewCandidate({...newCandidate, name: e.target.value})}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-6">
                     <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Vision (Visi)</label>
                        <textarea
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 min-h-[100px] focus:ring-2 focus:ring-emerald-500 outline-none"
                          placeholder="Short, inspiring vision..."
                          value={newCandidate.visi}
                          onChange={e => setNewCandidate({...newCandidate, visi: e.target.value})}
                          required
                        />
                     </div>
                     <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Mission (Misi)</label>
                        <textarea
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 min-h-[100px] focus:ring-2 focus:ring-emerald-500 outline-none"
                          placeholder="Detailed mission points..."
                          value={newCandidate.misi}
                          onChange={e => setNewCandidate({...newCandidate, misi: e.target.value})}
                          required
                        />
                     </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Photo</label>
                    <input
                      type="file"
                      className="block w-full text-sm text-slate-500
                        file:mr-4 file:py-2.5 file:px-5
                        file:rounded-xl file:border-0
                        file:text-sm file:font-semibold
                        file:bg-emerald-50 file:text-emerald-700
                        hover:file:bg-emerald-100
                        cursor-pointer bg-slate-50 rounded-xl border border-slate-200
                      "
                      onChange={e => e.target.files && setCandidateImg(e.target.files[0])}
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-emerald-200 transform hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                  >
                    {submitting ? "Saving..." : "Create Candidate"}
                  </button>
                </form>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {candidates.map(c => (
              <div key={c.ID} className="bg-white border border-slate-200 rounded-2xl overflow-hidden group hover:border-emerald-200 hover:shadow-lg transition-all duration-300">
                <div className="aspect-video relative overflow-hidden">
                   <img src={getImageSrc(c.ImageURL)} alt={c.Name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                   <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent opacity-60" />
                   <h3 className="absolute bottom-4 left-4 font-bold text-xl text-white drop-shadow-md">{c.Name}</h3>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <h4 className="text-xs uppercase text-emerald-600 font-bold mb-1 tracking-wider">Visi</h4>
                    <p className="text-sm text-slate-600 line-clamp-2">{c.Visi || "No vision provided."}</p>
                  </div>
                  <div>
                    <h4 className="text-xs uppercase text-emerald-600 font-bold mb-1 tracking-wider">Misi</h4>
                    <p className="text-sm text-slate-600 line-clamp-3">{c.Misi || "No mission provided."}</p>
                  </div>
                  <div className="pt-4 border-t border-slate-100">
                    <button
                      onClick={() => handleDeleteCandidate(c.ID)}
                      className="w-full py-2.5 flex items-center justify-center gap-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors text-sm font-medium"
                    >
                      <Trash2 size={16} /> Delete Candidate
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- SETTINGS TAB --- */}
      {activeTab === "settings" && (
        <div className="max-w-xl mx-auto bg-white border border-slate-200 rounded-2xl p-10 shadow-sm mt-8">
            <h3 className="text-2xl font-bold mb-8 text-slate-900 border-b border-slate-100 pb-4">Election Timing</h3>
            <form onSubmit={handleSaveSettings} className="space-y-6">
                <div>
                    <label className="block text-slate-600 font-medium mb-2">Start Time</label>
                    <input 
                        type="datetime-local" 
                        value={electionSettings.startTime}
                        onChange={(e) => setElectionSettings({...electionSettings, startTime: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl p-3.5 focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                </div>
                <div>
                     <label className="block text-slate-600 font-medium mb-2">End Time</label>
                     <input 
                         type="datetime-local" 
                         value={electionSettings.endTime}
                         onChange={(e) => setElectionSettings({...electionSettings, endTime: e.target.value})}
                         className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl p-3.5 focus:ring-2 focus:ring-emerald-500 outline-none"
                     />
                 </div>
                 <button 
                    type="submit"
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl transition-colors shadow-lg shadow-emerald-200 mt-4"
                 >
                     Save Settings
                 </button>
            </form>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminPage;
