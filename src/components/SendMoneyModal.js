import { useState, useEffect, useRef } from 'react';
import { X, Send, Loader2, CheckCircle2 } from 'lucide-react';

export default function SendMoneyModal({ isOpen, onClose, onSend, currency = "AED" }) {
  const [amount, setAmount] = useState('');
  const [recipient, setRecipient] = useState('');
  
  // Payment states
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState('');
  
  const recipientRef = useRef(null);

  // Focus the first input when modal opens
  useEffect(() => {
    if (isOpen && recipientRef.current && !isProcessing) {
      recipientRef.current.focus();
    }
    // Reset states on open
    if (isOpen) {
      setIsProcessing(false);
      setPaymentStatus('');
      setAmount('');
      setRecipient('');
    }
  }, [isOpen, isProcessing]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!amount || !recipient) return;

    setIsProcessing(true);
    setPaymentStatus('Connecting to secure gateway...');
    
    setTimeout(() => {
      setPaymentStatus('Transferring funds...');
      setTimeout(() => {
        setPaymentStatus('Success!');
        
        setTimeout(() => {
          onSend({
            id: Date.now(),
            type: 'card', // Mocking a card transfer
            merchant: `Transfer to ${recipient}`,
            nativeCurrency: currency,
            amount: parseFloat(amount),
            category: 'Transfer',
            date: new Date().toLocaleDateString()
          });
          onClose();
        }, 1000);
      }, 1500);
    }, 1500);
  };

  return (
    <div 
      className="modal-overlay animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        padding: '1rem'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isProcessing) onClose();
      }}
    >
      <div className="glass-panel" style={{ width: '100%', maxWidth: '400px', position: 'relative', background: 'var(--background)', border: '1px solid var(--surface-border)' }}>
        
        {!isProcessing && (
          <button 
            onClick={onClose}
            aria-label="Close send money modal"
            style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0.25rem', borderRadius: '50%' }}
          >
            <X size={24} aria-hidden="true" />
          </button>
        )}
        
        <h2 id="modal-title" className="title" style={{ marginBottom: '1.5rem', color: 'var(--text-primary)' }}>Send Money</h2>

        {isProcessing ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem 0', gap: '1.5rem' }}>
            {paymentStatus === 'Success!' ? (
              <CheckCircle2 size={56} color="var(--accent-neon)" className="animate-fade-in" />
            ) : (
              <Loader2 size={56} color="var(--accent-primary)" className="animate-spin" style={{ animation: 'spin 1.5s linear infinite' }} />
            )}
            
            <div style={{ textAlign: 'center', width: '100%' }}>
              <p style={{ color: '#fff', fontWeight: 600, fontSize: '1.1rem' }}>{paymentStatus}</p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="animate-fade-in">
            <div className="input-group">
              <label htmlFor="recipient-input" className="input-label">Recipient Name, Email, or Phone</label>
              <input 
                id="recipient-input"
                ref={recipientRef}
                type="text" 
                className="input-field" 
                placeholder="e.g. John Doe" 
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                required 
              />
            </div>

            <div className="input-group">
              <label htmlFor="send-amount-input" className="input-label">Amount ({currency})</label>
              <input 
                id="send-amount-input"
                type="number" 
                className="input-field" 
                placeholder="0.00" 
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required 
                min="0.01"
                step="0.01"
                style={{ fontSize: '1.5rem', padding: '1rem' }}
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem', padding: '1rem', fontSize: '1.1rem', display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
              <Send size={20} /> Pay Now
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
