import React from 'react';
import { Check, Circle } from 'lucide-react';

interface PipelineProgressProps {
  currentStep: number; // 0 to 4
}

const STEPS = [
  'Preprocessing image',
  'Reading text & barcode',
  'Extracting statutory fields',
  'Evaluating compliance',
];

export const PipelineProgress: React.FC<PipelineProgressProps> = ({ currentStep }) => {
  return (
    <div className="flex flex-col space-y-4 relative py-2">
      {STEPS.map((label, index) => {
        const stepNum = index + 1;
        const isComplete = currentStep > stepNum;
        const isActive = currentStep === stepNum;
        const isPending = currentStep < stepNum;
        
        let circleClasses = 'flex items-center justify-center w-8 h-8 rounded-full bg-slate-900 border-2 z-10';
        if (isComplete) circleClasses += ' border-emerald-500 bg-emerald-500/20';
        else if (isActive) circleClasses += ' border-indigo-500 bg-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.5)] animate-pulse';
        else if (isPending) circleClasses += ' border-slate-700';

        return (
          <div key={index} className="flex items-center relative z-10">
            <div className={circleClasses}>
              {isComplete && <Check className="w-4 h-4 text-emerald-400" />}
              {isActive && <Circle className="w-3 h-3 fill-indigo-400 text-indigo-400" />}
              {isPending && <Circle className="w-2 h-2 fill-slate-600 text-slate-600" />}
            </div>
            <div className="ml-4 flex-1">
              <p className={`text-sm font-medium ${isActive ? 'text-indigo-400' : isComplete ? 'text-slate-200' : 'text-slate-500'}`}>
                {label}
              </p>
            </div>
          </div>
        );
      })}
      {/* Vertical Connecting Line */}
      <div className="absolute top-6 bottom-6 left-4 w-0.5 bg-slate-800 -z-0 transform -translate-x-1/2">
        <div 
          className="w-full bg-indigo-500 transition-all duration-500 ease-in-out"
          style={{ height: `${Math.min(100, Math.max(0, ((currentStep - 1) / (STEPS.length - 1)) * 100))}%` }}
        />
      </div>
    </div>
  );
};
