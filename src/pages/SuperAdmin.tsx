import React, { useEffect, useState } from 'react';
import { collection, getDocs, query } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Franchise, UserProfile } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { useTheme } from '../context/ThemeContext';
import { Users, Store, Shield, Key, Eye } from 'lucide-react';
import { useFranchise } from '../context/FranchiseContext';
import { Button } from '../components/ui/button';

export default function SuperAdmin({ onNavigate }: { onNavigate?: (tab: string) => void }) {
  const [franchises, setFranchises] = useState<Franchise[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { switchFranchise } = useFranchise();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const franchisesSnap = await getDocs(query(collection(db, 'franchises')));
        const franchisesData = franchisesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Franchise);
        
        const usersSnap = await getDocs(query(collection(db, 'users')));
        const usersData = usersSnap.docs.map(doc => ({ uid: doc.id, ...doc.data() }) as UserProfile);

        setFranchises(franchisesData);
        setUsers(usersData);
      } catch (err) {
        console.error("Error fetching data: ", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Shield className={`w-8 h-8 ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`} />
        <h1 className={`text-2xl font-black uppercase tracking-widest ${isDark ? 'text-white' : 'text-slate-900'}`}>
          Super Admin Control Panel
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className={`border ${isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200'}`}>
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
              <Store className="w-4 h-4" /> Total Franchises
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-4xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{franchises.length}</p>
          </CardContent>
        </Card>
        
        <Card className={`border ${isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200'}`}>
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
              <Users className="w-4 h-4" /> Total Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-4xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{users.length}</p>
          </CardContent>
        </Card>
      </div>

      <h2 className={`text-lg font-bold uppercase tracking-widest mt-8 mb-4 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
        Registered Franchises
      </h2>

      <div className="space-y-6">
        {franchises.map(franchise => {
          const owner = users.find(u => u.uid === franchise.ownerId);
          const staff = users.filter(u => u.franchiseId === franchise.id && u.uid !== franchise.ownerId);

          return (
            <Card key={franchise.id} className={`border ${isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200'}`}>
              <CardHeader className={`border-b ${isDark ? 'border-slate-800' : 'border-slate-100'} pb-4`}>
                <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4">
                  <div>
                    <CardTitle className={`text-xl font-black ${isDark ? 'text-cyan-400' : 'text-cyan-600'} uppercase tracking-wide`}>
                      {franchise.name}
                    </CardTitle>
                    <div className="mt-2 space-y-1 text-sm">
                      <p className={isDark ? 'text-slate-400' : 'text-slate-600'}>
                        <span className="font-bold">Franchise ID:</span> <code className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 ml-1 select-all">{franchise.id}</code>
                      </p>
                      <p className={isDark ? 'text-slate-400' : 'text-slate-600'}>
                        <span className="font-bold">Owner Email:</span> {owner?.email || 'N/A'}
                      </p>
                      <p className={isDark ? 'text-slate-400' : 'text-slate-600'}>
                        <span className="font-bold">Owner UID:</span> <code className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 ml-1 select-all">{franchise.ownerId}</code>
                      </p>
                    </div>
                  </div>
                  <div className={`p-3 rounded-lg border flex flex-col justify-between items-end gap-2 ${isDark ? 'bg-amber-950/30 border-amber-900/50' : 'bg-amber-50 border-amber-200'}`}>
                    <div>
                      <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 flex items-center gap-1 ${isDark ? 'text-amber-500' : 'text-amber-700'}`}>
                        <Key className="w-3 h-3" /> Invite Code
                      </p>
                      <code className={`text-lg font-black tracking-widest select-all ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                        {franchise.inviteCode}
                      </code>
                    </div>
                    <Button 
                      onClick={async () => {
                        await switchFranchise(franchise.id);
                        if (onNavigate) onNavigate('dashboard');
                      }}
                      size="sm"
                      className="mt-2 text-[10px] font-bold uppercase tracking-widest h-8"
                    >
                      <Eye className="w-3 h-3 mr-1" /> View Dashboard
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <h3 className={`text-xs font-bold uppercase tracking-widest mb-3 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                  Assigned Staff ({staff.length})
                </h3>
                {staff.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className={`text-[10px] uppercase tracking-widest ${isDark ? 'text-slate-500 bg-slate-900/80' : 'text-slate-500 bg-slate-50'}`}>
                        <tr>
                          <th className="px-4 py-2 font-bold rounded-l-lg">Email</th>
                          <th className="px-4 py-2 font-bold">UID</th>
                          <th className="px-4 py-2 font-bold rounded-r-lg">Role</th>
                        </tr>
                      </thead>
                      <tbody>
                        {staff.map(s => (
                          <tr key={s.uid} className={`border-b last:border-0 ${isDark ? 'border-slate-800/50' : 'border-slate-100'}`}>
                            <td className={`px-4 py-3 font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{s.email}</td>
                            <td className="px-4 py-3">
                              <code className={`text-xs px-2 py-1 rounded select-all ${isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>
                                {s.uid}
                              </code>
                            </td>
                            <td className="px-4 py-3 capitalize text-slate-500">{s.role}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className={`text-sm italic ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>No staff members assigned yet.</p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <h2 className={`text-lg font-bold uppercase tracking-widest mt-12 mb-4 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
        All Registered Users
      </h2>
      <Card className={`border ${isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200'}`}>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className={`text-[10px] uppercase tracking-widest ${isDark ? 'text-slate-500 bg-slate-900/80' : 'text-slate-500 bg-slate-50'}`}>
                <tr>
                  <th className="px-4 py-3 font-bold">Email</th>
                  <th className="px-4 py-3 font-bold">UID</th>
                  <th className="px-4 py-3 font-bold">Role</th>
                  <th className="px-4 py-3 font-bold">Franchise ID</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.uid} className={`border-b last:border-0 ${isDark ? 'border-slate-800/50' : 'border-slate-100'}`}>
                    <td className={`px-4 py-3 font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{u.email}</td>
                    <td className="px-4 py-3">
                      <code className={`text-xs px-2 py-1 rounded select-all ${isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>
                        {u.uid}
                      </code>
                    </td>
                    <td className="px-4 py-3 capitalize text-slate-500">{u.role}</td>
                    <td className="px-4 py-3">
                      {u.franchiseId ? (
                        <code className={`text-xs px-2 py-1 rounded select-all ${isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>
                          {u.franchiseId}
                        </code>
                      ) : (
                        <span className="text-slate-400 text-xs italic">None</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
