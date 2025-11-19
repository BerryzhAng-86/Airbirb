import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { api } from '../../uitles/api';
import { showError } from '../showError';
import {
  AppLayoutContainer,
  Main,
  HeaderContainer,
  NavBar,
  LinkItem,
  Brand,
} from '../../uitles/appLayoutCss';

export default function AppLayout() {
  const navigate = useNavigate();

  /**
   * Initialise auth state from localStorage once on mount.
   * This lets the header show the correct Login/Logout link
   * on a hard refresh.
   */
  const [token, setToken] = React.useState(() => localStorage.getItem('token'));

  /**
   * Keep `token` in sync across multiple tabs/windows
   * using the native `storage` event.
   */
  React.useEffect(() => {
    const onStorage = (e) => {
      if (e.key === 'token') {
        setToken(e.newValue);
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  /**
   * Also listen to a custom `auth-changed` event so that
   * other parts of the app can trigger a header refresh
   * after login / logout.
   */
  React.useEffect(() => {
    const sync = () => setToken(localStorage.getItem('token'));
    window.addEventListener('auth-changed', sync);
    return () => window.removeEventListener('auth-changed', sync);
  }, []);

  /**
   * Logout handler:
   * - prevent immediate navigation
   * - call backend logout (if we still have a token)
   * - clear local auth state
   * - redirect user to /auth
   */
  const handleLogout = async (e) => {
    e.preventDefault(); // Prevent LinkItem from navigating before we finish logout
    try {
      const t = localStorage.getItem('token');
      if (t) {
        await api.logout(t);
      }
    } catch (err) {
      showError(err);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('userEmail');
      setToken(null);
      navigate('/login');
    }
  };

  return (
    <AppLayoutContainer>
      {/* Global header: shared across all pages in the app */}
      <HeaderContainer>
        <Brand>AirBrB</Brand>
        <NavBar style={{ display: 'flex', gap: 12 }}>
          <LinkItem to="/">Home</LinkItem>
          <LinkItem to="/hosted">My Listings</LinkItem>

          {/* Render different links based on auth state */}
          {token ? (
            <LinkItem to="/login" onClick={handleLogout} id='logout'>
              Logout
            </LinkItem>
          ) : (
            <>
              <LinkItem to="/login">Login</LinkItem>
              <LinkItem to="/register">Sign up</LinkItem>
            </>

          )}
        </NavBar>
      </HeaderContainer>

      {/* Main content area where child routes are rendered */}
      <Main>
        <Outlet />
      </Main>
    </AppLayoutContainer>
  );
}
