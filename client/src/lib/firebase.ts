import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider, 
  OAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User as FirebaseUser,
  type UserCredential
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Firebase configuration using environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.appspot.com`,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const firestore = getFirestore(app);

// Authentication providers
const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('email');
googleProvider.addScope('profile');
const appleProvider = new OAuthProvider('apple.com');
appleProvider.addScope('email');
appleProvider.addScope('name');

// Check if we're on mobile to use a different sign-in approach
const isMobileDevice = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

// Get redirect result (common for all auth providers)
export const getRedirectAuthResult = async (): Promise<UserCredential | null> => {
  try {
    const result = await getRedirectResult(auth);
    if (result && result.user) {
      console.log("Auth redirect result:", result);
      return result;
    }
    return null;
  } catch (error) {
    console.error("Error getting redirect result:", error);
    return null;
  }
};

// Sign in with Google
export const signInWithGoogle = async (): Promise<UserCredential | null> => {
  try {
    // Always use redirect on mobile devices for better UX
    if (isMobileDevice()) {
      console.log("Using redirect for Google auth on mobile");
      await signInWithRedirect(auth, googleProvider);
      return null; // Will resolve after redirect
    }
    
    // On desktop, try popup first
    try {
      console.log("Attempting Google sign-in popup");
      const popupResult = await signInWithPopup(auth, googleProvider);
      console.log("Google sign-in popup success:", popupResult);
      return popupResult;
    } catch (popupError: any) {
      console.log("Google popup error:", popupError);
      
      // If popup is blocked or fails, fall back to redirect
      if (popupError.code === 'auth/popup-blocked' || 
          popupError.code === 'auth/popup-closed-by-user' ||
          popupError.code === 'auth/cancelled-popup-request' ||
          popupError.code === 'auth/network-request-failed') {
        console.log("Falling back to redirect for Google auth");
        await signInWithRedirect(auth, googleProvider);
        return null; // Will complete on redirect callback
      }
      
      throw popupError;
    }
  } catch (error) {
    console.error("Google sign-in error:", error);
    throw error;
  }
};

// Sign in with Apple
export const signInWithApple = async (): Promise<UserCredential | null> => {
  try {
    // Always use redirect on mobile devices for better UX
    if (isMobileDevice()) {
      console.log("Using redirect for Apple auth on mobile");
      await signInWithRedirect(auth, appleProvider);
      return null; // Will resolve after redirect
    }
    
    // On desktop, try popup first
    try {
      console.log("Attempting Apple sign-in popup");
      const popupResult = await signInWithPopup(auth, appleProvider);
      console.log("Apple sign-in popup success:", popupResult);
      return popupResult;
    } catch (popupError: any) {
      console.log("Apple popup error:", popupError);
      
      // If popup is blocked or fails, fall back to redirect
      if (popupError.code === 'auth/popup-blocked' || 
          popupError.code === 'auth/popup-closed-by-user' ||
          popupError.code === 'auth/cancelled-popup-request' ||
          popupError.code === 'auth/network-request-failed') {
        console.log("Falling back to redirect for Apple auth");
        await signInWithRedirect(auth, appleProvider);
        return null; // Will complete on redirect callback
      }
      
      throw popupError;
    }
  } catch (error) {
    console.error("Apple sign-in error:", error);
    throw error;
  }
};

// Sign in with email and password
export const signInWithEmail = async (email: string, password: string): Promise<UserCredential> => {
  return signInWithEmailAndPassword(auth, email, password);
};

// Create user with email and password
export const createUserWithEmail = async (email: string, password: string): Promise<UserCredential> => {
  return createUserWithEmailAndPassword(auth, email, password);
};

// Sign out
export const signOut = async (): Promise<void> => {
  return firebaseSignOut(auth);
};

// Auth state change listener
export const onAuthStateChange = (callback: (user: FirebaseUser | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

// Get current user
export const getCurrentUser = (): FirebaseUser | null => {
  return auth.currentUser;
};

export { auth, firestore };
