// src/pages/listings/ListingsPage.jsx
import React from 'react';
import { Space, Typography, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { api } from '../../uitles/api';
import { showError } from '../../componemts/showError';
import ListingsSearchBar from '../../componemts/listingsSearchBar';
import ListingsGrid from '../../componemts/listingsGrid';
import {
  getRating,
  getTotalReviews,
  isRangeCovered,
  decodeEmailFromJWT,
} from '../../uitles/listingsUtils';
import styled from 'styled-components';

const { Title } = Typography;

/* ===== styled-components for layout ===== */

// Header bar above the search bar & grid
const HeaderBar = styled(Space)`
  width: 100%;
  justify-content: space-between;
  margin-bottom: 12px;
`;

// Page title with zero margin (override antd default)
const PageTitle = styled(Title)`
  && {
    margin: 0;
  }
`;

export default function ListingsPage() {
  // React Router navigation
  const nav = useNavigate();

  // JWT token from localStorage (guarded for SSR)
  const token =
    typeof localStorage !== 'undefined'
      ? localStorage.getItem('token')
      : null;

  /**
   * `all` holds the merged data for each listing:
   * {
   *   base,        // base listing info from listPublished
   *   detail,      // full listing detail from getListing
   *   rating,      // computed rating via getRating
   *   reviews,     // total number of reviews via getTotalReviews
   *   availability,// availability array from detail.listing.availability
   *   bedrooms,    // numeric number of bedrooms
   *   hasPriority, // whether this listing should be pinned to top for current user
   * }
   */
  const [all, setAll] = React.useState([]);

  // Global loading state for the page
  const [loading, setLoading] = React.useState(true);

  // ===== Search / filter states for ListingsSearchBar =====
  const [q, setQ] = React.useState(''); // text keyword
  const [brMin, setBrMin] = React.useState(); // min bedrooms
  const [brMax, setBrMax] = React.useState(); // max bedrooms
  const [priceMin, setPriceMin] = React.useState(); // min price
  const [priceMax, setPriceMax] = React.useState(); // max price
  const [dateRange, setDateRange] = React.useState(); // [dayjs, dayjs]
  const [rateOrder, setRateOrder] = React.useState(null); // 'desc' | 'asc' | null

  /**
   * Effect: load listings on first render (and whenever token changes).
   * Steps:
   *  1) Fetch published listings (base info).
   *  2) Fetch detail for each listing.
   *  3) If logged in, fetch current user's bookings for priority pin.
   *  4) Merge everything into a single list and filter out unpublished.
   */
  React.useEffect(() => {
    (async () => {
      try {
        // 1) Get all published listings (public list)
        const res = await api.listPublished();
        let list = res?.listings || [];

        // If `published` field exists on base objects, quick filter by it
        if (
          list.length &&
          Object.prototype.hasOwnProperty.call(list[0], 'published')
        ) {
          list = list.filter((x) => x?.published === true);
        }

        // 2) Fetch details for each listing
        // If one request fails, catch and ignore it (return null)
        const details = await Promise.all(
          list.map((x) => api.getListing(x.id).catch(() => null))
        );
        const map = new Map();
        details.forEach((d, i) => d && map.set(list[i].id, d));

        // 3) If user is logged in, fetch all bookings to determine priority
        let myBookings = [];
        let myEmail = '';

        if (token) {
          try {
            const b = await api.getBookingDetails(token);
            myBookings = b?.bookings || [];
          } catch {
            // Ignore booking fetch errors so that listing page still works
          }

          // Try to get user email from localStorage, fallback to decoding JWT
          const saved = (localStorage.getItem('userEmail') || '').toLowerCase();
          const decoded = (decodeEmailFromJWT(token) || '').toLowerCase();
          myEmail = saved || decoded;
        }

        // 4) Merge base + detail + computed fields
        const merged = list.map((b) => {
          // Full detail for this listing
          const d = map.get(b.id);

          // Bookings created by current user for this listing
          const relatedBookings = myBookings.filter(
            (x) =>
              x.listingId === b.id &&
              String(x.owner || x.user || x.email || '')
                .toLowerCase() === myEmail
          );

          // Priority: listing should be pinned if there's at least one
          // accepted or pending booking.
          const hasPriority = relatedBookings.some((x) =>
            ['accepted', 'pending'].includes(x.status)
          );

          return {
            base: b,
            detail: d,
            rating: getRating(d),
            reviews: getTotalReviews(d),
            availability: d?.listing?.availability || [],
            bedrooms: Number(d?.listing?.metadata?.bedrooms ?? 0),
            hasPriority,
          };
        });

        // Only keep listings that are actually published.
        // Use detail.listing.published if available; otherwise fallback to base.published.
        const onlyPublished = merged.filter(
          (m) =>
            m?.detail?.listing?.published === true ||
            m?.base?.published === true
        );

        setAll(onlyPublished);
      } catch (e) {
        // Show a unified error modal and keep the page visible
        showError(e);
      } finally {
        // Done loading in any case (success or failure)
        setLoading(false);
      }
    })();
  }, [token]);

  /**
   * Derived view data:
   * - Apply all filters (text, bedrooms, price, date range)
   * - Sort by:
   *   1) hasPriority: true listings go to the top
   *   2) rating (asc/desc) if selected
   *   3) fallback alphabetical order by title
   */
  const viewData = React.useMemo(() => {
    // Split query string into words and normalize to lowercase
    const words = q
      .trim()
      .toLowerCase()
      .split(/\s+/)
      .filter(Boolean);

    return all
      .filter((x) => {
        // Text search: in title or city
        const title = (x.base?.title || '').toLowerCase();
        const city = (x.detail?.listing?.address?.city || '').toLowerCase();
        const okText =
          words.length === 0 ||
          words.every((w) => title.includes(w) || city.includes(w));

        // Bedrooms range filter
        const okBr =
          (brMin == null || x.bedrooms >= brMin) &&
          (brMax == null || x.bedrooms <= brMax);

        // Price range filter (use detail price first, fallback to base price)
        const price = Number(
          x.detail?.listing?.price ?? x.base?.price ?? 0
        );
        const okPrice =
          (priceMin == null || price >= priceMin) &&
          (priceMax == null || price <= priceMax);

        // Date range filter: check whether selected range is covered by availability
        const okDate =
          !dateRange ||
          isRangeCovered(x.detail?.listing?.availability, dateRange);

        // Only listings satisfying all conditions are kept
        return okText && okBr && okPrice && okDate;
      })
      .sort((a, b) => {
        // Priority sort: listings with hasPriority go first
        if (a.hasPriority !== b.hasPriority) {
          return a.hasPriority ? -1 : 1;
        }

        // Rating sort (descending, higher rating first)
        if (rateOrder === 'desc') {
          return b.rating - a.rating;
        }

        // Rating sort (ascending, lower rating first)
        if (rateOrder === 'asc') {
          return a.rating - b.rating;
        }

        // Fallback: alphabetical order by title
        return (a.base?.title || '').localeCompare(
          b.base?.title || ''
        );
      });
  }, [
    all,
    q,
    brMin,
    brMax,
    priceMin,
    priceMax,
    dateRange,
    rateOrder,
  ]);

  /**
   * Open listing detail page:
   * - Navigate to /listing/:id
   * - Pass current selected date range via route state
   *   so that detail page can pre-fill the RangePicker.
   */
  const openDetail = (id, pickedRange) => {
    nav(`/listing/${id}`, {
      state: { fromDates: pickedRange || null },
    });
  };

  return (
    <>
      {/* Page header with title; can be extended with more actions later */}
      <HeaderBar>
        <PageTitle level={4}>Listings</PageTitle>
      </HeaderBar>

      {/* Search / filter bar */}
      <ListingsSearchBar
        q={q}
        onQ={setQ}
        brMin={brMin}
        onBrMin={setBrMin}
        brMax={brMax}
        onBrMax={setBrMax}
        priceMin={priceMin}
        onPriceMin={setPriceMin}
        priceMax={priceMax}
        onPriceMax={setPriceMax}
        dateRange={dateRange}
        onDateRange={setDateRange}
        rateOrder={rateOrder}
        onRateOrder={setRateOrder}
        onSubmit={() => message.success('Filters applied')}
      />

      {/* Main listing grid */}
      <ListingsGrid
        loading={loading}
        data={viewData}
        dateRange={dateRange}
        onOpenDetail={openDetail}
      />
    </>
  );
}
