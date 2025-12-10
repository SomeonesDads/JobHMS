import React, { useEffect } from "react";
import { X, CheckCircle, AlertTriangle, AlertCircle, Info } from "lucide-react";

export type ToastType = "success" | "error" | "warning" | "info";

interface ToastProps {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
  onClose: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({ id, type, message, duration = 3000, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(id);
    }, duration);
    return () => clearTimeout(timer);
  }, [id, duration, onClose]);

  const styles = {
    success: "bg-emerald-50 border-emerald-200 text-emerald-800",
    error: "bg-red-50 border-red-200 text-red-800",
    warning: "bg-amber-50 border-amber-200 text-amber-800",
    info: "bg-blue-50 border-blue-200 text-blue-800",
  };

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-emerald-500" />,
    error: <AlertCircle className="w-5 h-5 text-red-500" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-500" />,
    info: <Info className="w-5 h-5 text-blue-500" />,
  };

  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg shadow-black/5 mb-3 transition-all animate-slide-in-right ${styles[type]}`}>
      {icons[type]}
      <span className="text-sm font-medium">{message}</span>
      <button onClick={() => onClose(id)} className="p-1 hover:bg-black/5 rounded-full transition-colors ml-2">
        <X size={16} className="opacity-60" />
      </button>
    </div>
  );
};

export default Toast;
