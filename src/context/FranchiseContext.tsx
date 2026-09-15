import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { auth, db } from '../lib/firebase';
import { doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { UserProfile, Franchise } from '../types';
import { setCurrentFranchiseId } from '../store';

interface FranchiseContextType {
  profile: UserProfile | null;
  franchise: Franchise | null;
  loading: boolean;
  createFranchise: (name: string) => Promise<void>;
  joinFranchise: (inviteCode: string) => Promise<void>;
  switchFranchise: (franchiseId: string) => Promise<void>;
}

export const FranchiseContext = createContext<FranchiseContextType>({} as any);

export const useFranchise = () => useContext(FranchiseContext);

export const FranchiseProvider = ({ children }: { children: ReactNode }) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [franchise, setFranchise] = useState<Franchise | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return auth.onAuthStateChanged(async (user) => {
      if (user) {
        // 1. Instant Cache Hydration - unlock UI immediately if cached credentials exist
        let hasCache = false;
        try {
          const cachedPStr = localStorage.getItem(`namma_profile_${user.uid}`);
          const cachedFStr = localStorage.getItem(`namma_franchise_${user.uid}`);
          if (cachedPStr) {
            const cachedP = JSON.parse(cachedPStr) as UserProfile;
            setProfile(cachedP);
            setCurrentFranchiseId(cachedP.franchiseId);
            if (cachedFStr) {
              setFranchise(JSON.parse(cachedFStr) as Franchise);
            }
            hasCache = true;
            setLoading(false); // Immediate unlock for instant login!
          }
        } catch (e) {
          console.warn("Could not parse local franchise cache", e);
        }

        if (!hasCache) {
          setLoading(true);
        }

        // 2. Fetch fresh profile and franchise with strict timeout guards
        // to prevent 30-40s hangs on slow/flaky cellular networks
        const fetchWithTimeout = async <T,>(p: Promise<T>, timeoutMs = 4500): Promise<T> => {
          let timer: any;
          const timeoutPromise = new Promise<T>((_, reject) => {
            timer = setTimeout(() => reject(new Error('Network timeout - falling back')), timeoutMs);
          });
          return Promise.race([p, timeoutPromise]).finally(() => clearTimeout(timer));
        };

        try {
          const profileDoc = await fetchWithTimeout(getDoc(doc(db, 'users', user.uid)));
          if (profileDoc.exists()) {
            const pData = profileDoc.data() as UserProfile;
            setProfile(pData);
            setCurrentFranchiseId(pData.franchiseId);
            try {
              localStorage.setItem(`namma_profile_${user.uid}`, JSON.stringify(pData));
            } catch {}
            window.dispatchEvent(new Event('franchiseChanged'));

            if (pData.franchiseId) {
              try {
                const fDoc = await fetchWithTimeout(getDoc(doc(db, 'franchises', pData.franchiseId)), 3000);
                if (fDoc.exists()) {
                  const fData = fDoc.data() as Franchise;
                  setFranchise(fData);
                  try {
                    localStorage.setItem(`namma_franchise_${user.uid}`, JSON.stringify(fData));
                  } catch {}
                }
              } catch (fErr) {
                console.warn('Franchise fetch timed out or offline, using cache if available');
              }
            }
          } else {
            // Handle superadmin special case
            if (user.email === 'superadmin@gmail.com') {
              const superProfile: UserProfile = {
                uid: user.uid,
                email: user.email,
                role: 'superadmin',
                franchiseId: ''
              };
              setProfile(superProfile);
              setCurrentFranchiseId('all');
            } else {
              setProfile(null);
              setFranchise(null);
              setCurrentFranchiseId(null);
              window.dispatchEvent(new Event('franchiseChanged'));
            }
          }
        } catch (err) {
          console.warn("User profile fetch timed out or error occurred; using cached or fallback profile:", err);
        } finally {
          setLoading(false);
        }
      } else {
        setProfile(null);
        setFranchise(null);
        setLoading(false);
      }
    });
  }, []);

  const createFranchise = async (name: string) => {
    if (!auth.currentUser) return;
    const user = auth.currentUser;
    const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const franchiseId = `F-${Date.now()}`;
    
    const newFranchise: Franchise = {
      id: franchiseId,
      name,
      inviteCode,
      ownerId: user.uid,
      createdAt: new Date().toISOString()
    };
    
    const newProfile: UserProfile = {
      uid: user.uid,
      email: user.email || '',
      franchiseId,
      role: 'owner'
    };

    await setDoc(doc(db, 'franchises', franchiseId), newFranchise);
    await setDoc(doc(db, 'users', user.uid), newProfile);
    
    setProfile(newProfile);
    setCurrentFranchiseId(newProfile.franchiseId);
    window.dispatchEvent(new Event('franchiseChanged'));
    setFranchise(newFranchise);
  };

  const joinFranchise = async (inviteCode: string) => {
    if (!auth.currentUser) return;
    const user = auth.currentUser;
    
    const q = query(collection(db, 'franchises'), where('inviteCode', '==', inviteCode));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) throw new Error("Invalid invite code");
    
    const fDoc = snapshot.docs[0];
    const franchiseData = fDoc.data() as Franchise;
    
    const newProfile: UserProfile = {
      uid: user.uid,
      email: user.email || '',
      franchiseId: franchiseData.id,
      role: 'staff'
    };
    
    await setDoc(doc(db, 'users', user.uid), newProfile);
    try {
      localStorage.setItem(`namma_profile_${user.uid}`, JSON.stringify(newProfile));
      localStorage.setItem(`namma_franchise_${user.uid}`, JSON.stringify(franchiseData));
    } catch {}
    
    setProfile(newProfile);
    setFranchise(franchiseData);
  };

  const switchFranchise = async (franchiseId: string) => {
    if (franchiseId === 'superadmin') {
      setCurrentFranchiseId(null);
      window.dispatchEvent(new Event('franchiseChanged'));
      setFranchise(null);
      return;
    }
    try {
      const fDoc = await getDoc(doc(db, 'franchises', franchiseId));
      if (fDoc.exists()) {
        const fData = fDoc.data() as Franchise;
        setCurrentFranchiseId(fData.id);
        window.dispatchEvent(new Event('franchiseChanged'));
        setFranchise(fData);
        if (auth.currentUser) {
          try {
            localStorage.setItem(`namma_franchise_${auth.currentUser.uid}`, JSON.stringify(fData));
          } catch {}
        }
      }
    } catch (e) {
      console.warn("Switch franchise error:", e);
    }
  };

  return (
    <FranchiseContext.Provider value={{ profile, franchise, loading, createFranchise, joinFranchise, switchFranchise }}>
      {children}
    </FranchiseContext.Provider>
  );
};
