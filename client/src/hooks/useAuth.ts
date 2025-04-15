import { useState, useEffect, useCallback } from "react";
import {
  signInWithGoogle,
  signInWithApple,
  signInWithEmail,
  createUserWithEmail,
  signOut as firebaseSignOut,
  onAuthStateChange,
  getCurrentUser,
  getRedirectAuthResult
} from "@/lib/firebase";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { User } from "@shared/schema";

interface AuthState {
  isInitializing: boolean;
  isAuthenticated: boolean;
  user: User | null;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  createAccount: (email: string, password: string, username: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

export function useAuth(): AuthState {
  const [isInitializing, setIsInitializing] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const { toast } = useToast();

  // Function to sync the Firebase auth state with our backend
  const syncUserWithBackend = useCallback(async (firebaseUid: string) => {
    try {
      // Check if user exists in our backend
      const response = await fetch(`/api/auth/check?firebaseUid=${firebaseUid}`);
      const data = await response.json();
      
      if (data.authenticated) {
        setUser(data.user);
        setIsAuthenticated(true);
      } else {
        // Create new user if not exists in our backend
        const firebaseUser = getCurrentUser();
        if (firebaseUser) {
          const newUser = {
            username: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
            email: firebaseUser.email || '',
            firebaseUid: firebaseUser.uid,
            avatarUrl: firebaseUser.photoURL || '',
          };
          
          const createResponse = await apiRequest('POST', '/api/user', newUser);
          const createdUser = await createResponse.json();
          
          setUser(createdUser);
          setIsAuthenticated(true);
        }
      }
    } catch (error) {
      console.error('Error syncing user with backend:', error);
      toast({
        title: 'Error',
        description: 'Failed to authenticate with the server.',
        variant: 'destructive',
      });
    }
  }, [toast]);

  // Initialize auth state on component mount
  useEffect(() => {
    // First check for redirect results
    const checkRedirectResult = async () => {
      try {
        const redirectResult = await getRedirectAuthResult();
        if (redirectResult && redirectResult.user) {
          console.log("Found redirect auth result on initialization");
          await syncUserWithBackend(redirectResult.user.uid);
          toast({
            title: 'Authentication Successful',
            description: 'You have been signed in successfully.',
          });
        }
      } catch (error) {
        console.error("Error processing redirect result:", error);
      }
    };
    
    // Check for redirect result
    checkRedirectResult();
    
    // Then set up the auth state observer
    const unsubscribe = onAuthStateChange(async (firebaseUser) => {
      if (firebaseUser) {
        await syncUserWithBackend(firebaseUser.uid);
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
      setIsInitializing(false);
    });

    return () => unsubscribe();
  }, [syncUserWithBackend, toast]);

  // Google sign in
  const handleSignInWithGoogle = async () => {
    try {
      const result = await signInWithGoogle();
      if (result && result.user) {
        await syncUserWithBackend(result.user.uid);
      } else {
        // This means we've initiated a redirect flow
        // We'll just show a toast letting the user know it's in progress
        toast({
          title: 'Redirecting...',
          description: 'You\'ll be redirected to Google for authentication',
        });
      }
    } catch (error) {
      console.error('Error signing in with Google:', error);
      toast({
        title: 'Sign In Failed',
        description: 'Could not sign in with Google. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Apple sign in
  const handleSignInWithApple = async () => {
    try {
      const result = await signInWithApple();
      if (result && result.user) {
        await syncUserWithBackend(result.user.uid);
      } else {
        // This means we've initiated a redirect flow
        // We'll just show a toast letting the user know it's in progress
        toast({
          title: 'Redirecting...',
          description: 'You\'ll be redirected to Apple for authentication',
        });
      }
    } catch (error) {
      console.error('Error signing in with Apple:', error);
      toast({
        title: 'Sign In Failed',
        description: 'Could not sign in with Apple. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Email/password sign in
  const handleSignInWithEmail = async (email: string, password: string) => {
    try {
      const result = await signInWithEmail(email, password);
      if (result.user) {
        await syncUserWithBackend(result.user.uid);
      }
    } catch (error) {
      console.error('Error signing in with email:', error);
      toast({
        title: 'Sign In Failed',
        description: 'Invalid email or password. Please try again.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  // Create account with email/password
  const handleCreateAccount = async (email: string, password: string, username: string) => {
    try {
      const result = await createUserWithEmail(email, password);
      if (result.user) {
        // Create user in our backend
        const newUser = {
          username,
          email,
          firebaseUid: result.user.uid,
          avatarUrl: '',
        };
        
        const createResponse = await apiRequest('POST', '/api/user', newUser);
        const createdUser = await createResponse.json();
        
        setUser(createdUser);
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Error creating account:', error);
      toast({
        title: 'Account Creation Failed',
        description: 'Could not create your account. This email might already be in use.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  // Sign out
  const handleSignOut = async () => {
    try {
      await firebaseSignOut();
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Error signing out:', error);
      toast({
        title: 'Sign Out Failed',
        description: 'Could not sign out. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Refresh user data
  const refreshUser = async () => {
    if (!user?.id) return;
    
    try {
      const response = await fetch(`/api/user?userId=${user.id}`);
      const userData = await response.json();
      setUser(userData);
    } catch (error) {
      console.error('Error refreshing user data:', error);
    }
  };

  return {
    isInitializing,
    isAuthenticated,
    user,
    signInWithGoogle: handleSignInWithGoogle,
    signInWithApple: handleSignInWithApple,
    signInWithEmail: handleSignInWithEmail,
    createAccount: handleCreateAccount,
    signOut: handleSignOut,
    refreshUser,
  };
}
