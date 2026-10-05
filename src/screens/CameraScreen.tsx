import React, { useRef, useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Camera as CameraIcon, Upload, Sparkles, SwitchCamera, Plus, Trash2, CheckCircle2, Layers } from 'lucide-react';

interface StagedPhoto {
  id: string;
  dataUrl: string;
  label: string;
}

interface CameraScreenProps {
  onCapture: (imageDataUrls: string | string[]) => void;
  onBack: () => void;
  onPresetSelect: (presetId: string) => void;
}

export function CameraScreen({ onCapture, onBack, onPresetSelect }: CameraScreenProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);
  
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  
  // Multi-angle staged photos
  const [stagedPhotos, setStagedPhotos] = useState<StagedPhoto[]>([]);
  const [captureFlash, setCaptureFlash] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Start live camera stream
  const startCamera = useCallback(async (mode: 'environment' | 'user') => {
    try {
      setCameraError(null);
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera streaming is not supported by your browser environment.');
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: mode },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });

      setStream(mediaStream);
      setCameraActive(true);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();
      }
    } catch (err: any) {
      console.warn('CompliScan Camera: Live stream initialization failed', err);
      setCameraActive(false);
      setCameraError(err.message || 'Camera access denied or unavailable. You can use the Upload button below.');
    }
  }, [stream]);

  // Initialize camera on mount
  useEffect(() => {
    startCamera(facingMode);

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Flip camera between front and rear
  const handleFlipCamera = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    startCamera(nextMode);
  };

  // Helper to trigger capture flash animation
  const triggerFlash = () => {
    setCaptureFlash(true);
    setTimeout(() => setCaptureFlash(false), 200);
  };

  // Capture current video frame into staged list
  const handleCaptureFrame = () => {
    if (videoRef.current && cameraActive) {
      triggerFlash();
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 1920;
      canvas.height = video.videoHeight || 1080;

      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
      
      const newIndex = stagedPhotos.length + 1;
      const sideName = newIndex === 1 ? 'Angle 1 (Front/PDP)' : newIndex === 2 ? 'Angle 2 (Back/Info)' : newIndex === 3 ? 'Angle 3 (Crimp/Stamp)' : `Angle ${newIndex}`;

      setStagedPhotos(prev => [
        ...prev,
        {
          id: Math.random().toString(36).substring(2, 9),
          dataUrl,
          label: sideName,
        }
      ]);
    } else {
      fileInputRef.current?.click();
    }
  };

  // Handle images uploaded via multi-file picker
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileList = Array.from(files);
    let loadedCount = 0;
    const newStaged: StagedPhoto[] = [];

    fileList.forEach((file, index) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          // Compress the image before staging it
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX_DIMENSION = 1920;
            let width = img.width;
            let height = img.height;

            if (width > height && width > MAX_DIMENSION) {
              height *= MAX_DIMENSION / width;
              width = MAX_DIMENSION;
            } else if (height > MAX_DIMENSION) {
              width *= MAX_DIMENSION / height;
              height = MAX_DIMENSION;
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d')!;
            ctx.drawImage(img, 0, 0, width, height);
            
            const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);

            const totalSoFar = stagedPhotos.length + index + 1;
            const label = totalSoFar === 1 ? 'Angle 1 (Front/PDP)' : totalSoFar === 2 ? 'Angle 2 (Back/Info)' : totalSoFar === 3 ? 'Angle 3 (Crimp/Stamp)' : `Angle ${totalSoFar}`;
            
            newStaged.push({
              id: Math.random().toString(36).substring(2, 9),
              dataUrl: compressedDataUrl,
              label,
            });

            loadedCount++;
            if (loadedCount === fileList.length) {
              setStagedPhotos(prev => [...prev, ...newStaged]);
            }
          };
          img.src = reader.result;
        }
      };
      reader.readAsDataURL(file);
    });

    // Reset input
    e.target.value = '';
  };

  // Remove a staged photo by id
  const handleRemovePhoto = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setStagedPhotos(prev => prev.filter(p => p.id !== id));
  };

  // Run final inspection on staged photos
  const handleAnalyze = () => {
    if (stagedPhotos.length === 0) {
      // If none staged yet, capture current frame immediately
      handleCaptureFrame();
      return;
    }

    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }

    const urls = stagedPhotos.map(p => p.dataUrl);
    onCapture(urls.length === 1 ? urls[0] : urls);
  };

  return (
    <div className="flex flex-col h-screen bg-black text-white overflow-hidden select-none">
      {/* Visual Capture Flash */}
      {captureFlash && (
        <div className="absolute inset-0 bg-white/80 z-50 pointer-events-none transition-opacity duration-150 animate-out fade-out" />
      )}

      {/* Top Header Bar */}
      <div className="flex items-center justify-between p-4 z-20 bg-gradient-to-b from-black/90 to-transparent">
        <button 
          onClick={() => {
            if (stream) stream.getTracks().forEach(t => t.stop());
            onBack();
          }} 
          className="p-2 hover:bg-white/10 rounded-full transition-colors"
          title="Back to Home"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>

        <div className="flex flex-col items-center">
          <h1 className="text-base font-bold text-slate-100 tracking-wide flex items-center gap-1.5">
            CompliScan 360°
            {stagedPhotos.length > 1 && (
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-indigo-500/30 text-indigo-300 border border-indigo-500/40">
                Multi-Side ({stagedPhotos.length})
              </span>
            )}
          </h1>
          <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            Zero-Order Permutation Invariant OCR
          </span>
          <span className="text-[10px] mt-0.5 text-cyan-300 font-mono flex items-center gap-1">
            <Layers className="w-3 h-3 text-cyan-400" />
            Cylindrical Dewarping Active (Curved Jars & Bottles)
          </span>
        </div>

        <button 
          onClick={handleFlipCamera}
          className="p-2 rounded-full text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          title="Flip Camera"
        >
          <SwitchCamera className="w-5 h-5" />
        </button>
      </div>

      {/* Camera Viewfinder Area */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden bg-slate-950">
        {/* Live Video Feed */}
        <video 
          ref={videoRef}
          playsInline
          muted
          autoPlay
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${cameraActive ? 'opacity-100' : 'opacity-0'}`}
        />

        {/* Fallback overlay when camera is inactive or denied */}
        {!cameraActive && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-10 bg-slate-900/95">
            <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mb-4 text-cyan-400 border border-slate-700 shadow-lg">
              <Upload className="w-8 h-8" />
            </div>
            <p className="text-base font-bold text-slate-100 mb-1">Multi-Side Package Inspection</p>
            <p className="text-xs text-slate-400 max-w-xs mb-5">
              Upload Front, Back, and Crimp photos. The engine fuses all sides with zero error and applies cylindrical dewarping for curved jars.
            </p>
            <div className="flex flex-col gap-2.5 w-full max-w-xs">
              <button
                onClick={() => uploadInputRef.current?.click()}
                className="w-full text-xs py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-950/50 active:scale-95 border border-emerald-400/40"
              >
                <Upload className="w-4 h-4 text-white" />
                Select Multiple Photos (Front + Back)
              </button>
              <button
                onClick={() => startCamera(facingMode)}
                className="w-full text-xs py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium transition-colors border border-slate-700"
              >
                Enable Live Camera
              </button>
            </div>
          </div>
        )}

        {/* Scanning Guide HUD Overlay */}
        <div className="relative w-72 h-80 rounded-2xl border-2 border-white/30 z-10 flex items-center justify-center shadow-[0_0_0_9999px_rgba(0,0,0,0.6)] pointer-events-none">
          {/* Corner Brackets */}
          <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-emerald-400 -translate-x-1 -translate-y-1 rounded-tl-lg animate-pulse"></div>
          <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-emerald-400 translate-x-1 -translate-y-1 rounded-tr-lg animate-pulse"></div>
          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-emerald-400 -translate-x-1 translate-y-1 rounded-bl-lg animate-pulse"></div>
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-emerald-400 translate-x-1 translate-y-1 rounded-br-lg animate-pulse"></div>

          {/* Central Laser Guideline */}
          <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-emerald-400/80 to-transparent shadow-[0_0_12px_#34d399] animate-pulse"></div>
        </div>

        <p className="absolute bottom-3 text-slate-200 text-xs font-medium z-10 px-4 py-1.5 bg-black/60 rounded-full backdrop-blur-md border border-white/10 text-center max-w-[90%]">
          {stagedPhotos.length === 0 
            ? 'Align label panel & tap Capture or Upload multi-photos' 
            : `Turn product to scan next angle (${stagedPhotos.length} side${stagedPhotos.length > 1 ? 's' : ''} captured)`}
        </p>
      </div>

      {/* Multi-Photo Staging Tray & Capture Drawer */}
      <div className="bg-slate-950 p-4 rounded-t-3xl border-t border-slate-800 z-20 flex flex-col gap-3">
        
        {/* Staged Photos Preview Strip (When 1+ photos are captured/uploaded) */}
        {stagedPhotos.length > 0 && (
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-2.5 flex flex-col gap-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                Staged Packaging Angles ({stagedPhotos.length})
                <span className="text-[10px] text-slate-500 font-normal">Order-Independent</span>
              </span>
              <button 
                onClick={() => setStagedPhotos([])} 
                className="text-[11px] text-rose-400 hover:text-rose-300 font-medium px-2 py-0.5 rounded hover:bg-rose-950/40 transition-colors"
              >
                Clear All
              </button>
            </div>

            {/* Thumbnail Carousel */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
              {stagedPhotos.map((photo, index) => (
                <div 
                  key={photo.id}
                  onClick={() => setPreviewImage(photo.dataUrl)}
                  className="relative group shrink-0 w-16 h-16 rounded-lg overflow-hidden border border-cyan-500/40 bg-slate-950 shadow-md cursor-pointer"
                >
                  <img src={photo.dataUrl} alt={photo.label} className="w-full h-full object-cover" />
                  <span className="absolute bottom-0 inset-x-0 bg-black/75 text-[8px] font-mono text-cyan-300 text-center py-0.5 truncate px-0.5">
                    Side {index + 1}
                  </span>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleRemovePhoto(photo.id, e); }}
                    className="absolute top-0.5 right-0.5 p-0.5 bg-black/80 hover:bg-rose-600 rounded-full text-white transition-colors"
                    title="Remove angle"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}

              {/* Add Next Side Slot */}
              {stagedPhotos.length < 5 && (
                <button
                  onClick={handleCaptureFrame}
                  className="shrink-0 w-16 h-16 rounded-lg border border-dashed border-slate-700 hover:border-emerald-400 bg-slate-900/50 flex flex-col items-center justify-center gap-1 text-slate-400 hover:text-emerald-300 transition-colors"
                  title="Capture next angle"
                >
                  <Plus className="w-4 h-4" />
                  <span className="text-[8px] font-medium">+ Side</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Capture / Upload / Inspect Actions */}
        <div className="flex items-center justify-center gap-2.5">
          {/* Hidden inputs for camera capture and multi-file upload */}
          <input 
            type="file" 
            accept="image/*" 
            capture="environment" 
            className="hidden" 
            ref={fileInputRef} 
            onChange={handleFileChange}
          />
          <input 
            type="file" 
            accept="image/*" 
            multiple
            className="hidden" 
            ref={uploadInputRef} 
            onChange={handleFileChange}
          />

          {/* Capture Angle Button */}
          <button 
            onClick={handleCaptureFrame}
            className="py-3 px-4 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-100 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 transition-all border border-slate-700"
            title="Snap another angle from camera feed"
          >
            <CameraIcon className="w-4 h-4 text-emerald-400" />
            {stagedPhotos.length === 0 ? 'Snap Photo' : '+ Turn & Snap'}
          </button>

          {/* Upload Multiple Photos Button */}
          <button 
            onClick={() => uploadInputRef.current?.click()}
            className="py-3 px-3.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-100 rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 transition-all border border-slate-700 shadow-sm"
            title="Upload 1 or more photos (Front + Back / All Sides)"
          >
            <Upload className="w-4 h-4 text-cyan-400" />
            {stagedPhotos.length === 0 ? 'Upload Multi-Side' : '+ Add Side'}
          </button>

          {/* Main Inspection Trigger */}
          <button 
            onClick={handleAnalyze}
            className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95 ${
              stagedPhotos.length > 0 
                ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-950/60 ring-2 ring-emerald-400/40 animate-pulse' 
                : 'bg-emerald-600/90 hover:bg-emerald-500 text-white'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            {stagedPhotos.length === 0
              ? 'Capture & Inspect'
              : stagedPhotos.length === 1
              ? 'Inspect 1 Angle'
              : `Inspect 360° (${stagedPhotos.length} Angles)`}
          </button>
        </div>

        {/* Quick Safety-Net Demo Presets */}
        <div className="space-y-1.5 pt-1 border-t border-slate-900">
          <div className="flex items-center justify-between text-slate-400 text-[11px]">
            <span className="flex items-center gap-1 font-medium text-slate-300">
              <Sparkles className="w-3 h-3 text-indigo-400" />
              Verified Demo Presets (Jury Safety Net)
            </span>
            <span className="text-[10px] text-slate-500">Instant offline test</span>
          </div>

          <div className="grid grid-cols-3 gap-1.5">
            <button 
              onClick={() => { if (stream) stream.getTracks().forEach(t => t.stop()); onPresetSelect('kurkure'); }} 
              className="flex flex-col items-center justify-center p-2 bg-slate-900 border border-slate-800 rounded-lg hover:border-emerald-500/50 active:scale-95 transition-all"
            >
              <span className="text-[11px] font-medium text-slate-200">Kurkure</span>
              <span className="text-[9px] mt-0.5 px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 font-bold">10/10 PASS</span>
            </button>

            <button 
              onClick={() => { if (stream) stream.getTracks().forEach(t => t.stop()); onPresetSelect('maggi'); }} 
              className="flex flex-col items-center justify-center p-2 bg-slate-900 border border-indigo-500/30 rounded-lg hover:border-emerald-500/50 active:scale-95 transition-all shadow-sm shadow-indigo-950"
            >
              <span className="text-[11px] font-semibold text-yellow-300">Maggi 70g</span>
              <span className="text-[9px] mt-0.5 px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 font-bold">10/10 PASS</span>
            </button>

            <button 
              onClick={() => { if (stream) stream.getTracks().forEach(t => t.stop()); onPresetSelect('haldiram'); }} 
              className="flex flex-col items-center justify-center p-2 bg-slate-900 border border-slate-800 rounded-lg hover:border-rose-500/50 active:scale-95 transition-all"
            >
              <span className="text-[11px] font-medium text-slate-200">Haldiram</span>
              <span className="text-[9px] mt-0.5 px-1.5 py-0.2 rounded-full bg-rose-500/20 text-rose-400 font-bold">7/10 FAIL</span>
            </button>

            <button 
              onClick={() => { if (stream) stream.getTracks().forEach(t => t.stop()); onPresetSelect('parle-g'); }} 
              className="flex flex-col items-center justify-center p-2 bg-slate-900 border border-slate-800 rounded-lg hover:border-amber-500/50 active:scale-95 transition-all"
            >
              <span className="text-[11px] font-medium text-slate-200">Parle-G</span>
              <span className="text-[9px] mt-0.5 px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-400 font-bold">8/10 WARN</span>
            </button>

            <button 
              onClick={() => { if (stream) stream.getTracks().forEach(t => t.stop()); onPresetSelect('amul'); }} 
              className="flex flex-col items-center justify-center p-2 bg-slate-900 border border-slate-800 rounded-lg hover:border-rose-500/50 active:scale-95 transition-all"
            >
              <span className="text-[11px] font-medium text-slate-200">Amul Butter</span>
              <span className="text-[9px] mt-0.5 px-1.5 py-0.2 rounded-full bg-rose-500/20 text-rose-400 font-bold">9/10 FAIL</span>
            </button>
          </div>
        </div>
      </div>

      {/* Fullscreen Image Preview Overlay */}
      {previewImage && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center backdrop-blur-sm"
          onClick={() => setPreviewImage(null)}
        >
          <div className="absolute top-4 right-4 z-50">
            <button 
              onClick={() => setPreviewImage(null)}
              className="p-2 rounded-full bg-slate-800/80 text-white hover:bg-slate-700 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>
          <div className="w-full h-full max-w-3xl max-h-[85vh] p-4 flex items-center justify-center">
            <img 
              src={previewImage} 
              alt="Preview" 
              className="max-w-full max-h-full object-contain rounded-xl shadow-2xl border border-white/10"
              onClick={(e) => e.stopPropagation()} // Prevent closing when tapping the image itself
            />
          </div>
          <p className="absolute bottom-8 text-slate-400 text-sm font-medium">Tap anywhere to close</p>
        </div>
      )}

    </div>
  );
}
