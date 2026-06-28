"use client";

import { useState, useEffect } from 'react';
import { Home, Plus, CreditCard, User, Wallet, RefreshCw, Zap, Download, Settings, LogOut, ChevronRight, PieChart, Send, Lock, Fingerprint, Link2, Users, Smartphone, Camera } from 'lucide-react';
import { usePlaidLink } from 'react-plaid-link';
import AddTransactionModal from '@/components/AddTransactionModal';
import SendMoneyModal from '@/components/SendMoneyModal';
import TapToPayModal from '@/components/TapToPayModal';
import LinkDeviceModal from '@/components/LinkDeviceModal';
import AddCardModal from '@/components/AddCardModal';
import { registerBiometrics, authenticateBiometrics } from '@/utils/webauthn';
import { fetchExchangeRates, convertCurrency } from '@/utils/currencyExchange';

const CURRENCIES = [
  { code: 'AED', symbol: 'AED ' },
  { code: 'USD', symbol: '$' },
  { code: 'EUR', symbol: '€' },
  { code: 'GBP', symbol: '£' },
  { code: 'INR', symbol: '₹' },
  { code: 'NPR', symbol: 'रू' },
  { code: 'JPY', symbol: '¥' },
  { code: 'CAD', symbol: 'CA$' },
  { code: 'AUD', symbol: 'A$' }
];

