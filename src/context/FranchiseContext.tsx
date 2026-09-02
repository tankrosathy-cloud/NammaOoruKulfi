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
        setLoading(true);
        try {
          const profileDoc = await getDoc(doc(db, 'users', user.uid));
          if (profileDoc.exists()) {
            const pData = profileDoc.data() as UserProfile;
            setProfile(pData);
            setCurrentFranchiseId(pData.franchiseId);
            window.dispatchEvent(new Event('franchiseChanged'));
            const fDoc = await getDoc(doc(db, 'franchises', pData.franchiseId));
            if (fDoc.exists()) {
              setFranchise(fDoc.data() as Franchise);
            }
          } else {
            setProfile(null);
            setFranchise(null);
            setCurrentFranchiseId(null);
            window.dispatchEvent(new Event('franchiseChanged'));
          }
        } catch (err) {
          console.error(err);
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
    
    setProfile(newProfile);
    setFranchise(franchiseData);
  };

  return (
    <FranchiseContext.Provider value={{ profile, franchise, loading, createFranchise, joinFranchise }}>
      {children}
    </FranchiseContext.Provider>
  );
};
