import React from 'react';

const Steps = ({ currentStep }) => {
    return (
        <div className="flex items-center justify-center mb-8">
            <div className="flex items-center">
                <div className={`rounded-full h-10 w-10 flex items-center justify-center border-2 
                    ${currentStep >= 1 ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-blue-600 text-blue-600'}`}>
                    1
                </div>
                <div className={`ml-2 font-medium ${currentStep >= 1 ? 'text-blue-600' : 'text-gray-500'}`}>Verify</div>
            </div>
            <div className={`flex-auto border-t-2 transition duration-500 ease-in-out mx-4 w-24
                ${currentStep >= 2 ? 'border-blue-600' : 'border-gray-300'}`}></div>
            <div className="flex items-center">
                <div className={`rounded-full h-10 w-10 flex items-center justify-center border-2 
                    ${currentStep >= 2 ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-gray-300 text-gray-500'}`}>
                    2
                </div>
                <div className={`ml-2 font-medium ${currentStep >= 2 ? 'text-blue-600' : 'text-gray-500'}`}>Vote</div>
            </div>
        </div>
    );
}

export default Steps;
