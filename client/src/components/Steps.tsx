import React from 'react';

interface StepsProps {
    currentStep: number;
}

const Steps: React.FC<StepsProps> = ({ currentStep }) => {
    return (
        <div className="flex items-center justify-center mb-8 gap-20">
            <div className="flex items-center">
                <div className={`rounded-full h-10 w-10 flex items-center justify-center
                    ${currentStep > 1 ? 'bg-green-900 text-white' : 'bg-green-600 border-green-700 text-white'}`}>
                    1
                </div>
                <div className={`ml-2 font-medium ${currentStep > 1 ? 'text-green-900' : 'text-gray-800'}`}>Verifikasi Diri</div>
            </div>
            <div className="flex items-center">
                <div className={`rounded-full h-10 w-10 flex items-center justify-center border-2 
                    ${currentStep >= 2 ? 'bg-green-600  text-white' : 'bg-white border-gray-300 text-gray-500'}`}>
                    2
                </div>
                <div className={`ml-2 font-medium ${currentStep > 2 ? 'text-green-900' : 'text-gray-800'}`}>Memilih Ketua BP HMS 2025/2026</div>
            </div>
        </div>
    );
}

export default Steps;

