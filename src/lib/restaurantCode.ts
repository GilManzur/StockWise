import { collection, getDocs, query, where } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';

/**
 * Generates a 6-character unique alphanumeric code in format XX-XXX
 * Uses uppercase letters and numbers, excluding confusing characters (0, O, I, 1, L)
 */
const generateCode = (): string => {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let code = '';
  
  // Generate 2 characters
  for (let i = 0; i < 2; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  code += '-';
  
  // Generate 3 more characters
  for (let i = 0; i < 3; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return code;
};

/**
 * Generates a unique restaurant code by checking against existing codes in Firestore
 * @returns A unique 6-character code (format: XX-XXX)
 */
export const generateUniqueRestaurantCode = async (): Promise<string> => {
  const maxAttempts = 10;
  let attempts = 0;
  
  while (attempts < maxAttempts) {
    const code = generateCode();
    
    // Check if code already exists
    const restaurantsRef = collection(firestore, 'restaurants');
    const q = query(restaurantsRef, where('restaurant_code', '==', code));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return code;
    }
    
    attempts++;
  }
  
  // Fallback: add timestamp suffix for guaranteed uniqueness
  const fallbackCode = generateCode();
  const timestamp = Date.now().toString(36).slice(-2).toUpperCase();
  return `${fallbackCode.slice(0, 2)}-${timestamp}${fallbackCode.slice(-1)}`;
};
