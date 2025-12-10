import React, { useEffect, useState } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastProps {
    id: string;
    message: string;
    type: ToastType;
    duration?: number;
    onClose: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({ id, message, type, duration = 3000, onClose }) => {
    const [isExiting, setIsExiting] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsExiting(true);
        }, duration);

        return () => clearTimeout(timer);
    }, [duration]);

    useEffect(() => {
        if (isExiting) {
            const timer = setTimeout(() => {
                onClose(id);
            }, 300); // Match animation duration
            return () => clearTimeout(timer);
        }
    }, [isExiting, id, onClose]);

    const handleClose = () => {
        setIsExiting(true);
    };

    const styles = {
        success: "bg-green-100 border-green-200 text-green-800",
        error: "bg-red-100 border-red-200 text-red-800",
        info: "bg-blue-100 border-blue-200 text-blue-800",
        warning: "bg-yellow-100 border-yellow-200 text-yellow-800"
    };

    const icons = {
        success: <CheckCircle className="w-5 h-5 text-green-600" />,
        error: <AlertCircle className="w-5 h-5 text-red-600" />,
        info: <Info className="w-5 h-5 text-blue-600" />,
        warning: <AlertTriangle className="w-5 h-5 text-yellow-600" />
    };

    return (
        <div 
            className={`
                flex items-center gap-3 p-4 rounded-lg shadow-lg border backdrop-blur-sm bg-opacity-95
                transform transition-all duration-300 ease-in-out
                ${styles[type]}
                ${isExiting ? 'opacity-0 translate-x-full' : 'opacity-100 translate-x-0'}
            `}
            role="alert"
        >
            <div className="flex-shrink-0">
                {icons[type]}
            </div>
            <div className="flex-1 text-sm font-medium">
                {message}
            </div>
            <button 
                onClick={handleClose}
                className="flex-shrink-0 ml-4 bg-transparent hover:bg-black/5 rounded-full p-1 transition-colors"
                aria-label="Close"
            >
                <X className="w-4 h-4 opacity-50" />
            </button>
        </div>
    );
};

export default Toast;
