// src/uitles/listingsUtils.js
import dayjs from 'dayjs';


export const getTotalReviews = (detail) =>
  Array.isArray(detail?.listing?.reviews) ? detail.listing.reviews.length : 0;

export const getRating = (detail) => {
  const rs = detail?.listing?.reviews || [];
  if (!rs.length) return 0;
  const sum = rs.reduce((a, b) => a + Number(b?.score || 0), 0);
  return sum / rs.length;
};


export const isRangeCovered = (ranges, [s, e]) => {
  if (!Array.isArray(ranges) || !s || !e) return true; // 没选日期视为通过
  const S = s.startOf('day').valueOf();
  const E = e.endOf('day').valueOf();
  return ranges.some((r) => {
    const rs = dayjs(r.start).startOf('day').valueOf();
    const re = dayjs(r.end).endOf('day').valueOf();
    return rs <= S && re >= E;
  });
};


export function decodeEmailFromJWT(t) {
  try {
    const payload = JSON.parse(atob(String(t || '').split('.')[1]));
    return (payload?.email || payload?.user || '').toString();
  } catch {
    return '';
  }
}
