import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { ref, get, child } from 'firebase/database';
import { auth, database, firestore, createUserWithEmailAndPassword, doc, setDoc, getDoc, collection, addDoc, updateDoc, arrayUnion } from '@/lib/firebase';
import { UserProfile, RestaurantData } from '@/types';
import { formatDateWithTimezone } from '@/lib/dateUtils';

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  country: string;
  phonePrefix: string;
  phoneNumber: string;
  restaurantName: string;
  restaurantAddress: string;
  chainName?: string;
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
          phone: data.phone,
          role: data.role || 'client',
          restaurants: data.restaurants || [],
          displayName: data.displayName || `${data.firstName} ${data.lastName}`,
          createdAt: data.createdAt,
        };
      }

      // Fallback to Realtime Database for legacy users
      const dbRef = ref(database);
      const userSnapshot = await get(child(dbRef, `users/${firebaseUser.uid}`));
      
      if (userSnapshot.exists()) {
        const legacyData = userSnapshot.val();
        return {
          uid: firebaseUser.uid,
          email: firebaseUser.email || '',
          firstName: legacyData.firstName,
          lastName: legacyData.lastName,
          role: legacyData.role || 'client',
          restaurants: legacyData.restaurant_id ? [legacyData.restaurant_id] : [],
          ...legacyData,
        };
      }

      // Default to client role if no profile exists
      return {
        uid: firebaseUser.uid,
        email: firebaseUser.email || '',
        role: 'client',
        restaurants: [],
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
    const { 
      email, 
      password, 
      firstName, 
      lastName, 
      country, 
      phonePrefix, 
      phoneNumber,
      restaurantName,
      restaurantAddress,
      chainName 
    } = data;
    
    // Create auth user
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const { uid } = userCredential.user;
    
    const createdAt = formatDateWithTimezone();
    const fullPhone = `${phonePrefix}${phoneNumber}`;

    // Create restaurant document first
    const restaurantData: Omit<RestaurantData, 'id'> = {
      name: restaurantName,
      address: restaurantAddress,
      chainName: chainName || '',
      ownerUid: uid,
      status: '',
      masterController: '',
      allowed_masters: [],
      users: [email],
      createdAt,
    };

    const restaurantRef = await addDoc(collection(firestore, 'restaurants'), restaurantData);
    const restaurantId = restaurantRef.id;

    // Create user profile in Firestore with restaurant ID
    const userProfileData = {
      email,
      firstName,
      lastName,
      country,
      phone: fullPhone,
      role: 'client',
      restaurants: [restaurantId],
      displayName: `${firstName} ${lastName}`,
      createdAt,
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
