import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from '../src/componemts/appLayout/index.jsx';
import HostedListPage from './pages/hosted/index.jsx';
import HostedCreatePage from './pages/hostCreratePage/index.jsx';
import HostedEditPage from './pages/hostEditPage/index.jsx';
import ListingsPage from './pages/publicListingPage/index.jsx';
import ListingDetailPage from './pages/listingDetail/index.jsx';
import HostedBookingsPage from './pages/hostedBookings/index.jsx';
import LoginPage from './pages/loginPage/index.jsx';
import RegisterPage from './pages/registerPage/index.jsx';

/**
 * Protected route wrapper.
 * - If there is no auth token in localStorage, redirect to /auth.
 * - Otherwise, render the children normally.
 */
function ProtectedRoute({ children }) {
  const token =
    typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null;
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

/**
 * Simple fallback page for unknown routes.
 * Can be replaced with a richer 404 screen later.
 */
const NotFound = () => <div>404 Not Found</div>;

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Shared layout: header + main + <Outlet /> for all nested routes */}
        <Route element={<AppLayout />}>
          {/* Auth page (login / register). 
              It currently reuses the same layout, which is acceptable for this app. */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Public listing pages */}
          <Route index element={<ListingsPage />} />
          <Route path="/listing/:id" element={<ListingDetailPage />} />

          {/* Hosted listing pages (protected) */}
          <Route
            path="/hosted"
            element={
              <ProtectedRoute>
                <HostedListPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/hosted/new"
            element={
              <ProtectedRoute>
                <HostedCreatePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/hosted/:id/edit"
            element={
              <ProtectedRoute>
                <HostedEditPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/hosted/:id/bookings"
            element={
              <ProtectedRoute>
                <HostedBookingsPage />
              </ProtectedRoute>
            }
          />

          {/* Catch-all route for unmatched paths */}
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
