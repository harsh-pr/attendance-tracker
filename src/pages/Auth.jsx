// src/pages/Auth.jsx
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

export default function Auth() {
  const { login, register, loginWithGoogle } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [isLoginTab, setIsLoginTab] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
          setErrorMsg("Password does not meet all safety requirements below.");
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
      } else if (
        err.code === "auth/wrong-password" ||
        err.code === "auth/user-not-found" ||
        err.code === "auth/invalid-credential"
      ) {
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
    <div className="relative min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 px-4 py-12 overflow-hidden transition-colors duration-300">
      {/* AMBIENT BACKGROUND GLOW BLOBS */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-blue-500/20 dark:bg-blue-600/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-indigo-500/20 dark:bg-indigo-600/15 rounded-full blur-[120px] pointer-events-none" />

      {/* TOP FLOATING THEME TOGGLE */}
      <div className="absolute top-6 right-6 z-20">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={toggleTheme}
          className="flex relative w-12 h-6 rounded-full bg-zinc-200 dark:bg-zinc-800 transition-colors duration-300 cursor-pointer items-center p-0.5 border border-zinc-300 dark:border-zinc-700 shadow-sm"
          aria-label="Toggle theme"
        >
          <motion.span
            animate={{ x: theme === "dark" ? 22 : 2 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            className="w-4 h-4 rounded-full bg-white dark:bg-zinc-200 flex items-center justify-center text-[10px] leading-none shadow-sm"
          >
            {theme === "dark" ? "🌙" : "🌞"}
          </motion.span>
        </motion.button>
      </div>

      {/* KOKONUT UI MAIN GLASS CARD */}
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md bg-white/80 dark:bg-zinc-900/80 border border-zinc-200/80 dark:border-zinc-800/80 shadow-[0_20px_60px_rgba(0,0,0,0.08)] dark:shadow-[0_20px_60px_rgba(0,0,0,0.45)] backdrop-blur-2xl rounded-3xl p-6 sm:p-8 space-y-6"
      >
        {/* LOGO & HEADER */}
        <div className="text-center space-y-2">
          <div className="relative inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 text-white font-black text-2xl shadow-lg shadow-blue-500/30">
            <span>A</span>
            <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white dark:border-zinc-900 rounded-full" />
          </div>

          <div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-900 dark:text-white font-[Poppins]">
              Attendance{" "}
              <span className="bg-gradient-to-r from-blue-600 to-indigo-500 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
                Tracker
              </span>
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 font-medium">
              Sync your schedules, logs, and analytics seamlessly
            </p>
          </div>
        </div>

        {/* KOKONUT MORPHIC TAB SWITCHER */}
        <div className="relative flex p-1 rounded-2xl bg-zinc-100 dark:bg-zinc-800/60 border border-zinc-200/60 dark:border-zinc-700/50">
          <button
            type="button"
            onClick={() => handleSwitchTab(true)}
            className={`relative flex-1 py-2.5 text-xs font-bold rounded-xl transition-colors cursor-pointer select-none z-10 ${
              isLoginTab ? "text-zinc-900 dark:text-white" : "text-zinc-500 dark:text-zinc-400"
            }`}
          >
            {isLoginTab && (
              <motion.div
                layoutId="auth-tab-pill"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                className="absolute inset-0 bg-white dark:bg-zinc-800 rounded-xl shadow-sm border border-zinc-200/80 dark:border-zinc-700/60"
              />
            )}
            <span className="relative z-10">Sign In</span>
          </button>

          <button
            type="button"
            onClick={() => handleSwitchTab(false)}
            className={`relative flex-1 py-2.5 text-xs font-bold rounded-xl transition-colors cursor-pointer select-none z-10 ${
              !isLoginTab ? "text-zinc-900 dark:text-white" : "text-zinc-500 dark:text-zinc-400"
            }`}
          >
            {!isLoginTab && (
              <motion.div
                layoutId="auth-tab-pill"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                className="absolute inset-0 bg-white dark:bg-zinc-800 rounded-xl shadow-sm border border-zinc-200/80 dark:border-zinc-700/60"
              />
            )}
            <span className="relative z-10">Sign Up</span>
          </button>
        </div>

        {/* ERROR CALLOUT */}
        <AnimatePresence mode="wait">
          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, y: -8, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: -8, height: 0 }}
              transition={{ duration: 0.2 }}
              className="p-3.5 rounded-2xl bg-red-500/10 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-xs text-red-600 dark:text-red-300 font-semibold flex items-center gap-2"
            >
              <span className="text-base shrink-0">⚠️</span>
              <span>{errorMsg}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* FORM FIELDS */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <AnimatePresence mode="wait">
            {!isLoginTab && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-1.5"
              >
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                  Full Name
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-zinc-400">
                    👤
                  </span>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-950/70 text-zinc-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition duration-200"
                    placeholder="John Doe"
                    required
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
              Email Address
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-zinc-400">
                ✉️
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-950/70 text-zinc-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition duration-200"
                placeholder="name@university.edu"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
              Password
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-zinc-400">
                🔒
              </span>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-950/70 text-zinc-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition duration-200"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition"
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>

            {/* PASSWORD REQUIREMENTS INDICATOR */}
            {!isLoginTab && password.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 rounded-2xl bg-zinc-100/70 dark:bg-zinc-950/50 border border-zinc-200/80 dark:border-zinc-800/80 text-[11px] space-y-1.5 text-zinc-600 dark:text-zinc-400"
              >
                <p className="font-bold text-[10px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Password Safety Requirements:
                </p>
                <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                  <div
                    className={`flex items-center gap-1.5 transition-colors ${
                      isMinLength
                        ? "text-emerald-600 dark:text-emerald-400 font-bold"
                        : "text-zinc-400"
                    }`}
                  >
                    <span>{isMinLength ? "✓" : "•"}</span> 8+ characters
                  </div>
                  <div
                    className={`flex items-center gap-1.5 transition-colors ${
                      hasUpper
                        ? "text-emerald-600 dark:text-emerald-400 font-bold"
                        : "text-zinc-400"
                    }`}
                  >
                    <span>{hasUpper ? "✓" : "•"}</span> Uppercase letter
                  </div>
                  <div
                    className={`flex items-center gap-1.5 transition-colors ${
                      hasLower
                        ? "text-emerald-600 dark:text-emerald-400 font-bold"
                        : "text-zinc-400"
                    }`}
                  >
                    <span>{hasLower ? "✓" : "•"}</span> Lowercase letter
                  </div>
                  <div
                    className={`flex items-center gap-1.5 transition-colors ${
                      hasDigit
                        ? "text-emerald-600 dark:text-emerald-400 font-bold"
                        : "text-zinc-400"
                    }`}
                  >
                    <span>{hasDigit ? "✓" : "•"}</span> One number
                  </div>
                  <div
                    className={`flex items-center gap-1.5 transition-colors ${
                      hasSpecial
                        ? "text-emerald-600 dark:text-emerald-400 font-bold"
                        : "text-zinc-400"
                    }`}
                  >
                    <span>{hasSpecial ? "✓" : "•"}</span> Special character
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-2xl font-bold text-xs shadow-lg shadow-blue-500/25 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <span>{isLoginTab ? "Sign In to Dashboard" : "Create My Account"}</span>
            )}
          </motion.button>
        </form>

        {/* DIVIDER */}
        <div className="relative my-4 flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-zinc-200 dark:border-zinc-800" />
          </div>
          <span className="relative px-3 bg-white dark:bg-zinc-900 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
            Or Continue With
          </span>
        </div>

        {/* GOOGLE SIGN-IN BUTTON */}
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full py-2.5 flex items-center justify-center gap-3 border border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 hover:bg-zinc-100 dark:bg-zinc-950/60 dark:hover:bg-zinc-800/80 text-zinc-800 dark:text-zinc-200 rounded-2xl text-xs font-bold transition-all duration-200 cursor-pointer shadow-sm disabled:opacity-50"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
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
          <span>Continue with Google</span>
        </motion.button>
      </motion.div>
    </div>
  );
}
