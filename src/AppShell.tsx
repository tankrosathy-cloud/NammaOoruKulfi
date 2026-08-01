import React, { useState } from 'react';
import { Home, PlusCircle, List, Settings as SettingsIcon } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import AddEntry from './pages/AddEntry';
import Reports from './pages/Reports';
import SettingsPage from './pages/Settings';

export default function AppShell() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'add' | 'reports' | 'settings'>('dashboard');
  const [editDate, setEditDate] = useState<string | undefined>(undefined);

  const handleEditEntry = (date: string) => {
    setEditDate(date);
    setActiveTab('add');
  };

  const navigateTab = (tab: 'dashboard' | 'add' | 'reports' | 'settings') => {
    if (tab !== 'add') {
      setEditDate(undefined);
    }
    setActiveTab(tab);
  };

  return (
    <div className="flex flex-col h-screen bg-[#0B0F19] text-slate-200 font-sans overflow-hidden">
      <header className="px-6 py-5 bg-[#0B0F19] border-b border-slate-800/60 sticky top-0 z-10 flex justify-between items-end backdrop-blur-md">
        <div className="flex flex-col">
          <span className="text-[10px] font-bold tracking-[0.2em] text-cyan-400 uppercase mb-1">Sathyamangalam Outpost</span>
          <h1 className="text-2xl font-black tracking-tighter leading-none uppercase text-white">Namma Ooru <span className="text-pink-500">Kulfi</span></h1>
        </div>
      </header>
      
      <main className="flex-1 overflow-y-auto pb-24">
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'add' && <AddEntry onSave={() => navigateTab('reports')} initialDate={editDate} key={editDate || 'new'} />}
        {activeTab === 'reports' && <Reports onEdit={handleEditEntry} />}
        {activeTab === 'settings' && <SettingsPage />}
      </main>

      <nav className="fixed bottom-0 w-full bg-[#111827]/90 backdrop-blur-xl border-t border-slate-800 pb-safe flex justify-around items-center h-20 px-2 pb-4 pt-2 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] z-20">
        <NavItem 
          icon={<Home className="w-6 h-6" />} 
          label="Dashboard" 
          active={activeTab === 'dashboard'} 
          onClick={() => navigateTab('dashboard')} 
        />
        <NavItem 
          icon={<PlusCircle className="w-6 h-6" />} 
          label="Add Entry" 
          active={activeTab === 'add'} 
          onClick={() => navigateTab('add')} 
        />
        <NavItem 
          icon={<List className="w-6 h-6" />} 
          label="Reports" 
          active={activeTab === 'reports'} 
          onClick={() => navigateTab('reports')} 
        />
        <NavItem 
          icon={<SettingsIcon className="w-6 h-6" />} 
          label="Settings" 
          active={activeTab === 'settings'} 
          onClick={() => navigateTab('settings')} 
        />
      </nav>
    </div>
  );
}

function NavItem({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center justify-center w-full h-full space-y-1.5 transition-all duration-300 ${active ? 'text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)] scale-110' : 'text-slate-500 hover:text-slate-300'}`}
    >
      {icon}
      <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
    </button>
  );
}
