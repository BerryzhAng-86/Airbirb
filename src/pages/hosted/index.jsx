// pages/hosted/HostedListPage.jsx
import React from 'react';
import { message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { api } from '../../uitles/api';
import { showError } from '../../componemts/showError';
import {
  getCardImages,
  getRatingAvg,
  decodeEmailFromJWT,
} from '../../componemts/hostComponents';
import { StarRating } from '../../componemts/StarRating';
import { fetchHostedSummary } from '../../componemts/hostLoad';
import HostedHeader from '../../componemts/hostedHeader';
import HostedListSection from '../../componemts/hostedListSection';

/**
 * HostedListPage
 *
 * Main screen for "My listings" (host side).
 * - Fetches all listings owned by the current user
 * - Shows bookings-based profit series for the last 31 days
 * - Allows editing, deleting, publishing, unpublishing listings
 * - Handles a publish modal with multiple date ranges
 */
export default function HostedListPage() {
  // All my listings (with details)
  const [data, setData] = React.useState([]);

  // Global loading state for the page
  const [loading, setLoading] = React.useState(true);

  // Profit data: daily profit for the last 0..30 days
  const [profitSeries, setProfitSeries] = React.useState(
    Array.from({ length: 31 }, (_, d) => ({ d, amount: 0 }))
  );

  // Publish modal state
  const [pubOpen, setPubOpen] = React.useState(false);
  const [pubId, setPubId] = React.useState(null); // listing id being published
  const [tempRange, setTempRange] = React.useState(null); // current date range in picker
  const [pubRanges, setPubRanges] = React.useState([]); // confirmed date ranges

  // Which listing is currently performing an action (delete/publish/unpublish)
  const [actioningId, setActioningId] = React.useState(null);

  const navigate = useNavigate();
  const token =
    typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null;

  // How to format availability payload for the publish API
  const API_AVAIL_FORMAT = 'objects'; // 'objects' | 'flat'

  /**
   * Load "my hosted listings" and the profit time series.
   * Memoised so it can be reused (e.g. after delete).
   */
  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const { listings, series } = await fetchHostedSummary({ token });
      setData(listings);
      setProfitSeries(series);
    } catch (e) {
      showError(e);
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Initial data fetch on mount
  React.useEffect(() => {
    load();
  }, [load]);

  /**
   * Delete a listing.
   * - Calls API
   * - Removes it from local list
   * - Refreshes profit series
   */
  const onDelete = async (id) => {
    try {
      setActioningId(id);
      await api.deleteListing(token, id);
      message.success('Deleted');
      setData((prev) => prev.filter((x) => x.id !== id));
      // Also refresh profit series after deletion
      load();
    } catch (e) {
      showError(e);
    } finally {
      setActioningId(null);
    }
  };

  /**
   * Unpublish a listing (make it unavailable for booking).
   */
  const onUnpublish = async (id) => {
    try {
      setActioningId(id);
      await api.unpublishListing(token, id);
      message.success('Unpublished');
      setData((prev) =>
        prev.map((x) => (x.id === id ? { ...x, published: false } : x))
      );
    } catch (e) {
      showError(e);
    } finally {
      setActioningId(null);
    }
  };

  /**
   * Open publish modal for a specific listing.
   * Resets temporary/confirmed ranges for a fresh start.
   */
  const onOpenPublish = (id) => {
    setPubId(id);
    setTempRange(null);
    setPubRanges([]);
    setPubOpen(true);
  };

  /**
   * Normalise and merge date ranges:
   * - Ensure each range is [start, end] with start <= end
   * - Sort by start date
   * - Merge overlapping or adjacent ranges (difference <= 1 day)
   */
  const normalizeRanges = (ranges) => {
    const xs = (ranges || [])
      .filter((r) => r && r[0] && r[1])
      .map(([s, e]) => (s.isAfter(e) ? [e, s] : [s, e]))
      .sort((a, b) => a[0].valueOf() - b[0].valueOf());

    const out = [];
    for (const [s, e] of xs) {
      if (!out.length) {
        out.push([s, e]);
      } else {
        const last = out[out.length - 1];
        // If the start is within 1 day after the last end, merge them
        if (s.diff(last[1], 'day') <= 1) {
          if (e.isAfter(last[1])) last[1] = e;
        } else {
          out.push([s, e]);
        }
      }
    }
    return out;
  };

  /**
   * Convert ranges to API payload (objects mode).
   * Each range becomes { start, end } with full-day coverage.
   */
  const toAvailabilityObjects = (ranges) =>
    (ranges || []).map(([s, e]) => ({
      start: s.startOf('day').toISOString(),
      end: e.endOf('day').toISOString(),
    }));

  /**
   * Convert ranges to API payload (flat array mode).
   * [start1, end1, start2, end2, ...]
   */
  const toAvailabilityFlat = (ranges) =>
    (ranges || []).flatMap(([s, e]) => [
      s.startOf('day').toISOString(),
      e.endOf('day').toISOString(),
    ]);

  /**
   * Confirm current temp range and add it to the list (with merge).
   */
  const addOneRange = () => {
    if (!tempRange || !tempRange[0] || !tempRange[1]) {
      message.warning('Please choose a start and end date first.');
      return;
    }
    const merged = normalizeRanges([...pubRanges, tempRange]);
    setPubRanges(merged);
    setTempRange(null);
  };

  /**
   * Remove a range at the given index.
   */
  const removeRangeAt = (idx) => {
    setPubRanges((prev) => prev.filter((_, i) => i !== idx));
  };

  /**
   * Submit publish request:
   * - Build availability payload from ranges
   * - Call publish API
   * - Update local listing state
   */
  const onPublish = async () => {
    if (pubRanges.length === 0) {
      message.warning('Please add at least one date range.');
      return;
    }

    const payload =
      API_AVAIL_FORMAT === 'objects'
        ? toAvailabilityObjects(pubRanges)
        : toAvailabilityFlat(pubRanges);

    try {
      setActioningId(pubId);
      await api.publishListing(token, pubId, payload);
      message.success('Published');
      setPubOpen(false);
      setData((prev) =>
        prev.map((x) => (x.id === pubId ? { ...x, published: true } : x))
      );
    } catch (e) {
      showError(e);
    } finally {
      setActioningId(null);
    }
  };

  return (
    <>
      {/* Header: title, "create new listing" button, etc. */}
      <HostedHeader onNew={() => navigate('/hosted/new')} />

      {/* Main content section: list + charts + publish modal */}
      <HostedListSection
        // Profit chart data
        series={profitSeries}
        // Listing cards data
        data={data}
        loading={loading}
        actioningId={actioningId}
        // Navigation handlers
        onEdit={(id) => navigate(`/hosted/${id}/edit`)}
        onBookings={(id) => navigate(`/hosted/${id}/bookings`)}
        // Listing actions
        onUnpublish={onUnpublish}
        onOpenPublish={onOpenPublish}
        onDelete={onDelete}
        // Helpers/formatters
        getCardImages={getCardImages}
        getRatingAvg={getRatingAvg}
        StarRating={StarRating}
        // Publish modal props
        pubOpen={pubOpen}
        onClosePublish={() => setPubOpen(false)}
        onPublish={onPublish}
        okLoading={actioningId === pubId}
        pubRanges={pubRanges}
        tempRange={tempRange}
        setTempRange={setTempRange}
        addOneRange={addOneRange}
        removeRangeAt={removeRangeAt}
        apiAvailFormat={API_AVAIL_FORMAT}
        // Label to show when a listing has no explicit owner name
        emptyOwnerLabel={
          localStorage.getItem('userEmail') ||
          decodeEmailFromJWT(token) ||
          'you'
        }
      />
    </>
  );
}
