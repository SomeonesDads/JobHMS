import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import UserDetailModal from "../components/UserDetailModal";
import VoteDetailModal from "../components/VoteDetailModal";
import AdminLayout from "../components/AdminLayout";
import { useToast } from "../contexts/ToastContext";
import { RefreshCw, CheckCircle2, XCircle, Plus, Trash2, Eye, EyeOff } from "lucide-react";

interface User {
  ID: number;
  Name: string;
  NIM: string;
  Email: string;
  Role: string;
  ProfileImage: string;
  KTMImage: string;
  HasVoted?: boolean;
  VerificationStatus?: string;
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
  id: number;
  userName: string;
  userNim: string;
  userEmail: string;
  ktmImage: string;
  selfImage: string;
  candidateName: string;
  rejectionReason?: string; // Added optional field
}

interface Candidate {
  ID: number;
  Name: string;
  Visi: string;
  Misi: string;
  ImageURL: string;
}

interface Result {
  CandidateID?: number;
  candidateId?: number;
  Name?: string;
  name?: string;
  imageUrl?: string;
  Count: number;
  count?: number;
}

const AdminPage = () => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem("user");
    return saved ? JSON.parse(saved) : null;
  });
  const [activeTab, setActiveTab] = useState("all_users");
  const navigate = useNavigate();
  const { success, error: showError } = useToast();

  // Data States
  // Data States
  const [verifications, setVerifications] = useState<Verification[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]); // Data for "all_users"
  const [pendingVotes, setPendingVotes] = useState<VoteRequest[]>([]);
  const [rejectedVotes, setRejectedVotes] = useState<VoteRequest[]>([]); // Added rejected votes state
  const [results, setResults] = useState<any[]>([]); // Using any to handle inconsistent casing from API if valid
  const [candidates, setCandidates] = useState<Candidate[]>([]);



  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [filterVerification, setFilterVerification] = useState("all");
  const [filterHasVoted, setFilterHasVoted] = useState("all");

  // Modal State
  const [selectedUser, setSelectedUser] = useState<Verification | null>(null);
  const [selectedVote, setSelectedVote] = useState<any>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showVoteModal, setShowVoteModal] = useState(false);

  // Candidate Form State
  const [isAddCandidateOpen, setIsAddCandidateOpen] = useState(false);
  const [newCandidate, setNewCandidate] = useState({
    name: "",
    visi: "",
    misi: "",
  });
  const [candidateImg, setCandidateImg] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Election Settings
  const [electionSettings, setElectionSettings] = useState({
    startTime: "",
    endTime: ""
  });
  const [showSensitive, setShowSensitive] = useState(false);
  
  // Vote Success Modal State
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successCandidateName, setSuccessCandidateName] = useState("");
  const [showResults, setShowResults] = useState(true);

  useEffect(() => {
    if (!user || user.Role !== "admin") {
      navigate("/loginadmin");
      return;
    }
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [user, navigate, activeTab]);

  const fetchData = () => {
    if (activeTab === "mahasiswa") fetchVerifications();
    if (activeTab === "mahasiswa") fetchVerifications();
    if (activeTab === "all_users") fetchAllUsers();
    if (activeTab === "verifikasi_suara") fetchPendingVotes();
    if (activeTab === "votes_rejected") fetchRejectedVotes();
    if (activeTab === "kandidat") fetchCandidates();
    if (activeTab === "recap") fetchResults();
  };

  const fetchVerifications = async () => {
    try {
      const res = await api.get("/admin/users/pending");
      setVerifications(res.data || []);
    } catch (err) { console.error(err); }
  };
  const fetchPendingVotes = async () => {
    try {
      const res = await api.get("/admin/votes/pending");
      setPendingVotes(Array.isArray(res.data) ? res.data : []);
    } catch (err) { console.error(err); setPendingVotes([]); }
  };
  const fetchRejectedVotes = async () => {
    try {
      const res = await api.get("/admin/votes/rejected");
      setRejectedVotes(Array.isArray(res.data) ? res.data : []);
    } catch (err) { console.error(err); setRejectedVotes([]); }
  };
  const fetchResults = async () => {
    try {
      const res = await api.get("/admin/results");
      setResults(res.data || []);
    } catch (err) { console.error(err); }
  };
  const fetchCandidates = async () => {
    try {
      const res = await api.get("/candidates");
      setCandidates(res.data || []);
    } catch (err) { console.error(err); }
  };

  const fetchAllUsers = async () => {
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append("q", searchQuery);
      if (filterVerification !== "all") params.append("verificationStatus", filterVerification);
      if (filterHasVoted !== "all") params.append("hasVoted", filterHasVoted);

      const res = await api.get(`/admin/users?${params.toString()}`);
      setAllUsers(res.data || []);
    } catch (err) { console.error(err); }
  };

  // Debounced search effect
  useEffect(() => {
    if (activeTab === "all_users") {
      const timer = setTimeout(() => {
        fetchAllUsers();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [searchQuery, filterVerification, filterHasVoted, activeTab]);

  const handleVerifyUser = async (userId: number, action: string) => {
    try {
      await api.post("/admin/verify", { userId, action });
      success(`User ${action}ed successfully`);
      fetchVerifications();
    } catch (err) { showError("Action failed"); }
  };

  const handleVerifyVote = async (voteId: number, action: string) => {
    try {
      // Find the vote to get details before verifying
      const vote = pendingVotes.find(v => v.id === voteId);
      
      await api.post("/admin/votes/verify", { voteId, action });
      
      if (action === "approve" && vote) {
        // Show detailed success message for approval
        setSuccessCandidateName(vote.candidateName);
        setShowSuccessModal(true);
      } else {
        success(`Vote ${action}ed successfully`);
      }
      
      fetchPendingVotes();
    } catch (err) { showError("Action failed"); }
  };

  const handleDeleteCandidate = async (id: number) => {
    if (!window.confirm("Are you sure?")) return;
    try {
      await api.delete(`/admin/candidates/${id}`);
      success("Candidate deleted");
      fetchCandidates();
    } catch (err) { showError("Delete failed"); }
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
      success("Candidate added!");
      setNewCandidate({ name: "", visi: "", misi: "" });
      setCandidateImg(null);
      setIsAddCandidateOpen(false);
      fetchCandidates();
    } catch (err) { showError("Failed to add candidate"); }
    finally { setSubmitting(false); }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/admin/settings", electionSettings);
      success("Settings saved successfully");
    } catch (err) {
      showError("Failed to save settings");
    }
  }

  const getImageSrc = (path: string) => {
    if (!path) return "";
    if (path.startsWith("http")) return path;
    return `http://localhost:8080${path}`;
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
            {activeTab === "recap" ? "Dashboard Overview" :
              activeTab === "mahasiswa" ? "User Registrations" :
                activeTab === "verifikasi_suara" ? "Vote Verification" :
                  activeTab === "kandidat" ? "Candidate Management" :
                    activeTab === "kandidat" ? "Candidate Management" :
                      activeTab === "all_users" ? "All Users" :
                        "Election Settings"}
          </h1>
          <p className="text-slate-500 text-sm">
            Manage your election system efficiently.
          </p>
        </div>
        <div className="flex gap-3">
          <div className="bg-white border border-slate-200 rounded-xl p-1 flex shadow-sm">
            {["mahasiswa", "all_users", "verifikasi_suara", "votes_rejected", "kandidat", "recap", "settings"].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab
                  ? "bg-emerald-50 text-emerald-700 shadow-sm"
                  : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                  }`}
              >
                {tab === "mahasiswa" && "Registrations"}
                {tab === "all_users" && "User List"}
                {tab === "verifikasi_suara" && "Votes"}
                {tab === "votes_rejected" && "Rejected Votes"}
                {tab === "kandidat" && "Candidates"}
                {tab === "recap" && "Results"}
                {tab === "settings" && "Settings"}
              </button>
            ))}
          </div>
          <button
            onClick={fetchData}
            className="p-3 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-slate-500 hover:text-emerald-600 shadow-sm"
            title="Refresh Data"
          >
            <RefreshCw size={20} />
          </button>
        </div>
      </div>

      {/* --- RECAP TAB --- */}
      {activeTab === "recap" && (
        <div className="space-y-8 animate-fade-in-up">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-slate-900">Election Results</h2>
            <button
              onClick={() => setShowResults(!showResults)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                !showResults ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {!showResults ? <><Eye size={18} /> Show Results</> : <><EyeOff size={18} /> Hide Results</>}
            </button>
          </div>

          {showResults ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                  label="Total Votes Cast"
                  value={results.reduce((acc, curr) => acc + (curr.Count || curr.count || 0), 0)}
                  color="text-emerald-600"
                />
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
                      {results.map((r, idx) => {
                        const total = results.reduce((acc, curr) => acc + (curr.Count || curr.count || 0), 0);
                        const count = r.Count || r.count || 0;
                        const percent = total > 0 ? ((count / total) * 100).toFixed(1) : "0";
                        return (
                          <tr key={idx} className="hover:bg-slate-50 transition-colors">
                            <td className="p-5 font-medium text-slate-900 flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-slate-100 overflow-hidden">
                                {r.imageUrl && <img src={getImageSrc(r.imageUrl)} className="w-full h-full object-cover" />}
                              </div>
                              {r.Name || r.name}
                            </td>
                            <td className="p-5 text-right font-mono text-xl text-emerald-600 font-bold">
                              {count}
                            </td>
                            <td className="p-5 text-right text-slate-500">
                              {percent}%
                            </td>
                          </tr>
                        );
                      })}
                      {results.length === 0 && (
                        <tr>
                          <td colSpan={3} className="p-8 text-center text-slate-500">No votes recorded yet.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400 flex flex-col items-center">
              <EyeOff size={48} className="mb-4 opacity-50" />
              <p className="text-lg font-medium text-slate-500">Results are currently hidden</p>
              <p className="text-sm">Click "Show Results" to view the current count</p>
            </div>
          )}
        </div>
      )}

      {/* --- MAHASISWA TAB --- */}
      {activeTab === "mahasiswa" && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm min-h-[400px]">
            {verifications.length === 0 ? (
              <div className="p-12 text-center flex flex-col items-center justify-center h-full text-slate-400">
                <CheckCircle2 size={48} className="mb-4 text-emerald-100" />
                <p>All clear! No pending registrations.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 p-6">
                {verifications.map((v) => (
                  <div key={v.ID} className="bg-slate-50 border border-slate-200 rounded-xl p-5 flex flex-col lg:flex-row gap-6 items-start lg:items-center hover:border-emerald-200 transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-2">
                        <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-200 border border-slate-300">
                          <img src={getImageSrc(v.ProfileImage)} className="w-full h-full object-cover" alt="Profile" />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 text-lg">{v.Name}</h4>
                          <span className="text-slate-500 font-mono text-sm bg-white border border-slate-200 px-2 py-0.5 rounded">{v.NIM}</span>
                        </div>
                      </div>
                      <p className="text-slate-500 text-sm ml-16">{v.Email}</p>
                    </div>

                    <div className="flex gap-4">
                      <a href={getImageSrc(v.KTMImage)} target="_blank" rel="noreferrer" className="group relative block w-32 h-20 bg-slate-100 rounded-lg overflow-hidden border border-slate-200 hover:border-emerald-500 transition-colors">
                        <img src={getImageSrc(v.KTMImage)} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" />
                        <span className="absolute bottom-0 left-0 bg-slate-900/70 text-white text-[10px] w-full text-center py-1 backdrop-blur-sm">View KTM</span>
                      </a>
                    </div>

                    <div className="flex gap-2 w-full lg:w-auto mt-4 lg:mt-0">
                      <button onClick={() => handleVerifyUser(v.ID, "approve")} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors shadow-sm">
                        <CheckCircle2 size={16} /> Approve
                      </button>
                      <button onClick={() => handleVerifyUser(v.ID, "reject")} className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-red-50 text-red-500 border border-red-200 hover:border-red-300 rounded-lg font-medium transition-all">
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

      {/* --- ALL USERS TAB --- */}
      {activeTab === "all_users" && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h2 className="font-bold text-xl mb-6 text-slate-900">Registered Users</h2>

            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <input
                type="text"
                placeholder="Search by Name, NIM, or Email..."
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <select
                className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 outline-none"
                value={filterVerification}
                onChange={(e) => setFilterVerification(e.target.value)}
              >
                <option value="all">Verif: All</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
              <select
                className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 outline-none"
                value={filterHasVoted}
                onChange={(e) => setFilterHasVoted(e.target.value)}
              >
                <option value="all">Voted: All</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider">
                  <tr>
                    <th className="p-4 rounded-tl-xl">User</th>
                    <th className="p-4">NIM</th>
                    <th className="p-4">Email</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 rounded-tr-xl text-center">Voted?</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {allUsers.map((u) => (
                    <tr key={u.ID} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden">
                          {u.ProfileImage && <img src={getImageSrc(u.ProfileImage)} className="w-full h-full object-cover" />}
                        </div>
                        <span className="font-medium text-slate-900">{u.Name}</span>
                      </td>
                      <td className="p-4 font-mono text-sm text-slate-600">{u.NIM}</td>
                      <td className="p-4 text-sm text-slate-600">{u.Email}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wide border ${u.VerificationStatus === 'approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                          u.VerificationStatus === 'pending' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                            'bg-red-50 text-red-600 border-red-100'
                          }`}>
                          {u.VerificationStatus}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        {u.HasVoted ?
                          <CheckCircle2 size={20} className="text-emerald-500 mx-auto" /> :
                          <span className="text-slate-300 text-xs font-medium">No</span>
                        }
                      </td>
                    </tr>
                  ))}
                  {allUsers.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-400">No users found match your criteria.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --- VERIFIKASI SUARA TAB --- */}
      {activeTab === "verifikasi_suara" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
             <h3 className="font-bold text-lg text-slate-900">Vote Verification Queue</h3>
             <button
               onClick={() => setShowSensitive(!showSensitive)}
               className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                 showSensitive ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' : 'bg-emerald-100 text-emerald-700'
               }`}
             >
               {showSensitive ? <EyeOff size={18} /> : <Eye size={18} />}
               {showSensitive ? "Hide Details" : "Show Details"}
             </button>
           </div>
          {pendingVotes.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400">
              No pending votes to verify.
            </div>
          ) : (
            <div className="space-y-4">
              {pendingVotes.map((v) => (
                <div key={v.id} className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col md:flex-row gap-8 items-center shadow-sm">
                  <div className="flex-1">
                    <h4 className="text-slate-400 text-xs uppercase tracking-wider mb-1 font-bold">Voter</h4>
                    <p className="font-bold text-lg text-slate-900">{showSensitive ? v.userName : "********"}</p>
                  </div>
                  {/* Voted For removed as requested */}

                  <div className="flex gap-4">
                    <div className="text-center">
                      <span className="text-[10px] text-slate-400 mb-1 block uppercase font-bold">KTM Record</span>
                      {showSensitive ? (
                        <a href={getImageSrc(v.ktmImage)} target="_blank" className="block w-20 h-20 bg-slate-100 rounded-lg border border-slate-200 overflow-hidden hover:scale-105 transition-transform shadow-sm">
                          <img src={getImageSrc(v.ktmImage)} className="w-full h-full object-cover" />
                        </a>
                      ) : (
                        <div className="w-20 h-20 bg-slate-100 rounded-lg border border-slate-200 flex items-center justify-center">
                          <EyeOff size={20} className="text-slate-300" />
                        </div>
                      )}
                    </div>
                    <div className="text-center">
                      <span className="text-[10px] text-slate-400 mb-1 block uppercase font-bold">Verification</span>
                      {showSensitive ? (
                        <a href={getImageSrc(v.selfImage)} target="_blank" className="block w-20 h-20 bg-slate-100 rounded-lg border border-slate-200 overflow-hidden hover:scale-105 transition-transform shadow-sm">
                          <img src={getImageSrc(v.selfImage)} className="w-full h-full object-cover" />
                        </a>
                      ) : (
                        <div className="w-20 h-20 bg-slate-100 rounded-lg border border-slate-200 flex items-center justify-center">
                          <EyeOff size={20} className="text-slate-300" />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 min-w-[140px]">
                    <button onClick={() => handleVerifyVote(v.id, "approve")} className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-emerald-200 shadow-md transition-all">VALIDATE</button>
                    <button onClick={() => handleVerifyVote(v.id, "reject")} className="w-full py-2 bg-white hover:bg-red-50 text-slate-500 hover:text-red-500 border border-slate-200 hover:border-red-200 rounded-lg transition-all">INVALID</button>

                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* --- REJECTED VOTES TAB --- */}
      {activeTab === "votes_rejected" && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h2 className="font-bold text-xl mb-6 text-slate-900">Rejected Votes Log</h2>
            {rejectedVotes.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                No rejected votes found.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider">
                    <tr>
                      <th className="p-4 rounded-tl-xl w-48">NIM</th>
                      <th className="p-4 rounded-tr-xl">Reason</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {rejectedVotes.map((v) => (
                      <tr key={v.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-4 font-mono text-slate-900 font-bold">{v.userNim}</td>
                        <td className="p-4">
                          <span className="text-red-600 font-medium">
                            {v.rejectionReason || "No reason provided"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
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
              {isAddCandidateOpen ? <><XCircle size={18} /> Cancel</> : <><Plus size={18} /> Add Candidate</>}
            </button>
          </div>

          {isAddCandidateOpen && (
            <div className="bg-white border border-slate-200 p-8 rounded-2xl max-w-2xl mx-auto shadow-xl animate-fade-in">
              <h3 className="text-2xl font-bold mb-8 text-slate-900 text-center">New Candidate</h3>
              <form onSubmit={handleAddCandidate} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Name</label>
                  <input className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="Candidate Name" value={newCandidate.name} onChange={e => setNewCandidate({ ...newCandidate, name: e.target.value })} required />
                </div>
                <div className="grid grid-cols-1 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Vision (Visi)</label>
                    <textarea className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 min-h-[100px] focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="Short, inspiring vision..." value={newCandidate.visi} onChange={e => setNewCandidate({ ...newCandidate, visi: e.target.value })} required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Mission (Misi)</label>
                    <textarea className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 min-h-[100px] focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="Detailed mission points..." value={newCandidate.misi} onChange={e => setNewCandidate({ ...newCandidate, misi: e.target.value })} required />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Photo</label>
                  <input type="file" className="block w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-5 file:rounded-xl file:border-0 file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer bg-slate-50 rounded-xl border border-slate-200" onChange={e => e.target.files && setCandidateImg(e.target.files[0])} required />
                </div>
                <button type="submit" disabled={submitting} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-emerald-200 mt-4">
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
                    <button onClick={() => handleDeleteCandidate(c.ID)} className="w-full py-2.5 flex items-center justify-center gap-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors text-sm font-medium">
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
              <input type="datetime-local" value={electionSettings.startTime} onChange={(e) => setElectionSettings({ ...electionSettings, startTime: e.target.value })} className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl p-3.5 focus:ring-2 focus:ring-emerald-500 outline-none" />
            </div>
            <div>
              <label className="block text-slate-600 font-medium mb-2">End Time</label>
              <input type="datetime-local" value={electionSettings.endTime} onChange={(e) => setElectionSettings({ ...electionSettings, endTime: e.target.value })} className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl p-3.5 focus:ring-2 focus:ring-emerald-500 outline-none" />
            </div>
            <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl transition-colors shadow-lg shadow-emerald-200 mt-4">Save Settings</button>
          </form>
        </div>
      )}
      {/* --- SUCCESS MODAL --- */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl flex flex-col items-center text-center transform transition-all scale-100 animate-scale-up">
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-6 text-emerald-600">
               <CheckCircle2 size={40} strokeWidth={3} />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-2">Vote Recorded!</h3>
            <p className="text-slate-500 mb-6">The vote has been successfully verified and added to the count.</p>
            
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 w-full mb-8">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Voted For</span>
              <span className="text-lg font-bold text-emerald-700">{successCandidateName || "Unknown Candidate"}</span>
            </div>

            <button 
              onClick={() => setShowSuccessModal(false)}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 rounded-xl transition-colors shadow-lg shadow-slate-200"
            >
              Continue
            </button>
          </div>
        </div>
      )}

    </AdminLayout>
  );
};

export default AdminPage;
