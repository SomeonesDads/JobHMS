import React from 'react';

interface StepsProps {
    currentStep: number;
}

const Steps: React.FC<StepsProps> = ({ currentStep }) => {
    return (
        <div className="flex items-center justify-center mb-10 gap-4 sm:gap-12">
            <div className={`flex items-center gap-3 transition-colors duration-300`}>
                <div className={`rounded-full h-10 w-10 flex items-center justify-center font-bold text-lg shadow-sm transition-all duration-300
                    ${currentStep >= 1 ? 'bg-emerald-600 text-white shadow-emerald-200' : 'bg-slate-200 text-slate-500'}`}>
                    1
                </div>
                <div className={`font-medium text-sm sm:text-base ${currentStep >= 1 ? 'text-emerald-800' : 'text-slate-400'}`}>Verifikasi Diri</div>
            </div>
            
            <div className={`h-1 w-12 sm:w-24 rounded-full transition-colors duration-300 ${currentStep >= 2 ? 'bg-emerald-200' : 'bg-slate-200'}`}></div>

            <div className={`flex items-center gap-3 transition-colors duration-300`}>
                <div className={`rounded-full h-10 w-10 flex items-center justify-center font-bold text-lg border-2 transition-all duration-300
                    ${currentStep >= 2 ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-200' : 'bg-white border-slate-300 text-slate-400'}`}>
                    2
                </div>
                <div className={`font-medium text-sm sm:text-base ${currentStep >= 2 ? 'text-emerald-800' : 'text-slate-400'}`}>Pemilihan</div>
            </div>
        </div>
    );
}

export default Steps;
