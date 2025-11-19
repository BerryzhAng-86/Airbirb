// src/utils/editPayload.js
import { DEFAULT_COVER_URL } from '../../uitles/defaultImage/index';
import { toStr } from '../../componemts/hostComponents';

/**
 * Safe getter: walk an object by a path array and
 * return `undefined` if any intermediate key is missing.
 */
export const get = (obj, pathArr) =>
  pathArr.reduce((o, k) => (o ? o[k] : undefined), obj);

/**
 * Normalise and clean amenities:
 * - keep only strings
 * - trim whitespace
 * - drop empty values
 * - deduplicate
 * - hard-cap the list length to avoid huge payloads
 */
export const sanitizeAmenities = (raw) => {
  if (!Array.isArray(raw)) return [];
  const cleaned = raw
    .map((x) => (typeof x === 'string' ? x.trim() : ''))
    .filter(Boolean);
  return Array.from(new Set(cleaned)).slice(0, 50);
};

/**
 * Normalise Upload component value to a string[] of
 * base64 data URLs or remote URLs.
 *
 * Supported input shapes:
 * - string[]
 * - Ant Design `fileList`
 * - raw File / Blob objects
 */
export const normalizeImages = async (val) => {
  if (!val) return [];
  const fileList = val?.fileList ?? val;
  const out = [];

  for (const f of fileList) {
    // Already a plain string (url or base64)
    if (typeof f === 'string') {
      out.push(f);
      continue;
    }

    // Reuse existing url / thumbUrl when possible
    if (f?.url || f?.thumbUrl) {
      out.push(f.url || f.thumbUrl);
      continue;
    }

    // Fallback: read File/Blob as base64 data URL
    const raw = f?.originFileObj || f;
    const b64 = await new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(r.result);
      r.onerror = rej;
      r.readAsDataURL(raw);
    });
    out.push(b64);
  }

  return out;
};

// Name path to the images field in the form
const IMAGES_FIELD = ['metadata', 'images'];

// Thin wrapper around AntD's isFieldsTouched with a name path
const isTouched = (form, namePath) =>
  form?.isFieldsTouched?.([namePath], true);

/**
 * Build the payload for update while preserving existing images.
 *
 * - If the `images` form field was touched, normalise the new value.
 * - Otherwise, keep the images from the original backend detail.
 * - Always recompute thumbnail, amenities and basic numeric fields.
 */
export const buildPayloadPreserveImages = async (
  form,
  values,
  originalDetail,
) => {
  const imagesTouched = isTouched(form, IMAGES_FIELD);

  let images;
  if (imagesTouched) {
    images = await normalizeImages(get(values, IMAGES_FIELD));
  } else {
    images = Array.isArray(originalDetail?.listing?.metadata?.images)
      ? originalDetail.listing.metadata.images
      : [];
  }

  const thumbnail =
    toStr(values?.thumbnail) ||
    images?.[0] ||
    DEFAULT_COVER_URL;

  const amenities = sanitizeAmenities(values?.metadata?.amenities);

  return {
    title: values?.title?.trim() || '',
    address: {
      city: values?.address?.city?.trim() || '',
    },
    price: Number(values?.price || 0),
    thumbnail,
    metadata: {
      type: values?.metadata?.type || 'entire',
      bedrooms: Number(values?.metadata?.bedrooms ?? 0),
      beds: Number(values?.metadata?.beds ?? 1),
      bathrooms: Number(values?.metadata?.bathrooms ?? 1),
      images,
      amenities,
    },
  };
};

/**
 * Quick completeness check for a listing payload.
 * Used to decide if a listing can be considered "ready".
 */
export const isComplete = (p) =>
  !!p.title &&
  p.price >= 1 &&
  !!p.address?.city &&
  !!p.metadata?.type &&
  p.metadata?.beds >= 1 &&
  p.metadata?.bathrooms >= 1 &&
  p.metadata?.bedrooms >= 0;

/**
 * Final payload normalisation before submitting:
 * - ensure there is always a thumbnail (fallback to default)
 * - re-run amenities sanitisation as a last safety net
 */
export const finalizePayload = (payload) => ({
  ...payload,
  thumbnail: payload.thumbnail || DEFAULT_COVER_URL,
  metadata: {
    ...payload.metadata,
    amenities: sanitizeAmenities(payload?.metadata?.amenities),
  },
});
