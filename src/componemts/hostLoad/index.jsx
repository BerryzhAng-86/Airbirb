// src/services/hostedLoad.js
import dayjs from 'dayjs';
import { api } from '../../uitles/api';
import { enrichWithDetails, decodeEmailFromJWT } from '../hostComponents';

/**
 * Utility: build a 31-day cumulative revenue series.
 *
 * Logic:
 * - Each accepted booking is treated as revenue on the check-in date (start).
 * - For the last 31 days (today = 0, yesterday = 1, ...), we:
 *   - add that booking's total to its check-in day bucket
 *   - then run a reverse cumulative sum from 30 days ago up to today
 *     so `series[i]` = total revenue from day i (inclusive) to today.
 */
function buildSeriesFromBookings(acceptedMine, priceMap) {
  const today = dayjs().startOf('day');
  const parseDay = (iso) =>
    (dayjs.utc ? dayjs.utc(iso).local().startOf('day') : dayjs(iso).startOf('day'));

  const dailyAdd = new Array(31).fill(0);

  for (const bk of acceptedMine) {
    const s = parseDay(bk?.dateRange?.start);
    const e = parseDay(bk?.dateRange?.end);
    if (!s.isValid() || !e.isValid() || !e.isAfter(s)) continue;

    const nights = Math.max(0, e.diff(s, 'day'));
    const listedPrice = priceMap.get(String(bk.listingId)) || 0;
    const total = Number.isFinite(Number(bk.totalPrice))
      ? Number(bk.totalPrice)
      : listedPrice * nights;

    // today = 0, yesterday = 1, ... up to 30 days ago
    const diff = today.diff(s, 'day');
    if (diff >= 0 && diff <= 30) {
      dailyAdd[diff] += total;
    }
  }

  // Reverse cumulative sum: from 30 days ago up to today
  const series = Array.from({ length: 31 }, (_, d) => ({ d, amount: 0 }));
  let acc = 0;
  for (let i = 30; i >= 0; i--) {
    acc += dailyAdd[i];
    series[i].amount = acc;
  }
  return series;
}

/**
 * Pure function: fetch "my hosted listings + bookings" and return:
 * {
 *   listings,  // enriched hosted listings (details + reviews, etc.)
 *   series,    // 31-day cumulative revenue series for accepted bookings
 *   myEmail,   // resolved owner email (from localStorage / JWT)
 * }
 */
export async function fetchHostedSummary({ token }) {
  // 1) Fetch all published listings
  const res = await api.listPublished();
  let list = res?.listings || [];

  // 2) Resolve my email (localStorage first, then JWT payload)
  const saved = (localStorage.getItem('userEmail') || '').toLowerCase();
  const decoded = (decodeEmailFromJWT(token) || '').toLowerCase();
  const myEmail = saved || decoded;

  // 3) Filter to only my hosted listings
  if (myEmail) {
    list = list.filter(
      (x) => String(x.owner || '').toLowerCase() === myEmail
    );
  } else {
    list = [];
  }

  // 4) Enrich with full listing details (metadata, reviews, etc.)
  const full = await enrichWithDetails(list);

  // 5) Fetch all bookings for the current user
  let allBookings = [];
  try {
    const resp = await api.getBookingDetails(token);
    allBookings = Array.isArray(resp?.bookings) ? resp.bookings : [];
  } catch {
    allBookings = [];
  }

  // 6) Keep only accepted bookings
  let acceptedMine = allBookings.filter((bk) => bk.status === 'accepted');

  // 7) Double-check bookings actually belong to me via listingId -> owner
  const uniqListingIds = Array.from(
    new Set(acceptedMine.map((bk) => String(bk.listingId)))
  );
  const ownerByListingId = new Map();

  await Promise.all(
    uniqListingIds.map(async (lid) => {
      try {
        const det = await api.getListing(lid);
        const listing = det?.listing || det || {};
        const owner = String(
          listing.owner || listing?.metadata?.owner || ''
        ).toLowerCase();
        ownerByListingId.set(lid, owner);
      } catch {
        ownerByListingId.set(lid, '');
      }
    })
  );

  acceptedMine = acceptedMine.filter(
    (bk) => (ownerByListingId.get(String(bk.listingId)) || '') === myEmail
  );

  // 8) Build price map and revenue series for my accepted bookings
  const priceMap = new Map(
    full.map((x) => [String(x.id), Number(x.price || 0)])
  );
  const series = buildSeriesFromBookings(acceptedMine, priceMap);

  return { listings: full, series, myEmail };
}
