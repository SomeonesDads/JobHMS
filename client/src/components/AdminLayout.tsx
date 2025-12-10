import React, { ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Vote,
  FileCheck,
  LogOut,
  Menu,
} from "lucide-react";

interface AdminLayoutProps {
  children: ReactNode;
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/login");
  };

  const menuItems = [
    {
      label: "Dashboard & Recap",
      icon: <LayoutDashboard size={20} />,
      path: "/admin?tab=recap",
      id: "recap",
    },
    {
      label: "Registrations",
      icon: <Users size={20} />,
      path: "/admin?tab=mahasiswa",
      id: "mahasiswa",
    },
    {
      label: "Vote Verification",
      icon: <FileCheck size={20} />,
      path: "/admin?tab=verifikasi_suara",
      id: "verifikasi_suara",
    },
    {
      label: "Candidates",
      icon: <Vote size={20} />,
      path: "/admin?tab=kandidat",
      id: "kandidat",
    },
    {
      label: "Settings",
      icon: <LayoutDashboard size={20} />, // Reusing icon or import Settings icon
      path: "/admin?tab=settings",
      id: "settings",
    },
  ];

  // Derive active tab from URL query param
  const query = new URLSearchParams(location.search);
  const activeTab = query.get("tab") || "mahasiswa";

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-emerald-500 selection:text-white">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col fixed h-full z-10 hidden md:flex shadow-sm">
        <div className="p-6 border-b border-slate-100 flex items-center gap-3">
          <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center font-bold text-white text-lg shadow-md shadow-emerald-500/20">
            A
          </div>
          <span className="font-bold text-xl tracking-tight text-slate-800">AdminPanel</span>
        </div>

        <nav className="flex-1 py-6 px-3 space-y-1">
          {menuItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <Link
                key={item.id}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group
                  ${
                    isActive
                      ? "bg-emerald-50 text-emerald-600"
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                  }`}
              >
                <div
                  className={`${
                    isActive ? "text-emerald-600" : "text-slate-400 group-hover:text-slate-600"
                  }`}
                >
                  {item.icon}
                </div>
                <span className="font-medium text-sm">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full text-left text-red-500 hover:bg-red-50 rounded-xl transition-colors"
          >
            <LogOut size={20} />
            <span className="font-medium text-sm">Logout</span>
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed w-full bg-white border-b border-slate-200 z-20 p-4 flex justify-between items-center shadow-sm">
        <span className="font-bold text-slate-800">AdminPanel</span>
        <button className="text-slate-500">
          <Menu size={24} />
        </button>
      </div>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 p-4 md:p-8 pt-20 md:pt-8 bg-slate-50 overflow-y-auto">
        <div className="max-w-6xl mx-auto animate-fade-in text-slate-900">
            {children}
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
