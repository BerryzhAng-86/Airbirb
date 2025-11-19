const BACKEND_PORT = 5005;
const API_BASE = `http://localhost:${BACKEND_PORT}`;

/**
 * Generic helper to call the backend API.
 *
 * - Automatically stringifies JSON bodies.
 * - Adds Authorization header when a token is provided.
 * - Parses JSON responses and throws on non-2xx status codes.
 *
 * @param {string} path   - API path (e.g. "/user/auth/login")
 * @param {Object} options
 * @param {string} [options.method="GET"] - HTTP method
 * @param {Object} [options.body]         - Request body (will be JSON-encoded)
 * @param {string} [options.token]        - Auth token for Authorization header
 */
async function request(path, { method = 'GET', body, token } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  // Gracefully handle responses with no JSON body
  const data = await res.json().catch(() => ({}));

  // Normalise error handling for all endpoints
  if (!res.ok) {
    throw new Error(data.error || `HTTP ${res.status}`);
  }

  return data;
}

/**
 * High-level API wrapper used across the app.
 * Each method is a small, typed wrapper around the generic `request` helper.
 */
export const api = {
  // ---------- Auth ----------

  register: (email, password, name) =>
    request('/user/auth/register', {
      method: 'POST',
      body: { email, password, name },
    }),

  login: (email, password) =>
    request('/user/auth/login', {
      method: 'POST',
      body: { email, password },
    }),

  logout: (token) =>
    request('/user/auth/logout', {
      method: 'POST',
      token,
    }),

  // ---------- Listings (public + hosted) ----------

  /**
   * Fetch all published listings (public landing page).
   */
  listPublished: () =>
    request('/listings', { method: 'GET' }),

  /**
   * Create a new listing for the current host.
   */
  createListing: (token, payload) =>
    request('/listings/new', {
      method: 'POST',
      token,
      body: payload,
    }),

  /**
   * Get details of a single listing by ID.
   */
  getListing: (id) =>
    request(`/listings/${id}`, { method: 'GET' }),

  /**
   * Update an existing listing.
   */
  updateListing: (token, id, payload) =>
    request(`/listings/${id}`, {
      method: 'PUT',
      token,
      body: payload,
    }),

  /**
   * Delete a listing owned by the current user.
   */
  deleteListing: (token, id) =>
    request(`/listings/${id}`, {
      method: 'DELETE',
      token,
    }),

  /**
   * Publish a listing with a set of availability date ranges.
   */
  publishListing: (token, id, availabilityRanges) =>
    request(`/listings/publish/${id}`, {
      method: 'PUT',
      token,
      body: { availability: availabilityRanges },
    }),

  /**
   * Unpublish a listing (it will no longer appear on the public page).
   */
  unpublishListing: (token, id) =>
    request(`/listings/unpublish/${id}`, {
      method: 'PUT',
      token,
    }),

  /**
   * Add or update a review for a completed booking.
   */
  addReview: (token, listingId, bookingId, review) =>
    request(`/listings/${listingId}/review/${bookingId}`, {
      method: 'PUT',
      token,
      body: { review },
    }),

  // ---------- Bookings ----------

  /**
   * Get all bookings related to the current user
   * (as host or guest, depending on backend implementation).
   */
  getBookingDetails: (token) =>
    request('/bookings', {
      method: 'GET',
      token,
    }),

  /**
   * Create a booking for a listing.
   */
  createBookings: (token, listingId, dateRange, totalPrice) =>
    request(`/bookings/new/${listingId}`, {
      method: 'POST',
      token,
      body: { dateRange, totalPrice },
    }),

  /**
   * Accept a pending booking (host action).
   */
  acceptBookings: (token, bookingid) =>
    request(`/bookings/accept/${bookingid}`, {
      method: 'PUT',
      token,
    }),

  /**
   * Decline a pending booking (host action).
   */
  declineBookings: (token, bookingid) =>
    request(`/bookings/decline/${bookingid}`, {
      method: 'PUT',
      token,
    }),

  /**
   * Delete/cancel a booking by ID.
   */
  deleteBookings: (token, bookingid) =>
    request(`/bookings/${bookingid}`, {
      method: 'DELETE',
      token,
    }),
};
