import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, Users, Vote, Settings, LogOut, CheckCircle2 } from "lucide-react";

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/login-admin");
  };

  const navItems = [
    { label: "Dashboard", path: "/admin", icon: <LayoutDashboard size={20} /> },
    { label: "Settings", path: "/admin/settings", icon: <Settings size={20} /> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-900">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col fixed h-full z-10 shadow-sm">
        <div className="p-6 border-b border-slate-100 flex items-center gap-3">
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">Admin Panel</h1>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                  isActive
                    ? "bg-emerald-50 text-emerald-700 font-semibold shadow-sm"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <span className={isActive ? "text-emerald-600" : "text-slate-400 group-hover:text-slate-600"}>
                    {item.icon}
                </span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors font-medium"
          >
            <LogOut size={20} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 p-8 overflow-y-auto h-screen">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
      </main>
    </div>
  );
};

export default AdminLayout;
