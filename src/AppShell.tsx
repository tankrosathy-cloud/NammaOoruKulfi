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
import { isDateInMonth } from './lib/utils';

function AppShellContent() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  const { profile, franchise, switchFranchise } = useFranchise();
  const userEmail = auth.currentUser?.email || '';
  const username = userEmail.split('@')[0].toLowerCase();
  const baseRole = profile?.role === 'superadmin' ? 'superadmin' : ((profile?.role === 'owner' || profile?.role === 'manager') ? 'owner' : 'staff');

  // Role-Based Interface Mode: Allows owners to toggle into clean Staff Mode
  const [viewMode, setViewMode] = useState<'owner' | 'staff'>(() => {
    try {
      const saved = localStorage.getItem('namma_view_mode');
      if (saved === 'owner' || saved === 'staff') return saved;
    } catch {}
    return 'owner';
  });

  const toggleViewMode = (mode: 'owner' | 'staff') => {
    setViewMode(mode);
    try {
      localStorage.setItem('namma_view_mode', mode);
    } catch {}
  };

  // If actual account is staff, force staff mode. Otherwise follow user's chosen viewMode.
  const effectiveRole: 'owner' | 'staff' = (baseRole === 'staff') ? 'staff' : viewMode;
  const navRole = (baseRole === 'superadmin' && !franchise) ? 'superadmin' : effectiveRole;

  useEffect(() => {
    setCurrentUserRole(effectiveRole);
  }, [effectiveRole]);

  const [activeTab, setActiveTab] = useState<'dashboard' | 'add' | 'expense' | 'reports' | 'settings' | 'logs' | 'superadmin'>(() => {
    try {
      const isFreshLogin = sessionStorage.getItem('just_logged_in') === 'true';
      if (isFreshLogin) {
        sessionStorage.removeItem('just_logged_in');
        sessionStorage.removeItem('namma_active_tab');
        localStorage.removeItem('namma_active_tab');
        sessionStorage.removeItem('namma_edit_date');
        return baseRole === 'superadmin' ? 'superadmin' : (effectiveRole === 'owner' ? 'dashboard' : 'reports');
      }

      const lastUser = sessionStorage.getItem('namma_logged_user');
      if (!lastUser || lastUser !== userEmail) {
        sessionStorage.setItem('namma_logged_user', userEmail);
        sessionStorage.removeItem('namma_active_tab');
        localStorage.removeItem('namma_active_tab');
        sessionStorage.removeItem('namma_edit_date');
        return baseRole === 'superadmin' ? 'superadmin' : (effectiveRole === 'owner' ? 'dashboard' : 'reports');
      }

      const saved = sessionStorage.getItem('namma_active_tab');
      const validTabs = ['dashboard', 'add', 'expense', 'reports', 'settings', 'logs', 'superadmin'];
      if (saved && validTabs.includes(saved)) {
        if (effectiveRole === 'staff') {
          if (saved === 'settings' || saved === 'logs' || saved === 'superadmin' || saved === 'dashboard' || saved === 'expense') {
            return 'reports';
          }
        }
        if (saved === 'superadmin' && baseRole !== 'superadmin') {
          return effectiveRole === 'owner' ? 'dashboard' : 'reports';
        }
        return saved as any;
      }
    } catch {}
    return baseRole === 'superadmin' ? 'superadmin' : (effectiveRole === 'owner' ? 'dashboard' : 'reports');
  });

  useEffect(() => {
    if (effectiveRole === 'staff' && (activeTab === 'dashboard' || activeTab === 'expense' || activeTab === 'logs' || activeTab === 'superadmin')) {
      setActiveTab('reports');
    }
  }, [effectiveRole, activeTab]);

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
    if (navRole !== 'owner' && !isDateInMonth(date, new Date())) {
      return;
    }
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
      <header className={`px-2.5 sm:px-6 py-2.5 sm:py-5 sticky top-0 z-10 flex justify-between items-center backdrop-blur-md transition-all duration-300 border-b ${
        isDark 
          ? 'bg-[#0B0F19]/90 border-slate-800/60' 
          : 'bg-white border-slate-300 shadow-md shadow-slate-100'
      }`}>
        <div className="flex items-center gap-1.5 sm:gap-3 min-w-0 shrink">
          <Logo className={`w-7 h-7 sm:w-10 sm:h-10 shrink-0 transition-all ${
            isDark ? 'shadow-lg shadow-cyan-500/20' : 'shadow-md shadow-cyan-500/10'
          }`} />
          <div className="flex flex-col min-w-0">
            <span className={`text-[7px] sm:text-[10px] font-bold tracking-wider uppercase truncate leading-none mb-0.5 ${
              isDark ? 'text-cyan-400' : 'text-cyan-600'
            }`}>{franchise?.name || 'Franchise'}</span>
            <h1 className={`text-xs xs:text-sm sm:text-2xl font-black tracking-tight leading-none uppercase truncate ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}>Namma Ooru <span className="text-pink-500">Kulfi</span></h1>
          </div>
        </div>
        <div className="flex items-center gap-1 sm:gap-2.5 shrink-0">
          {/* Owner vs Staff Mode Switcher for Owners/Managers */}
          {baseRole !== 'staff' && (
            <div className="flex items-center shrink-0">
              <div className="hidden sm:inline-flex p-0.5 rounded-xl bg-slate-200/90 dark:bg-slate-800/90 border border-slate-300/80 dark:border-slate-700 shadow-inner">
                <button
                  type="button"
                  id="viewmode-owner-toggle"
                  onClick={() => toggleViewMode('owner')}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                    effectiveRole === 'owner'
                      ? 'bg-white dark:bg-slate-900 text-cyan-600 dark:text-cyan-400 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                  title="Owner Mode: Full financial controls & profit withdrawals"
                >
                  👔 Owner
                </button>
                <button
                  type="button"
                  id="viewmode-staff-toggle"
                  onClick={() => toggleViewMode('staff')}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                    effectiveRole === 'staff'
                      ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                  title="Staff Mode: Clean counter interface (sensitive profit & margins hidden)"
                >
                  🧑‍🍳 Staff
                </button>
              </div>

              {/* Mobile View Mode Button */}
              <button
                type="button"
                id="viewmode-mobile-toggle"
                onClick={() => toggleViewMode(effectiveRole === 'owner' ? 'staff' : 'owner')}
                className={`sm:hidden h-7 px-1.5 rounded-lg border font-black text-[9px] uppercase tracking-wider flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0 transition-colors ${
                  effectiveRole === 'staff'
                    ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-700 dark:text-emerald-300 shadow-sm'
                    : isDark 
                      ? 'border-slate-800 text-cyan-400 bg-slate-900/40' 
                      : 'border-slate-300 text-cyan-700 bg-white shadow-sm'
                }`}
                title={`Currently in ${effectiveRole === 'owner' ? 'Owner' : 'Staff'} Mode. Tap to switch.`}
              >
                <span>{effectiveRole === 'owner' ? '👔' : '🧑‍🍳'}</span>
                <span>{effectiveRole === 'owner' ? 'Owner' : 'Staff'}</span>
              </button>
            </div>
          )}

          {baseRole === 'superadmin' && activeTab !== 'superadmin' && (
            <button 
              onClick={() => navigateTab('superadmin')}
              className={`transition-colors h-7 sm:h-auto p-1 sm:p-1.5 px-2 sm:px-3 rounded-lg border font-bold text-[9px] sm:text-[10px] uppercase tracking-widest flex items-center gap-1 shrink-0 ${
                isDark 
                  ? 'border-cyan-800 text-cyan-400 bg-cyan-950/30 hover:bg-cyan-900/50' 
                  : 'border-cyan-300 text-cyan-700 bg-cyan-50 hover:bg-cyan-100 shadow-sm'
              }`}
            >
              <Shield className="w-3.5 h-3.5" /> <span className="hidden xs:inline">Exit</span>
            </button>
          )}

          <SyncStatus />

          <button 
            id="refresh-page-btn"
            onClick={handleRefreshPage} 
            disabled={isRefreshing}
            className={`transition-all duration-200 h-7 sm:h-auto w-7 sm:w-auto p-1.5 sm:px-2.5 rounded-lg border flex items-center justify-center gap-1.5 cursor-pointer select-none active:scale-95 shrink-0 ${
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
            className={`transition-colors h-7 w-7 sm:h-auto sm:w-auto p-1.5 sm:p-2 rounded-lg border flex items-center justify-center shrink-0 ${
              isDark 
                ? 'border-slate-800 text-cyan-400 hover:text-cyan-300 hover:bg-slate-900/50' 
                : 'border-slate-300 text-pink-600 hover:text-pink-700 hover:bg-slate-100 bg-white shadow-sm'
            }`}
            title={isDark ? "Day Mode" : "Night Mode"}
          >
            {isDark ? <Sun className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Moon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
          </button>

          {baseRole === 'superadmin' && (
            <NavItem 
              icon={<SettingsIcon className="w-5 h-5" />} 
              label="Admin" 
              active={activeTab === 'superadmin'} 
              onClick={() => navigateTab('superadmin')} 
              isDark={isDark}
            />
          )}

          {navRole === 'owner' && (
            <button 
              id="header-logs-btn"
              onClick={() => navigateTab('logs')} 
              className={`transition-colors h-7 w-7 sm:h-auto sm:w-auto p-1.5 sm:p-2 rounded-lg border flex items-center justify-center shrink-0 ${
                activeTab === 'logs' 
                  ? 'border-cyan-500/40 text-cyan-400 bg-cyan-950/30' 
                  : isDark 
                    ? 'border-slate-800 text-slate-400 hover:text-white hover:bg-slate-900/50' 
                    : 'border-slate-300 text-slate-500 hover:text-slate-800 hover:bg-slate-100 bg-white shadow-sm'
              }`}
              title="Activity Logs & History"
            >
              <History className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          )}

          <button 
            id="header-logout-btn"
            onClick={handleLogout} 
            className={`transition-colors h-7 w-7 sm:h-auto sm:w-auto p-1.5 sm:p-2 rounded-lg border flex items-center justify-center shrink-0 ${
              isDark 
                ? 'border-slate-800 text-slate-400 hover:text-rose-400 hover:border-rose-500/40 hover:bg-rose-950/20' 
                : 'border-slate-300 text-slate-500 hover:text-rose-600 hover:border-rose-300 hover:bg-rose-50 bg-white shadow-sm'
            }`}
            title="Log Out"
            aria-label="Log Out"
          >
            <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>
      </header>

      {/* Staff Mode Notice Banner for Owners Previewing Staff Experience */}
      {baseRole !== 'staff' && effectiveRole === 'staff' && (
        <div className="bg-emerald-500/15 border-b border-emerald-500/25 px-4 py-2 text-xs text-emerald-900 dark:text-emerald-200 flex items-center justify-between font-bold z-10 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-sm">🧑‍🍳</span>
            <span><strong>Staff Counter Mode Active:</strong> Profit withdrawals, retained earnings, and admin controls are hidden.</span>
          </div>
          <button
            type="button"
            id="exit-staff-view-banner-btn"
            onClick={() => toggleViewMode('owner')}
            className="text-[10px] font-black uppercase px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors cursor-pointer shrink-0 ml-3 shadow-sm active:scale-95"
          >
            Exit to Owner
          </button>
        </div>
      )}
      
      <main className="flex-1 overflow-y-auto overflow-x-hidden pb-24">
        {activeTab === 'dashboard' && navRole === 'owner' && <Dashboard onNavigateToEntry={handleEditEntry} />}
        {activeTab === 'add' && <AddEntry role={navRole as any} onSave={() => navigateTab('reports')} onCancel={() => navigateTab('reports')} initialDate={editDate} key={editDate || 'new'} />}
        {activeTab === 'expense' && navRole === 'owner' && <AddExpense onSave={() => { setEditExpense(undefined); navigateTab(navRole === 'owner' ? 'dashboard' : 'add'); }} onCancel={() => { setEditExpense(undefined); navigateTab(navRole === 'owner' ? 'dashboard' : 'add'); }} initialExpense={editExpense} />}
        {activeTab === 'reports' && <Reports role={navRole as any} onEdit={handleEditEntry} onEditExpense={handleEditExpense} />}
        {activeTab === 'settings' && <SettingsPage role={navRole as any} />}
        {activeTab === 'logs' && navRole === 'owner' && <HistoryLogs />}
        {activeTab === 'superadmin' && baseRole === 'superadmin' && <SuperAdmin onNavigate={(tab) => navigateTab(tab as any)} />}
      </main>

      <nav className={`fixed bottom-0 w-full pb-safe flex justify-around items-center h-20 px-2 pb-4 pt-2 z-20 transition-all duration-300 border-t ${
        isDark 
          ? 'bg-[#111827]/95 border-slate-800 backdrop-blur-xl shadow-[0_-10px_40px_rgba(0,0,0,0.5)]' 
          : 'bg-white border-slate-300 shadow-[0_-4px_24px_rgba(15,23,42,0.1)]'
      }`}>
        {baseRole === 'superadmin' && !franchise && (
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
          label={navRole === 'owner' ? "Admin" : "Stock"} 
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
