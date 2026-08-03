import React, { useState } from 'react';
import { Logo } from './components/Logo';
import { Home, PlusCircle, List, Settings as SettingsIcon, Package, Wallet, LogOut, History, Sun, Moon, Coins, Sparkles } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import AddEntry from './pages/AddEntry';
import Reports from './pages/Reports';
import SettingsPage from './pages/Settings';
import AddExpense from './pages/AddExpense';
import HistoryLogs from './pages/HistoryLogs';
import Planner from './pages/Planner';
import { auth } from './lib/firebase';
import { signOut } from 'firebase/auth';
import { useTheme } from './context/ThemeContext';
import { motion } from 'motion/react';
import QuickExpenseModal from './components/QuickExpenseModal';

export default function AppShell() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  const userEmail = auth.currentUser?.email || '';
  const username = userEmail.split('@')[0].toLowerCase();
  const role = ['nadeem', 'yuvaraj'].includes(username) ? 'owner' : 'manager';

  const [activeTab, setActiveTab] = useState<'dashboard' | 'add' | 'expense' | 'reports' | 'planner' | 'settings' | 'logs'>(role === 'owner' ? 'dashboard' : 'add');
  const [editDate, setEditDate] = useState<string | undefined>(undefined);
  const [editExpense, setEditExpense] = useState<any>(undefined);
  const [isQuickExpenseOpen, setIsQuickExpenseOpen] = useState(false);

  const handleEditEntry = (date: string) => {
    setEditDate(date);
    setActiveTab('add');
  };

  const handleEditExpense = (expense: any) => {
    setEditExpense(expense);
    setActiveTab('expense');
  };

  const navigateTab = (tab: 'dashboard' | 'add' | 'expense' | 'reports' | 'planner' | 'settings' | 'logs') => {
    if (tab !== 'add') {
      setEditDate(undefined);
    }
    setActiveTab(tab);
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  return (
    <div className={`flex flex-col h-screen font-sans overflow-hidden transition-colors duration-300 ${
      isDark ? 'bg-[#0B0F19] text-slate-200' : 'bg-[#F1F5F9] text-slate-800'
    }`}>
      <header className={`px-6 py-5 sticky top-0 z-10 flex justify-between items-center backdrop-blur-md transition-all duration-300 border-b ${
        isDark 
          ? 'bg-[#0B0F19]/90 border-slate-800/60' 
          : 'bg-white border-slate-300 shadow-md shadow-slate-100'
      }`}>
        <div className="flex items-center gap-3">
          <Logo className={`w-10 h-10 transition-all ${
            isDark ? 'shadow-lg shadow-cyan-500/20' : 'shadow-md shadow-cyan-500/10'
          }`} />
          <div className="flex flex-col">
            <span className={`text-[10px] font-bold tracking-[0.2em] uppercase mb-1 ${
              isDark ? 'text-cyan-400' : 'text-cyan-600'
            }`}>Sathyamangalam Outpost</span>
            <h1 className={`text-2xl font-black tracking-tighter leading-none uppercase ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}>Namma Ooru <span className="text-pink-500">Kulfi</span></h1>
          </div>
        </div>
        <div className="flex items-center gap-4">
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
          >
            <LogOut className="w-4.5 h-4.5" />
          </button>
        </div>
      </header>
      
      <main className="flex-1 overflow-y-auto pb-24">
        {activeTab === 'dashboard' && role === 'owner' && <Dashboard />}
        {activeTab === 'add' && <AddEntry onSave={() => navigateTab('reports')} initialDate={editDate} key={editDate || 'new'} />}
        {activeTab === 'expense' && <AddExpense onSave={() => { setEditExpense(undefined); navigateTab(role === 'owner' ? 'dashboard' : 'add'); }} initialExpense={editExpense} />}
        {activeTab === 'reports' && <Reports onEdit={handleEditEntry} onEditExpense={handleEditExpense} />}
        {activeTab === 'planner' && <Planner />}
        {activeTab === 'settings' && <SettingsPage role={role} />}
        {activeTab === 'logs' && role === 'owner' && <HistoryLogs />}
      </main>

      {/* Floating Action Button for Quick Expense */}
      {activeTab !== 'expense' && (
        <motion.button
          onClick={() => setIsQuickExpenseOpen(true)}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="fixed bottom-24 right-5 z-40 w-14 h-14 rounded-full bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white flex items-center justify-center shadow-[0_8px_25px_rgba(239,68,68,0.35)] dark:shadow-[0_8px_30px_rgba(239,68,68,0.5)] transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-pink-500/50"
          title="Quick Expense Entry"
        >
          <Coins className="w-6 h-6 animate-pulse" />
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-cyan-500 text-[9px] font-black flex items-center justify-center border-2 border-white dark:border-slate-900">⚡</span>
        </motion.button>
      )}

      {/* Quick Expense Modal */}
      <QuickExpenseModal
        isOpen={isQuickExpenseOpen}
        onClose={() => setIsQuickExpenseOpen(false)}
        onSave={() => {}}
        isDark={isDark}
      />

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
        <NavItem 
          icon={<Wallet className="w-5 h-5" />} 
          label="EXP" 
          active={activeTab === 'expense'} 
          onClick={() => navigateTab('expense')} 
          isDark={isDark}
        />
        <NavItem 
          icon={<List className="w-5 h-5" />} 
          label="REC" 
          active={activeTab === 'reports'} 
          onClick={() => navigateTab('reports')} 
          isDark={isDark}
        />
        <NavItem 
          icon={<Sparkles className="w-5 h-5" />} 
          label="Planner" 
          active={activeTab === 'planner'} 
          onClick={() => navigateTab('planner')} 
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

