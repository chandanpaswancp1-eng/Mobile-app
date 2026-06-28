import React, { useState } from 'react';
import { X, CreditCard, Lock } from 'lucide-react';

export default function AddCardModal({ isOpen, onClose, onAdd }) {
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!cardNumber || !cardHolder || !expiry || !cvv) {
      alert("Please fill all fields");
      return;
    }
    
    // Determine card type based on first digit
    let type = 'VISA';
    if (cardNumber.startsWith('5')) type = 'Mastercard';
    if (cardNumber.startsWith('3')) type = 'Amex';

    const last4 = cardNumber.slice(-4);

    const newCard = {
      id: Date.now().toString(),
      type,
      last4,
      expiry,
      name: cardHolder
    };

    onAdd(newCard);
    
    // Reset
    setCardNumber('');
    setCardHolder('');
    setExpiry('');
    setCvv('');
    onClose();
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10000, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div className="glass-panel animate-slide-up" style={{ width: '100%', maxWidth: '400px', margin: '0', borderBottomLeftRadius: 0, borderBottomRightRadius: 0, padding: '2rem' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CreditCard size={24} color="var(--accent-primary)" />
            Link New Card
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div className="input-group">
            <label className="input-label">Cardholder Name</label>
            <input 
              type="text" 
              className="input-field" 
              placeholder="JOHN DOE"
              value={cardHolder}
              onChange={e => setCardHolder(e.target.value)}
              style={{ textTransform: 'uppercase' }}
            />
          </div>

          <div className="input-group">
            <label className="input-label">Card Number</label>
            <input 
              type="text" 
              className="input-field" 
              placeholder="0000 0000 0000 0000"
              value={cardNumber}
              onChange={e => setCardNumber(e.target.value.replace(/\D/g, '').slice(0, 16))}
            />
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <div className="input-group" style={{ flex: 1 }}>
              <label className="input-label">Expiry (MM/YY)</label>
              <input 
                type="text" 
                className="input-field" 
                placeholder="12/25"
                value={expiry}
                onChange={e => setExpiry(e.target.value)}
              />
            </div>
            <div className="input-group" style={{ flex: 1 }}>
              <label className="input-label">CVV</label>
              <input 
                type="password" 
                className="input-field" 
                placeholder="***"
                value={cvv}
                onChange={e => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
              />
            </div>
          </div>

          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
            <Lock size={14} color="var(--accent-primary)" />
            Your card details are securely stored locally on this device.
          </p>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '1rem', marginTop: '1rem', background: 'var(--accent-primary)', color: '#000', border: 'none', fontWeight: 700 }}>
            Save Card
          </button>
        </form>

      </div>
    </div>
  );
}
