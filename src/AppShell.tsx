import React, { useState, useEffect } from 'react';
import { Logo } from './components/Logo';
import { Home, PlusCircle, List, Settings as SettingsIcon, Package, Wallet, LogOut, History, Sun, Moon, Coins, Sparkles, Shield, RotateCw } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import AddEntry from './pages/AddEntry';
import Reports from './pages/Reports';
import SettingsPage from './pages/Settings';
import AddExpense from './pages/AddExpense';
import HistoryLogs from './pages/HistoryLogs';
import { auth } from './lib/firebase';
import { StoreProvider, isUserAdminOrOwner, setCurrentUserRole, setCurrentFranchiseId } from './store';
import { signOut } from 'firebase/auth';
import { useTheme } from './context/ThemeContext';
import { useFranchise } from './context/FranchiseContext';
import { motion } from 'motion/react';
import SyncStatus from './components/SyncStatus';
import SuperAdmin from './pages/SuperAdmin';

function AppShellContent() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  const { profile, franchise, switchFranchise } = useFranchise();
  const userEmail = auth.currentUser?.email || '';
  const username = userEmail.split('@')[0].toLowerCase();
  const role = profile?.role === 'superadmin' ? 'superadmin' : ((profile?.role === 'owner' || profile?.role === 'manager') ? 'owner' : 'staff');
  const navRole = (role === 'superadmin' && franchise) ? 'owner' : role;
  useEffect(() => {
    setCurrentUserRole(role === 'owner' ? 'owner' : 'staff');
    
  }, [role]);

  const [activeTab, setActiveTab] = useState<'dashboard' | 'add' | 'expense' | 'reports' | 'settings' | 'logs' | 'superadmin'>(() => {
    try {
      const isFreshLogin = sessionStorage.getItem('just_logged_in') === 'true';
      if (isFreshLogin) {
        sessionStorage.removeItem('just_logged_in');
        sessionStorage.removeItem('namma_active_tab');
        localStorage.removeItem('namma_active_tab');
        sessionStorage.removeItem('namma_edit_date');
        return role === 'superadmin' ? 'superadmin' : (role === 'owner' ? 'dashboard' : 'reports');
      }

      const lastUser = sessionStorage.getItem('namma_logged_user');
      if (!lastUser || lastUser !== userEmail) {
        sessionStorage.setItem('namma_logged_user', userEmail);
        sessionStorage.removeItem('namma_active_tab');
        localStorage.removeItem('namma_active_tab');
        sessionStorage.removeItem('namma_edit_date');
        return role === 'superadmin' ? 'superadmin' : (role === 'owner' ? 'dashboard' : 'reports');
      }

      const saved = sessionStorage.getItem('namma_active_tab');
      const validTabs = ['dashboard', 'add', 'expense', 'reports', 'settings', 'logs', 'superadmin'];
      if (saved && validTabs.includes(saved)) {
        if (role === 'staff') {
          if (saved === 'settings' || saved === 'logs' || saved === 'superadmin' || saved === 'dashboard' || saved === 'expense') {
            return 'reports';
          }
        }
        if (saved === 'superadmin' && role !== 'superadmin') {
          return role === 'owner' ? 'dashboard' : 'reports';
        }
        return saved as any;
      }
    } catch {}
    return role === 'superadmin' ? 'superadmin' : (role === 'owner' ? 'dashboard' : 'reports');
  });

  useEffect(() => {
    if (role === 'staff' && (activeTab === 'dashboard' || activeTab === 'expense' || activeTab === 'logs' || activeTab === 'superadmin')) {
      setActiveTab('reports');
    }
  }, [role, activeTab]);

  useEffect(() => {
    try {
      sessionStorage.setItem('namma_active_tab', activeTab);
      localStorage.setItem('namma_active_tab', activeTab);
    } catch {}
  }, [activeTab]);

  useEffect(() => {
    const mainContainer = document.querySelector('main');
    if (mainContainer) mainContainer.scrollTo(0, 0);
  }, [activeTab]);

  const [editDate, setEditDate] = useState<string | undefined>(() => {
    try {
      return sessionStorage.getItem('namma_edit_date') || undefined;
    } catch {
      return undefined;
    }
  });

  useEffect(() => {
    try {
      if (editDate) {
        sessionStorage.setItem('namma_edit_date', editDate);
      } else {
        sessionStorage.removeItem('namma_edit_date');
      }
    } catch {}
  }, [editDate]);

  const [editExpense, setEditExpense] = useState<any>(undefined);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefreshPage = () => {
    if (isRefreshing) return;
    setIsRefreshing(true);

    try {
      sessionStorage.setItem('namma_active_tab', activeTab);
      localStorage.setItem('namma_active_tab', activeTab);
      if (editDate) {
        sessionStorage.setItem('namma_edit_date', editDate);
      } else {
        sessionStorage.removeItem('namma_edit_date');
      }
    } catch (e) {
      console.warn('Could not save tab state to storage:', e);
    }

    try {
      window.dispatchEvent(new CustomEvent('app-data-updated', { detail: { type: 'refresh' } }));
    } catch {}

    // Reload with latest data
    setTimeout(() => {
      window.location.reload();
    }, 200);
  };
  
  const handleEditEntry = (date: string) => {
    setEditDate(date);
    setActiveTab('add');
  };

  const handleEditExpense = (expense: any) => {
    setEditExpense(expense);
    setActiveTab('expense');
  };

  const navigateTab = (tab: 'dashboard' | 'add' | 'expense' | 'reports' | 'settings' | 'logs' | 'superadmin') => {
    if (tab !== 'add') {
      setEditDate(undefined);
    }
    if (tab === 'superadmin' && switchFranchise) {
      switchFranchise('superadmin');
    }
    setActiveTab(tab);
    const mainContainer = document.querySelector('main');
    if (mainContainer) mainContainer.scrollTo(0, 0);
  };

  const handleLogout = async () => {
    try {
      sessionStorage.removeItem('namma_active_tab');
      localStorage.removeItem('namma_active_tab');
      sessionStorage.removeItem('namma_edit_date');
      sessionStorage.removeItem('namma_logged_user');
      localStorage.removeItem('namma_logged_user');
      sessionStorage.removeItem('just_logged_in');
    } catch {}
    await signOut(auth);
  };

  return (
    <div className={`flex flex-col h-screen font-sans overflow-hidden transition-colors duration-300 ${
      isDark ? 'bg-[#0B0F19] text-slate-200' : 'bg-[#F1F5F9] text-slate-800'
    }`}>
      <header className={`px-4 sm:px-6 py-4 sm:py-5 sticky top-0 z-10 flex justify-between items-center backdrop-blur-md transition-all duration-300 border-b ${
        isDark 
          ? 'bg-[#0B0F19]/90 border-slate-800/60' 
          : 'bg-white border-slate-300 shadow-md shadow-slate-100'
      }`}>
        <div className="flex items-center gap-2 sm:gap-3">
          <Logo className={`w-8 h-8 sm:w-10 sm:h-10 transition-all ${
            isDark ? 'shadow-lg shadow-cyan-500/20' : 'shadow-md shadow-cyan-500/10'
          }`} />
          <div className="flex flex-col">
            <span className={`text-[8px] sm:text-[10px] font-bold tracking-[0.15em] sm:tracking-[0.2em] uppercase mb-0.5 sm:mb-1 ${
              isDark ? 'text-cyan-400' : 'text-cyan-600'
            }`}>{franchise?.name || 'Franchise'}</span>
            <h1 className={`text-lg sm:text-2xl font-black tracking-tighter leading-none uppercase ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}>Namma Ooru <span className="text-pink-500">Kulfi</span></h1>
          </div>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-3">
          {role === 'superadmin' && activeTab !== 'superadmin' && (
            <button 
              onClick={() => navigateTab('superadmin')}
              className={`transition-colors p-1.5 px-3 rounded-lg border font-bold text-[10px] uppercase tracking-widest flex items-center gap-1 ${
                isDark 
                  ? 'border-cyan-800 text-cyan-400 bg-cyan-950/30 hover:bg-cyan-900/50' 
                  : 'border-cyan-300 text-cyan-700 bg-cyan-50 hover:bg-cyan-100 shadow-sm'
              }`}
            >
              <Shield className="w-3.5 h-3.5" /> Exit
            </button>
          )}
          <SyncStatus />
          <button 
            id="refresh-page-btn"
            onClick={handleRefreshPage} 
            disabled={isRefreshing}
            className={`transition-all duration-200 p-1.5 px-2 sm:px-2.5 rounded-lg border flex items-center gap-1.5 cursor-pointer select-none active:scale-95 ${
              isRefreshing
                ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-400 shadow-sm shadow-cyan-500/20'
                : isDark 
                  ? 'border-slate-800 text-cyan-400 hover:text-cyan-300 hover:bg-slate-900/50 bg-slate-900/40 shadow-sm' 
                  : 'border-slate-300 text-cyan-700 hover:text-cyan-800 hover:bg-slate-100 bg-white shadow-sm'
            }`}
            title="Reload page with latest data"
            aria-label="Reload page with latest data"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-cyan-400' : ''}`} />
            <span className="hidden sm:inline font-bold text-[10px] uppercase tracking-wider">
              {isRefreshing ? 'Reloading...' : 'Refresh'}
            </span>
          </button>
          <button 
            onClick={toggleTheme} 
            className={`transition-colors p-1.5 rounded-lg border ${
              isDark 
                ? 'border-slate-800 text-cyan-400 hover:text-cyan-300 hover:bg-slate-900/50' 
                : 'border-slate-300 text-pink-600 hover:text-pink-700 hover:bg-slate-100 bg-white shadow-sm'
            }`}
            title={isDark ? "Day Mode" : "Night Mode"}
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          {role === 'superadmin' && (
          <NavItem 
            icon={<SettingsIcon className="w-5 h-5" />} 
            label="Admin" 
            active={activeTab === 'superadmin'} 
            onClick={() => navigateTab('superadmin')} 
            isDark={isDark}
          />
        )}
        {role === 'owner' && (
            <button 
              onClick={() => navigateTab('logs')} 
              className={`transition-colors p-1.5 rounded-lg ${
                activeTab === 'logs' 
                  ? 'text-cyan-400 bg-cyan-950/20' 
                  : isDark 
                    ? 'text-slate-400 hover:text-white hover:bg-slate-900/50' 
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              <History className="w-4.5 h-4.5" />
            </button>
          )}
          <button 
            onClick={handleLogout} 
            className={`transition-colors p-1.5 rounded-lg ${
              isDark 
                ? 'text-slate-400 hover:text-white hover:bg-slate-900/50' 
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
            title="Log Out"
          >
            <LogOut className="w-4.5 h-4.5" />
          </button>
        </div>
      </header>
      
      <main className="flex-1 overflow-y-auto overflow-x-hidden pb-24">
        {activeTab === 'dashboard' && navRole === 'owner' && <Dashboard onNavigateToEntry={handleEditEntry} />}
        {activeTab === 'add' && <AddEntry onSave={() => navigateTab('reports')} onCancel={() => navigateTab('reports')} initialDate={editDate} key={editDate || 'new'} />}
        {activeTab === 'expense' && navRole === 'owner' && <AddExpense onSave={() => { setEditExpense(undefined); navigateTab(navRole === 'owner' ? 'dashboard' : 'add'); }} onCancel={() => { setEditExpense(undefined); navigateTab(navRole === 'owner' ? 'dashboard' : 'add'); }} initialExpense={editExpense} />}
        {activeTab === 'reports' && <Reports role={navRole as any} onEdit={handleEditEntry} onEditExpense={handleEditExpense} />}
        {activeTab === 'settings' && <SettingsPage role={navRole as any} />}
        {activeTab === 'logs' && navRole === 'owner' && <HistoryLogs />}
        {activeTab === 'superadmin' && role === 'superadmin' && <SuperAdmin onNavigate={(tab) => navigateTab(tab as any)} />}
      </main>

      <nav className={`fixed bottom-0 w-full pb-safe flex justify-around items-center h-20 px-2 pb-4 pt-2 z-20 transition-all duration-300 border-t ${
        isDark 
          ? 'bg-[#111827]/95 border-slate-800 backdrop-blur-xl shadow-[0_-10px_40px_rgba(0,0,0,0.5)]' 
          : 'bg-white border-slate-300 shadow-[0_-4px_24px_rgba(15,23,42,0.1)]'
      }`}>
        {role === 'superadmin' && (
          <NavItem 
            icon={<Shield className="w-5 h-5" />} 
            label="S-Admin" 
            active={activeTab === 'superadmin'} 
            onClick={() => navigateTab('superadmin')} 
            isDark={isDark}
          />
        )}
        {navRole === 'owner' && (
          <NavItem 
            icon={<Home className="w-5 h-5" />} 
            label="Home" 
            active={activeTab === 'dashboard'} 
            onClick={() => navigateTab('dashboard')} 
            isDark={isDark}
          />
        )}
        {navRole !== 'superadmin' && <NavItem 
          icon={<PlusCircle className="w-5 h-5" />} 
          label="Job" 
          active={activeTab === 'add'} 
          onClick={() => navigateTab('add')} 
          isDark={isDark}
        />}
        {navRole === 'owner' && (
          <NavItem 
            icon={<Wallet className="w-5 h-5" />} 
            label="EXP" 
            active={activeTab === 'expense'} 
            onClick={() => navigateTab('expense')} 
            isDark={isDark}
          />
        )}
        {navRole !== 'superadmin' && <NavItem 
          icon={<List className="w-5 h-5" />} 
          label="REC" 
          active={activeTab === 'reports'} 
          onClick={() => navigateTab('reports')} 
          isDark={isDark}
        />}
        {navRole !== 'superadmin' && <NavItem 
          icon={navRole === 'owner' ? <SettingsIcon className="w-5 h-5" /> : <Package className="w-5 h-5" />} 
          label={navRole === 'owner' ? "Admin" : "Inv"} 
          active={activeTab === 'settings'} 
          onClick={() => navigateTab('settings')} 
          isDark={isDark}
        />}
      </nav>
    </div>
  );
}

function NavItem({ icon, label, active, onClick, isDark }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void, isDark: boolean }) {
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center justify-center w-full h-full space-y-1.5 transition-all duration-300 ${
        active 
          ? isDark 
            ? 'text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)] scale-110' 
            : 'text-pink-600 font-extrabold drop-shadow-[0_2px_8px_rgba(219,39,119,0.3)] scale-110' 
          : isDark 
            ? 'text-slate-500 hover:text-slate-300' 
            : 'text-slate-500 hover:text-slate-800 font-bold'
      }`}
    >
      {icon}
      <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
    </button>
  );
}



export default function AppShell() {
  const { profile, franchise } = useFranchise();
  
  let activeFid = franchise?.id || profile?.franchiseId || null;
  if (profile?.role === 'superadmin' && !franchise) {
    activeFid = 'all';
  }

  setCurrentFranchiseId(activeFid);

  return (
    <StoreProvider franchiseId={activeFid}>
      <AppShellContent />
    </StoreProvider>
  );
}
