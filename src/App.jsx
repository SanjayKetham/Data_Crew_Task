import React, { useState, useEffect } from 'react';
import { 
  Heart, Users, Settings, LogOut, Search, User, Filter, 
  AlertCircle, CheckCircle, Clock, Calendar, Mail, FileText, 
  ArrowLeft, RefreshCw, X, Eye, ThumbsUp, Trash2, Sun, Moon, 
  Plus, Key, HelpCircle, Briefcase, Award, MapPin, Check, ChevronRight, ChevronLeft
} from 'lucide-react';
import { initialClients, initialPool } from './data/profiles';
import { calculateCompatibility } from './utils/matchingAlgo';
import { apiClient } from './utils/apiClient';
import './App.css';

// Reusable avatar component with deterministic color initials fallback
function ProfileAvatar({ src, name, gender, className }) {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [src]);

  const initials = name
    ? name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : '??';

  const getBackgroundColor = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colors = [
      '#e11d48', '#db2777', '#c084fc', '#818cf8', '#6366f1', 
      '#4f46e5', '#2563eb', '#0284c7', '#0d9488', '#059669', 
      '#10b981', '#16a34a', '#84cc16', '#ca8a04', '#ea580c'
    ];
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };

  const bgColor = name ? getBackgroundColor(name) : 'var(--primary)';

  if (hasError || !src) {
    return (
      <div 
        className={className} 
        style={{ 
          backgroundColor: bgColor, 
          color: '#ffffff', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          fontWeight: 'bold', 
          borderRadius: '50%',
          userSelect: 'none',
          border: '2px solid var(--border-color)',
          boxShadow: 'var(--shadow-sm)',
          aspectRatio: '1 / 1'
        }}
      >
        {initials}
      </div>
    );
  }

  return (
    <img 
      className={className} 
      src={src} 
      alt={name} 
      onError={() => setHasError(true)} 
    />
  );
}

