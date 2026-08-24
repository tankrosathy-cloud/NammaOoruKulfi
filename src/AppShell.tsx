import React, { useState, useEffect } from 'react';
import { Logo } from './components/Logo';
import { Home, PlusCircle, List, Settings as SettingsIcon, Package, Wallet, LogOut, History, Sun, Moon, Coins, Sparkles } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import AddEntry from './pages/AddEntry';
import Reports from './pages/Reports';
import SettingsPage from './pages/Settings';
import AddExpense from './pages/AddExpense';
import HistoryLogs from './pages/HistoryLogs';
import { auth } from './lib/firebase';
import { StoreProvider } from './store';
import { signOut } from 'firebase/auth';
import { useTheme } from './context/ThemeContext';
import { motion } from 'motion/react';
import SyncStatus from './components/SyncStatus';

function AppShellContent() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  const userEmail = auth.currentUser?.email || '';
  const username = userEmail.split('@')[0].toLowerCase();
  const role = ['nadeem', 'yuvaraj', 'tankrosathy'].includes(username) ? 'owner' : 'manager';

  const [activeTab, setActiveTab] = useState<'dashboard' | 'add' | 'expense' | 'reports' | 'settings' | 'logs'>(role === 'owner' ? 'dashboard' : 'add');

  useEffect(() => {
    const mainContainer = document.querySelector('main');
    if (mainContainer) mainContainer.scrollTo(0, 0);
  }, [activeTab]);
  const [editDate, setEditDate] = useState<string | undefined>(undefined);
  const [editExpense, setEditExpense] = useState<any>(undefined);
  
  const handleEditEntry = (date: string) => {
    setEditDate(date);
    setActiveTab('add');
  };

  const handleEditExpense = (expense: any) => {
    setEditExpense(expense);
    setActiveTab('expense');
  };

  const navigateTab = (tab: 'dashboard' | 'add' | 'expense' | 'reports' | 'settings' | 'logs') => {
    if (tab !== 'add') {
      setEditDate(undefined);
    }
    setActiveTab(tab);
    const mainContainer = document.querySelector('main');
    if (mainContainer) mainContainer.scrollTo(0, 0);
  };

  const handleLogout = async () => {
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
            }`}>Sathyamangalam</span>
            <h1 className={`text-lg sm:text-2xl font-black tracking-tighter leading-none uppercase ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}>Namma Ooru <span className="text-pink-500">Kulfi</span></h1>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <SyncStatus />
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
        {activeTab === 'dashboard' && role === 'owner' && <Dashboard onNavigateToEntry={handleEditEntry} />}
        {activeTab === 'add' && <AddEntry onSave={() => navigateTab('reports')} onCancel={() => navigateTab('reports')} initialDate={editDate} key={editDate || 'new'} />}
        {activeTab === 'expense' && role === 'owner' && <AddExpense onSave={() => { setEditExpense(undefined); navigateTab(role === 'owner' ? 'dashboard' : 'add'); }} onCancel={() => { setEditExpense(undefined); navigateTab(role === 'owner' ? 'dashboard' : 'add'); }} initialExpense={editExpense} />}
        {activeTab === 'reports' && <Reports role={role} onEdit={handleEditEntry} onEditExpense={handleEditExpense} />}
        {activeTab === 'settings' && <SettingsPage role={role} />}
        {activeTab === 'logs' && role === 'owner' && <HistoryLogs />}
      </main>

      <nav className={`fixed bottom-0 w-full pb-safe flex justify-around items-center h-20 px-2 pb-4 pt-2 z-20 transition-all duration-300 border-t ${
        isDark 
          ? 'bg-[#111827]/95 border-slate-800 backdrop-blur-xl shadow-[0_-10px_40px_rgba(0,0,0,0.5)]' 
          : 'bg-white border-slate-300 shadow-[0_-4px_24px_rgba(15,23,42,0.1)]'
      }`}>
        {role === 'owner' && (
          <NavItem 
            icon={<Home className="w-5 h-5" />} 
            label="Home" 
            active={activeTab === 'dashboard'} 
            onClick={() => navigateTab('dashboard')} 
            isDark={isDark}
          />
        )}
        <NavItem 
          icon={<PlusCircle className="w-5 h-5" />} 
          label="Job" 
          active={activeTab === 'add'} 
          onClick={() => navigateTab('add')} 
          isDark={isDark}
        />
        {role === 'owner' && (
          <NavItem 
            icon={<Wallet className="w-5 h-5" />} 
            label="EXP" 
            active={activeTab === 'expense'} 
            onClick={() => navigateTab('expense')} 
            isDark={isDark}
          />
        )}
        <NavItem 
          icon={<List className="w-5 h-5" />} 
          label="REC" 
          active={activeTab === 'reports'} 
          onClick={() => navigateTab('reports')} 
          isDark={isDark}
        />
        <NavItem 
          icon={role === 'owner' ? <SettingsIcon className="w-5 h-5" /> : <Package className="w-5 h-5" />} 
          label={role === 'owner' ? "Admin" : "Inv"} 
          active={activeTab === 'settings'} 
          onClick={() => navigateTab('settings')} 
          isDark={isDark}
        />
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
  return (
    <StoreProvider>
      <AppShellContent />
    </StoreProvider>
  );
}
