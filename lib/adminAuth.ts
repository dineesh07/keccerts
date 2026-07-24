/**
 * Admin authentication helpers.
 *
 * SECURITY NOTE: Hardcoded credentials are acceptable ONLY for this
 * frontend-only development stage. Before production:
 *   1. Remove ADMIN_CREDENTIALS from client code entirely.
 *   2. Replace checkAdminAuth() with a POST /api/admin/login fetch call.
 *   3. Use httpOnly session cookies or a signed JWT from the server.
 *   4. Add server-side rate limiting on the login endpoint.
 *
 * SWAP GUIDE: Only the body of checkAdminAuth() needs to change —
 * all callers use the same function signature.
 */

const ADMIN_CREDENTIALS = {
  username: "kec-admin",
  password: "KEC@2024Admin",
} as const;

const SESSION_KEY = "kec_admin_auth";

// ── Auth check (swap this for real API call in production) ────────────────────
export async function checkAdminAuth(
  username: string,
  password: string
): Promise<boolean> {
  // Simulate a tiny async delay so UI can show loading state
  await new Promise((r) => setTimeout(r, 400));
  return (
    username.trim() === ADMIN_CREDENTIALS.username &&
    password === ADMIN_CREDENTIALS.password
  );
}

// ── Session helpers (localStorage-backed; swap for cookie/token in prod) ──────
export function isAdminLoggedIn(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(SESSION_KEY) === "true";
}

export function setAdminSession(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(SESSION_KEY, "true");
}

export function clearAdminSession(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(SESSION_KEY);
}
