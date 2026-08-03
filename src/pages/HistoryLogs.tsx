import React, { useState } from 'react';
import { useLogs, clearLogs } from '../store';
import { format, parseISO } from 'date-fns';
import { Card, CardContent } from '../components/ui/card';
import { History, User, Activity, Trash2 } from 'lucide-react';
import { Button } from '../components/ui/button';

export default function HistoryLogs() {
  const { logs, loading } = useLogs();
  const [clearing, setClearing] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  const handleClear = async () => {
    setClearing(true);
    try {
      await clearLogs();
      setConfirmClear(false);
    } catch (error) {
      console.error("Failed to clear logs:", error);
    } finally {
      setClearing(false);
    }
  };

  if (loading) {
    return <div className="p-6 text-center text-slate-400 font-bold uppercase tracking-wider">Loading logs...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="bg-slate-100 dark:bg-slate-800/50 rounded-2xl p-6 border border-slate-300 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tighter mb-1 flex items-center gap-2 text-slate-900 dark:text-white">
            <History className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
            History Logs
          </h2>
          <p className="text-sm font-semibold text-slate-750 dark:text-slate-400">Monitor application activity and user logs</p>
        </div>
        {logs.length > 0 && (
          <div className="flex items-center gap-2">
            {confirmClear ? (
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" className="text-xs font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white" onClick={() => setConfirmClear(false)}>
                  Cancel
                </Button>
                <Button variant="destructive" size="sm" className="text-xs font-bold bg-pink-600 hover:bg-pink-700 text-white" onClick={handleClear} disabled={clearing}>
                  {clearing ? 'Clearing...' : 'Confirm Clear'}
                </Button>
              </div>
            ) : (
              <Button variant="outline" size="sm" className="text-xs font-bold border-slate-200 text-slate-500 hover:text-pink-600 hover:border-pink-500/50 dark:border-slate-700 dark:text-slate-400 dark:hover:text-pink-500 dark:hover:border-pink-500/50 flex items-center gap-1.5" onClick={() => setConfirmClear(true)}>
                <Trash2 className="w-3.5 h-3.5" />
                Clear Logs
              </Button>
            )}
          </div>
        )}
      </div>

      {logs.length === 0 ? (
        <p className="text-xs font-extrabold uppercase tracking-wider text-slate-700 text-center py-6 bg-slate-100 dark:bg-slate-900/50 rounded-3xl border border-slate-300 dark:border-slate-800">
          No logs found.
        </p>
      ) : (
        <div className="space-y-4">
          {logs.map(log => (
            <Card key={log.id}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-cyan-600 dark:text-cyan-500" />
                    <span className="font-black text-sm text-slate-900 dark:text-white">{log.action.replace(/_/g, ' ')}</span>
                  </div>
                  <span className="text-[10px] font-extrabold text-slate-700 dark:text-slate-400 uppercase tracking-widest">
                    {format(parseISO(log.timestamp), 'dd MMM yyyy, HH:mm')}
                  </span>
                </div>
                
                <p className="text-sm text-slate-800 dark:text-slate-300 font-bold leading-snug mb-3">
                  {log.details}
                </p>

                <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-slate-200 dark:border-slate-800/50 text-slate-750 dark:text-slate-400">
                  <User className="w-3 h-3" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">{log.userEmail}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
