// src/components/edit/useListingDetail.js
import React from 'react';
import { api } from '../../uitles/api';

/**
 * Hook to load a listing detail by ID.
 *
 * - Manages loading state and fetched data.
 * - Calls optional onError callback when request fails.
 *
 * @param {string|number} id - Listing ID to load
 * @param {Object} [options]
 * @param {(error: any) => void} [options.onError] - Error handler
 * @returns {{ loading: boolean, detail: any, setDetail: Function }}
 */
export default function useListingDetail(id, { onError } = {}) {
  // Whether the data is currently being loaded
  const [loading, setLoading] = React.useState(true);
  // The listing detail data
  const [detail, setDetail] = React.useState(null);

  React.useEffect(() => {
    // Flag to avoid updating state after unmount
    let alive = true;

    (async () => {
      try {
        // Fetch listing detail from API
        const data = await api.getListing(id);
        // Only update state if the component is still mounted
        if (alive) setDetail(data);
      } catch (e) {
        // If an error handler is provided, call it
        onError?.(e);
      } finally {
        // Stop loading state if still mounted
        if (alive) setLoading(false);
      }
    })();

    // Cleanup: mark as not alive so we don't set state after unmount
    return () => {
      alive = false;
    };
  }, [id, onError]);

  // Expose loading state, data, and a setter for manual updates
  return { loading, detail, setDetail };
}