function App() {
  // --- AUTH STATE ---
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('tdc_authenticated') === 'true';
  });
  const [loginEmail, setLoginEmail] = useState('matchmaker@datecrew.com');
  const [loginPassword, setLoginPassword] = useState('password123');
  const [loginError, setLoginError] = useState('');

  // --- THEME & API KEYS ---
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('tdc_theme') || 'dark';
  });
  const [openaiApiKey, setOpenaiApiKey] = useState(() => {
    return localStorage.getItem('tdc_openai_key') || '';
  });
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    return localStorage.getItem('tdc_sidebar_collapsed') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('tdc_sidebar_collapsed', isSidebarCollapsed);
  }, [isSidebarCollapsed]);

  // --- APP STATE ---
  const [clients, setClients] = useState([]);
  const [pool, setPool] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [activeView, setActiveView] = useState('dashboard'); // 'dashboard' | 'pool' | 'settings'
  const [activeDetailTab, setActiveDetailTab] = useState('finder'); // 'finder' | 'notes' | 'journey'
  const [connectionMode, setConnectionMode] = useState('Client-Side Local Storage');
  const [scoredMatches, setScoredMatches] = useState([]);
  const [isMatchesLoading, setIsMatchesLoading] = useState(false);

  // --- SEARCH & FILTERS ---
  const [searchQuery, setSearchQuery] = useState('');
  const [stageFilter, setStageFilter] = useState('All');
  const [genderFilter, setGenderFilter] = useState('All');
  
  // Match Finder Filters (Inside Detailed View)
  const [poolFilters, setPoolFilters] = useState({
    city: 'All',
    religion: 'All',
    diet: 'All',
    manglik: 'All',
    minAge: '',
    maxAge: ''
  });

  // --- DETAIL WORKSPACE INTERACTIONS ---
  const [compareCandidate, setCompareCandidate] = useState(null);
  const [sendMatchCandidate, setSendMatchCandidate] = useState(null);
  const [emailIntro, setEmailIntro] = useState('');
  const [isGeneratingEmail, setIsGeneratingEmail] = useState(false);
  const [newNoteText, setNewNoteText] = useState('');
  const [toast, setToast] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);

  // --- INITIALIZE DATA ---
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('tdc_theme', theme);
  }, [theme]);

  // Load clients and pool
  useEffect(() => {
    const loadInitialData = async () => {
      // Force database reload if version is outdated
      const dbVersion = localStorage.getItem('tdc_db_version');
      if (dbVersion !== '3') {
        localStorage.removeItem('tdc_clients');
        localStorage.removeItem('tdc_pool');
        localStorage.setItem('tdc_db_version', '3');
      }

      const clientRes = await apiClient.getClients();
      setClients(clientRes.data);
      setConnectionMode(clientRes.mode);

      const poolRes = await apiClient.getPool();
      setPool(poolRes.data);
    };

    loadInitialData();
  }, []);

  // Fetch match recommendations dynamically on client selection
  useEffect(() => {
    const loadMatches = async () => {
      if (!selectedClient || activeDetailTab !== 'finder') return;
      setIsMatchesLoading(true);
      const res = await apiClient.getMatches(selectedClient, pool);
      setScoredMatches(res.data);
      setIsMatchesLoading(false);
    };

    loadMatches();
  }, [selectedClient, activeDetailTab, pool]);

  // Toast Helper
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // --- HANDLERS ---
  const handleLogin = (e) => {
    e.preventDefault();
    if (loginEmail === 'matchmaker@datecrew.com' && loginPassword === 'password123') {
      setIsAuthenticated(true);
      localStorage.setItem('tdc_authenticated', 'true');
      setLoginError('');
      showToast('Logged in successfully! Welcome to TDC Matchmaker Portal.');
    } else {
      setLoginError('Invalid email or password. Use the demo credentials provided below.');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.setItem('tdc_authenticated', 'false');
    setSelectedClient(null);
    setActiveView('dashboard');
    showToast('Logged out successfully.', 'info');
  };

  const handleSaveApiKey = (key) => {
    setOpenaiApiKey(key);
    localStorage.setItem('tdc_openai_key', key);
    showToast('API Key configuration updated.');
  };

  // Update client matchmaking stage (Express or local fallback)
  const handleUpdateStage = async (clientId, newStage) => {
    const res = await apiClient.updateStage(clientId, newStage, clients);
    if (res.fullList) {
      setClients(res.fullList);
    } else {
      const clientList = await apiClient.getClients();
      setClients(clientList.data);
    }
    
    setSelectedClient(res.updatedClient);
    showToast(`Journey stage updated to "${newStage}" (${res.mode})`);
  };

  // Add custom matchmaker note (Express or local fallback)
  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;

    const res = await apiClient.addNote(selectedClient.id, newNoteText.trim(), clients);
    if (res.fullList) {
      setClients(res.fullList);
    } else {
      const clientList = await apiClient.getClients();
      setClients(clientList.data);
    }
    
    setSelectedClient(res.updatedClient);
    setNewNoteText('');
    showToast(`CRM Meeting/Call note added successfully (${res.mode}).`);
  };

  // Trigger match preview and email intro generation (Express API or local fallback)
  const handleOpenSendMatch = async (candidate) => {
    setSendMatchCandidate(candidate);
    setIsGeneratingEmail(true);
    try {
      const res = await apiClient.generateEmail(selectedClient, candidate, openaiApiKey);
      setEmailIntro(res.email);
    } catch (err) {
      showToast('Failed to generate intro email.', 'danger');
    } finally {
      setIsGeneratingEmail(false);
    }
  };

  // Dispatch mock email invite and log action
  const handleSendMockEmail = async () => {
    const res = await apiClient.sendMatch(selectedClient.id, sendMatchCandidate, clients);
    if (res.fullList) {
      setClients(res.fullList);
    } else {
      const clientList = await apiClient.getClients();
      setClients(clientList.data);
    }
    
    setSelectedClient(res.updatedClient);
    
    // Confetti effect
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 4000);

    setSendMatchCandidate(null);
    showToast(`Proposal email sent for ${sendMatchCandidate.fullName}! Recorded in history log (${res.mode}).`, 'success');
  };

  // Clean filters inside detailed view
  const clearPoolFilters = () => {
    setPoolFilters({
      city: 'All',
      religion: 'All',
      diet: 'All',
      manglik: 'All',
      minAge: '',
      maxAge: ''
    });
    showToast('Match Finder filters cleared.', 'info');
  };

  // --- FILTER UTILS ---
  const getFilteredClients = () => {
    return clients.filter(client => {
      const matchesSearch = client.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            client.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            client.designation.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStage = stageFilter === 'All' || client.stage === stageFilter;
      const matchesGender = genderFilter === 'All' || client.gender === genderFilter;

      return matchesSearch && matchesStage && matchesGender;
    });
  };

  const uniqueCities = Array.from(new Set(pool.map(p => p.city))).sort();
  const uniqueReligions = Array.from(new Set(pool.map(p => p.religion))).sort();
  const uniqueDiets = Array.from(new Set(pool.map(p => p.diet))).sort();

  const getFilteredAndScoredMatches = () => {
    return scoredMatches.filter(item => {
      const matchesCity = poolFilters.city === 'All' || item.city === poolFilters.city;
      const matchesReligion = poolFilters.religion === 'All' || item.religion === poolFilters.religion;
      const matchesDiet = poolFilters.diet === 'All' || item.diet === poolFilters.diet;
      const matchesManglik = poolFilters.manglik === 'All' || item.manglik === poolFilters.manglik;

      const ageVal = parseInt(item.age, 10);
      const matchesMinAge = !poolFilters.minAge || ageVal >= parseInt(poolFilters.minAge, 10);
      const matchesMaxAge = !poolFilters.maxAge || ageVal <= parseInt(poolFilters.maxAge, 10);

      return matchesCity && matchesReligion && matchesDiet && matchesManglik && matchesMinAge && matchesMaxAge;
    });
  };

  // --- AUTH CHECK ---
  if (!isAuthenticated) {
    return (
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <div className="login-logo">
              <Heart fill="currentColor" size={28} />
            </div>
            <h1 className="login-title">The Date Crew</h1>
            <p className="login-subtitle">Matchmaker Dashboard & CRM MVP Portal</p>
          </div>

          {loginError && (
            <div className="login-error">
              <AlertCircle size={18} />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label className="form-label" htmlFor="email">Username</label>
              <div className="input-wrapper">
                <span className="input-icon"><User size={18} /></span>
                <input
                  id="email"
                  type="text"
                  className="form-input"
                  placeholder="name@datecrew.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="password">Password</label>
              <div className="input-wrapper">
                <span className="input-icon"><Key size={18} /></span>
                <input
                  id="password"
                  type="password"
                  className="form-input"
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-block mt-16">
              Sign In to Workspace
            </button>
          </form>

          <div className="login-credentials-box">
            <strong>Demo Access Details:</strong>
            <p style={{ marginTop: '4px' }}>Username: <code>matchmaker@datecrew.com</code></p>
            <p>Password: <code>password123</code></p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`app-container ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      {/* Toast Notifications */}
      {toast && (
        <div className="toast-container">
          <div className={`toast ${toast.type}`}>
            <span className="toast-icon">
              {toast.type === 'success' && <CheckCircle size={20} />}
              {toast.type === 'info' && <AlertCircle size={20} />}
              {toast.type === 'danger' && <AlertCircle size={20} />}
            </span>
            <span className="toast-message">{toast.message}</span>
            <span className="toast-close" onClick={() => setToast(null)}><X size={16} /></span>
          </div>
        </div>
      )}

      {/* Confetti Trigger Overlay */}
      {showConfetti && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          pointerEvents: 'none',
          zIndex: 9999,
          overflow: 'hidden'
        }}>
          {Array.from({ length: 100 }).map((_, i) => {
            const size = Math.random() * 12 + 6;
            const left = Math.random() * 100;
            const delay = Math.random() * 3;
            const duration = Math.random() * 3 + 2;
            const rotate = Math.random() * 360;
            const colors = ['#e11d48', '#6366f1', '#10b981', '#f59e0b', '#ec4899', '#3b82f6'];
            const color = colors[Math.floor(Math.random() * colors.length)];
            return (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  width: `${size}px`,
                  height: `${size}px`,
                  backgroundColor: color,
                  left: `${left}%`,
                  top: `-20px`,
                  opacity: Math.random() * 0.8 + 0.2,
                  borderRadius: Math.random() > 0.5 ? '50%' : '2px',
                  transform: `rotate(${rotate}deg)`,
                  animation: `confettiFall ${duration}s linear ${delay}s infinite`
                }}
              />
            );
          })}
        </div>
      )}

      {/* --- SIDEBAR --- */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexGrow: 1, overflow: 'hidden' }}>
            <div className="sidebar-logo">
              <Heart fill="currentColor" size={18} />
            </div>
            <span className="sidebar-brand">Date Crew CRM</span>
          </div>
          <button 
            className="sidebar-toggle-btn" 
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {isSidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        <ul className="sidebar-menu">
          <li className="sidebar-item">
            <div 
              className={`sidebar-link ${activeView === 'dashboard' ? 'active' : ''}`}
              onClick={() => { setSelectedClient(null); setActiveView('dashboard'); }}
            >
              <Users size={18} />
              <span>Assigned Clients</span>
            </div>
          </li>
          <li className="sidebar-item">
            <div 
              className={`sidebar-link ${activeView === 'pool' ? 'active' : ''}`}
              onClick={() => { setSelectedClient(null); setActiveView('pool'); }}
            >
              <Heart size={18} />
              <span>Matchmaking Pool</span>
            </div>
          </li>
          <li className="sidebar-item">
            <div 
              className={`sidebar-link ${activeView === 'settings' ? 'active' : ''}`}
              onClick={() => { setSelectedClient(null); setActiveView('settings'); }}
            >
              <Settings size={18} />
              <span>Settings & AI Engine</span>
            </div>
          </li>
        </ul>

        <div className="sidebar-footer">
          <div className="matchmaker-badge">
            <div className="matchmaker-avatar">PG</div>
            <div className="matchmaker-info">
              <span className="matchmaker-name">Preeti Gupta</span>
              <span className="matchmaker-role">Senior Matchmaker</span>
            </div>
          </div>
          <button onClick={handleLogout} className="sidebar-link active" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* --- MAIN PANEL --- */}
      <main className="main-content">
        {/* Main Header */}
        <header className="main-header">
          <div className="header-title-area">
            <h2>
              {selectedClient ? `Client Profile: ${selectedClient.fullName}` : 
               activeView === 'dashboard' ? 'Assigned Client Queue' : 
               activeView === 'pool' ? `Matchmaking Database Pool` : 'Workspace Configuration'}
            </h2>
            <span className="header-subtitle">
              {selectedClient ? `CRM Workspace & Profile Compatibility Finder` : 
               activeView === 'dashboard' ? 'Manage, track, and assign matches to your assigned active clients' :
               activeView === 'pool' ? `Review verified matrimonial profiles (${pool.length} total)` : 'Manage API integrations and portal preferences'}
            </span>
          </div>


          <div className="header-actions">
            <button 
              className="theme-toggle-btn"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Theme`}
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
        </header>

        {/* Content Body */}
        <div className="page-container">
          
          {/* VIEW: ASSIGNED CUSTOMERS DASHBOARD */}
          {activeView === 'dashboard' && !selectedClient && (
            <div>
              {/* Quick stats board */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
                <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', padding: '20px', borderRadius: 'var(--border-radius-md)', display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary)', padding: '12px', borderRadius: '12px' }}><Users size={24} /></div>
                  <div>
                    <h3 style={{ fontSize: '24px' }}>{clients.length}</h3>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Assigned Clients</p>
                  </div>
                </div>
                <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', padding: '20px', borderRadius: 'var(--border-radius-md)', display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ backgroundColor: 'var(--success-light)', color: 'var(--success)', padding: '12px', borderRadius: '12px' }}><Heart size={24} /></div>
                  <div>
                    <h3 style={{ fontSize: '24px' }}>{clients.filter(c => c.stage === 'Matchmaking Active').length}</h3>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Active Matchmaking</p>
                  </div>
                </div>
                <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', padding: '20px', borderRadius: 'var(--border-radius-md)', display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ backgroundColor: 'rgba(139, 92, 246, 0.1)', color: 'rgb(139, 92, 246)', padding: '12px', borderRadius: '12px' }}><Calendar size={24} /></div>
                  <div>
                    <h3 style={{ fontSize: '24px' }}>{clients.filter(c => c.stage === 'First Date Scheduled').length}</h3>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Dates Arranged</p>
                  </div>
                </div>
                <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', padding: '20px', borderRadius: 'var(--border-radius-md)', display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ backgroundColor: 'var(--warning-light)', color: 'var(--warning)', padding: '12px', borderRadius: '12px' }}><RefreshCw size={24} /></div>
                  <div>
                    <h3 style={{ fontSize: '24px' }}>{pool.length}</h3>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Matching Pool Profiles</p>
                  </div>
                </div>
              </div>

              {/* Filters Panel */}
              <div className="search-filter-bar">
                <div className="search-input-wrapper">
                  <span className="input-icon"><Search size={18} /></span>
                  <input
                    type="text"
                    className="search-input"
                    placeholder="Search by name, city, designation..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <select
                  className="filter-select"
                  value={stageFilter}
                  onChange={(e) => setStageFilter(e.target.value)}
                >
                  <option value="All">All Stages</option>
                  <option value="Onboarding">Onboarding</option>
                  <option value="Matchmaking Active">Matchmaking Active</option>
                  <option value="First Date Scheduled">First Date Scheduled</option>
                  <option value="Feedback Stage">Feedback Stage</option>
                  <option value="Matched / Closed">Matched / Closed</option>
                </select>

                <select
                  className="filter-select"
                  value={genderFilter}
                  onChange={(e) => setGenderFilter(e.target.value)}
                >
                  <option value="All">All Genders</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>

                {(stageFilter !== 'All' || genderFilter !== 'All' || searchQuery) && (
                  <button className="clear-filters-btn" onClick={() => { setStageFilter('All'); setGenderFilter('All'); setSearchQuery(''); }}>
                    Reset Filters
                  </button>
                )}
              </div>

              {/* Customer Queue List */}
              <div className="dashboard-grid">
                {getFilteredClients().map(client => (
                  <div 
                    key={client.id}
                    className="client-card"
                    onClick={() => {
                      setSelectedClient(client);
                      setActiveDetailTab('finder');
                    }}
                  >
                    <div className="client-card-header">
                      <ProfileAvatar 
                        className="client-card-avatar" 
                        src={client.photo} 
                        name={client.fullName}
                        gender={client.gender}
                      />
                      <div className="client-card-title">
                        <span className="client-name">{client.fullName}</span>
                        <span className="client-meta-top">{client.age} yrs • {client.city}</span>
                      </div>
                      <span className={`tag-badge ${client.stage.toLowerCase().replace(/\s+/g, '-').replace(/\//g, '')}`}>
                        {client.stage}
                      </span>
                    </div>

                    <div className="client-card-details">
                      <div className="client-detail-item">
                        <span className="client-detail-label">Profession</span>
                        <span className="client-detail-value">{client.designation}</span>
                      </div>
                      <div className="client-detail-item">
                        <span className="client-detail-label">Income (LPA)</span>
                        <span className="client-detail-value">₹{client.income} Lakhs</span>
                      </div>
                      <div className="client-detail-item">
                        <span className="client-detail-label">Religion / Caste</span>
                        <span className="client-detail-value">{client.religion} / {client.caste}</span>
                      </div>
                      <div className="client-detail-item">
                        <span className="client-detail-label">Diet Preference</span>
                        <span className="client-detail-value">{client.diet}</span>
                      </div>
                    </div>

                    <div className="client-card-footer">
                      <span className="card-notes-preview">
                        <strong>Last Note:</strong> {client.notes && client.notes.length > 0 ? client.notes[0].text : 'No recorded notes.'}
                      </span>
                      <span className="card-action-hint">
                        Manage <ChevronRight size={14} />
                      </span>
                    </div>
                  </div>
                ))}

                {getFilteredClients().length === 0 && (
                  <div className="empty-state" style={{ gridColumn: '1 / -1' }}>
                    <div className="empty-state-icon">🔍</div>
                    <h3>No matching clients found</h3>
                    <p>Try adjusting your search filters or check your spelling.</p>
                  </div>
                )}
              </div>
            </div>
          )}


          {/* VIEW: CLIENT WORKSPACE (DETAILED VIEW) */}
          {selectedClient && (
            <div className="detailed-grid">
              
              {/* Left Column: Full Biodata Card */}
              <aside className="biodata-card">
                <div className="biodata-hero">
                  <div className="back-to-dashboard" onClick={() => setSelectedClient(null)}>
                    <ArrowLeft size={14} /> Back to List
                  </div>
                  <ProfileAvatar 
                    className="biodata-avatar" 
                    src={selectedClient.photo} 
                    name={selectedClient.fullName}
                    gender={selectedClient.gender}
                  />
                  <h3 className="biodata-name">{selectedClient.fullName}</h3>
                  <p className="biodata-title-meta">
                    {selectedClient.age} yrs • {selectedClient.height} ({selectedClient.heightCm} cm) • {selectedClient.city}
                  </p>
                  <span className={`tag-badge ${selectedClient.stage.toLowerCase().replace(/\s+/g, '-').replace(/\//g, '')}`} style={{ border: '1px solid rgba(255,255,255,0.4)', textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}>
                    {selectedClient.stage}
                  </span>
                </div>

                <div className="biodata-body">
                  <div className="biodata-section">
                    <span className="biodata-section-title">Personal Overview</span>
                    <p style={{ fontSize: '13px', fontStyle: 'italic', lineHeight: '1.4', color: 'var(--text-main)' }}>
                      "{selectedClient.bio}"
                    </p>
                  </div>

                  <div className="biodata-section">
                    <span className="biodata-section-title">Career & Credentials</span>
                    <div className="biodata-fields">
                      <div className="biodata-row"><span className="biodata-label">Occupation:</span><span className="biodata-val">{selectedClient.designation}</span></div>
                      <div className="biodata-row"><span className="biodata-label">Company:</span><span className="biodata-val">{selectedClient.company}</span></div>
                      <div className="biodata-row"><span className="biodata-label">Income:</span><span className="biodata-val">₹{selectedClient.income} LPA</span></div>
                      <div className="biodata-row"><span className="biodata-label">Education:</span><span className="biodata-val">{selectedClient.degree}</span></div>
                      <div className="biodata-row"><span className="biodata-label">College:</span><span className="biodata-val">{selectedClient.college}</span></div>
                    </div>
                  </div>

                  <div className="biodata-section">
                    <span className="biodata-section-title">Social & Astrological</span>
                    <div className="biodata-fields">
                      <div className="biodata-row"><span className="biodata-label">Religion:</span><span className="biodata-val">{selectedClient.religion}</span></div>
                      <div className="biodata-row"><span className="biodata-label">Caste:</span><span className="biodata-val">{selectedClient.caste}</span></div>
                      <div className="biodata-row"><span className="biodata-label">Mother Tongue:</span><span className="biodata-val">{selectedClient.languagesKnown.slice(0,2).join(', ')}</span></div>
                      <div className="biodata-row"><span className="biodata-label">Manglik Status:</span><span className="biodata-val">{selectedClient.manglik}</span></div>
                      <div className="biodata-row"><span className="biodata-label">Family Values:</span><span className="biodata-val">{selectedClient.familyValues}</span></div>
                      <div className="biodata-row"><span className="biodata-label">Siblings:</span><span className="biodata-val">{selectedClient.siblings}</span></div>
                    </div>
                  </div>

                  <div className="biodata-section">
                    <span className="biodata-section-title">Lifestyle Preferences</span>
                    <div className="biodata-fields">
                      <div className="biodata-row"><span className="biodata-label">Diet Lifestyle:</span><span className="biodata-val">{selectedClient.diet}</span></div>
                      <div className="biodata-row"><span className="biodata-label">Smoking habit:</span><span className="biodata-val">{selectedClient.smoke}</span></div>
                      <div className="biodata-row"><span className="biodata-label">Drinking habit:</span><span className="biodata-val">{selectedClient.drink}</span></div>
                      <div className="biodata-row">
                        <span className="biodata-label">Want Children:</span>
                        <span className={`biodata-val ${selectedClient.wantKids === 'Yes' ? 'pref-positive' : selectedClient.wantKids === 'No' ? 'pref-negative' : 'pref-neutral'}`}>
                          {selectedClient.wantKids}
                        </span>
                      </div>
                      <div className="biodata-row">
                        <span className="biodata-label">Relocate:</span>
                        <span className={`biodata-val ${selectedClient.openToRelocate === 'Yes' ? 'pref-positive' : selectedClient.openToRelocate === 'No' ? 'pref-negative' : 'pref-neutral'}`}>
                          {selectedClient.openToRelocate}
                        </span>
                      </div>
                      <div className="biodata-row">
                        <span className="biodata-label">Pet Friendly:</span>
                        <span className={`biodata-val ${selectedClient.openToPets === 'Yes' ? 'pref-positive' : selectedClient.openToPets === 'No' ? 'pref-negative' : 'pref-neutral'}`}>
                          {selectedClient.openToPets}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="biodata-section">
                    <span className="biodata-section-title">Contact Information</span>
                    <div className="biodata-fields">
                      <div className="biodata-row"><span className="biodata-label">Email:</span><span className="biodata-val">{selectedClient.email}</span></div>
                      <div className="biodata-row"><span className="biodata-label">Phone:</span><span className="biodata-val">{selectedClient.phone}</span></div>
                    </div>
                  </div>
                </div>
              </aside>

              {/* Right Column: Matchmaker CRM Workspace */}
              <div className="workspace-card">
                <nav className="workspace-tabs">
                  <button 
                    className={`workspace-tab ${activeDetailTab === 'finder' ? 'active' : ''}`}
                    onClick={() => setActiveDetailTab('finder')}
                  >
                    <Heart size={16} /> Match Finder Pool
                  </button>
                  <button 
                    className={`workspace-tab ${activeDetailTab === 'journey' ? 'active' : ''}`}
                    onClick={() => setActiveDetailTab('journey')}
                  >
                    <Clock size={16} /> Journey Tracker
                  </button>
                  <button 
                    className={`workspace-tab ${activeDetailTab === 'notes' ? 'active' : ''}`}
                    onClick={() => setActiveDetailTab('notes')}
                  >
                    <FileText size={16} /> Meeting Notes ({selectedClient.notes ? selectedClient.notes.length : 0})
                  </button>
                </nav>

                <div className="workspace-content">
                  
                  {/* TAB CONTENT: MATCH FINDER */}
                  {activeDetailTab === 'finder' && (
                    <div className="match-finder-layout">
                      
                      {/* Search & Compatibility Rules Filter */}
                      <div className="matching-pool-controls">
                        <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-heading)' }}>
                          Scoring Heuristic: {selectedClient.gender === 'Male' ? 'Male Client Rules (Younger, shorter, lower income, child views)' : 'Female Client Rules (Profession alignment, values, relocation, diet, horoscope)'}
                        </span>
                        
                        <div className="matching-pool-filters">
                          <select
                            className="pool-filter-select"
                            value={poolFilters.city}
                            onChange={(e) => setPoolFilters({ ...poolFilters, city: e.target.value })}
                          >
                            <option value="All">All Cities</option>
                            {uniqueCities.map(c => <option key={c} value={c}>{c}</option>)}
                          </select>

                          <select
                            className="pool-filter-select"
                            value={poolFilters.religion}
                            onChange={(e) => setPoolFilters({ ...poolFilters, religion: e.target.value })}
                          >
                            <option value="All">All Religions</option>
                            {uniqueReligions.map(r => <option key={r} value={r}>{r}</option>)}
                          </select>

                          <select
                            className="pool-filter-select"
                            value={poolFilters.diet}
                            onChange={(e) => setPoolFilters({ ...poolFilters, diet: e.target.value })}
                          >
                            <option value="All">All Diets</option>
                            {uniqueDiets.map(d => <option key={d} value={d}>{d}</option>)}
                          </select>

                          <select
                            className="pool-filter-select"
                            value={poolFilters.manglik}
                            onChange={(e) => setPoolFilters({ ...poolFilters, manglik: e.target.value })}
                          >
                            <option value="All">Horoscope (Manglik)</option>
                            <option value="No">Non-Manglik</option>
                            <option value="Yes">Manglik</option>
                            <option value="Partial">Partial Manglik</option>
                          </select>

                          <input
                            type="number"
                            className="pool-filter-select"
                            placeholder="Min Age"
                            style={{ width: '80px' }}
                            value={poolFilters.minAge}
                            onChange={(e) => setPoolFilters({ ...poolFilters, minAge: e.target.value })}
                          />
                          <input
                            type="number"
                            className="pool-filter-select"
                            placeholder="Max Age"
                            style={{ width: '80px' }}
                            value={poolFilters.maxAge}
                            onChange={(e) => setPoolFilters({ ...poolFilters, maxAge: e.target.value })}
                          />
                        </div>
                      </div>

                      {/* Active Filter Pills */}
                      {(poolFilters.city !== 'All' || poolFilters.religion !== 'All' || poolFilters.diet !== 'All' || poolFilters.manglik !== 'All' || poolFilters.minAge || poolFilters.maxAge) && (
                        <div className="active-filters-summary">
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Active Filters:</span>
                          {poolFilters.city !== 'All' && <span className="filter-pill">City: {poolFilters.city}</span>}
                          {poolFilters.religion !== 'All' && <span className="filter-pill">Religion: {poolFilters.religion}</span>}
                          {poolFilters.diet !== 'All' && <span className="filter-pill">Diet: {poolFilters.diet}</span>}
                          {poolFilters.manglik !== 'All' && <span className="filter-pill">Manglik: {poolFilters.manglik}</span>}
                          {(poolFilters.minAge || poolFilters.maxAge) && (
                            <span className="filter-pill">Age: {poolFilters.minAge || '24'} - {poolFilters.maxAge || '36'}</span>
                          )}
                          <button className="clear-filters-btn" onClick={clearPoolFilters}>Clear All</button>
                        </div>
                      )}

                      {/* Candidates Pool Scored Results */}
                      {isMatchesLoading ? (
                        <div className="loading-spinner-container" style={{ minHeight: '300px' }}>
                          <div className="spinner" />
                          <span style={{ marginTop: '16px', fontSize: '13px', color: 'var(--text-muted)' }}>Calculating Compatibility Scores...</span>
                        </div>
                      ) : (
                        <div className="matches-list">
                          {getFilteredAndScoredMatches().map(candidate => {
                            const result = candidate.matchResult || { score: 50, reasons: [], matchLevel: 'Moderate' };
                            const scoreColor = result.score >= 82 ? '#10b981' : result.score >= 60 ? '#f59e0b' : '#ef4444';
                            
                            return (
                              <div key={candidate.id} className="match-item-card">
                                <div className="match-avatar-wrapper">
                                  <ProfileAvatar 
                                    className="match-item-avatar" 
                                    src={candidate.photo} 
                                    name={candidate.fullName}
                                    gender={candidate.gender}
                                  />
                                  <span className={`match-gender-indicator ${candidate.gender.toLowerCase()}`}>
                                    {candidate.gender === 'Male' ? 'M' : 'F'}
                                  </span>
                                </div>

                                <div className="match-item-info">
                                  <div className="match-item-name-row">
                                    <span className="match-item-name">{candidate.fullName}</span>
                                    <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                                      {candidate.age} yrs • {candidate.height}
                                    </span>
                                    <span className={`match-tag ${result.matchLevel.toLowerCase()}`}>
                                      {result.matchLevel} Fit
                                    </span>
                                  </div>

                                  <div className="match-details-grid">
                                    <div className="match-info-pill">
                                      <span className="match-info-lbl">Career</span>
                                      <span className="match-info-val">{candidate.designation}</span>
                                    </div>
                                    <div className="match-info-pill">
                                      <span className="match-info-lbl">College</span>
                                      <span className="match-info-val">{candidate.college.split(' ')[0]}</span>
                                    </div>
                                    <div className="match-info-pill">
                                      <span className="match-info-lbl">Income / Location</span>
                                      <span className="match-info-val">₹{candidate.income} LPA • {candidate.city}</span>
                                    </div>
                                    <div className="match-info-pill">
                                      <span className="match-info-lbl">Religion / Caste</span>
                                      <span className="match-info-val">{candidate.religion} / {candidate.caste}</span>
                                    </div>
                                    <div className="match-info-pill">
                                      <span className="match-info-lbl">Diet & Values</span>
                                      <span className="match-info-val">{candidate.diet} • {candidate.familyValues}</span>
                                    </div>
                                    <div className="match-info-pill">
                                      <span className="match-info-lbl">Manglik / Kids</span>
                                      <span className="match-info-val">{candidate.manglik === 'No' ? 'No' : candidate.manglik} • {candidate.wantKids}</span>
                                    </div>
                                  </div>

                                  {/* Dynamic AI Explanation Panel */}
                                  {result.reasons && result.reasons.length > 0 && (
                                    <div className="match-ai-reason">
                                      <Heart size={14} style={{ color: 'var(--primary)', marginTop: '2px', flexShrink: 0 }} fill="currentColor" />
                                      <div>
                                        <strong>AI Fit Analysis: </strong> 
                                        {result.reasons.slice(0, 3).join(' ')}
                                      </div>
                                    </div>
                                  )}

                                  <div className="match-actions-bar">
                                    <button 
                                      className="btn btn-secondary" 
                                      style={{ height: '36px', fontSize: '13px', padding: '0 12px' }}
                                      onClick={() => setCompareCandidate(candidate)}
                                    >
                                      <Eye size={14} /> Compare Side-by-Side
                                    </button>
                                    <button 
                                      className="btn btn-primary" 
                                      style={{ height: '36px', fontSize: '13px', padding: '0 12px' }}
                                      onClick={() => handleOpenSendMatch(candidate)}
                                    >
                                      <Mail size={14} /> Send Match
                                    </button>
                                  </div>
                                </div>

                                {/* Compatibility Circular Chart */}
                                <div className="match-compatibility-score-panel">
                                  <div 
                                    className="score-circle" 
                                    style={{ 
                                      '--score-percent': `${result.score}%`, 
                                      '--score-color': scoreColor 
                                    }}
                                  >
                                    <span className="score-number">{result.score}</span>
                                    <span className="score-percent-label">%</span>
                                  </div>
                                  <span className={`match-score-meta ${result.matchLevel.toLowerCase()}`}>
                                    {result.score}% Match
                                  </span>
                                </div>
                              </div>
                            );
                          })}

                          {getFilteredAndScoredMatches().length === 0 && (
                            <div className="empty-state">
                              <div className="empty-state-icon">⚠️</div>
                              <h3>No matches meet your filter criteria</h3>
                              <p>Try expanding your filter parameters (e.g. changing cities or age caps).</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB CONTENT: JOURNEY TIMELINE TRACKER */}
                  {activeDetailTab === 'journey' && (
                    <div className="journey-timeline-container">
                      <div className="journey-config-card">
                        <h3>Customer Journey Progression</h3>
                        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                          Manage and track where {selectedClient.fullName} is in their matrimonial journey. Advancing stages logs an automatic audit note.
                        </p>

                        {/* Interactive Steps */}
                        <div className="timeline-tracker">
                          {/* Progress Line */}
                          {(() => {
                            const stagesList = ['Onboarding', 'Matchmaking Active', 'First Date Scheduled', 'Feedback Stage', 'Matched / Closed'];
                            const currentIndex = stagesList.indexOf(selectedClient.stage);
                            const widthPercent = currentIndex === -1 ? 0 : (currentIndex / (stagesList.length - 1)) * 100;
                            return (
                              <div 
                                className="timeline-progress-line" 
                                style={{ width: `calc(${widthPercent}% - 40px)` }}
                              />
                            );
                          })()}

                          {[
                            { name: 'Onboarding', num: 1 },
                            { name: 'Matchmaking Active', num: 2 },
                            { name: 'First Date Scheduled', num: 3 },
                            { name: 'Feedback Stage', num: 4 },
                            { name: 'Matched / Closed', num: 5 }
                          ].map((step) => {
                            const stagesList = ['Onboarding', 'Matchmaking Active', 'First Date Scheduled', 'Feedback Stage', 'Matched / Closed'];
                            const clientIndex = stagesList.indexOf(selectedClient.stage);
                            const stepIndex = stagesList.indexOf(step.name);
                            
                            let stepClass = '';
                            if (step.name === selectedClient.stage) {
                              stepClass = 'active';
                            } else if (stepIndex < clientIndex) {
                              stepClass = 'completed';
                            }

                            return (
                              <div 
                                key={step.name} 
                                className={`timeline-step ${stepClass}`}
                                onClick={() => handleUpdateStage(selectedClient.id, step.name)}
                              >
                                <div className="timeline-bullet">
                                  {stepIndex < clientIndex ? <Check size={14} /> : step.num}
                                </div>
                                <span className="timeline-label">{step.name}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div className="journey-config-card" style={{ backgroundColor: 'var(--bg-card)' }}>
                        <h3>Client Preferences Summary</h3>
                        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '8px' }}>
                          This client requests matches with:
                        </p>
                        <ul style={{ paddingLeft: '20px', fontSize: '13px', marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {selectedClient.gender === 'Male' ? (
                            <>
                              <li><strong>Age:</strong> Younger than {selectedClient.age} years old.</li>
                              <li><strong>Height:</strong> Shorter than {selectedClient.height} (180cm).</li>
                              <li><strong>Financials:</strong> Annual salary less than ₹{selectedClient.income} LPA.</li>
                              <li><strong>Children:</strong> Aligned with starting a family (wants "{selectedClient.wantKids}").</li>
                              <li><strong>Diet:</strong> Strict preference for {selectedClient.diet} lifestyle.</li>
                            </>
                          ) : (
                            <>
                              <li><strong>Career:</strong> Partner established in technology or corporate finance sectors.</li>
                              <li><strong>Values:</strong> Matching "{selectedClient.familyValues}" family upbringing.</li>
                              <li><strong>Location:</strong> Located in {selectedClient.city} or open to relocating.</li>
                              <li><strong>Astrological:</strong> Aligned horoscope/Manglik background ({selectedClient.manglik === 'No' ? 'Non-Manglik groom' : 'Manglik groom'}).</li>
                            </>
                          )}
                        </ul>
                      </div>
                    </div>
                  )}

                  {/* TAB CONTENT: MEETING CRM NOTES */}
                  {activeDetailTab === 'notes' && (
                    <div className="notes-container">
                      
                      {/* Form to submit note */}
                      <form onSubmit={handleAddNote} className="new-note-form">
                        <span style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--text-heading)' }}>
                          Record Meeting/Call notes
                        </span>
                        <textarea
                          className="note-textarea"
                          placeholder="Type notes from today's sync or feedback from a recent coffee date..."
                          value={newNoteText}
                          onChange={(e) => setNewNoteText(e.target.value)}
                          required
                        />
                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                          <button type="submit" className="btn btn-primary" style={{ height: '38px', fontSize: '13px' }}>
                            <Plus size={16} /> Add Note to Log
                          </button>
                        </div>
                      </form>

                      {/* Timeline of existing notes */}
                      <div className="notes-timeline">
                        {selectedClient.notes && selectedClient.notes.length > 0 ? (
                          selectedClient.notes.map((note, index) => (
                            <div key={index} className="note-card">
                              <div className="note-header">
                                <span className="note-date">📅 Record Date: {note.date}</span>
                                <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>TDC Staff Sync</span>
                              </div>
                              <p className="note-body">{note.text}</p>
                            </div>
                          ))
                        ) : (
                          <div className="empty-state" style={{ padding: '24px' }}>
                            <p>No meeting or consultation notes logged yet.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                </div>
              </div>
            </div>
          )}


          {/* VIEW: POOL BROWSER DATABASE */}
          {activeView === 'pool' && !selectedClient && (
            <div className="profiles-pool-layout">
              
              {/* Search and Filters for Pool Database */}
              <div className="search-filter-bar">
                <div className="search-input-wrapper">
                  <span className="input-icon"><Search size={18} /></span>
                  <input
                    type="text"
                    className="search-input"
                    placeholder="Search pool by name, college, caste, city..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <select
                  className="filter-select"
                  value={genderFilter}
                  onChange={(e) => setGenderFilter(e.target.value)}
                >
                  <option value="All">All Genders</option>
                  <option value="Male">Male Candidates</option>
                  <option value="Female">Female Candidates</option>
                </select>
                
                <select
                  className="filter-select"
                  value={stageFilter} // Reused for city in database search
                  onChange={(e) => setStageFilter(e.target.value)}
                >
                  <option value="All">All Cities</option>
                  {uniqueCities.map(c => <option key={c} value={c}>{c}</option>)}
                </select>

                {(genderFilter !== 'All' || stageFilter !== 'All' || searchQuery) && (
                  <button className="clear-filters-btn" onClick={() => { setGenderFilter('All'); setStageFilter('All'); setSearchQuery(''); }}>
                    Reset Filters
                  </button>
                )}
              </div>

              {/* Pool Grid */}
              <div className="profile-grid">
                {pool.filter(item => {
                  const matchesSearch = item.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                        item.caste.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                        item.college.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                        item.designation.toLowerCase().includes(searchQuery.toLowerCase());
                  const matchesGender = genderFilter === 'All' || item.gender === genderFilter;
                  const matchesCity = stageFilter === 'All' || item.city === stageFilter;

                  return matchesSearch && matchesGender && matchesCity;
                }).map(item => (
                  <div key={item.id} className="pool-profile-card">
                    <ProfileAvatar 
                      className="pool-profile-avatar" 
                      src={item.photo} 
                      name={item.fullName}
                      gender={item.gender}
                    />
                    <span className="pool-profile-name">{item.fullName}</span>
                    <span className="pool-profile-meta">{item.age} yrs • {item.gender} • {item.city}</span>
                    
                    <div className="pool-profile-details">
                      <div className="pool-profile-detail-item">
                        <span className="pool-profile-detail-label">Occupation</span>
                        <span className="pool-profile-detail-value">{item.designation}</span>
                      </div>
                      <div className="pool-profile-detail-item">
                        <span className="pool-profile-detail-label">College</span>
                        <span className="pool-profile-detail-value">{item.college.split(' ')[0]}</span>
                      </div>
                      <div className="pool-profile-detail-item">
                        <span className="pool-profile-detail-label">Caste / Rel</span>
                        <span className="pool-profile-detail-value">{item.religion} - {item.caste}</span>
                      </div>
                      <div className="pool-profile-detail-item">
                        <span className="pool-profile-detail-label">Income (LPA)</span>
                        <span className="pool-profile-detail-value">₹{item.income} Lakhs</span>
                      </div>
                    </div>
                  </div>
                ))}

                {pool.filter(item => {
                  const matchesSearch = item.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                        item.caste.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                        item.college.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                        item.designation.toLowerCase().includes(searchQuery.toLowerCase());
                  const matchesGender = genderFilter === 'All' || item.gender === genderFilter;
                  const matchesCity = stageFilter === 'All' || item.city === stageFilter;

                  return matchesSearch && matchesGender && matchesCity;
                }).length === 0 && (
                  <div className="empty-state" style={{ gridColumn: '1 / -1' }}>
                    <div className="empty-state-icon">📂</div>
                    <h3>No pool profiles found</h3>
                    <p>Change your query filter combinations and search again.</p>
                  </div>
                )}
              </div>
            </div>
          )}


          {/* VIEW: WORKSPACE CONFIG / SETTINGS */}
          {activeView === 'settings' && !selectedClient && (
            <div className="settings-container">
              <div className="settings-card">
                <div className="settings-header">
                  <h3>AI Content & Rules Engine Settings</h3>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Select how compatibility explanations and proposal email drafts are generated inside the workspace.
                  </p>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Key size={16} /> OpenAI API Secret Key (Optional)
                  </label>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                    Input your OpenAI API key to enable dynamic LLM completions for email intros. If left blank, the portal automatically uses our rich backend heuristic-based natural language generator.
                  </p>
                  <div className="input-wrapper">
                    <span className="input-icon"><Key size={18} /></span>
                    <input
                      type="password"
                      className="form-input"
                      placeholder="sk-..."
                      value={openaiApiKey}
                      onChange={(e) => handleSaveApiKey(e.target.value)}
                    />
                  </div>
                  {openaiApiKey ? (
                    <span style={{ fontSize: '11px', color: 'var(--success)', fontWeight: 'bold', display: 'block', marginTop: '6px' }}>
                      ✓ OpenAI Integration Active (Model: gpt-4o-mini)
                    </span>
                  ) : (
                    <span style={{ fontSize: '11px', color: 'var(--warning)', fontWeight: 'bold', display: 'block', marginTop: '6px' }}>
                      ⚠ Local Natural Language Engine Active (No API Key)
                    </span>
                  )}
                </div>

                <div style={{ marginTop: '24px', padding: '16px', backgroundColor: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-sm)' }}>
                  <h4 style={{ fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <HelpCircle size={16} /> How is the AI used?
                  </h4>
                  <ul style={{ fontSize: '12px', paddingLeft: '20px', marginTop: '8px', lineHeight: '1.6' }}>
                    <li><strong>Scoring Explanation:</strong> Extracts mismatches or strengths on height, income, values, and diet, translating quantitative match vectors into natural language summaries.</li>
                    <li><strong>Email Proposals:</strong> Builds beautiful matching proposals summarizing career achievements, cultural alignments, and lifestyle preferences.</li>
                  </ul>
                </div>
              </div>

              <div className="settings-card">
                <div className="settings-header">
                  <h3>Portal Preferences</h3>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h4 style={{ fontSize: '14px' }}>Visual Display Theme</h4>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Toggle between light and dark backgrounds for the dashboard.</p>
                  </div>
                  <button className="btn btn-secondary" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
                    {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />} 
                    <span>Set {theme === 'dark' ? 'Light' : 'Dark'} Mode</span>
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* --- COMPARISON MODAL --- */}
      {compareCandidate && (
        <div className="modal-overlay" onClick={() => setCompareCandidate(null)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <header className="modal-header">
              <span className="modal-title">Side-by-Side Profile Evaluation</span>
              <button className="modal-close-btn" onClick={() => setCompareCandidate(null)}><X size={20} /></button>
            </header>

            <div className="modal-body">
              <div className="compare-grid">
                
                {/* Client Profile */}
                <div className="compare-col">
                  <div className="compare-profile-header">
                    <ProfileAvatar 
                      className="compare-avatar" 
                      src={selectedClient.photo} 
                      name={selectedClient.fullName}
                      gender={selectedClient.gender}
                    />
                    <span className="compare-name">{selectedClient.fullName}</span>
                    <span className="compare-tagline">Client (Seeker)</span>
                  </div>

                  <div className="comparison-field-row">
                    <span className="comparison-label">Gender:</span>
                    <span className="comparison-val">{selectedClient.gender}</span>
                  </div>
                  <div className="comparison-field-row">
                    <span className="comparison-label">Age:</span>
                    <span className="comparison-val">{selectedClient.age} yrs</span>
                  </div>
                  <div className="comparison-field-row">
                    <span className="comparison-label">Height:</span>
                    <span className="comparison-val">{selectedClient.height} ({selectedClient.heightCm} cm)</span>
                  </div>
                  <div className="comparison-field-row">
                    <span className="comparison-label">Salary:</span>
                    <span className="comparison-val">₹{selectedClient.income} LPA</span>
                  </div>
                  <div className="comparison-field-row">
                    <span className="comparison-label">Occupation:</span>
                    <span className="comparison-val">{selectedClient.designation}</span>
                  </div>
                  <div className="comparison-field-row">
                    <span className="comparison-label">Religion / Caste:</span>
                    <span className="comparison-val">{selectedClient.religion} - {selectedClient.caste}</span>
                  </div>
                  <div className="comparison-field-row">
                    <span className="comparison-label">Values:</span>
                    <span className="comparison-val">{selectedClient.familyValues}</span>
                  </div>
                  <div className="comparison-field-row">
                    <span className="comparison-label">Diet Lifestyle:</span>
                    <span className="comparison-val">{selectedClient.diet}</span>
                  </div>
                  <div className="comparison-field-row">
                    <span className="comparison-label">Horoscope:</span>
                    <span className="comparison-val">{selectedClient.manglik === 'No' ? 'Non-Manglik' : selectedClient.manglik}</span>
                  </div>
                  <div className="comparison-field-row">
                    <span className="comparison-label">Want Children:</span>
                    <span className="comparison-val">{selectedClient.wantKids}</span>
                  </div>
                </div>

                {/* Candidate Profile */}
                <div className="compare-col" style={{ borderLeft: '1px solid var(--border-color)' }}>
                  <div className="compare-profile-header">
                    <ProfileAvatar 
                      className="compare-avatar" 
                      src={compareCandidate.photo} 
                      name={compareCandidate.fullName}
                      gender={compareCandidate.gender}
                    />
                    <span className="compare-name">{compareCandidate.fullName}</span>
                    <span className="compare-tagline">Candidate ({calculateCompatibility(selectedClient, compareCandidate).score}% Compatibility)</span>
                  </div>

                  {(() => {
                    const compatibility = calculateCompatibility(selectedClient, compareCandidate);
                    
                    const isMale = selectedClient.gender === 'Male';
                    const ageMatch = isMale ? (compareCandidate.age < selectedClient.age) : true;
                    const heightMatch = isMale ? (compareCandidate.heightCm < selectedClient.heightCm) : true;
                    const incomeMatch = isMale ? (compareCandidate.income < selectedClient.income) : true;
                    const childMatch = selectedClient.wantKids === compareCandidate.wantKids || selectedClient.wantKids === 'Maybe' || compareCandidate.wantKids === 'Maybe';
                    const religionMatch = selectedClient.religion === compareCandidate.religion;
                    const dietMatch = selectedClient.diet === compareCandidate.diet;
                    const valuesMatch = selectedClient.familyValues === compareCandidate.familyValues;
                    
                    return (
                      <>
                        <div className="comparison-field-row">
                          <span className="comparison-label">Gender:</span>
                          <span className="comparison-val">{compareCandidate.gender}</span>
                        </div>
                        <div className="comparison-field-row">
                          <span className="comparison-label">Age:</span>
                          <span className={`comparison-val ${ageMatch ? 'match' : 'mismatch'}`}>
                            {compareCandidate.age} yrs {isMale && (ageMatch ? '(Younger ✓)' : '(Older ⚠)')}
                          </span>
                        </div>
                        <div className="comparison-field-row">
                          <span className="comparison-label">Height:</span>
                          <span className={`comparison-val ${heightMatch ? 'match' : 'mismatch'}`}>
                            {compareCandidate.height} ({compareCandidate.heightCm} cm) {isMale && (heightMatch ? '(Shorter ✓)' : '(Taller ⚠)')}
                          </span>
                        </div>
                        <div className="comparison-field-row">
                          <span className="comparison-label">Salary:</span>
                          <span className={`comparison-val ${incomeMatch ? 'match' : 'mismatch'}`}>
                            ₹{compareCandidate.income} LPA {isMale && (incomeMatch ? '(Earns Less ✓)' : '(Earns More ⚠)')}
                          </span>
                        </div>
                        <div className="comparison-field-row">
                          <span className="comparison-label">Occupation:</span>
                          <span className="comparison-val">{compareCandidate.designation}</span>
                        </div>
                        <div className="comparison-field-row">
                          <span className="comparison-label">Religion / Caste:</span>
                          <span className={`comparison-val ${religionMatch ? 'match' : ''}`}>
                            {compareCandidate.religion} - {compareCandidate.caste} {religionMatch ? '(Same ✓)' : '(Different)'}
                          </span>
                        </div>
                        <div className="comparison-field-row">
                          <span className="comparison-label">Values:</span>
                          <span className={`comparison-val ${valuesMatch ? 'match' : ''}`}>
                            {compareCandidate.familyValues} {valuesMatch ? '(Aligned ✓)' : ''}
                          </span>
                        </div>
                        <div className="comparison-field-row">
                          <span className="comparison-label">Diet Lifestyle:</span>
                          <span className={`comparison-val ${dietMatch ? 'match' : 'mismatch'}`}>
                            {compareCandidate.diet} {dietMatch ? '(Aligned ✓)' : '(Conflict)'}
                          </span>
                        </div>
                        <div className="comparison-field-row">
                          <span className="comparison-label">Horoscope:</span>
                          <span className="comparison-val">{compareCandidate.manglik === 'No' ? 'Non-Manglik' : compareCandidate.manglik}</span>
                        </div>
                        <div className="comparison-field-row">
                          <span className="comparison-label">Want Children:</span>
                          <span className={`comparison-val ${childMatch ? 'match' : 'mismatch'}`}>
                            {compareCandidate.wantKids} {childMatch ? '(Aligned ✓)' : '(Conflict)'}
                          </span>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* Fit Description */}
              <div className="match-ai-reason mt-16" style={{ width: '100%' }}>
                <Heart size={16} style={{ color: 'var(--primary)', flexShrink: 0 }} fill="currentColor" />
                <div>
                  <strong>Matchmaker Fit Notes: </strong>
                  {calculateCompatibility(selectedClient, compareCandidate).reasons.join(' ')}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                <button className="btn btn-secondary" onClick={() => setCompareCandidate(null)}>Close View</button>
                <button 
                  className="btn btn-primary" 
                  onClick={() => {
                    const c = compareCandidate;
                    setCompareCandidate(null);
                    handleOpenSendMatch(c);
                  }}
                >
                  <Mail size={16} /> Send Match Suggestion
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- SEND MATCH PROPOSAL MODAL --- */}
      {sendMatchCandidate && (
        <div className="modal-overlay" onClick={() => setSendMatchCandidate(null)}>
          <div className="modal-container" style={{ maxWidth: '640px' }} onClick={(e) => e.stopPropagation()}>
            <header className="modal-header">
              <span className="modal-title">Email Proposal Draft</span>
              <button className="modal-close-btn" onClick={() => setSendMatchCandidate(null)}><X size={20} /></button>
            </header>

            <div className="modal-body">
              <div className="send-match-layout">
                <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                  This draft will be sent to <strong>{selectedClient.email}</strong> proposing <strong>{sendMatchCandidate.fullName}</strong>. Review and customize the content below.
                </p>

                {isGeneratingEmail ? (
                  <div className="loading-spinner-container" style={{ minHeight: '200px' }}>
                    <div className="spinner" />
                  </div>
                ) : (
                  <div className="ai-intro-container">
                    <span className="ai-intro-badge">
                      <Heart size={10} fill="currentColor" className="mr-8" />
                      {openaiApiKey ? 'OpenAI GPT-4o-mini' : 'Local NLG Engine'}
                    </span>
                    <textarea 
                      className="ai-intro-text"
                      value={emailIntro}
                      onChange={(e) => setEmailIntro(e.target.value)}
                      style={{ 
                        border: 'none', 
                        background: 'transparent', 
                        width: '100%', 
                        outline: 'none',
                        resize: 'vertical',
                        paddingTop: '20px'
                      }}
                    />
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
                  <button 
                    className="ai-regenerate-btn"
                    disabled={isGeneratingEmail}
                    onClick={() => handleOpenSendMatch(sendMatchCandidate)}
                  >
                    <RefreshCw size={14} className={isGeneratingEmail ? 'spinner' : ''} /> Regenerate Draft
                  </button>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button className="btn btn-secondary" onClick={() => setSendMatchCandidate(null)}>Discard</button>
                    <button className="btn btn-primary" onClick={handleSendMockEmail} disabled={isGeneratingEmail}>
                      <Mail size={16} /> Send Mock Email Invite
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default App;
