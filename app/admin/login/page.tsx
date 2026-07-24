"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Lock, User, ShieldAlert, LogIn } from "lucide-react";
import { checkAdminAuth, setAdminSession } from "@/lib/adminAuth";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername]   = useState("");
  const [password, setPassword]   = useState("");
  const [showPass, setShowPass]   = useState(false);
  const [loading,  setLoading]    = useState(false);
  const [error,    setError]      = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const ok = await checkAdminAuth(username, password);
      if (ok) {
        setAdminSession();
        router.replace("/admin/dashboard");
      } else {
        setError("Invalid username or password. Please try again.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="admin-login-page">
      {/* Background blobs */}
      <div className="admin-login__blob admin-login__blob--blue" aria-hidden="true" />
      <div className="admin-login__blob admin-login__blob--green" aria-hidden="true" />

      <div className="admin-login__card">
        {/* Logo */}
        <div className="admin-login__logo">
          <Image
            src="/logo.png"
            alt="Kongu Engineering College Logo"
            width={320}
            height={90}
            className="admin-login__logo-img"
            priority
          />
        </div>

        <h1 className="admin-login__title">Admin Portal</h1>
        <p className="admin-login__sub">Kongu Engineering College · Certificate Portal</p>

        {/* Error */}
        {error && (
          <div className="admin-login__error" role="alert" aria-live="assertive">
            <ShieldAlert size={16} aria-hidden="true" />
            {error}
          </div>
        )}

        <form className="admin-login__form" onSubmit={handleSubmit} noValidate>
          {/* Username */}
          <div className="admin-form-group">
            <label className="admin-form-label" htmlFor="admin-username">
              Username
            </label>
            <div className="admin-input-wrap">
              <span className="admin-input-icon"><User size={16} /></span>
              <input
                id="admin-username"
                type="text"
                className="admin-input"
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                required
                disabled={loading}
              />
            </div>
          </div>

          {/* Password */}
          <div className="admin-form-group">
            <label className="admin-form-label" htmlFor="admin-password">
              Password
            </label>
            <div className="admin-input-wrap">
              <span className="admin-input-icon"><Lock size={16} /></span>
              <input
                id="admin-password"
                type={showPass ? "text" : "password"}
                className="admin-input admin-input--password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                disabled={loading}
              />
              <button
                type="button"
                className="admin-input-toggle"
                onClick={() => setShowPass((p) => !p)}
                aria-label={showPass ? "Hide password" : "Show password"}
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="admin-login__submit"
            disabled={loading || !username || !password}
          >
            {loading ? (
              <span className="spinner" aria-hidden="true" />
            ) : (
              <LogIn size={18} aria-hidden="true" />
            )}
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>

        <p className="admin-login__note">
          This portal is restricted to authorised administrators only.
        </p>
      </div>
    </div>
  );
}
