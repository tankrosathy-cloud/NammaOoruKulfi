import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { auth, db } from '../lib/firebase';
import { doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { UserProfile, Franchise } from '../types';
import { setCurrentFranchiseId, ADMIN_USERNAMES } from '../store';
import { isSuperAdminEmail } from '../lib/utils';

export const SATHY_FRANCHISE_ID = 'F-1788087111153';
export const SATHY_FRANCHISE_NAME = 'Namma Ooru Kulfi (Sathyamangalam)';

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
        const userEmail = (user.email || '').toLowerCase().trim();

        // Check if user's email was revoked/removed by franchise owner
        try {
          const fDocCheck = await getDoc(doc(db, 'franchises', SATHY_FRANCHISE_ID));
          if (fDocCheck.exists()) {
            const fData = fDocCheck.data() as Franchise & { removedEmails?: string[] };
            const removedList = (fData.removedEmails || []).map(e => e.toLowerCase().trim());
            const masterOwnerEmails = ['tankrosathy@gmail.com', 'nammaoorukulfisathy@gmail.com'];
            if (removedList.includes(userEmail) && !masterOwnerEmails.includes(userEmail)) {
              await auth.signOut();
              setProfile(null);
              setFranchise(null);
              setLoading(false);
              alert("Access Revoked: Your account access has been removed by the franchise owner.");
              return;
            }
          }
        } catch (e) {}

        const staffEmails = ['rabertraj777@gmail.com', 'dheepakkumar.m143@gmail.com'];
        const isStaffUser = staffEmails.includes(userEmail);

        const masterOwnerEmails = ['tankrosathy@gmail.com', 'nammaoorukulfisathy@gmail.com'];
        const isMasterOwner = masterOwnerEmails.includes(userEmail) || userEmail.startsWith('tankrosathy');
        const isSathyOwner = !isStaffUser && isMasterOwner;

        // Predefined profile for the Sathyamangalam main store
        const sathyProfile: UserProfile = {
          uid: user.uid,
          email: user.email || 'nammaoorukulfisathy@gmail.com',
          role: 'owner',
          franchiseId: SATHY_FRANCHISE_ID
        };

        const staffProfile: UserProfile = {
          uid: user.uid,
          email: user.email || userEmail,
          role: 'staff',
          franchiseId: SATHY_FRANCHISE_ID
        };

        const sathyFranchise: Franchise = {
          id: SATHY_FRANCHISE_ID,
          name: SATHY_FRANCHISE_NAME,
          ownerId: user.uid,
          inviteCode: 'SATHY1',
          createdAt: '2026-08-31T09:27:24.071Z'
        };

        // 1. Instant Cache or Auto-Detect Hydration - unlock UI immediately
        let hasCache = false;
        try {
          const cachedPStr = localStorage.getItem(`namma_profile_${user.uid}`) || localStorage.getItem('namma_last_profile');
          const cachedFStr = localStorage.getItem(`namma_franchise_${user.uid}`) || localStorage.getItem('namma_last_franchise');
          if (cachedPStr && !isStaffUser) {
            const cachedP = JSON.parse(cachedPStr) as UserProfile;
            if (cachedP.franchiseId === SATHY_FRANCHISE_ID && !isMasterOwner) {
              cachedP.role = 'staff';
            }
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

        // If this is a designated staff user, assign staff profile immediately!
        if (isStaffUser) {
          try {
            localStorage.removeItem(`namma_profile_${user.uid}`);
            localStorage.setItem('namma_last_profile', JSON.stringify(staffProfile));
          } catch {}
          setProfile(staffProfile);
          setFranchise(sathyFranchise);
          setCurrentFranchiseId(SATHY_FRANCHISE_ID);
          setLoading(false);
          hasCache = true;
        } else if (isSathyOwner) {
          setProfile(sathyProfile);
          setFranchise(sathyFranchise);
          setCurrentFranchiseId(SATHY_FRANCHISE_ID);
          setLoading(false);
          hasCache = true;
        } else if (isSuperAdminEmail(userEmail)) {
          const superProfile: UserProfile = {
            uid: user.uid,
            email: user.email || 'superadmin@gmail.com',
            role: 'superadmin',
            franchiseId: ''
          };
          setProfile(superProfile);
          setCurrentFranchiseId('all');
          setLoading(false);
          hasCache = true;
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
          let resolvedProfile: UserProfile | null = null;
          let resolvedFranchise: Franchise | null = null;

          // Attempt 1: Fetch user profile by UID
          try {
            const profileDoc = await fetchWithTimeout(getDoc(doc(db, 'users', user.uid)));
            if (profileDoc.exists()) {
              resolvedProfile = profileDoc.data() as UserProfile;
            }
          } catch (e) {
            console.warn("Direct user UID profile fetch skipped/failed:", e);
          }

          // Attempt 2: If profile not found by UID, search by email across users collection
          if (!resolvedProfile && userEmail) {
            try {
              const qEmail = query(collection(db, 'users'), where('email', '==', userEmail));
              const emailSnap = await fetchWithTimeout(getDocs(qEmail), 3000);
              if (!emailSnap.empty) {
                const foundData = emailSnap.docs[0].data() as UserProfile;
                resolvedProfile = { ...foundData, uid: user.uid };
              } else if (user.email && user.email !== userEmail) {
                const qEmailOrig = query(collection(db, 'users'), where('email', '==', user.email));
                const emailSnap2 = await fetchWithTimeout(getDocs(qEmailOrig), 3000);
                if (!emailSnap2.empty) {
                  const foundData = emailSnap2.docs[0].data() as UserProfile;
                  resolvedProfile = { ...foundData, uid: user.uid };
                }
              }
            } catch (e) {
              console.warn("User lookup by email skipped/failed:", e);
            }
          }

          // Attempt 3: If user owns an existing franchise, recover ownership automatically
          if (!resolvedProfile) {
            try {
              const qOwner = query(collection(db, 'franchises'), where('ownerId', '==', user.uid));
              const ownerSnap = await fetchWithTimeout(getDocs(qOwner), 3000);
              if (!ownerSnap.empty) {
                const fData = ownerSnap.docs[0].data() as Franchise;
                resolvedProfile = {
                  uid: user.uid,
                  email: user.email || '',
                  role: 'owner',
                  franchiseId: fData.id
                };
                resolvedFranchise = fData;
              }
            } catch (e) {
              console.warn("Franchise owner check skipped/failed:", e);
            }
          }

          // Force staff role for designated staff emails
          if (isStaffUser) {
            resolvedProfile = staffProfile;
            resolvedFranchise = sathyFranchise;
          }

          // Attempt 4: If Sathy store admin/owner, apply Sathyamangalam profile and ensure cloud sync
          if (!resolvedProfile && isSathyOwner) {
            resolvedProfile = sathyProfile;
            resolvedFranchise = sathyFranchise;
          }

          // Enforce that only nammaoorukulfisathy@gmail.com / tankrosathy@gmail.com can be owner of Sathyamangalam franchise
          if (resolvedProfile && resolvedProfile.franchiseId === SATHY_FRANCHISE_ID && !isMasterOwner) {
            resolvedProfile.role = 'staff';
          }

          if (resolvedProfile) {
            setProfile(resolvedProfile);
            setCurrentFranchiseId(resolvedProfile.franchiseId);
            try {
              localStorage.setItem(`namma_profile_${user.uid}`, JSON.stringify(resolvedProfile));
              localStorage.setItem('namma_last_profile', JSON.stringify(resolvedProfile));
            } catch {}
            window.dispatchEvent(new Event('franchiseChanged'));

            // Auto-persist profile doc in Firestore so future lookups are instant
            try {
              setDoc(doc(db, 'users', user.uid), resolvedProfile, { merge: true }).catch(() => {});
            } catch {}

            // Load associated franchise document
            if (resolvedProfile.franchiseId && !resolvedFranchise) {
              try {
                const fDoc = await fetchWithTimeout(getDoc(doc(db, 'franchises', resolvedProfile.franchiseId)), 3000);
                if (fDoc.exists()) {
                  resolvedFranchise = fDoc.data() as Franchise;
                } else if (resolvedProfile.franchiseId === SATHY_FRANCHISE_ID) {
                  resolvedFranchise = sathyFranchise;
                }
              } catch (fErr) {
                console.warn('Franchise fetch timed out or offline, using fallback:', fErr);
                if (resolvedProfile.franchiseId === SATHY_FRANCHISE_ID) {
                  resolvedFranchise = sathyFranchise;
                }
              }
            }

            if (resolvedFranchise) {
              setFranchise(resolvedFranchise);
              try {
                localStorage.setItem(`namma_franchise_${user.uid}`, JSON.stringify(resolvedFranchise));
                localStorage.setItem('namma_last_franchise', JSON.stringify(resolvedFranchise));
              } catch {}
              // Ensure franchise is saved with current ownerId
              if (resolvedProfile.role === 'owner') {
                try {
                  setDoc(doc(db, 'franchises', resolvedFranchise.id), {
                    ...resolvedFranchise,
                    ownerId: user.uid
                  }, { merge: true }).catch(() => {});
                } catch {}
              }
            }
          } else {
            // Handle superadmin special case
            if (isSuperAdminEmail(userEmail)) {
              const superProfile: UserProfile = {
                uid: user.uid,
                email: user.email || 'superadmin@gmail.com',
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
          console.warn("User profile fetch error/timeout; using cached or fallback profile:", err);
          if (isSathyOwner) {
            setProfile(sathyProfile);
            setFranchise(sathyFranchise);
            setCurrentFranchiseId(SATHY_FRANCHISE_ID);
          }
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
