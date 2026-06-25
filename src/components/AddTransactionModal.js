import { useState, useEffect, useRef } from 'react';
import { X, Camera, Loader2, CheckCircle2 } from 'lucide-react';
import Tesseract from 'tesseract.js';

export default function AddTransactionModal({ isOpen, onClose, onAdd, currency = "AED", familyMembers = [], initialOpenScanner = false }) {
  const [amount, setAmount] = useState('');
  const [merchant, setMerchant] = useState('');
  const [category, setCategory] = useState('Food & Dining');
  const [exactItem, setExactItem] = useState('');
  const [txCurrency, setTxCurrency] = useState(currency);
  const [spenderId, setSpenderId] = useState('me');
  
  // OCR states
  const [isScanning, setIsScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState('');
  const [scanProgress, setScanProgress] = useState(0);
  
  const [isLiveScannerOpen, setIsLiveScannerOpen] = useState(false);
  const [stream, setStream] = useState(null);
  
  const amountInputRef = useRef(null);
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsLiveScannerOpen(false);
  };

  // Focus the first input when modal opens
  useEffect(() => {
    if (isOpen) {
      if (initialOpenScanner) {
        startCamera();
      } else if (amountInputRef.current && !isScanning && !isLiveScannerOpen) {
        amountInputRef.current.focus();
      }
    }
    
    // Reset states on open
    if (isOpen) {
      setIsScanning(false);
      if (!initialOpenScanner) {
        setIsLiveScannerOpen(false);
      }
      setScanStatus('');
      setScanProgress(0);
      setExactItem('');
      setTxCurrency(currency);
    } else {
      stopCamera();
    }
  }, [isOpen, initialOpenScanner, currency]);

  // Handle escape key to close modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && !isScanning) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isScanning, onClose]);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      setStream(mediaStream);
      setIsLiveScannerOpen(true);
    } catch (err) {
      console.error("Camera access denied or unavailable", err);
      alert("Could not access camera. Please allow camera permissions or use the file picker.");
      fileInputRef.current?.click(); // fallback to file picker
    }
  };

  useEffect(() => {
    if (isLiveScannerOpen && videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(e => console.error("Error playing video:", e));
    }
  }, [isLiveScannerOpen, stream]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!amount || !merchant) return;

    onAdd({
      id: Date.now(),
      type: 'cash',
      merchant,
      category,
      exactItem,
      nativeCurrency: txCurrency,
      amount: parseFloat(amount),
      date: new Date().toLocaleDateString(),
      spenderId
    });
    
    setAmount('');
    setMerchant('');
    setCategory('Food & Dining');
    setExactItem('');
    onClose();
  };

  const processImageFile = async (file) => {
    setIsScanning(true);
    setScanStatus('Initializing AI Vision...');
    setScanProgress(0.1);

    try {
      const result = await Tesseract.recognize(
        file,
        'eng',
        {
          logger: (m) => {
            if (m.status === 'recognizing text') {
              setScanStatus('Reading Receipt Text...');
              setScanProgress(m.progress);
            } else if (m.status.includes('loading')) {
              setScanStatus('Loading AI Model (first time only)...');
            }
          }
        }
      );

      const text = result.data.text.toLowerCase();
      console.log("OCR Result: ", text);
      
      setScanStatus('Analyzing & Categorizing...');
      
      // Auto-Categorization Heuristics
      const categories = {
        'Food & Dining': ['restaurant', 'cafe', 'coffee', 'food', 'burger', 'pizza', 'dining', 'meal', 'lunch', 'dinner', 'starbucks', 'kfc', 'mcdonald'],
        'Transport': ['taxi', 'uber', 'careem', 'metro', 'bus', 'train', 'transport', 'fuel', 'petrol', 'gas', 'station', 'nol'],
        'Groceries': ['supermarket', 'grocery', 'market', 'mart', 'fresh', 'hypermarket', 'carrefour', 'lulu', 'spinneys', 'waitrose', 'choithrams'],
        'Utilities': ['dewa', 'water', 'electricity', 'bill', 'telecom', 'etisalat', 'du', 'virgin'],
        'Shopping': ['mall', 'store', 'boutique', 'clothing', 'electronics', 'amazon', 'noon', 'zara', 'h&m']
      };

      let detectedExactItem = '';
      let detectedBroadCategory = 'Other';

      for (const [catName, keywords] of Object.entries(categories)) {
        for (const keyword of keywords) {
          if (text.includes(keyword)) {
            if (keyword.length > detectedExactItem.length) {
              detectedExactItem = keyword;
              detectedBroadCategory = catName;
            }
          }
        }
      }
      
      // Set exact category if we found a strong match
      let finalExactItemStr = '';
      if (detectedExactItem) {
        finalExactItemStr = detectedExactItem.charAt(0).toUpperCase() + detectedExactItem.slice(1);
        setExactItem(finalExactItemStr);
        setCategory(detectedBroadCategory);
      }
      
      setScanStatus('Extracting Amount...');
      
      // Heuristic: Find all instances of digits followed by a decimal and two digits
      const priceRegex = /\b\d{1,4}\.\d{2}\b/g;
      const matches = text.match(priceRegex);
      
      if (matches && matches.length > 0) {
        const amounts = matches.map(m => parseFloat(m)).sort((a, b) => b - a);
        const likelyTotal = amounts.find(a => a < 20000); 
        
        if (likelyTotal) {
          setAmount(likelyTotal.toString());
          
          // Try to grab the first line of text for merchant name
          const lines = result.data.text.split('\n').filter(l => l.trim().length > 3);
          if (lines.length > 0 && !merchant) {
            const cleanMerchant = lines[0].replace(/[^a-zA-Z0-9\s&]/g, '').trim();
            setMerchant(cleanMerchant || 'Scanned Receipt');
          } else if (!merchant) {
            setMerchant('Scanned Receipt');
          }
          
          setScanStatus(`Done! Auto-Categorized as ${detectedBroadCategory}`);
          setTimeout(() => setIsScanning(false), 2000);
        } else {
          throw new Error('Could not find a valid total amount.');
        }
      } else {
        throw new Error('No prices detected in image.');
      }
      
    } catch (error) {
      console.error(error);
      alert("Could not automatically detect the amount. Please enter it manually or ensure the receipt is clear and flat.");
      setIsScanning(false);
    }
  };
    
  const handleImageCapture = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    await processImageFile(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const captureLiveImage = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      if (video.videoWidth === 0 || video.videoHeight === 0) {
        alert("Camera is still initializing, please wait a second.");
        return;
      }
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      stopCamera();
      processImageFile(dataUrl);
    }
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
        if (e.target === e.currentTarget && !isScanning && !isLiveScannerOpen) onClose();
      }}
    >
      <div className="glass-panel" style={{ width: '100%', maxWidth: '400px', position: 'relative', background: 'var(--background)', border: '1px solid var(--surface-border)', overflow: 'hidden' }}>
        
        {!isScanning && !isLiveScannerOpen && (
          <button 
            onClick={onClose}
            aria-label="Close add transaction modal"
            style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0.25rem', borderRadius: '50%', zIndex: 10 }}
          >
            <X size={24} aria-hidden="true" />
          </button>
        )}
        
        {isLiveScannerOpen ? (
          <div style={{ position: 'relative', width: '100%', height: '400px', background: '#000', display: 'flex', flexDirection: 'column' }}>
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            <canvas ref={canvasRef} style={{ display: 'none' }} />
            
            {/* Viewfinder Overlay */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none', border: '2px solid rgba(52, 211, 153, 0.5)', margin: '2rem' }}>
              <div style={{ position: 'absolute', top: '-2px', left: '-2px', width: '20px', height: '20px', borderTop: '4px solid var(--accent-neon)', borderLeft: '4px solid var(--accent-neon)' }} />
              <div style={{ position: 'absolute', top: '-2px', right: '-2px', width: '20px', height: '20px', borderTop: '4px solid var(--accent-neon)', borderRight: '4px solid var(--accent-neon)' }} />
              <div style={{ position: 'absolute', bottom: '-2px', left: '-2px', width: '20px', height: '20px', borderBottom: '4px solid var(--accent-neon)', borderLeft: '4px solid var(--accent-neon)' }} />
              <div style={{ position: 'absolute', bottom: '-2px', right: '-2px', width: '20px', height: '20px', borderBottom: '4px solid var(--accent-neon)', borderRight: '4px solid var(--accent-neon)' }} />
            </div>

            <div style={{ position: 'absolute', bottom: '2rem', left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: '2rem', alignItems: 'center' }}>
              <button 
                onClick={stopCamera}
                style={{ background: 'rgba(0,0,0,0.5)', color: '#fff', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '24px', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button 
                onClick={captureLiveImage}
                style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--accent-neon)', border: '4px solid #fff', cursor: 'pointer', boxShadow: '0 0 15px rgba(52, 211, 153, 0.5)' }}
                aria-label="Take picture"
              />
            </div>
          </div>
        ) : isScanning ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem 0', gap: '1.5rem' }}>
            {scanStatus === 'Done!' ? (
              <CheckCircle2 size={48} color="var(--accent-neon)" className="animate-fade-in" />
            ) : (
              <Loader2 size={48} color="var(--accent-primary)" className="animate-spin" style={{ animation: 'spin 1.5s linear infinite' }} />
            )}
            
            <div style={{ textAlign: 'center', width: '100%' }}>
              <p style={{ color: '#fff', fontWeight: 600, marginBottom: '0.5rem' }}>{scanStatus}</p>
              
              {/* Progress Bar */}
              {scanProgress > 0 && scanProgress < 1 && (
                <div className="progress-track" style={{ height: '6px', width: '80%', margin: '0 auto', background: 'rgba(255,255,255,0.1)' }}>
                  <div className="progress-fill" style={{ width: `${scanProgress * 100}%`, transition: 'width 0.2s ease' }}></div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="animate-fade-in">
            
            <h2 id="modal-title" className="title" style={{ marginBottom: '1.5rem', color: 'var(--text-primary)' }}>Add Cash Expense</h2>

            {/* Hidden File Input for Gallery Fallback */}
            <input 
              type="file" 
              accept="image/*" 
              ref={fileInputRef}
              style={{ display: 'none' }}
              onChange={handleImageCapture}
            />

            {/* Scan Receipt Button */}
            <button 
              type="button"
              onClick={startCamera}
              className="btn btn-outline" 
              style={{ width: '100%', marginBottom: '1.5rem', display: 'flex', gap: '0.5rem', background: 'rgba(16, 185, 129, 0.1)', borderColor: 'rgba(16, 185, 129, 0.3)', color: 'var(--accent-neon)' }}
            >
              <Camera size={20} /> Use Camera to Auto-Fill
            </button>

            <div className="input-group">
              <label htmlFor="amount-input" className="input-label">Amount & Currency</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input 
                  id="amount-input"
                  ref={amountInputRef}
                  type="number" 
                  className="input-field" 
                  placeholder="0.00" 
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required 
                  min="0.01"
                  step="0.01"
                  style={{ flex: 2 }}
                />
                <select 
                  className="input-field" 
                  value={txCurrency}
                  onChange={(e) => setTxCurrency(e.target.value)}
                  style={{ flex: 1, appearance: 'none', backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23a3b3cc%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.5rem center', backgroundSize: '1em', paddingRight: '1.5rem' }}
                >
                  <option value="AED">AED</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                  <option value="INR">INR</option>
                  <option value="NPR">NPR</option>
                  <option value="JPY">JPY</option>
                  <option value="CAD">CAD</option>
                  <option value="AUD">AUD</option>
                </select>
              </div>
            </div>
            
            <div className="input-group">
              <label htmlFor="merchant-input" className="input-label">Merchant / Description</label>
              <input 
                id="merchant-input"
                type="text" 
                className="input-field" 
                placeholder="e.g. Karak Chai" 
                value={merchant}
                onChange={(e) => setMerchant(e.target.value)}
                required 
              />
            </div>
            
            {familyMembers && familyMembers.length > 0 && (
              <div className="input-group">
                <label htmlFor="spender-input" className="input-label">Who spent this?</label>
                <select 
                  id="spender-input"
                  className="input-field" 
                  value={spenderId}
                  onChange={(e) => setSpenderId(e.target.value)}
                  style={{ appearance: 'none', backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23a3b3cc%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1em' }}
                >
                  {familyMembers.map(member => (
                    <option key={member.id} value={member.id}>{member.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="input-group">
              <label htmlFor="exact-item-input" className="input-label">Exact Item / Description</label>
              <input 
                id="exact-item-input"
                type="text"
                className="input-field" 
                value={exactItem}
                onChange={(e) => setExactItem(e.target.value)}
                placeholder="e.g. Coffee, Taxi, Pizza"
              />
            </div>

            <div className="input-group">
              <label htmlFor="category-select" className="input-label">Broad Category</label>
              <select 
                id="category-select"
                className="input-field" 
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                style={{ appearance: 'none', backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23a3b3cc%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1em' }}
              >
                <option value="Food & Dining">Food & Dining</option>
                <option value="Transport">Transport</option>
                <option value="Groceries">Groceries</option>
                <option value="Utilities">Utilities</option>
                <option value="Shopping">Shopping</option>
              </select>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem', padding: '1rem', fontSize: '1.05rem' }}>
              Add Transaction
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