export default function Dashboard() {
  const [isClient, setIsClient] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [initialOpenScanner, setInitialOpenScanner] = useState(false);
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [isTapToPayOpen, setIsTapToPayOpen] = useState(false);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [isAddCardModalOpen, setIsAddCardModalOpen] = useState(false);
  const [linkModalMode, setLinkModalMode] = useState('host');
  
  const [isSyncing, setIsSyncing] = useState(false);
  
  const [cards, setCards] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [userName, setUserName] = useState('User');
  const [currency, setCurrency] = useState('AED');
  const [exchangeRates, setExchangeRates] = useState(null);
  
  // Security & Auth States
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
  // Auth Onboarding States
  const [authStep, setAuthStep] = useState('pin'); // 'contact', 'otp', 'details', 'pin'
  const [contactMethod, setContactMethod] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpHash, setOtpHash] = useState(null);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [userAccount, setUserAccount] = useState(null);

  // Profile Details
  const [userProfile, setUserProfile] = useState({
    fullName: 'John Doe',
    address: '',
    bankName: '',
    bankAccount: ''
  });
  
  // Family Mode
  const [familyMembers, setFamilyMembers] = useState([]);

  const [savedPin, setSavedPin] = useState(null);
  const [pinInput, setPinInput] = useState('');
  const [isSettingPin, setIsSettingPin] = useState(false);
  const [biometricId, setBiometricId] = useState(null);
  const [hasPromptedBio, setHasPromptedBio] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    setIsClient(true);
    
    // Fetch rates
    fetchExchangeRates().then(rates => setExchangeRates(rates));
    
    // Load Security & Account
    const account = localStorage.getItem('eco_expenses_account');
    if (account) setUserAccount(account);
    
    const profile = localStorage.getItem('eco_expenses_profile');
    if (profile) {
      const parsed = JSON.parse(profile);
      setUserProfile(parsed);
      setUserName(parsed.fullName);
    }

    const family = localStorage.getItem('eco_expenses_family');
    if (family) setFamilyMembers(JSON.parse(family));
    else {
      // Default to just the user
      setFamilyMembers([{ id: 'me', name: profile ? JSON.parse(profile).fullName : 'Me' }]);
    }
    
    const storedPin = localStorage.getItem('eco_expenses_pin');
    if (storedPin) {
      setSavedPin(storedPin);
      setIsSettingPin(false);
      setAuthStep('pin');
    } else {
      setIsSettingPin(true);
      setAuthStep(account ? 'pin' : 'contact');
    }
    
    const hasBio = localStorage.getItem('eco_expenses_has_bio_prompted');
    if (hasBio) setHasPromptedBio(true);

    // Load Data
    const savedTx = localStorage.getItem('eco_expenses_transactions');
    if (savedTx) {
      setTransactions(JSON.parse(savedTx));
    } else {
      const initialData = [
        { id: 1, type: 'card', merchant: 'Waitrose (Groceries)', amount: 120.50, category: 'Groceries', date: new Date().toLocaleDateString() },
        { id: 2, type: 'cash', merchant: 'Taxi / Metro', amount: 35.00, category: 'Transport', date: new Date().toLocaleDateString() },
        { id: 3, type: 'card', merchant: 'DEWA Bill', amount: 450.00, category: 'Utilities', date: new Date(Date.now() - 86400000).toLocaleDateString() },
      ];
      setTransactions(initialData);
      localStorage.setItem('eco_expenses_transactions', JSON.stringify(initialData));
    }
    
    const savedName = localStorage.getItem('eco_expenses_user_name');
    if (savedName) setUserName(savedName);
    
    const savedCurrency = localStorage.getItem('eco_expenses_currency');
    if (savedCurrency) setCurrency(savedCurrency);
    
    const savedBioId = localStorage.getItem('eco_expenses_biometric_id');
    if (savedBioId) setBiometricId(savedBioId);

    const savedCards = localStorage.getItem('eco_expenses_cards');
    if (savedCards) {
      setCards(JSON.parse(savedCards));
    } else {
      setCards([{ id: 'default1', type: 'VISA', last4: '4281', expiry: '12/28', name: savedName || 'User' }]);
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    if (isClient && transactions.length > 0) {
      localStorage.setItem('eco_expenses_transactions', JSON.stringify(transactions));
    } else if (isClient && transactions.length === 0) {
      localStorage.removeItem('eco_expenses_transactions');
    }
    if (isClient) {
      localStorage.setItem('eco_expenses_user_name', userName);
      localStorage.setItem('eco_expenses_currency', currency);
    }
    if (isClient && cards.length > 0) {
      localStorage.setItem('eco_expenses_cards', JSON.stringify(cards));
    }
  }, [transactions, userName, currency, cards, isClient]);

  const handleAddTransaction = (newTx) => {
    setTransactions(prev => [newTx, ...prev]);
  };

  const [linkToken, setLinkToken] = useState(null);

  useEffect(() => {
    const fetchLinkToken = async () => {
      try {
        const response = await fetch('/api/plaid/create-link-token', { method: 'POST' });
        const data = await response.json();
        if (data.link_token) {
          setLinkToken(data.link_token);
        }
      } catch (err) {
        console.log("Plaid not configured yet", err);
      }
    };
    if (isAuthenticated && isClient) {
      fetchLinkToken();
    }
  }, [isAuthenticated, isClient]);

  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess: async (public_token, metadata) => {
      setIsSyncing(true);
      try {
        const res = await fetch('/api/plaid/exchange-public-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ public_token }),
        });
        const data = await res.json();
        
        if (data.access_token) {
          // Fetch real transactions
          const txRes = await fetch('/api/plaid/transactions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ access_token: data.access_token }),
          });
          const txData = await txRes.json();
          
          if (txData.transactions && txData.transactions.length > 0) {
            setTransactions(prev => [...txData.transactions, ...prev]);
            alert(`Successfully synced ${txData.transactions.length} transactions from your bank!`);
          } else {
            alert("Bank linked successfully, but no recent transactions found.");
          }
        }
      } catch (err) {
        console.error("Error syncing bank:", err);
        alert("Failed to sync bank. Check your API keys.");
      }
      setIsSyncing(false);
    },
  });

  const handleSyncCard = () => {
    if (ready && linkToken) {
      open();
    } else {
      // Fallback for demo purposes if Plaid isn't configured
      setIsSyncing(true);
      setTimeout(() => {
        const mockNewCardTx = [
          { id: Date.now(), type: 'card', merchant: 'Plaid Mock (Unconfigured)', amount: 25.00, category: 'Food & Dining', date: new Date().toLocaleDateString() }
        ];
        setTransactions(prev => [...mockNewCardTx, ...prev]);
        setIsSyncing(false);
        alert("Plaid keys are missing, used mock sync instead. Add PLAID_CLIENT_ID to .env.local to use real sync.");
      }, 1000);
    }
  };

  const exportCSV = () => {
    if (transactions.length === 0) {
      alert("No transactions to export.");
      return;
    }
    const headers = "ID,Type,Merchant,Amount,Category,Date\n";
    const csvRows = transactions.map(tx => 
      `${tx.id},${tx.type},"${tx.merchant}",${tx.amount},"${tx.category || 'Uncategorized'}",${tx.date}`
    );
    const csvData = headers + csvRows.join("\n");
    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `eco_expenses_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handlePinPress = (num) => {
    if (pinInput.length < 4) {
      const newPin = pinInput + num;
      setPinInput(newPin);
      
      if (newPin.length === 4) {
        if (isSettingPin) {
          localStorage.setItem('eco_expenses_pin', newPin);
          setSavedPin(newPin);
          setIsSettingPin(false);
          setIsAuthenticated(true);
        } else {
          if (newPin === savedPin) {
            setIsAuthenticated(true);
          } else {
            alert("Incorrect PIN");
            setPinInput('');
          }
        }
      }
    }
  };

  const [selectedCategory, setSelectedCategory] = useState('All');

  const triggerBiometricUnlock = async () => {
    if (!biometricId) return;
    try {
      await authenticateBiometrics(biometricId);
      setIsAuthenticated(true);
    } catch (err) {
      console.log("Biometric auth failed or cancelled", err);
    }
  };

  useEffect(() => {
    if (!isAuthenticated && biometricId && !hasPromptedBio && !isSettingPin && authStep === 'pin') {
      setHasPromptedBio(true);
      triggerBiometricUnlock();
    }
  }, [isAuthenticated, biometricId, hasPromptedBio, isSettingPin, authStep]);

  const handleSendOTP = async (e) => {
    e.preventDefault();
    if (!contactMethod) return;
    
    setIsSendingOtp(true);
    
    // If it's an email, use our real Resend API
    if (contactMethod.includes('@')) {
      try {
        const response = await fetch('/api/auth/send-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: contactMethod })
        });
        
        const data = await response.json();
        if (data.success) {
          setOtpHash(data.hash);
          setAuthStep('otp');
        } else {
          alert('Failed to send OTP: ' + data.error);
        }
      } catch (err) {
        alert('Network error sending OTP');
      }
      setIsSendingOtp(false);
    } else {
      // Fallback for phone numbers (mocked)
      setTimeout(() => {
        setIsSendingOtp(false);
        setOtpHash('mocked_hash');
        setAuthStep('otp');
      }, 1500);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    
    if (contactMethod.includes('@') && otpHash !== 'mocked_hash') {
      try {
        const response = await fetch('/api/auth/verify-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: contactMethod, otp: otpCode, hash: otpHash })
        });
        
        const data = await response.json();
        if (data.success) {
          localStorage.setItem('eco_expenses_account', contactMethod);
          setUserAccount(contactMethod);
          setAuthStep('details');
        } else {
          alert('Invalid OTP code. Please try again.');
        }
      } catch (err) {
        alert('Error verifying OTP');
      }
    } else {
      // Fallback mocked phone verification
      if (otpCode === '123456') {
        localStorage.setItem('eco_expenses_account', contactMethod);
        setUserAccount(contactMethod);
        setAuthStep('details');
      } else {
        alert('Invalid OTP code. Please enter 123456 for this demo.');
      }
    }
  };

  const handleSaveDetails = (e) => {
    e.preventDefault();
    localStorage.setItem('eco_expenses_profile', JSON.stringify(userProfile));
    setUserName(userProfile.fullName);
    const family = [{ id: 'me', name: userProfile.fullName || 'Me' }];
    setFamilyMembers(family);
    localStorage.setItem('eco_expenses_family', JSON.stringify(family));
    setAuthStep('pin');
  };

  const handleSwitchAccount = () => {
    if(confirm("Log out and sign in to a different account?")) {
      localStorage.removeItem('eco_expenses_account');
      localStorage.removeItem('eco_expenses_pin');
      localStorage.removeItem('eco_expenses_biometric_id');
      setUserAccount(null);
      setSavedPin(null);
      setBiometricId(null);
      setAuthStep('contact');
      setContactMethod('');
      setOtpCode('');
      setPinInput('');
    }
  };

  // --- Views ---

  const renderLogoutTransition = () => (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, background: 'linear-gradient(-45deg, #020617, #0f172a, #1e1b4b, #020617)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }} className="animate-gradient animate-fade-in">
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', animation: 'pulse 2s infinite ease-in-out' }}>
        <LogOut size={48} color="var(--accent-primary)" style={{ marginBottom: '1.5rem' }} />
        <h2 style={{ color: '#fff', fontSize: '1.5rem', fontWeight: 600, letterSpacing: '1px' }}>Logging Out...</h2>
        <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>Securing your data</p>
      </div>
    </div>
  );

  const renderLoginView = () => (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, background: 'linear-gradient(-45deg, #020617, #0f172a, #064e3b, #020617)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }} className="animate-gradient">
      
      {authStep === 'contact' && (
        <div className="stagger-1" style={{ width: '100%', maxWidth: '360px', textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, background: 'var(--accent-primary)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', boxShadow: '0 0 30px rgba(52, 211, 153, 0.4)' }}>
            <Zap size={32} color="#000" />
          </div>
          <h1 className="title text-gradient-emerald" style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>
            Get Started
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', marginBottom: '2rem' }}>
            Enter your email or phone number
          </p>
          <form onSubmit={handleSendOTP} className="glass-login-panel stagger-2" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <input 
              type="text" 
              className="input-field" 
              placeholder="Email or Phone" 
              value={contactMethod}
              onChange={(e) => setContactMethod(e.target.value)}
              required
              style={{ padding: '1rem', fontSize: '1.1rem', background: 'rgba(255,255,255,0.05)' }}
            />
            <button type="submit" className="btn btn-primary" disabled={isSendingOtp} style={{ padding: '1rem', fontSize: '1.1rem', background: 'var(--accent-primary)', color: '#000', border: 'none' }}>
              {isSendingOtp ? 'Sending...' : 'Continue'}
            </button>
          </form>
        </div>
      )}

      {authStep === 'otp' && (
        <div className="stagger-1" style={{ width: '100%', maxWidth: '360px', textAlign: 'center' }}>
          <h1 className="title text-gradient-emerald" style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
            Verify Code
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '2rem' }}>
            We sent a 6-digit code to <br/><strong style={{ color: '#fff' }}>{contactMethod}</strong>
          </p>
          <form onSubmit={handleVerifyOTP} className="glass-login-panel stagger-2" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <input 
              type="text" 
              className="input-field" 
              placeholder="123456" 
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value)}
              maxLength={6}
              required
              style={{ padding: '1rem', fontSize: '1.5rem', textAlign: 'center', letterSpacing: '0.5rem', background: 'rgba(255,255,255,0.05)' }}
            />
            <button type="submit" className="btn btn-primary" style={{ padding: '1rem', fontSize: '1.1rem', background: 'var(--accent-primary)', color: '#000', border: 'none' }}>
              Verify & Continue
            </button>
            <button type="button" onClick={() => setAuthStep('contact')} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', marginTop: '0.5rem', cursor: 'pointer', fontSize: '0.9rem' }}>
              Use a different number
            </button>
          </form>
        </div>
      )}

      {authStep === 'details' && (
        <div className="stagger-1" style={{ width: '100%', maxWidth: '360px', textAlign: 'center' }}>
          <h1 className="title text-gradient-emerald" style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
            Complete Profile
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
            Securely save your details to this device.
          </p>
          <form onSubmit={handleSaveDetails} className="glass-login-panel stagger-2" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <input type="text" className="input-field" placeholder="Full Name" value={userProfile.fullName} onChange={(e) => setUserProfile({...userProfile, fullName: e.target.value})} required style={{ padding: '0.8rem', background: 'rgba(255,255,255,0.05)' }} />
            <input type="text" className="input-field" placeholder="Home Address" value={userProfile.address} onChange={(e) => setUserProfile({...userProfile, address: e.target.value})} style={{ padding: '0.8rem', background: 'rgba(255,255,255,0.05)' }} />
            <input type="text" className="input-field" placeholder="Bank Name" value={userProfile.bankName} onChange={(e) => setUserProfile({...userProfile, bankName: e.target.value})} style={{ padding: '0.8rem', background: 'rgba(255,255,255,0.05)' }} />
            <input type="text" className="input-field" placeholder="Account Number" value={userProfile.bankAccount} onChange={(e) => setUserProfile({...userProfile, bankAccount: e.target.value})} style={{ padding: '0.8rem', background: 'rgba(255,255,255,0.05)' }} />
            <button type="submit" className="btn btn-primary" style={{ padding: '1rem', fontSize: '1.1rem', background: 'var(--accent-primary)', color: '#000', border: 'none', marginTop: '0.5rem' }}>
              Save Profile
            </button>
          </form>
        </div>
      )}

      {authStep === 'pin' && (
        <>
          <div className="stagger-1" style={{ marginBottom: '3rem', textAlign: 'center' }}>
            <div style={{ width: 64, height: 64, background: 'var(--accent-primary)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', boxShadow: '0 0 30px rgba(52, 211, 153, 0.4)' }}>
              <Lock size={32} color="#000" />
            </div>
            <h1 className="title text-gradient-emerald" style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>
              {isSettingPin ? 'Secure App' : 'Welcome Back'}
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>
              {isSettingPin ? 'Create a 4-digit PIN for quick access' : 'Enter PIN to unlock'}
            </p>
          </div>

          <div className="glass-login-panel stagger-2" style={{ padding: '2.5rem', width: '100%', maxWidth: '360px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            
            {/* PIN Dots */}
            <div className="stagger-3" style={{ display: 'flex', gap: '1.25rem', marginBottom: '3rem' }}>
              {[0, 1, 2, 3].map(i => (
                <div key={i} style={{ 
                  width: '18px', height: '18px', borderRadius: '50%', 
                  background: i < pinInput.length ? 'var(--accent-primary)' : 'rgba(255,255,255,0.05)', 
                  boxShadow: i < pinInput.length ? '0 0 15px var(--accent-primary)' : 'inset 0 1px 3px rgba(0,0,0,0.5)',
                  transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)' 
                }} />
              ))}
            </div>

            {/* Keypad */}
            <div className="stagger-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem', width: '100%' }}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                <button key={num} onClick={() => handlePinPress(num.toString())} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', fontSize: '1.75rem', width: '72px', height: '72px', borderRadius: '50%', margin: '0 auto', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 15px rgba(0,0,0,0.2)' }} onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.9)'} onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}>
                  {num}
                </button>
              ))}
              
              {biometricId && !isSettingPin ? (
                <button onClick={triggerBiometricUnlock} style={{ background: 'linear-gradient(135deg, rgba(52, 211, 153, 0.1), rgba(52, 211, 153, 0.0))', border: '1px solid rgba(52, 211, 153, 0.2)', color: 'var(--accent-neon)', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '72px', height: '72px', borderRadius: '50%', margin: '0 auto', cursor: 'pointer', transition: 'all 0.2s' }} onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.9)'} onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}>
                  <Fingerprint size={32} />
                </button>
              ) : (
                <div />
              )}
              
              <button onClick={() => handlePinPress('0')} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', fontSize: '1.75rem', width: '72px', height: '72px', borderRadius: '50%', margin: '0 auto', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 15px rgba(0,0,0,0.2)' }} onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.9)'} onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}>
                0
              </button>
              <button onClick={() => setPinInput(pinInput.slice(0, -1))} style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: '1rem', fontWeight: 600, width: '72px', height: '72px', borderRadius: '50%', margin: '0 auto', cursor: 'pointer', transition: 'color 0.2s' }} onMouseDown={(e) => e.currentTarget.style.color = '#fff'} onMouseUp={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.4)'}>
                DEL
              </button>
            </div>
            
            {userAccount && (
              <button onClick={handleSwitchAccount} style={{ marginTop: '2rem', background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.9rem', cursor: 'pointer', textDecoration: 'underline' }}>
                Not {userAccount}? Log in differently
              </button>
            )}
          </div>
        </>
      )}
      
      <div className="stagger-5" style={{ marginTop: '2rem', color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem', letterSpacing: '1px', textTransform: 'uppercase' }}>
        Eco-Expense Secure
      </div>
    </div>
  );

  const renderHomeView = () => {
    const currencyObj = CURRENCIES.find(c => c.code === currency) || CURRENCIES[0];
    const filteredTransactions = selectedCategory === 'All' 
      ? transactions 
      : transactions.filter(tx => tx.category === selectedCategory);

    const totalBalance = filteredTransactions.reduce((sum, tx) => {
      const converted = convertCurrency(tx.amount, tx.nativeCurrency || 'AED', currency, exchangeRates);
      return sum + converted;
    }, 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    
    const allCategories = ['All', ...new Set(transactions.map(tx => tx.category || 'Other'))];
    
    return (
      <div className="animate-fade-in" style={{ animation: 'fade-in 0.6s ease-out' }}>
        <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 className="title" style={{ marginBottom: 0, background: 'linear-gradient(to right, #fff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Hello, {userName} 👋</h1>
            <p className="subtitle" style={{ opacity: 0.8 }}>Here are your recent expenses</p>
          </div>
          <div role="img" aria-label="User Profile" onClick={() => setActiveTab('profile')} style={{ width: 48, height: 48, borderRadius: '50%', background: 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.2)', cursor: 'pointer', boxShadow: '0 0 20px rgba(16, 185, 129, 0.2)', transition: 'all 0.3s ease' }}>
            <User size={24} color="var(--accent-neon)" />
          </div>
        </header>

        <section className="credit-card" style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '0.25rem' }}>
                {selectedCategory === 'All' ? 'Total Spent' : `${selectedCategory} Total`}
              </p>
              <h2 style={{ fontSize: '2.75rem', fontWeight: 800, margin: '0', color: '#fff', letterSpacing: '-1px' }}>
                <span style={{ fontSize: '1.5rem', fontWeight: 500, opacity: 0.8, marginRight: '4px' }}>{currencyObj.symbol.trim()}</span>
                {totalBalance}
              </h2>
            </div>
            <Zap size={24} color="var(--accent-neon)" style={{ filter: 'drop-shadow(0 0 8px var(--accent-neon))' }} />
          </div>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
            <button className="btn btn-outline" style={{ flex: 1, display: 'flex', gap: '0.5rem', fontSize: '0.9rem' }} onClick={handleSyncCard} disabled={isSyncing}>
              <RefreshCw size={16} className={isSyncing ? "animate-spin" : ""} style={{ animation: isSyncing ? 'spin 1s linear infinite' : 'none' }} /> 
              {isSyncing ? 'Syncing...' : 'Sync Bank'}
            </button>
            <button className="btn btn-primary" style={{ flex: 1, display: 'flex', gap: '0.5rem', fontSize: '0.9rem', background: 'var(--accent-primary)', color: '#000', border: 'none' }} onClick={() => setIsSendModalOpen(true)}>
              <Send size={16} /> 
              Send Money
            </button>
          </div>
        </section>

        <button 
          className="btn btn-outline" 
          style={{ width: '100%', marginBottom: '2rem', display: 'flex', gap: '0.75rem', justifyContent: 'center', borderColor: 'var(--accent-neon)', color: 'var(--accent-neon)', padding: '1rem', borderRadius: '16px' }}
          onClick={() => { setIsModalOpen(true); setInitialOpenScanner(true); }}
        >
          <Camera size={20} /> Scan Receipt
        </button>

        <section style={{ marginBottom: '6rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Recent Activity</h3>
            {transactions.length > 0 && (
              <button onClick={() => confirm('Clear history?') && setTransactions([])} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.85rem', cursor: 'pointer' }}>Clear</button>
            )}
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '1rem', marginBottom: '0.5rem', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {allCategories.map(cat => (
              <button 
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                style={{ 
                  whiteSpace: 'nowrap', 
                  padding: '0.4rem 1rem', 
                  borderRadius: '99px', 
                  fontSize: '0.8rem', 
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: cat === selectedCategory ? 'none' : '1px solid var(--surface-border)',
                  background: cat === selectedCategory ? 'var(--accent-primary)' : 'rgba(255,255,255,0.05)',
                  color: cat === selectedCategory ? '#000' : 'var(--text-primary)',
                  transition: 'all 0.2s'
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          <div role="list" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {filteredTransactions.length === 0 ? (
              <div className="glass-panel" style={{ textAlign: 'center', padding: '3rem 1rem' }}><p style={{ color: 'var(--text-muted)' }}>No transactions found.</p></div>
            ) : (
              filteredTransactions.map((tx, index) => {
                const nativeCurr = tx.nativeCurrency || 'AED';
                const nativeSymbol = CURRENCIES.find(c => c.code === nativeCurr)?.symbol.trim() || nativeCurr;
                const converted = convertCurrency(tx.amount, nativeCurr, currency, exchangeRates);
                const isConverted = nativeCurr !== currency;

                return (
                  <div key={tx.id} role="listitem" className="glass-panel" style={{ padding: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                      <div className={`icon-circle ${tx.type === 'card' ? 'icon-circle-card' : 'icon-circle-cash'}`}>
                        {tx.category === 'Transfer' ? <Send size={22} /> : tx.type === 'card' ? <CreditCard size={22} /> : <Wallet size={22} />}
                      </div>
                      <div>
                        <h4 style={{ fontWeight: 600, color: '#fff', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          {tx.merchant}
                          {tx.spenderId && tx.spenderId !== 'me' && familyMembers.find(f => f.id === tx.spenderId) && (
                            <span style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem', borderRadius: '4px', background: 'rgba(52, 211, 153, 0.15)', color: 'var(--accent-neon)', fontWeight: 700 }}>
                              {familyMembers.find(f => f.id === tx.spenderId).name}
                            </span>
                          )}
                        </h4>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          <span style={{ color: 'var(--accent-neon)', fontWeight: 600 }}>{tx.exactItem ? `${tx.exactItem} (${tx.category})` : tx.category || 'Other'}</span> • {tx.date}
                        </p>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontWeight: 700, color: '#fff', fontSize: '1.1rem' }}>-{nativeSymbol}{parseFloat(tx.amount).toFixed(2)}</p>
                      {isConverted && (
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>~{currencyObj.symbol.trim()}{converted.toFixed(2)}</p>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </div>
    );
  };

  const renderCardsView = () => (
    <div className="animate-fade-in" style={{ paddingBottom: '6rem' }}>
      <header style={{ marginBottom: '2rem', marginTop: '1rem' }}>
        <h1 className="title">My Cards</h1>
        <p className="subtitle">Manage your connected bank cards</p>
      </header>
      
      {cards.map(card => (
        <div key={card.id} className="credit-card" style={{ marginBottom: '1.5rem', background: card.type === 'Mastercard' ? 'linear-gradient(135deg, #1e1b4b, #020617)' : 'linear-gradient(135deg, #0f172a, #020617)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Zap size={24} color={card.type === 'Mastercard' ? '#ffedd5' : 'var(--text-muted)'} />
            <span style={{ color: '#fff', fontWeight: 600, letterSpacing: '2px' }}>{card.type}</span>
          </div>
          <div style={{ marginTop: '2rem', marginBottom: '1rem', fontSize: '1.5rem', color: '#fff', letterSpacing: '4px', fontFamily: 'monospace' }}>
            **** **** **** {card.last4}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>
            <span>{card.name || userName}</span>
            <span>{card.expiry}</span>
          </div>
        </div>
      ))}

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
        <button className="btn btn-primary" style={{ flex: 1, padding: '1rem', display: 'flex', gap: '0.5rem', justifyContent: 'center' }} onClick={() => setIsTapToPayOpen(true)}>
          <Zap size={20} /> Tap to Pay
        </button>
        <button className="btn btn-outline" style={{ flex: 1, padding: '1rem', display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
          <Settings size={20} /> Manage
        </button>
      </div>

      <button className="btn btn-outline" style={{ width: '100%', padding: '1.25rem', display: 'flex', gap: '0.75rem', justifyContent: 'center', borderStyle: 'dashed', borderWidth: '2px', borderColor: 'var(--surface-border)' }} onClick={() => setIsAddCardModalOpen(true)}>
        <Plus size={20} color="var(--accent-neon)" /> Add New Card
      </button>
    </div>
  );

  const renderWalletView = () => {
    const currencyObj = CURRENCIES.find(c => c.code === currency) || CURRENCIES[0];
    const categories = transactions.reduce((acc, tx) => {
      const cat = tx.category || 'Other';
      const converted = convertCurrency(tx.amount, tx.nativeCurrency || 'AED', currency, exchangeRates);
      acc[cat] = (acc[cat] || 0) + converted;
      return acc;
    }, {});
    
    const maxAmount = Math.max(...Object.values(categories), 1);

    return (
      <div className="animate-fade-in" style={{ paddingBottom: '6rem' }}>
        <header style={{ marginBottom: '2rem', marginTop: '1rem' }}>
          <h1 className="title">Analytics</h1>
          <p className="subtitle">Expense breakdown by category</p>
        </header>

        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '1.5rem' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem' }}><PieChart size={20} color="var(--accent-neon)" /> Spending by Category</h3>
          {Object.entries(categories).length === 0 ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>No data to display.</p>
          ) : (
            Object.entries(categories).sort((a,b) => b[1] - a[1]).map(([cat, amount]) => (
              <div key={cat}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                  <span style={{ color: '#fff' }}>{cat}</span>
                  <span style={{ fontWeight: 600 }}>{currencyObj.symbol}{amount.toFixed(2)}</span>
                </div>
                <div className="progress-track" style={{ height: '8px' }}>
                  <div className="progress-fill" style={{ width: `${(amount / maxAmount) * 100}%` }}></div>
                </div>
              </div>
            ))
          )}
        </div>

        {familyMembers.length > 1 && (
          <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem' }}><Users size={20} color="var(--accent-primary)" /> Family Breakdown</h3>
            {familyMembers.map(member => {
              const memberSpent = transactions
                .filter(tx => tx.spenderId === member.id || (!tx.spenderId && member.id === 'me'))
                .reduce((sum, tx) => sum + convertCurrency(tx.amount, tx.nativeCurrency || 'AED', currency, exchangeRates), 0);
              
              const totalAll = transactions.reduce((sum, tx) => sum + convertCurrency(tx.amount, tx.nativeCurrency || 'AED', currency, exchangeRates), 0) || 1;
              const pct = (memberSpent / totalAll) * 100;

              return (
                <div key={member.id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                    <span style={{ color: '#fff' }}>{member.name}</span>
                    <span style={{ fontWeight: 600 }}>{currencyObj.symbol}{memberSpent.toFixed(2)}</span>
                  </div>
                  <div className="progress-track" style={{ height: '8px', background: 'rgba(255,255,255,0.05)' }}>
                    <div className="progress-fill" style={{ width: `${pct}%`, background: 'var(--accent-primary)' }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const renderProfileView = () => (
    <div className="animate-fade-in" style={{ paddingBottom: '6rem' }}>
      <header style={{ marginBottom: '2rem', marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <User size={32} color="#000" />
        </div>
        <div>
          <h1 className="title" style={{ fontSize: '1.5rem', marginBottom: 0 }}>{userName}</h1>
          <p className="subtitle">Eco-conscious Saver</p>
        </div>
      </header>

      <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
        
        {userAccount && (
          <div style={{ padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--surface-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}><Zap size={20} color="var(--accent-primary)" /> <span style={{ color: '#fff' }}>Account ({userAccount})</span></div>
            <span style={{ color: 'var(--accent-primary)', fontSize: '0.8rem', background: 'rgba(52, 211, 153, 0.1)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>Verified</span>
          </div>
        )}

        <button onClick={() => setActiveTab('settings')} className="btn-outline" style={{ width: '100%', padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: 'none', borderBottom: '1px solid var(--surface-border)', borderRadius: 0, background: 'transparent', cursor: 'pointer' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}><Settings size={20} color="var(--text-secondary)" /> <span style={{ color: '#fff' }}>Account Settings</span></div>
          <ChevronRight size={20} color="var(--text-muted)" />
        </button>
        <button onClick={exportCSV} className="btn-outline" style={{ width: '100%', padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: 'none', borderBottom: '1px solid var(--surface-border)', borderRadius: 0, background: 'transparent', cursor: 'pointer' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}><Download size={20} color="var(--accent-neon)" /> <span style={{ color: '#fff' }}>Export Data (CSV)</span></div>
          <ChevronRight size={20} color="var(--text-muted)" />
        </button>
        <button className="btn-outline" style={{ width: '100%', padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: 'none', borderRadius: 0, background: 'transparent', cursor: 'pointer' }} onClick={() => {
            if(confirm("Log out and lock the app?")) {
              setIsLoggingOut(true);
              setTimeout(() => {
                setIsAuthenticated(false);
                setPinInput('');
                setActiveTab('home');
                setIsLoggingOut(false);
              }, 1500);
            }
          }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}><LogOut size={20} color="var(--danger)" /> <span style={{ color: 'var(--danger)' }}>Log Out</span></div>
          <ChevronRight size={20} color="var(--text-muted)" />
        </button>
      </div>
    </div>
  );

  const handleToggleBiometrics = async () => {
    if (biometricId) {
      // Disable
      localStorage.removeItem('eco_expenses_biometric_id');
      setBiometricId(null);
    } else {
      // Enable
      try {
        const newId = await registerBiometrics(userName);
        localStorage.setItem('eco_expenses_biometric_id', newId);
        setBiometricId(newId);
        alert("Face ID / Touch ID successfully enabled!");
      } catch (err) {
        console.error(err);
        alert("Failed to enable Biometrics. Ensure your device supports it and you are using a secure context (HTTPS/localhost).");
      }
    }
  };

  const handleAddFamilyMember = () => {
    const name = prompt("Enter family member's name:");
    if (name && name.trim() !== '') {
      const newFamily = [...familyMembers, { id: 'fam_' + Date.now(), name: name.trim() }];
      setFamilyMembers(newFamily);
      localStorage.setItem('eco_expenses_family', JSON.stringify(newFamily));
    }
  };

  const handleSyncSuccess = (newFamily, newTransactions) => {
    // Merge family members (avoiding duplicates by id)
    const familyMap = new Map();
    [...familyMembers, ...newFamily].forEach(m => familyMap.set(m.id, m));
    const mergedFamily = Array.from(familyMap.values());
    
    // Merge transactions (avoiding duplicates by id)
    const txMap = new Map();
    [...transactions, ...newTransactions].forEach(tx => txMap.set(tx.id, tx));
    const mergedTx = Array.from(txMap.values()).sort((a,b) => new Date(b.date) - new Date(a.date));

    setFamilyMembers(mergedFamily);
    setTransactions(mergedTx);
    
    localStorage.setItem('eco_expenses_family', JSON.stringify(mergedFamily));
    localStorage.setItem('eco_expenses_data', JSON.stringify(mergedTx));
  };

  const renderSettingsView = () => (
    <div className="animate-fade-in" style={{ paddingBottom: '6rem' }}>
      <header style={{ marginBottom: '2rem', marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <button onClick={() => setActiveTab('profile')} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0.5rem' }}>
          <ChevronRight size={24} style={{ transform: 'rotate(180deg)' }} />
        </button>
        <h1 className="title" style={{ fontSize: '1.5rem', marginBottom: 0 }}>Settings</h1>
      </header>

      <div className="glass-panel" style={{ marginBottom: '1.5rem' }}>
        <div className="input-group">
          <label className="input-label">Display Name</label>
          <input 
            type="text" 
            className="input-field" 
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            placeholder="Enter your name"
          />
        </div>
        
        <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--surface-border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <label className="input-label" style={{ marginBottom: 0 }}>Family Members</label>
            <button onClick={handleAddFamilyMember} style={{ background: 'var(--accent-primary)', color: '#000', border: 'none', borderRadius: '4px', padding: '0.25rem 0.75rem', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>+ Add</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {familyMembers.map(member => (
              <div key={member.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.05)', padding: '0.5rem 1rem', borderRadius: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <User size={16} color="var(--text-muted)" />
                  <span style={{ color: '#fff', fontSize: '0.9rem' }}>{member.name}</span>
                </div>
                {member.id !== 'me' && (
                  <button 
                    onClick={() => {
                      setLinkModalMode('host');
                      setIsLinkModalOpen(true);
                    }}
                    style={{ background: 'rgba(52, 211, 153, 0.1)', color: 'var(--accent-neon)', border: '1px solid rgba(52, 211, 153, 0.3)', borderRadius: '12px', padding: '0.2rem 0.5rem', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '0.25rem', cursor: 'pointer' }}
                  >
                    <Smartphone size={12} /> Link App
                  </button>
                )}
              </div>
            ))}
          </div>
          
          <button 
            onClick={() => {
              setLinkModalMode('join');
              setIsLinkModalOpen(true);
            }}
            className="btn-outline" 
            style={{ width: '100%', marginTop: '1rem', padding: '0.75rem', display: 'flex', gap: '0.5rem', justifyContent: 'center', fontSize: '0.9rem', borderColor: 'var(--surface-border)' }}
          >
            <Link2 size={16} /> Link with Family App
          </button>
        </div>
      </div>

      <div className="glass-panel">

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2rem', borderTop: '1px solid var(--surface-border)', paddingTop: '1.5rem' }}>
          <div>
            <h4 style={{ color: '#fff', fontSize: '1rem' }}>Push Notifications</h4>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Receive daily expense alerts.</p>
          </div>
          <div style={{ width: '48px', height: '24px', background: 'var(--accent-primary)', borderRadius: '12px', position: 'relative', cursor: 'pointer' }}>
            <div style={{ width: '20px', height: '20px', background: '#fff', borderRadius: '50%', position: 'absolute', top: '2px', right: '2px', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}></div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', borderTop: '1px solid var(--surface-border)', paddingTop: '1.5rem' }}>
          <div>
            <h4 style={{ color: '#fff', fontSize: '1rem' }}>Face ID / Touch ID</h4>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Unlock app with biometrics.</p>
          </div>
          <div 
            onClick={handleToggleBiometrics}
            style={{ width: '48px', height: '24px', background: biometricId ? 'var(--accent-primary)' : 'rgba(255,255,255,0.1)', borderRadius: '12px', position: 'relative', cursor: 'pointer', transition: 'background 0.3s ease' }}
          >
            <div style={{ width: '20px', height: '20px', background: '#fff', borderRadius: '50%', position: 'absolute', top: '2px', left: biometricId ? '26px' : '2px', boxShadow: '0 2px 4px rgba(0,0,0,0.2)', transition: 'left 0.3s ease' }}></div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', borderTop: '1px solid var(--surface-border)', paddingTop: '1.5rem' }}>
          <div>
            <h4 style={{ color: '#fff', fontSize: '1rem' }}>Currency Priority</h4>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Global currency settings.</p>
          </div>
          <select 
            className="input-field" 
            style={{ width: '120px', padding: '0.5rem', appearance: 'none', backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23a3b3cc%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.5rem center', backgroundSize: '1em' }}
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
          >
            {CURRENCIES.map(c => (
              <option key={c.code} value={c.code}>{c.code} ({c.symbol.trim()})</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );

  if (!isClient) return null;
  if (isLoggingOut) return renderLogoutTransition();
  if (!isAuthenticated) return renderLoginView();

  return (
    <main className="container" style={{ position: 'relative', zIndex: 1 }}>
      <div className="bg-orb-3"></div>
      
      {/* Active View Router */}
      {activeTab === 'home' && renderHomeView()}
      {activeTab === 'cards' && renderCardsView()}
      {activeTab === 'wallet' && renderWalletView()}
      {activeTab === 'profile' && renderProfileView()}
      {activeTab === 'settings' && renderSettingsView()}

      {/* Floating Bottom Navigation */}
      <nav className="bottom-nav">
        <button className={`nav-item ${activeTab === 'home' ? 'active' : ''}`} onClick={() => setActiveTab('home')} aria-label="Home">
          <Home size={22} />
        </button>
        <button className={`nav-item ${activeTab === 'cards' ? 'active' : ''}`} onClick={() => setActiveTab('cards')} aria-label="Cards">
          <CreditCard size={22} />
        </button>
        
        <button 
          className="add-button shadow-neon"
          onClick={() => setIsModalOpen(true)}
          aria-label="Add Transaction"
        >
          <Plus size={24} color="#000" />
        </button>

        <button className={`nav-item ${activeTab === 'wallet' ? 'active' : ''}`} onClick={() => setActiveTab('wallet')} aria-label="Wallet">
          <Wallet size={22} />
        </button>
        <button className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')} aria-label="Profile">
          <User size={22} />
        </button>
      </nav>

      {/* Modals */}
      <AddTransactionModal 
        isOpen={isModalOpen} 
        onClose={() => { setIsModalOpen(false); setInitialOpenScanner(false); }} 
        onAdd={(tx) => setTransactions([tx, ...transactions])} 
        currency={currency}
        familyMembers={familyMembers}
        initialOpenScanner={initialOpenScanner}
      />
      
      <SendMoneyModal 
        isOpen={isSendModalOpen} 
        onClose={() => setIsSendModalOpen(false)} 
        onSend={handleAddTransaction} 
        currency={currency}
      />
      
      <TapToPayModal
        isOpen={isTapToPayOpen}
        onClose={() => setIsTapToPayOpen(false)}
        userName={userName}
      />
      
      <LinkDeviceModal
        isOpen={isLinkModalOpen}
        onClose={() => setIsLinkModalOpen(false)}
        mode={linkModalMode}
        familyMembers={familyMembers}
        transactions={transactions}
        onSyncSuccess={handleSyncSuccess}
      />
      
      <AddCardModal
        isOpen={isAddCardModalOpen}
        onClose={() => setIsAddCardModalOpen(false)}
        onAdd={(newCard) => setCards([...cards, newCard])}
      />
    </main>
  );
}
