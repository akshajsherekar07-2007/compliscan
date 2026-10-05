import React from 'react';
import { PipelineProgress } from '../components/PipelineProgress';

interface ProcessingScreenProps {
  currentStage: number; // 0-4
  capturedImage: string | null;
}

export function ProcessingScreen({ currentStage, capturedImage }: ProcessingScreenProps) {
  return (
    <div className="relative w-full h-screen overflow-hidden flex flex-col items-center justify-center bg-slate-950">
      {/* Blurred Background */}
      {capturedImage && (
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-110 blur-[16px] opacity-40 z-0"
          style={{ backgroundImage: `url(${capturedImage})` }}
        />
      )}
      
      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-slate-950/60 z-10" />

      {/* Centered Card */}
      <div className="relative z-20 bg-slate-900/95 backdrop-blur-xl border border-slate-700 p-8 rounded-3xl shadow-2xl max-w-sm w-[90%] flex flex-col items-center text-center">
        {/* Wordmark / Logo area */}
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <span className="text-white font-bold text-xl">C</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">CompliScan</h1>
        </div>

        {/* Pipeline Progress component */}
        <div className="w-full mb-6">
          <PipelineProgress currentStep={currentStage} />
        </div>

        {/* Status text */}
        <p className="text-sm font-medium text-slate-300 animate-pulse">
          {currentStage === 1 && 'Preprocessing packaging surfaces (Adaptive CLAHE)...'}
          {currentStage === 2 && 'Executing on-device OCR & GS1 barcode decoding...'}
          {currentStage === 3 && 'Zero-order optical fusion & statutory field extraction...'}
          {currentStage === 4 && 'Evaluating Legal Metrology (PCR 2011) compliance rules...'}
          {currentStage === 5 && 'Sealing Sec 65B court-admissible forensic dossier...'}
          {(currentStage < 1 || currentStage > 5) && 'Analyzing packaging declarations...'}
        </p>
        <span className="text-[10px] text-cyan-400 font-mono mt-2 uppercase tracking-wider">
          Zero-Order Permutation Invariant Fusion
        </span>
      </div>
    </div>
  );
}
