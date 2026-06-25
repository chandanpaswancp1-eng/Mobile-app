import React, { useState, useEffect } from 'react';
import { X, Smartphone, Copy, CheckCircle2, Link2, Loader2, QrCode, Camera } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Scanner } from '@yudiel/react-qr-scanner';

export default function LinkDeviceModal({ isOpen, onClose, mode, familyMembers, transactions, onSyncSuccess }) {
  const [syncCode, setSyncCode] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [status, setStatus] = useState('idle'); // idle, loading, success, error
  const [errorMessage, setErrorMessage] = useState('');
  const [showScanner, setShowScanner] = useState(false);

  useEffect(() => {
    if (isOpen && mode === 'host') {
      const payload = {
        familyMembers,
        transactions
      };
      const encoded = btoa(JSON.stringify(payload));
      setSyncCode(encoded);
      setStatus('idle');
    } else if (isOpen && mode === 'join') {
      setJoinCode('');
      setStatus('idle');
      setShowScanner(false);
    }
  }, [isOpen, mode, familyMembers, transactions]);

  const handleCopy = () => {
    navigator.clipboard.writeText(syncCode);
    setStatus('success');
    setTimeout(() => setStatus('idle'), 3000);
  };

  const processSyncCode = (code) => {
    setStatus('loading');
    setErrorMessage('');

    setTimeout(() => {
      try {
        const decoded = atob(code);
        const parsed = JSON.parse(decoded);
        
        if (parsed.familyMembers && parsed.transactions) {
          onSyncSuccess(parsed.familyMembers, parsed.transactions);
          setStatus('success');
          setShowScanner(false);
          setTimeout(() => {
            onClose();
          }, 2000);
        } else {
          throw new Error('Invalid format');
        }
      } catch (err) {
        setStatus('error');
        setErrorMessage('Invalid sync code. Please check and try again.');
        setShowScanner(false);
      }
    }, 1500);
  };

  const handleJoin = (e) => {
    e.preventDefault();
    if (!joinCode) return;
    processSyncCode(joinCode);
  };

  const handleScan = (result) => {
    if (result && result.length > 0) {
      const text = result[0].rawValue;
      setJoinCode(text);
      processSyncCode(text);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay animate-fade-in" style={{ zIndex: 1000 }}>
      <div className="modal-content glass-panel stagger-1" style={{ maxWidth: '400px', width: '100%', padding: '2rem' }}>
        <button 
          onClick={onClose}
          aria-label="Close"
          style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', zIndex: 10 }}
        >
          <X size={24} />
        </button>

        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(52, 211, 153, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto' }}>
            <Smartphone size={32} color="var(--accent-neon)" />
          </div>
          <h2 className="title" style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>
            {mode === 'host' ? 'Link Device' : 'Join Family'}
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            {mode === 'host' 
              ? 'Have your family member scan this QR code to link.' 
              : 'Scan the QR code from the host device to join.'}
          </p>
        </div>

        {mode === 'host' ? (
          <div>
            <div style={{ background: '#fff', padding: '1rem', borderRadius: '12px', display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
              {syncCode && (
                <QRCodeSVG 
                  value={syncCode} 
                  size={200}
                  bgColor={"#ffffff"}
                  fgColor={"#000000"}
                  level={"L"}
                  includeMargin={false}
                />
              )}
            </div>
            <button 
              onClick={handleCopy}
              className="btn btn-outline"
              style={{ width: '100%', padding: '1rem', display: 'flex', gap: '0.5rem', justifyContent: 'center', color: status === 'success' ? '#10b981' : 'var(--text-primary)', border: '1px solid var(--surface-border)' }}
            >
              {status === 'success' ? <><CheckCircle2 size={20} /> Copied to Clipboard!</> : <><Copy size={20} /> Copy Manual Code</>}
            </button>
          </div>
        ) : (
          <div>
            {showScanner ? (
              <div style={{ marginBottom: '1.5rem', borderRadius: '12px', overflow: 'hidden', border: '2px solid var(--accent-neon)' }}>
                <Scanner 
                  onScan={handleScan}
                  formats={['qr_code']}
                  components={{ audio: false, finder: true }}
                />
                <button 
                  onClick={() => setShowScanner(false)}
                  style={{ width: '100%', padding: '0.75rem', background: 'rgba(0,0,0,0.5)', color: '#fff', border: 'none', borderTop: '1px solid var(--surface-border)', cursor: 'pointer' }}
                >
                  Cancel Scanner
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setShowScanner(true)}
                className="btn btn-outline"
                style={{ width: '100%', padding: '1rem', display: 'flex', gap: '0.5rem', justifyContent: 'center', marginBottom: '1rem', borderColor: 'var(--accent-neon)', color: 'var(--accent-neon)' }}
              >
                <Camera size={20} /> Open Camera Scanner
              </button>
            )}

            <div style={{ textAlign: 'center', margin: '1rem 0', color: 'var(--text-muted)' }}>— OR PAIRED CODE —</div>

            <form onSubmit={handleJoin}>
              <textarea
                className="input-field"
                placeholder="Paste manual sync code here..."
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                style={{ width: '100%', height: '80px', padding: '1rem', resize: 'none', marginBottom: '1rem', fontSize: '0.8rem', fontFamily: 'monospace' }}
              />
              {status === 'error' && (
                <p style={{ color: 'var(--danger)', fontSize: '0.8rem', marginBottom: '1rem', textAlign: 'center' }}>{errorMessage}</p>
              )}
              <button 
                type="submit"
                className="btn btn-primary"
                disabled={status === 'loading'}
                style={{ width: '100%', padding: '1rem', display: 'flex', gap: '0.5rem', justifyContent: 'center', background: status === 'success' ? '#10b981' : 'var(--accent-primary)', color: '#000', border: 'none' }}
              >
                {status === 'loading' ? <Loader2 size={20} className="animate-spin" /> : 
                 status === 'success' ? <><CheckCircle2 size={20} /> Linked!</> : 
                 <><Link2 size={20} /> Connect via Code</>}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
