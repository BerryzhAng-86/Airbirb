// pages/hosted/HostedCreatePage.jsx
import React from 'react';
import { Card, Typography, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { api } from '../../uitles/api';
import { showError } from '../../componemts/showError';
import ListingForm from '../../componemts/listingForm';
import { DEFAULT_COVER_URL } from '/src/uitles/defaultImage';
import { toStr } from '../../componemts/hostComponents';
import { styled } from 'styled-components';

const { Title } = Typography;

const DRAFT_KEY = 'airbrb_create_draft';

// Card wrapper: centered, with a max width
const CardContainer = styled(Card)`
  max-width: 720px;
  margin: 24px auto;
`;

/**
 * Convert an Upload `fileList` (or array) into an array of strings.
 * Lightweight strategy: prefer existing `url` / `thumbUrl`;
 * if not available, read `originFileObj` as base64.
 */
const fileListToStrings = async (val) => {
  if (!val) return [];
  const files = val.fileList || val;
  const out = [];

  for (const f of files) {
    // Already a string
    if (typeof f === 'string') {
      out.push(f);
      continue;
    }
    // Already has URL / thumbUrl
    if (f.url || f.thumbUrl) {
      out.push(f.url || f.thumbUrl);
      continue;
    }

    // Fallback: read the File/Blob as base64
    const file = f.originFileObj || f;
    const b64 = await new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(r.result);
      r.onerror = rej;
      r.readAsDataURL(file);
    });
    out.push(b64);
  }
  return out;
};

/**
 * Clean and normalise the "amenities" list from form values.
 * - Keep only strings
 * - Trim whitespace
 * - Remove empty items
 * - Deduplicate
 * - Optionally limit length (here: max 50)
 */
const sanitizeAmenities = (raw) => {
  if (!Array.isArray(raw)) return [];
  const cleaned = raw
    .map((x) => (typeof x === 'string' ? x.trim() : ''))
    .filter(Boolean);
  return Array.from(new Set(cleaned)).slice(0, 50);
};

/**
 * Build request payload from form values.
 * This should stay consistent with your existing API format.
 */
const buildPayload = async (values) => {
  const images = await fileListToStrings(values.images);
  const amenities = sanitizeAmenities(values?.metadata?.amenities);

  const payload = {
    title: values.title?.trim() || '',
    address: { city: values?.address?.city?.trim() || '' },
    price: Number(values.price || 0),
    // Thumbnail: prefer explicit thumbnail, then first image, then default cover
    thumbnail: toStr(values.thumbnail) || images[0] || DEFAULT_COVER_URL,
    metadata: {
      type: values?.metadata?.type || 'entire',
      bedrooms: Number(values?.metadata?.bedrooms ?? 0),
      beds: Number(values?.metadata?.beds ?? 1),
      bathrooms: Number(values?.metadata?.bathrooms ?? 1),
      images,
      amenities, // Facilities list
    },
  };
  return payload;
};

/**
 * Check whether all required fields are present.
 * Only when this returns true should we send the payload to the backend.
 */
const isComplete = (p) =>
  !!p.title &&
  p.price >= 1 &&
  !!p.address.city &&
  !!p.metadata?.type &&
  p.metadata?.beds >= 1 &&
  p.metadata?.bathrooms >= 1 &&
  p.metadata?.bedrooms >= 0;

/**
 * Page for creating a new hosted listing.
 * - Uses a form component for the main fields
 * - Supports local draft in localStorage
 * - Creates or updates a draft listing on the server
 */
export default function HostedCreatePage() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = React.useState(false);
  const [draftId, setDraftId] = React.useState(null);
  const token =
    typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null;

  // On first render, read draft data from localStorage as initialValues
  const [initialDraft] = React.useState(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      return raw ? JSON.parse(raw) : undefined;
    } catch {
      return undefined;
    }
  });

  // NOTE: Auto-save logic could go here:
  // always write to localStorage, and only call backend when `isComplete(payload)` is true.

  /**
   * Manual "Save and return" handler.
   * Uses the same payload building / validation as auto-save.
   */
  const handleCreate = async (values) => {
    setSubmitting(true);
    try {
      const payload = await buildPayload(values);

      // Basic validation of required fields
      if (!isComplete(payload)) {
        message.warning('Please complete all required fields before saving.');
        setSubmitting(false);
        return;
      }

      // If we don't have a draftId yet, create a new listing;
      // otherwise, update the existing draft listing.
      if (!draftId) {
        const res = await api.createListing(token, payload);
        const newId = res?.listingId ?? res?.id;
        if (newId) setDraftId(newId);
      } else {
        await api.updateListing(token, draftId, payload);
      }

      // On success, clear local draft and navigate back to hosted list
      localStorage.removeItem(DRAFT_KEY);
      message.success('Saved');
      navigate('/hosted');
    } catch (e) {
      showError(e);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <CardContainer>
      <Title level={4}>Create Listing</Title>
      <ListingForm
        // Local draft as initial form values (may be undefined)
        initialValues={initialDraft}
        onSubmit={handleCreate}
        submitting={submitting}
        // Form changes → local draft + conditional backend save (if implemented)
      />
    </CardContainer>
  );
}
