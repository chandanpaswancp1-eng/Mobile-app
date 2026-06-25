import { useState, useEffect } from 'react';
import { X, SmartphoneNfc, CheckCircle2 } from 'lucide-react';

export default function TapToPayModal({ isOpen, onClose, cardLast4 = "4281" }) {
  const [paymentState, setPaymentState] = useState('waiting'); // waiting, processing, success

  // Reset states on open
  useEffect(() => {
    if (isOpen) {
      setPaymentState('waiting');
    }
  }, [isOpen]);

  // Simulate tapping logic
  const handleSimulateTap = () => {
    if (paymentState !== 'waiting') return;
    
    setPaymentState('processing');
    
    // Simulate terminal communication delay
    setTimeout(() => {
      setPaymentState('success');
      
      // Auto close after success
      setTimeout(() => {
        onClose();
      }, 2500);
    }, 1500);
  };

  if (!isOpen) return null;

  return (
    <div 
      className="modal-overlay animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tap-to-pay-title"
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 200, // Higher than everything
        padding: '1rem'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && paymentState !== 'processing') onClose();
      }}
    >
      <div style={{ position: 'absolute', top: '2rem', right: '2rem' }}>
        <button 
          onClick={onClose}
          style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', padding: '0.75rem', borderRadius: '50%', cursor: 'pointer' }}
        >
          <X size={28} />
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', width: '100%' }}>
        
        {paymentState === 'waiting' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <h2 id="tap-to-pay-title" style={{ color: '#fff', fontSize: '1.8rem', fontWeight: 700, marginBottom: '0.5rem' }}>Hold Near Reader</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', marginBottom: '4rem' }}>Paying with Visa •••• {cardLast4}</p>
            
            <div 
              style={{ 
                position: 'relative', 
                width: '150px', 
                height: '150px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                cursor: 'pointer' 
              }}
              onClick={handleSimulateTap}
            >
              <div style={{ position: 'absolute', width: '100%', height: '100%', border: '2px solid var(--accent-primary)', borderRadius: '50%', animation: 'ripple 2s infinite ease-out' }}></div>
              <div style={{ position: 'absolute', width: '100%', height: '100%', border: '2px solid var(--accent-primary)', borderRadius: '50%', animation: 'ripple 2s infinite ease-out 1s' }}></div>
              <div style={{ background: 'var(--accent-primary)', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(16, 185, 129, 0.5)' }}>
                <SmartphoneNfc size={40} color="#000" />
              </div>
            </div>

            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4rem', fontStyle: 'italic' }}>
              (Click the icon to simulate tapping a payment terminal)
            </p>
          </div>
        )}

        {paymentState === 'processing' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', border: '4px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--accent-primary)', animation: 'spin 1s linear infinite', marginBottom: '2rem' }}></div>
            <h2 style={{ color: '#fff', fontSize: '1.5rem', fontWeight: 600 }}>Processing...</h2>
            <p style={{ color: 'var(--text-muted)' }}>Communicating with terminal</p>
          </div>
        )}

        {paymentState === 'success' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <CheckCircle2 size={80} color="var(--accent-neon)" style={{ marginBottom: '2rem', filter: 'drop-shadow(0 0 20px var(--accent-neon))' }} />
            <h2 style={{ color: '#fff', fontSize: '2rem', fontWeight: 800 }}>Done</h2>
          </div>
        )}

      </div>
    </div>
  );
}
