/* eslint-disable react-refresh/only-export-components */
// src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  onAuthStateChanged,
} from "firebase/auth";
import { auth } from "../firebase/config";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 1. Session Activity Heartbeat (2-minute closed-tab auto-logout)
  useEffect(() => {
    const lastActive = localStorage.getItem("last_active_heartbeat");
    const now = Date.now();
    let isAutoLoggingOut = false;

    if (lastActive) {
      const elapsed = now - parseInt(lastActive, 10);
      // If elapsed time is greater than 2 minutes (120,000 ms)
      if (elapsed > 120000) {
        console.log("[Auth] Session inactive for > 2 mins. Logging out automatically.");
        localStorage.removeItem("last_active_heartbeat");
        isAutoLoggingOut = true;
        signOut(auth)
          .catch((e) => console.error("Auto logout failed", e))
          .finally(() => {
            setUser(null);
            setLoading(false);
          });
      }
    }

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      // Ignore initial logged-in state if we are currently signing out due to inactivity
      if (currentUser && isAutoLoggingOut) {
        return;
      }
      setUser(currentUser);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Update heartbeat continuously while logged in
  useEffect(() => {
    if (!user) return;

    localStorage.setItem("last_active_heartbeat", Date.now().toString());

    const interval = setInterval(() => {
      localStorage.setItem("last_active_heartbeat", Date.now().toString());
    }, 5000);

    return () => clearInterval(interval);
  }, [user]);

  // 2. Authentication Actions
  async function login(email, password) {
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      localStorage.setItem("last_active_heartbeat", Date.now().toString());
      return userCredential.user;
    } catch (error) {
      console.error("[Auth] Login error", error);
      throw error;
    } finally {
      setLoading(false);
    }
  }

  async function register(email, password, displayName) {
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      if (displayName) {
        await updateProfile(userCredential.user, { displayName });
      }
      // Force refresh auth user state to include display name
      setUser({ ...auth.currentUser });
      localStorage.setItem("last_active_heartbeat", Date.now().toString());
      return userCredential.user;
    } catch (error) {
      console.error("[Auth] Registration error", error);
      throw error;
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    setLoading(true);
    try {
      localStorage.removeItem("last_active_heartbeat");
      await signOut(auth);
      setUser(null);
    } catch (error) {
      console.error("[Auth] Logout error", error);
      throw error;
    } finally {
      setLoading(false);
    }
  }

  const contextValue = {
    user,
    loading,
    login,
    register,
    logout,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
