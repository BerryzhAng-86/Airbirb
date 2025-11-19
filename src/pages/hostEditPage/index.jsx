// src/pages/hosted/HostedEditPage.jsx
import React from 'react';
import { Typography, Spin, message } from 'antd';
import { useNavigate, useParams, useBeforeUnload } from 'react-router-dom';
import { api } from '../../uitles/api';
import { showError } from '../../componemts/showError';
import ListingForm from '../../componemts/listingForm';
import ListingEditorCard from '../../uitles/listingEditorCardCss';
import useListingDetail from '../../componemts/useListingDetail';
import useDebouncedCallback from '../../componemts/useDebouncedCallback';
import {
  buildPayloadPreserveImages,
  finalizePayload,
  isComplete,
} from '../../componemts/editPayload';

const { Title } = Typography;

const DRAFT_KEY = 'airbrb_edit_draft';

/**
 * HostedEditPage
 *
 * Edit page for an existing listing:
 * - Loads listing detail by ID
 * - Provides a form to edit the listing
 * - Auto-saves changes (debounced) to both backend and localStorage
 * - Supports manual "Save" which finalises and navigates back to list
 */
export default function HostedEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Load listing detail (with internal loading/error handling)
  const { loading, detail } = useListingDetail(id, { onError: showError });

  // Tracking explicit submit state (manual Save button)
  const [submitting, setSubmitting] = React.useState(false);

  /**
   * Autosave handler.
   * ListingForm's onValuesChange passes (form, allValues), but here we only use `form`.
   * The debounced function:
   *  1. Reads all current form values
   *  2. Writes a lightweight draft to localStorage (no base64 blobs)
   *  3. Builds a payload (preserving existing images)
   *  4. If the payload is "complete", sends a silent update to the backend
   */
  const autosave = useDebouncedCallback(
    async (form /* , allValues */) => {
      try {
        const values = form.getFieldsValue(true);

        // Lightweight draft object for localStorage (avoid storing base64 images)
        const { metadata, thumbnail, ...light } = values;
        const draft = {
          ...light,
          address: values.address,
          metadata: { ...metadata },
          // Only store a small part of the thumbnail string to avoid large size
          thumbnail:
            typeof thumbnail === 'string' ? thumbnail.slice(0, 64) : '',
        };

        // Best-effort: store draft in localStorage; do not break autosave if it fails
        try {
          localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
        } catch (e) {
          showError(e);
        }

        // Build full payload while preserving existing images on the server
        const payload = await buildPayloadPreserveImages(
          form,
          values,
          detail
        );

        // If required fields are not complete, do not send to backend yet
        if (!isComplete(payload)) return;

        const token = localStorage.getItem('token');
        if (!token) return;

        // Silent update – no UI message on success
        await api.updateListing(token, id, payload);
      } catch {
        // Ignore errors in autosave to avoid interrupting user editing
      }
    },
    600 // debounce delay (ms)
  );

  /**
   * Try to flush any pending autosave when the component unmounts.
   */
  React.useEffect(
    () => () => {
      try {
        autosave.flush?.();
      } catch (e) {
        showError(e);
      }
    },
    [autosave]
  );

  /**
   * Try to flush autosave when the user refreshes or closes the tab.
   */
  useBeforeUnload(
    React.useCallback(() => {
      try {
        autosave.flush?.();
      } catch (e) {
        showError(e);
      }
    }, [autosave])
  );

  /**
   * Manual "Save" handler.
   * ListingForm calls this with a prepared payloadFromForm.
   * We:
   *  - Finalise the payload,
   *  - Send update request,
   *  - Cancel autosave,
   *  - Navigate back to the hosted list.
   */
  const handleSave = async (payloadFromForm) => {
    const token = localStorage.getItem('token');
    const payload = finalizePayload(payloadFromForm);

    setSubmitting(true);
    try {
      await api.updateListing(token, id, payload);
      message.success('Saved');
      // Stop any further autosave after a successful manual save
      autosave.cancel?.();
      navigate('/hosted');
    } catch (e) {
      showError(e);
    } finally {
      setSubmitting(false);
    }
  };

  // While loading or before detail is ready, show a centered spinner
  if (loading || !detail)
    return (
      <Spin style={{ display: 'block', margin: '48px auto' }} />
    );

  /**
   * Map backend listing structure to form initial values.
   * This keeps ListingForm decoupled from API response format.
   */
  const initialValues = {
    title: detail.listing.title,
    price: detail.listing.price,
    thumbnail: detail.listing.thumbnail,
    address: {
      city: detail?.listing.address?.city || '',
    },
    metadata: {
      type: detail?.listing.metadata?.type || 'entire',
      bedrooms: detail?.listing.metadata?.bedrooms ?? 0,
      beds: detail?.listing.metadata?.beds ?? 1,
      bathrooms: detail?.listing.metadata?.bathrooms ?? 1,
      images: Array.isArray(detail?.listing.metadata?.images)
        ? detail.listing.metadata.images
        : [],
      amenities: Array.isArray(detail?.listing.metadata?.amenities)
        ? detail.listing.metadata.amenities
        : [],
    },
  };

  return (
    <ListingEditorCard>
      <Title level={4}>Edit Listing</Title>
      <ListingForm
        initialValues={initialValues}
        // Trigger autosave on any field change
        onValuesChange={autosave}
        // Manual submit handler (Save button)
        onSubmit={handleSave}
        submitting={submitting}
      />
    </ListingEditorCard>
  );
}
