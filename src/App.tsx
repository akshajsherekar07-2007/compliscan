import { useState, useCallback, useEffect } from 'react';
import { ScanRecord } from './engine/types';
import { DEMO_PRESETS } from './data/demoPresets';
import { runPipeline, PipelineStage } from './pipeline/VisionPipeline';
import { getOCRWorker } from './pipeline/OCREngine';
import { safeRandomUUID } from './utils/crypto';

// Screens
import HomeScreen from './screens/HomeScreen';
import { CameraScreen } from './screens/CameraScreen';
import { ProcessingScreen } from './screens/ProcessingScreen';
import ResultsScreen from './screens/ResultsScreen';
import HistoryScreen from './screens/HistoryScreen';
import SettingsScreen from './screens/SettingsScreen';
import WardMap from './screens/WardMap';

// Components
import { BottomNav } from './components/BottomNav';
import { SplashScreen } from './components/SplashScreen';

// PDF
import { generateFormA1PDF } from './services/pdfGenerator';
import { loadScanHistory, saveScanHistory, clearStoredHistory } from './data/storage';

import './index.css';

type Screen = 'home' | 'camera' | 'processing' | 'results' | 'history' | 'detail' | 'settings' | 'wardmap';
type Tab = 'scanner' | 'history' | 'settings';

