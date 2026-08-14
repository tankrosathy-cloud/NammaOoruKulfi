import React, { useState } from 'react';
import { useLogs, clearLogs, revokeDeletedRecord } from '../store';
import { format, parseISO } from 'date-fns';
import { Card, CardContent } from '../components/ui/card';
import { History, User, Activity, Trash2, Undo2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { AppLog } from '../types';

export default function HistoryLogs() {
  const [limitCount, setLimitCount] = useState(10);
  const { logs, loading } = useLogs(limitCount);
  const [clearing, setClearing] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);

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

  const handleRevoke = async (log: AppLog) => {
    if (!confirm('Are you sure you want to revoke this deletion and restore the record?')) {
      return;
    }
    setRevokingId(log.id);
    try {
      await revokeDeletedRecord(log);
    } catch (error) {
      console.error("Failed to revoke deletion:", error);
      alert("Failed to restore record: " + (error as Error).message);
    } finally {
      setRevokingId(null);
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

                <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-200 dark:border-slate-800/50">
                  <div className="flex items-center gap-1.5 text-slate-750 dark:text-slate-400">
                    <User className="w-3 h-3" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">{log.userEmail}</span>
                  </div>
                  {log.deletedPayload && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={revokingId === log.id}
                      onClick={() => handleRevoke(log)}
                      className="h-7 px-2.5 text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 border-emerald-500/20 text-emerald-600 hover:bg-emerald-500 hover:text-white dark:bg-emerald-500/5 dark:border-emerald-500/15 dark:text-emerald-400 dark:hover:bg-emerald-500 dark:hover:text-white flex items-center gap-1.5 rounded-lg transition-all cursor-pointer"
                    >
                      <Undo2 className="w-3 h-3" />
                      {revokingId === log.id ? 'Restoring...' : 'Revoke Deletion'}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
          {logs.length >= limitCount && (
            <div className="flex justify-center pt-6 pb-2">
              <Button 
                variant="outline" 
                onClick={() => setLimitCount(prev => prev + 10)}
                className="rounded-full px-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 shadow-sm text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 hover:border-cyan-500/30 transition-all"
              >
                Load More
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
