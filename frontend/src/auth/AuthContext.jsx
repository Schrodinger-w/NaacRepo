// Who is signed in, for the whole app. The answer comes from the server on load (GET /auth/me)
// and is kept up to date by login() and logout(). Components read it with useAuth().
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { apiRequest, setUnauthorizedHandler } from '../api/client.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true); // true until the first /me answer arrives
  const [sessionExpired, setSessionExpired] = useState(false);

  // The 401 handler is registered once, so it has to read the current user through a ref;
  // a captured variable would show the value from the first render forever.
  const userRef = useRef(null);
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      // A 401 while a user is on screen means the server ended the session, normally after
      // 30 minutes of inactivity (FR-007).
      if (userRef.current) {
        setUser(null);
        setSessionExpired(true);
      }
    });

    apiRequest('/auth/me')
      .then((data) => setUser(data.user))
      .catch(() => setUser(null))
      .finally(() => setChecking(false));
  }, []);

  async function login(email, password) {
    const data = await apiRequest('/auth/login', { method: 'POST', body: { email, password } });
    setSessionExpired(false);
    setUser(data.user);
  }

  async function logout() {
    try {
      await apiRequest('/auth/logout', { method: 'POST' });
    } catch {
      // Continue even if the server cannot be reached; the session still expires on its own.
    }
    // A full reload rather than a route change, so nothing the previous user's pages held in
    // memory survives and the next person starts on their own home page.
    window.location.replace('/login');
  }

  return (
    <AuthContext.Provider value={{ user, checking, sessionExpired, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