function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  const [activeTab, setActiveTab] = useState<Tab>('scanner');
  const [scanHistory, setScanHistory] = useState<ScanRecord[]>(() => loadScanHistory());
  const [currentScan, setCurrentScan] = useState<ScanRecord | null>(null);
  const [pipelineStage, setPipelineStage] = useState<PipelineStage>(0);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  // Auto-sync scanHistory to localStorage
  useEffect(() => {
    saveScanHistory(scanHistory);
  }, [scanHistory]);

  // Pre-warm Tesseract WASM OCR worker in background
  useEffect(() => {
    getOCRWorker().then(
      () => console.log('CompliScan: OCR Worker pre-warmed & ready'),
      (err) => console.warn('CompliScan: OCR pre-warm error', err)
    );
  }, []);

  // Navigate to a screen
  const navigateTo = useCallback((screen: Screen) => {
    setCurrentScreen(screen);
    if (screen === 'home') setActiveTab('scanner');
    if (screen === 'history') setActiveTab('history');
    if (screen === 'settings') setActiveTab('settings');
  }, []);

  // Handle tab change from bottom nav
  const handleTabChange = useCallback((tab: Tab) => {
    setActiveTab(tab);
    if (tab === 'scanner') setCurrentScreen('home');
    if (tab === 'history') setCurrentScreen('history');
    if (tab === 'settings') setCurrentScreen('settings');
  }, []);

  // Handle real camera capture — run the full pipeline (single or multi-photo)
  const handleCapture = useCallback(async (imageInput: string | string[]) => {
    const primaryImage = Array.isArray(imageInput) ? imageInput[0] : imageInput;
    const allImages = Array.isArray(imageInput) ? imageInput : [imageInput];

    setCapturedImage(primaryImage);
    setCurrentScreen('processing');
    setPipelineStage(0);

    try {
      const result = await runPipeline(imageInput, {
        onStageChange: (stage) => setPipelineStage(stage),
      });

      setPipelineStage(5);
      setCurrentScan(result);
      setScanHistory(prev => [result, ...prev]);
      
      // Brief delay to show all stages complete
      setTimeout(() => {
        setCurrentScreen('results');
        setPipelineStage(0);
      }, 300);
    } catch (error) {
      console.error('Pipeline error:', error);
      // Create a fallback scan record with 0/10 score
      const fallback: ScanRecord = {
        id: safeRandomUUID(),
        createdAt: new Date().toISOString(),
        photoDataUrl: primaryImage,
        photoDataUrls: allImages,
        extractedFields: {
          mrp: null, netQuantity: null, manufacturingDate: null,
          expiryDate: null, fssaiLicense: null, unitSalePrice: null,
          consumerPhone: null, consumerEmail: null, countryOfOrigin: null,
          manufacturerName: null, genericName: null,
        },
        complianceResult: {
          score: 0, totalChecks: 10, status: 'NON_COMPLIANT',
          checks: [], fontMeasurements: [], uspVerification: null,
          timestamp: new Date().toISOString(),
        },
        anomalyVerdict: null,
        evidence: {
          photoHash: 'error-computing-hash',
          photoHashes: allImages.map(() => 'error-computing-hash'),
          latitude: null, longitude: null,
          locationString: 'Location unavailable',
          timestamp: new Date().toISOString(),
          deviceInfo: navigator.userAgent,
          officerId: 'Insp. LM-MH-4091',
        },
        rawOcrText: 'OCR processing failed. Please retake photo with better lighting.',
        barcodeValue: null,
      };
      setCurrentScan(fallback);
      setScanHistory(prev => [fallback, ...prev]);
      setCurrentScreen('results');
      setPipelineStage(0);
    }
  }, []);

  // Handle demo preset selection
  const handlePresetSelect = useCallback((presetId: string) => {
    const preset = DEMO_PRESETS[presetId];
    if (preset) {
      // Refresh timestamps
      const fresh: ScanRecord = {
        ...preset,
        id: safeRandomUUID(),
        createdAt: new Date().toISOString(),
        evidence: { ...preset.evidence, timestamp: new Date().toISOString() },
        complianceResult: { ...preset.complianceResult, timestamp: new Date().toISOString() },
      };
      setCurrentScan(fresh);
      setScanHistory(prev => [fresh, ...prev]);

      // Show processing animation briefly for presets too
      setCapturedImage(null);
      setCurrentScreen('processing');
      setPipelineStage(1);
      setTimeout(() => setPipelineStage(2), 300);
      setTimeout(() => setPipelineStage(3), 600);
      setTimeout(() => setPipelineStage(4), 900);
      setTimeout(() => {
        setCurrentScreen('results');
        setPipelineStage(0);
      }, 1400);
    }
  }, []);

  // Handle viewing a scan from history
  const handleSelectScan = useCallback((scan: ScanRecord) => {
    setCurrentScan(scan);
    setCurrentScreen('detail');
  }, []);

  // Handle PDF export
  const handleExportPDF = useCallback(() => {
    if (currentScan) {
      generateFormA1PDF(currentScan);
    }
  }, [currentScan]);

  // Clear scan history
  const handleClearHistory = useCallback(() => {
    setScanHistory([]);
    clearStoredHistory();
  }, []);

  // Show bottom nav on home, history, settings, wardmap
  const showBottomNav = ['home', 'history', 'settings', 'wardmap'].includes(currentScreen);

  if (showSplash) {
    return <SplashScreen onReady={() => setShowSplash(false)} />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Main content area */}
      <div className={`flex-1 ${showBottomNav ? 'pb-16' : ''} overflow-y-auto`}>
        {currentScreen === 'home' && (
          <HomeScreen
            onNavigate={(screen: string) => navigateTo(screen as Screen)}
            scanHistory={scanHistory}
            onSelectScan={handleSelectScan}
          />
        )}

        {currentScreen === 'camera' && (
          <CameraScreen
            onCapture={handleCapture}
            onBack={() => navigateTo('home')}
            onPresetSelect={handlePresetSelect}
          />
        )}

        {currentScreen === 'processing' && (
          <ProcessingScreen
            currentStage={pipelineStage}
            capturedImage={capturedImage}
          />
        )}

        {currentScreen === 'results' && currentScan && (
          <ResultsScreen
            scanRecord={currentScan}
            onNewScan={() => navigateTo('camera')}
            onExportPDF={handleExportPDF}
            onBack={() => navigateTo('home')}
            title="Scan Results"
          />
        )}

        {currentScreen === 'detail' && currentScan && (
          <ResultsScreen
            scanRecord={currentScan}
            onNewScan={() => navigateTo('camera')}
            onExportPDF={handleExportPDF}
            onBack={() => navigateTo('history')}
            title="Scan Detail"
          />
        )}

        {currentScreen === 'history' && (
          <HistoryScreen
            scanHistory={scanHistory}
            onSelectScan={handleSelectScan}
          />
        )}

        {currentScreen === 'settings' && (
          <SettingsScreen
            onClearHistory={handleClearHistory}
          />
        )}

        {currentScreen === 'wardmap' && (
          <WardMap onBack={() => navigateTo('home')} />
        )}
      </div>

      {/* Bottom Navigation */}
      {showBottomNav && (
        <BottomNav
          activeTab={activeTab}
          onTabChange={handleTabChange}
        />
      )}

      {/* Ward Map floating button on Home */}
      {currentScreen === 'home' && (
        <button
          onClick={() => navigateTo('wardmap')}
          className="fixed bottom-20 right-4 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 text-sm font-medium z-40 transition-all"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
          Ministry GIS
        </button>
      )}
    </div>
  );
}

export default App;
