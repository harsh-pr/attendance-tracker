// src/pages/Auth.jsx
import { useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function Auth() {
  const { login, register, loginWithGoogle } = useAuth();
  const [isLoginTab, setIsLoginTab] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const isMinLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasDigit = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  const isPasswordValid = isMinLength && hasUpper && hasLower && hasDigit && hasSpecial;

  async function handleGoogleSignIn() {
    setErrorMsg("");
    setLoading(true);
    try {
      await loginWithGoogle();
    } catch (err) {
      let friendlyMessage = `Google Sign-In failed: ${err.code || err.message}. Please try again.`;
      if (err.code === "auth/popup-closed-by-user") {
        friendlyMessage = "Sign-in popup was closed before completion.";
      } else if (err.code === "auth/operation-not-allowed") {
        friendlyMessage = "Google sign-in is not enabled in the Firebase console.";
      }
      setErrorMsg(friendlyMessage);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    try {
      if (isLoginTab) {
        await login(email, password);
      } else {
        if (!name.trim()) {
          setErrorMsg("Please enter your display name.");
          setLoading(false);
          return;
        }
        if (!isPasswordValid) {
          setErrorMsg("Password does not meet the safety requirements.");
          setLoading(false);
          return;
        }
        await register(email, password, name.trim());
      }
    } catch (err) {
      let friendlyMessage = "Authentication failed. Please check your credentials.";
      if (err.code === "auth/email-already-in-use") {
        friendlyMessage = "This email is already registered.";
      } else if (err.code === "auth/weak-password") {
        friendlyMessage = "Password must be at least 6 characters long.";
      } else if (err.code === "auth/invalid-email") {
        friendlyMessage = "Please enter a valid email address.";
      } else if (err.code === "auth/wrong-password" || err.code === "auth/user-not-found" || err.code === "auth/invalid-credential") {
        friendlyMessage = "Invalid email or password.";
      }
      setErrorMsg(friendlyMessage);
    } finally {
      setLoading(false);
    }
  }

  function handleSwitchTab(isLogin) {
    setIsLoginTab(isLogin);
    setErrorMsg("");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-gray-100 to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-blue-950 px-4 transition-colors duration-300">
      <div className="w-full max-w-md bg-white/70 dark:bg-slate-900/70 border border-white/20 dark:border-slate-800/60 shadow-2xl rounded-3xl backdrop-blur-xl p-8 transform-gpu transition-all duration-300 hover:shadow-[0_20px_50px_rgba(99,102,241,0.15)] dark:hover:shadow-[0_20px_50px_rgba(30,58,138,0.3)]">
        
        {/* LOGO AREA */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600 text-white font-extrabold text-2xl shadow-lg shadow-blue-500/35 mb-3">
            A
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            Attendance <span className="text-blue-600">Tracker</span>
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Keep your schedule and records perfectly synced
          </p>
        </div>

        {/* TABS */}
        <div className="flex bg-gray-100/70 dark:bg-slate-800/40 p-1.5 rounded-xl mb-6">
          <button
            type="button"
            onClick={() => handleSwitchTab(true)}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${
              isLoginTab
                ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => handleSwitchTab(false)}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${
              !isLoginTab
                ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* ERROR STATE */}
        {errorMsg && (
          <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-xl p-3.5 mb-6 text-sm text-red-600 dark:text-red-300 animate-pulse">
            <span className="font-semibold">Error:</span> {errorMsg}
          </div>
        )}

        {/* FORM */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLoginTab && (
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 dark:focus:ring-blue-600/40 transition duration-200"
                placeholder="John Doe"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 dark:focus:ring-blue-600/40 transition duration-200"
              placeholder="name@university.edu"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 dark:focus:ring-blue-600/40 transition duration-200"
              placeholder="••••••••"
              required
            />
            {!isLoginTab && password.length > 0 && (
              <div className="mt-2.5 p-3 rounded-xl bg-gray-50 dark:bg-slate-950/40 border border-gray-150 dark:border-slate-800/80 text-[11px] space-y-1.5 transition-all text-gray-500 dark:text-gray-400">
                <p className="font-semibold">Password requirements:</p>
                <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                  <div className={`flex items-center gap-1.5 ${isMinLength ? "text-green-600 dark:text-green-400 font-medium" : "text-gray-400 dark:text-gray-500"}`}>
                    <span>{isMinLength ? "✓" : "•"}</span> 8+ characters
                  </div>
                  <div className={`flex items-center gap-1.5 ${hasUpper ? "text-green-600 dark:text-green-400 font-medium" : "text-gray-400 dark:text-gray-500"}`}>
                    <span>{hasUpper ? "✓" : "•"}</span> Uppercase letter
                  </div>
                  <div className={`flex items-center gap-1.5 ${hasLower ? "text-green-600 dark:text-green-400 font-medium" : "text-gray-400 dark:text-gray-500"}`}>
                    <span>{hasLower ? "✓" : "•"}</span> Lowercase letter
                  </div>
                  <div className={`flex items-center gap-1.5 ${hasDigit ? "text-green-600 dark:text-green-400 font-medium" : "text-gray-400 dark:text-gray-500"}`}>
                    <span>{hasDigit ? "✓" : "•"}</span> One number
                  </div>
                  <div className={`flex items-center gap-1.5 ${hasSpecial ? "text-green-600 dark:text-green-400 font-medium" : "text-gray-400 dark:text-gray-500"}`}>
                    <span>{hasSpecial ? "✓" : "•"}</span> Special char
                  </div>
                </div>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 mt-4 bg-blue-600 hover:bg-blue-500 dark:bg-blue-600 dark:hover:bg-blue-500 text-white rounded-xl font-bold tracking-wide shadow-lg shadow-blue-500/25 active:scale-[0.98] transition-all duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
            ) : null}
            {isLoginTab ? "Sign In" : "Create Account"}
          </button>
        </form>

        <div className="relative my-6 flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200 dark:border-slate-800"></div>
          </div>
          <span className="relative px-3 bg-white dark:bg-slate-900 text-xs font-semibold text-gray-500 dark:text-gray-450 uppercase tracking-wider">
            Or
          </span>
        </div>

        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full py-3 flex items-center justify-center gap-3 border border-gray-200 dark:border-slate-800 hover:bg-gray-50/80 dark:hover:bg-slate-850/40 text-gray-700 dark:text-gray-200 bg-white/50 dark:bg-slate-900/30 rounded-xl font-bold transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-sm hover:shadow"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          Continue with Google
        </button>
      </div>
    </div>
  );
}
