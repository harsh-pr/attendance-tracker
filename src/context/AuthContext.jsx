/* eslint-disable react-refresh/only-export-components */
// src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  linkWithPopup,
  deleteUser,
} from "firebase/auth";
import { auth } from "../firebase/config";
import { deleteAllUserData } from "../firebase/firestoreService";

const AuthContext = createContext();

const GUEST_USER = {
  uid: "guest_demo_user",
  email: "guest@demo.mode",
  displayName: "Guest User",
  isGuest: true,
  providerData: [],
};

function clearGuestLocalStorage() {
  localStorage.removeItem("is_guest_mode");
  localStorage.removeItem("GUEST_APP_DATA");
  localStorage.removeItem("TT_METADATA");
  localStorage.removeItem("TT_FACULTY");
  localStorage.removeItem("TT_TIMETABLE");
  localStorage.removeItem("TT_SLOTS");
  localStorage.removeItem("TT_BREAKS");
  localStorage.removeItem("TT_DAYS");
  try {
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith("GUEST_COLLEGE_TIMETABLE_")) {
        localStorage.removeItem(key);
      }
    });
  } catch (e) {
    console.error("Error clearing guest timetable storage:", e);
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check initial Guest session state on mount
  useEffect(() => {
    const isGuestSession = sessionStorage.getItem("is_guest_session");
    if (isGuestSession === "true") {
      setUser(GUEST_USER);
      setLoading(false);
    } else {
      // If no active guest session exists in sessionStorage (e.g. browser closed and re-opened),
      // purge any residual guest data from localStorage
      clearGuestLocalStorage();
    }
  }, []);

  // Window unload listener to clear guest data when tab/window is closed
  useEffect(() => {
    if (!user?.isGuest) return;

    function handleUnload() {
      clearGuestLocalStorage();
    }

    window.addEventListener("beforeunload", handleUnload);
    return () => window.removeEventListener("beforeunload", handleUnload);
  }, [user]);

  // 1. Session Activity Heartbeat (2-minute closed-tab auto-logout)
  useEffect(() => {
    const lastActive = localStorage.getItem("last_active_heartbeat");
    const now = Date.now();
    let isAutoLoggingOut = false;

    if (lastActive) {
      const elapsed = now - parseInt(lastActive, 10);
      // If elapsed time is greater than 2 minutes (120,000 ms)
      if (elapsed > 120000 && !sessionStorage.getItem("is_guest_session")) {
        console.log("[Auth] Session inactive for > 2 mins. Logging out automatically.");
        localStorage.removeItem("last_active_heartbeat");
        isAutoLoggingOut = true;
        signOut(auth)
          .catch((e) => console.error("Auto logout failed", e))
          .finally(() => {
            isAutoLoggingOut = false;
            setUser(null);
            setLoading(false);
          });
      }
    }

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      // If guest mode is active in this session, do not override with firebase user state
      if (sessionStorage.getItem("is_guest_session") === "true") {
        setUser(GUEST_USER);
        setLoading(false);
        return;
      }
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
  function loginAsGuest() {
    sessionStorage.setItem("is_guest_session", "true");
    localStorage.setItem("is_guest_mode", "true");
    setUser(GUEST_USER);
    setLoading(false);
  }

  async function login(email, password) {
    sessionStorage.removeItem("is_guest_session");
    clearGuestLocalStorage();
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
    sessionStorage.removeItem("is_guest_session");
    clearGuestLocalStorage();
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      if (displayName) {
        await updateProfile(userCredential.user, { displayName });
      }
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
      if (sessionStorage.getItem("is_guest_session") === "true" || user?.isGuest) {
        sessionStorage.removeItem("is_guest_session");
        clearGuestLocalStorage();
      } else {
        await signOut(auth);
      }
      setUser(null);
    } catch (error) {
      console.error("[Auth] Logout error", error);
      throw error;
    } finally {
      setLoading(false);
    }
  }

  async function loginWithGoogle() {
    sessionStorage.removeItem("is_guest_session");
    clearGuestLocalStorage();
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      localStorage.setItem("last_active_heartbeat", Date.now().toString());
      setUser(userCredential.user);
      return userCredential.user;
    } catch (error) {
      console.error("[Auth] Google Sign-In error", error);
      throw error;
    } finally {
      setLoading(false);
    }
  }

  async function connectGoogle() {
    if (!auth.currentUser || user?.isGuest) throw new Error("Google connection requires a non-guest account.");
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await linkWithPopup(auth.currentUser, provider);
      localStorage.setItem("last_active_heartbeat", Date.now().toString());
      setUser({ ...userCredential.user });
      return userCredential.user;
    } catch (error) {
      console.error("[Auth] Connect Google error", error);
      throw error;
    } finally {
      setLoading(false);
    }
  }

  async function deleteAccount() {
    if (user?.isGuest) {
      logout();
      return;
    }
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error("No authenticated user to delete.");

    setLoading(true);
    try {
      await deleteAllUserData(currentUser.uid);
      await deleteUser(currentUser);
      localStorage.removeItem("last_active_heartbeat");
      setUser(null);
    } catch (error) {
      console.error("[Auth] Delete account error:", error);
      if (error.code === "auth/requires-recent-login") {
        throw new Error("For security, please log out and log back in before deleting your account.");
      }
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
    loginWithGoogle,
    loginAsGuest,
    connectGoogle,
    logout,
    deleteAccount,
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
