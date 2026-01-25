import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { ref, get, child } from 'firebase/database';
import { auth, database, firestore, createUserWithEmailAndPassword, doc, setDoc, getDoc } from '@/lib/firebase';
import { UserProfile } from '@/types';

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  country: string;
  phonePrefix: string;
  phoneNumber: string;
}

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = async (firebaseUser: User): Promise<UserProfile | null> => {
    try {
      // Try Firestore first
      const userDoc = await getDoc(doc(firestore, 'users', firebaseUser.uid));
      
      if (userDoc.exists()) {
        const data = userDoc.data();
        return {
          uid: firebaseUser.uid,
          email: firebaseUser.email || '',
          firstName: data.firstName,
          lastName: data.lastName,
          country: data.country,
          phonePrefix: data.phonePrefix,
          phoneNumber: data.phoneNumber,
          role: data.role || 'client',
          restaurant_id: data.restaurant_id,
          displayName: data.displayName || `${data.firstName} ${data.lastName}`,
          createdAt: data.createdAt,
        };
      }

      // Fallback to Realtime Database for legacy users
      const dbRef = ref(database);
      const userSnapshot = await get(child(dbRef, `users/${firebaseUser.uid}`));
      
      if (userSnapshot.exists()) {
        return {
          uid: firebaseUser.uid,
          email: firebaseUser.email || '',
          ...userSnapshot.val(),
        };
      }

      // Default to client role if no profile exists
      return {
        uid: firebaseUser.uid,
        email: firebaseUser.email || '',
        role: 'client',
      };
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        const profile = await fetchUserProfile(firebaseUser);
        setUserProfile(profile);
      } else {
        setUserProfile(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const register = async (data: RegisterData) => {
    const { email, password, firstName, lastName, country, phonePrefix, phoneNumber } = data;
    
    // Create auth user
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const { uid } = userCredential.user;

    // Create user profile in Firestore
    const userProfileData = {
      email,
      firstName,
      lastName,
      country,
      phonePrefix,
      phoneNumber,
      role: 'client',
      displayName: `${firstName} ${lastName}`,
      createdAt: Date.now(),
    };

    await setDoc(doc(firestore, 'users', uid), userProfileData);

    // Set the profile immediately
    setUserProfile({
      uid,
      ...userProfileData,
    } as UserProfile);
  };

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, userProfile, loading, signIn, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
