import React from 'react';

interface StepsProps {
    currentStep: number;
}

const Steps: React.FC<StepsProps> = ({ currentStep }) => {
  const steps = [
    { number: 1, title: 'Registrasi' },
    { number: 2, title: 'Verifikasi' },
    { number: 3, title: 'Voting' }
  ];

  return (
    <div className="w-full max-w-3xl mx-auto mb-8">
      <div className="flex items-center justify-between relative">
        <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-full h-1 bg-gray-200 -z-10" />
        
        {steps.map((step) => (
          <div key={step.number} className="flex flex-col items-center bg-white px-2">
            <div 
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white transition-colors duration-300 ${
                currentStep >= step.number ? 'bg-emerald-600 shadow-lg shadow-emerald-500/30' : 'bg-slate-200 text-slate-500'
              }`}
            >
              {step.number}
            </div>
            <span 
              className={`mt-2 text-sm font-medium ${
                currentStep >= step.number ? 'text-emerald-700' : 'text-slate-400'
              }`}
            >
              {step.title}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Steps;

