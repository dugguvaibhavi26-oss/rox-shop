"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import {
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as fbSignOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
} from "firebase/auth";
import { auth } from "./firebase";
import { storeService, StoreData } from "./store-service";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  stores: StoreData[];
  refreshStores: () => void;
  signIn: (email: string, pass: string) => Promise<User>;
  signUp: (email: string, pass: string, displayName?: string) => Promise<User>;
  signInWithGoogle: () => Promise<User>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [stores, setStores] = useState<StoreData[]>([]);

  const fetchUserStores = useCallback((currentUser: User | null) => {
    if (!currentUser) {
      setStores([]);
      return;
    }
    const userStores = storeService.getUserStores(currentUser.uid, currentUser.email || undefined);
    setStores(userStores);
  }, []);

  const refreshStores = useCallback(() => {
    fetchUserStores(user);
  }, [fetchUserStores, user]);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      fetchUserStores(currentUser);
      setLoading(false);
    });

    // Also subscribe to storeService changes so newly created/updated stores show up
    const unsubscribeStores = storeService.subscribe(() => {
      if (auth.currentUser) {
        fetchUserStores(auth.currentUser);
      }
    });

    return () => {
      unsubscribeAuth();
      unsubscribeStores();
    };
  }, [fetchUserStores]);

  const signIn = async (email: string, pass: string): Promise<User> => {
    const cred = await signInWithEmailAndPassword(auth, email.trim(), pass);
    setUser(cred.user);
    fetchUserStores(cred.user);
    return cred.user;
  };

  const signUp = async (email: string, pass: string, displayName?: string): Promise<User> => {
    const cred = await createUserWithEmailAndPassword(auth, email.trim(), pass);
    if (displayName) {
      try {
        await updateProfile(cred.user, { displayName });
      } catch (e) {
        console.warn("Failed to update profile displayName", e);
      }
    }
    setUser(cred.user);
    fetchUserStores(cred.user);
    return cred.user;
  };

  const signInWithGoogle = async (): Promise<User> => {
    const provider = new GoogleAuthProvider();
    const cred = await signInWithPopup(auth, provider);
    setUser(cred.user);
    fetchUserStores(cred.user);
    return cred.user;
  };

  const signOut = async (): Promise<void> => {
    await fbSignOut(auth);
    setUser(null);
    setStores([]);
    if (typeof window !== "undefined") {
      localStorage.removeItem("shopper_active_store");
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        stores,
        refreshStores,
        signIn,
        signUp,
        signInWithGoogle,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
