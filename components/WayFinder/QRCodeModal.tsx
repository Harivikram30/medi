import React, { useState, useEffect } from 'react';
import type { HospitalLocation, WayFinderRoute } from '../../types';
import { 
  buildWayFinderNavigationURL, 
  generateRealQRCodeDataUrl 
} from '../../services/wayFinderService';

interface QRCodeModalProps {
  location: HospitalLocation;
  route?: WayFinderRoute | null;
  isOpen: boolean;
  onClose: () => void;
}

// Auto-detected local network IP from Vite host interface
const DETECTED_LAN_IP = '172.3.4.218';

export const QRCodeModal: React.FC<QRCodeModalProps> = ({ location, route, isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // URL mode: 'wifi' uses the Wi-Fi IP accessible by mobile phones; 'origin' uses current browser URL
  const isLocalHost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
  const [hostMode, setHostMode] = useState<'wifi' | 'origin' | 'custom'>(() => isLocalHost ? 'wifi' : 'origin');
  const [customHost, setCustomHost] = useState<string>('');

  // Compute active base origin
  const activeOrigin = React.useMemo(() => {
    if (typeof window === 'undefined') return 'http://localhost:3000';
    if (hostMode === 'wifi' && isLocalHost) {
      return `http://${DETECTED_LAN_IP}:3000`;
    }
    if (hostMode === 'custom' && customHost.trim()) {
      let host = customHost.trim();
      if (!host.startsWith('http://') && !host.startsWith('https://')) {
        host = `http://${host}`;
      }
      return host;
    }
    return window.location.origin;
  }, [hostMode, customHost, isLocalHost]);

  // Compute navigation URL
  const navigationUrl = React.useMemo(() => {
    return buildWayFinderNavigationURL(location, route?.isWheelchairAccessible ?? true, activeOrigin);
  }, [location, route, activeOrigin]);

  // Generate real ISO-compliant QR Code
  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;
    setIsLoading(true);

    generateRealQRCodeDataUrl(navigationUrl, {
      width: 320,
      margin: 2,
      darkColor: '#003e7e'
    }).then(dataUrl => {
      if (isMounted) {
        setQrDataUrl(dataUrl);
        setIsLoading(false);
      }
    }).catch(err => {
      console.error('Failed to generate QR Code:', err);
      if (isMounted) setIsLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, [navigationUrl, isOpen]);

  if (!isOpen) return null;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(navigationUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      console.error('Failed to copy link:', e);
    }
  };

  const handleDownloadQR = () => {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = `MediConnect_Nav_${location.roomNumber.replace(/\s+/g, '_')}.png`;
    link.click();
  };

  const handleTestLink = () => {
    window.open(navigationUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-dark-card rounded-2xl shadow-2xl max-w-md w-full p-6 border border-gray-100 dark:border-dark-border text-center overflow-hidden">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <span className="text-2xl">📱</span>
            <div className="text-left">
              <h3 className="font-bold text-gray-900 dark:text-white text-base leading-tight">
                Scan for Instant Navigation
              </h3>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                Works with any smartphone camera (iOS & Android)
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xl font-bold p-1"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Network / Host Mode Selector for local dev */}
        {isLocalHost && (
          <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-950/40 rounded-xl text-xs text-left border border-blue-200 dark:border-blue-800">
            <span className="font-semibold text-blue-900 dark:text-blue-300 block mb-1.5 flex items-center justify-between">
              <span>📶 Scanning from Mobile Device?</span>
              <span className="text-[10px] text-blue-600 dark:text-blue-400 font-normal">Same Wi-Fi Network</span>
            </span>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => setHostMode('wifi')}
                className={`flex-1 py-1.5 px-2 rounded-lg font-semibold text-[11px] transition ${
                  hostMode === 'wifi'
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100'
                }`}
              >
                Wi-Fi IP ({DETECTED_LAN_IP})
              </button>
              <button
                type="button"
                onClick={() => setHostMode('origin')}
                className={`py-1.5 px-2 rounded-lg font-semibold text-[11px] transition ${
                  hostMode === 'origin'
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100'
                }`}
              >
                Localhost
              </button>
              <button
                type="button"
                onClick={() => setHostMode('custom')}
                className={`py-1.5 px-2 rounded-lg font-semibold text-[11px] transition ${
                  hostMode === 'custom'
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100'
                }`}
              >
                Custom IP
              </button>
            </div>
            {hostMode === 'custom' && (
              <input
                type="text"
                placeholder="e.g. 192.168.1.100:3000"
                value={customHost}
                onChange={e => setCustomHost(e.target.value)}
                className="mt-2 w-full p-1.5 text-xs border rounded-lg dark:bg-gray-800 dark:text-white"
              />
            )}
          </div>
        )}

        {/* Real QR Code Display */}
        <div className="my-4 flex flex-col items-center">
          <div className="relative p-3 bg-white rounded-2xl shadow-lg border-2 border-primary/30 inline-block">
            {isLoading ? (
              <div className="w-56 h-56 flex flex-col items-center justify-center gap-2">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                <span className="text-xs text-gray-500 font-medium">Generating barcode...</span>
              </div>
            ) : qrDataUrl ? (
              <img 
                src={qrDataUrl} 
                alt={`QR code for ${location.name}`} 
                className="w-56 h-56 object-contain block mx-auto" 
              />
            ) : (
              <div className="w-56 h-56 flex items-center justify-center text-xs text-red-500">
                Failed to generate QR code
              </div>
            )}
            
            {/* Corner ADA accessibility badge on QR */}
            {location.isWheelchairAccessible && (
              <span 
                className="absolute -bottom-2 -right-2 bg-emerald-600 text-white text-[11px] font-bold px-2 py-0.5 rounded-full shadow-md flex items-center gap-1 border-2 border-white"
                title="Verified ADA Step-Free Route"
              >
                ♿ ADA
              </span>
            )}
          </div>
          
          <p className="mt-2 text-xs text-gray-600 dark:text-gray-300 font-medium">
            Open camera app on your phone & point at this QR code
          </p>
        </div>

        {/* Destination Information Card */}
        <div className="bg-light dark:bg-dark-bg p-3.5 rounded-xl border border-gray-200 dark:border-dark-border text-left mb-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold tracking-wider text-primary dark:text-blue-400">
              Scanned Destination
            </span>
            <span className="text-xs font-mono font-bold text-gray-900 dark:text-white bg-primary/10 dark:bg-primary/20 px-2 py-0.5 rounded-md">
              {location.roomNumber}
            </span>
          </div>
          <div className="font-extrabold text-gray-900 dark:text-white text-sm mt-1">
            {location.name}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
            {location.floorName} • {location.wing}
          </div>
          {location.doctorName && (
            <div className="text-xs text-indigo-600 dark:text-indigo-400 font-medium mt-1">
              👨‍⚕️ {location.doctorName} {location.department ? `(${location.department})` : ''}
            </div>
          )}
          {route && (
            <div className="mt-1.5 pt-1.5 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between text-xs">
              <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
                🚶 Transit: ~{route.estimatedMinutes} min ({route.totalDistanceMeters}m)
              </span>
              {route.isWheelchairAccessible && (
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-0.5">
                  ♿ Step-Free
                </span>
              )}
            </div>
          )}
        </div>

        {/* Live URL Preview */}
        <div className="mb-4 text-left">
          <span className="text-[10px] uppercase font-bold text-gray-400 block mb-1">
            Scanned Payload URL:
          </span>
          <div className="p-2 bg-gray-50 dark:bg-gray-800/80 rounded-lg text-[11px] font-mono text-gray-600 dark:text-gray-300 truncate border border-gray-100 dark:border-gray-700">
            {navigationUrl}
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-2">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleCopyLink}
              className="flex-1 bg-primary text-white font-semibold py-2.5 px-3 rounded-xl hover:bg-primary/90 transition text-xs shadow flex items-center justify-center gap-1.5"
            >
              <span>{copied ? '✓' : '📋'}</span>
              <span>{copied ? 'Copied to Clipboard!' : 'Copy Link'}</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadQR}
              className="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-semibold py-2.5 px-3 rounded-xl transition text-xs flex items-center gap-1 shadow-sm"
              title="Save PNG image to print or share"
            >
              <span>💾</span>
              <span>Save PNG</span>
            </button>
          </div>

          {/* Test Scan / Open Link Button */}
          <button
            type="button"
            onClick={handleTestLink}
            className="w-full py-2 px-3 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/60 rounded-xl transition border border-blue-200 dark:border-blue-800 flex items-center justify-center gap-1.5"
          >
            <span>🔗</span>
            <span>Test Scanned Route in Browser (Preview)</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default QRCodeModal;
