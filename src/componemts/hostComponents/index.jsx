import { api } from "../../uitles/api";

/**
 * Normalise different upload-like values into a single string URL.
 * Supports:
 * - plain string (url / base64)
 * - Ant Design Upload value with fileList
 * - objects with `url` / `thumbUrl`
 */
export const toStr = (x) =>
  typeof x === 'string'
    ? x
    : x?.fileList?.[0]?.thumbUrl || x?.url || x?.thumbUrl || '';

/**
 * Map an array of upload-like values into a clean string[] of URLs.
 */
const toStrArr = (arr) =>
  Array.isArray(arr) ? arr.map(toStr).filter(Boolean) : [];

/**
 * Compute the average rating from a reviews array.
 * If there are no reviews, returns 0.
 */
export const getRatingAvg = (reviews) => {
  const rs = Array.isArray(reviews) ? reviews : [];
  if (!rs.length) return 0;
  const sum = rs.reduce((a, b) => a + Number(b?.score || 0), 0);
  return sum / rs.length;
};

/**
 * Build a de-duplicated list of images for a listing card.
 * - first use the thumbnail (if any)
 * - then append additional metadata.images
 */
export const getCardImages = (item) => {
  const cover = toStr(item.thumbnail);
  const imgs = toStrArr(item?.metadata?.images);
  return Array.from(new Set([cover, ...imgs].filter(Boolean)));
};

/**
 * Fetch full listing details for a shallow list and enrich each item.
 *
 * For each listing:
 * - merges metadata from the detail endpoint
 * - attaches reviews
 * - normalises price, published flag and thumbnail
 * - exposes convenient top-level fields (type, beds, bathrooms)
 *
 * Any detail request that fails is simply skipped and the original
 * list item is returned unchanged.
 */
export const enrichWithDetails = async (list) => {
  const ids = (list || []).map((x) => x.id);

  const details = await Promise.all(
    ids.map((id) => api.getListing(id).catch(() => null))
  );

  const map = new Map();
  details.forEach((d, i) => {
    if (d && d.listing) {
      map.set(ids[i], d.listing);
    }
  });

  return (list || []).map((item) => {
    const det = map.get(item.id);
    if (!det) return item;

    return {
      ...item,
      metadata: det.metadata || item.metadata || {},
      reviews: det.reviews || [],
      price: typeof det.price === 'number' ? det.price : item.price,
      published:
        typeof det.published === 'boolean' ? det.published : item.published,
      thumbnail: item.thumbnail || det.thumbnail,
      type: det?.metadata?.type,
      beds: det?.metadata?.beds,
      bathrooms: det?.metadata?.bathrooms,
    };
  });
};

/**
 * Decode a JWT and try to extract the email (or user) field
 * from the payload. Returns an empty string if decoding fails.
 */
export function decodeEmailFromJWT(t) {
  try {
    const payload = JSON.parse(atob(String(t || '').split('.')[1]));
    return (payload?.email || payload?.user || '').toString();
  } catch {
    return '';
  }
}
