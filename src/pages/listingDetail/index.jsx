// src/pages/ListingDetailPage.jsx
import React from 'react';
import styled from 'styled-components';
import { Card, Typography, Space, Tag, List, Button, DatePicker, InputNumber, Input, message, Image, Divider, Alert } from 'antd';
import { useLocation, useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';

dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);
dayjs.extend(relativeTime);

import { api } from '../../uitles/api';
import { showError } from '../../componemts/showError';
import { toStr } from '../../componemts/hostComponents';

const { RangePicker } = DatePicker;
const { Title, Text, Paragraph } = Typography;

/* ===================== styled-components ===================== */

// Outer wrapper card for the entire listing detail page
const PageCard = styled(Card)`
  max-width: 980px;
  margin: 24px auto;
`;

// Top-level Space used as main vertical layout container
const FullWidthSpace = styled(Space)`
  width: 100%;
`;

// Grid layout for listing images
const ImageGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-top: 12px;
`;

// Styled image for gallery items
const GalleryImage = styled(Image)`
  width: 100%;
  height: 220px;
  object-fit: cover;
`;

// Info section under title (address / price / rooms / amenities)
const InfoSection = styled(Space)`
  margin-top: 8px;
`;

// Card sections with consistent top margin (availability, booking, reviews)
const SectionCard = styled(Card)`
  margin-top: 12px;
`;

// Alert under booking form
const WarningAlert = styled(Alert)`
  margin-top: 12px;
`;

// Container for "Your bookings for this listing" section
const MyBookingsWrapper = styled.div`
  margin-top: 12px;
`;

// Divider between review items
const ReviewDivider = styled(Divider)`
  margin: 8px 0;
`;

// Loading placeholder container
const LoadingContainer = styled.div`
  margin: 48px;
  text-align: center;
`;

/* ===================== helpers (outside component) ===================== */

/**
 * Compute the number of nights between two dayjs dates.
 * Dates are normalized to the start of the day before diff.
 * @param {dayjs.Dayjs} s - start date (check-in)
 * @param {dayjs.Dayjs} e - end date (check-out)
 * @returns {number} number of nights (>= 0)
 */

const nightsBetween = (s, e) => Math.max(0, e.startOf('day').diff(s.startOf('day'), 'day'));
function currentUserEmail(token) {
  const saved = (localStorage.getItem('userEmail') || '').toLowerCase();
  if (saved) return saved;

  try {
    // Decode JWT payload: header.payload.signature
    const payload = JSON.parse(atob(String(token || '').split('.')[1]));
    return (payload?.email || payload?.user || '').toString().toLowerCase();
  } catch {
    // If anything goes wrong, just fallback to empty string
    return '';
  }
}

/* ===================== main component ===================== */

export default function ListingDetailPage() {
  // Listing ID from route params
  const { id } = useParams();

  // Token from localStorage (SSR safe-guard)
  const token =
    typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null;

  // Location state: might contain default date range from previous page
  const loc = useLocation();
  const fromDates = loc.state?.fromDates || null;

  // Listing detail fetched from backend
  const [detail, setDetail] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  // Booking-related state: selected date range + guest count
  const [dates, setDates] = React.useState(fromDates || null);
  const [guest, setGuest] = React.useState(1);

  // Review-related state:
  // - myBookings: bookings for this listing created by current user
  // - score: rating value (1-5)
  // - comment: text content of review
  const [myBookings, setMyBookings] = React.useState([]);
  const [score, setScore] = React.useState(5);
  const [comment, setComment] = React.useState('');

  /**
   * Effect: load listing detail and "my bookings" once id/token changes.
   * - Always fetch listing detail by ID
   * - If logged in, also fetch all booking details and filter out only
   *   bookings of the current user for this specific listing.
   */
  React.useEffect(() => {
    (async () => {
      try {
        // Fetch listing detail
        const d = await api.getListing(id);
        setDetail(d);

        // If user has token, fetch booking info and filter "mine"
        if (token) {
          const b = await api.getBookingDetails(token);
          const me = currentUserEmail(token);
          const mine = (b?.bookings || []).filter(
            (x) =>
              String(x.listingId) === String(id) &&
              String(x.owner || x.user || x.email || '').toLowerCase() === me
          );
          setMyBookings(mine);
        } else {
          // If not logged in, no personal bookings for this listing
          setMyBookings([]);
        }
      } catch (e) {
        showError(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [id, token]);

  // Short-hand for listing object (backend returns { listing: {...} })
  const L = detail?.listing || {};

  // Nightly price (ensuring number)
  const pricePerNight = Number(L.price || 0);

  /**
   * Images for gallery:
   * - Use thumbnail + metadata.images[]
   * - Normalize all URLs via toStr and dedupe via Set
   */
  const imgs = React.useMemo(() => {
    const thumb = toStr(L?.thumbnail);
    const extras = Array.isArray(L?.metadata?.images)
      ? L.metadata.images.map(toStr)
      : [];
    return Array.from(new Set([thumb, ...extras].filter(Boolean)));
  }, [L]);

  /**
   * Average rating of listing:
   * - If no reviews, rating = 0
   * - Otherwise sum up scores and divide by count
   */
  const rating = React.useMemo(() => {
    const rs = L?.reviews || [];
    if (!rs.length) return 0;
    return rs.reduce((a, b) => a + Number(b.score || 0), 0) / rs.length;
  }, [L]);

  /**
   * Published date text:
   * - Try multiple fields for backward compatibility
   * - Show formatted date and relative time (e.g. "2 days ago")
   */
  const publishedAt = L?.publishedOn || L?.postedOn || L?.createdAt || null;
  const publishedText = publishedAt
    ? `${dayjs(publishedAt).format('YYYY-MM-DD HH:mm')} (${dayjs(
      publishedAt
    ).fromNow()})`
    : '—';

  /**
   * Availability ranges:
   * - Normalize raw availability to dayjs objects
   * - Filter invalid ranges
   * - Sort by start date
   * - Merge overlapping and adjacent ranges (within 1 day)
   */
  const availRanges = React.useMemo(() => {
    const raw = Array.isArray(L?.availability) ? L.availability : [];

    // Normalize to dayjs and filter invalid input
    const xs = raw
      .map((r) => ({
        s: dayjs(r.start).startOf('day'),
        e: dayjs(r.end).endOf('day'),
      }))
      .filter((r) => r.s.isValid() && r.e.isValid() && r.e.isAfter(r.s));

    // Sort by start date
    xs.sort((a, b) => a.s.valueOf() - b.s.valueOf());

    // Merge overlapping / adjacent ranges
    const out = [];
    for (const r of xs) {
      if (!out.length) {
        out.push({ ...r });
      } else {
        const last = out[out.length - 1];
        // If current start is within 1 day after last end, merge
        if (r.s.diff(last.e, 'day') <= 1) {
          if (r.e.isAfter(last.e)) last.e = r.e;
        } else {
          out.push({ ...r });
        }
      }
    }
    return out;
  }, [L]);

  /**
   * Disable dates in the RangePicker that are not in any available range.
   * - If no availability is provided, we allow all dates.
   * - Otherwise, a date is enabled only if it falls in at least one range.
   */
  const disabledDate = React.useCallback(
    (d) => {
      if (!availRanges.length) return false; // No constraints
      const day = d.startOf('day');
      return !availRanges.some(
        (r) => day.isSameOrAfter(r.s) && day.isSameOrBefore(r.e)
      );
    },
    [availRanges]
  );

  /**
   * Check if currently selected date range is fully inside any
   * single availability range.
   * - S: check-in (inclusive)
   * - E: check-out (exclusive, hence +1 day when compared with r.e)
   */
  const isSelectedInsideAvail = React.useMemo(() => {
    if (!dates || !dates[0] || !dates[1]) return true; // Not selected yet -> no error
    const S = dates[0].startOf('day');
    const E = dates[1].startOf('day');
    return availRanges.some((r) =>
      S.isSameOrAfter(r.s) && E.isSameOrBefore(r.e.add(1, 'day'))
    );
  }, [dates, availRanges]);

  // Show simple loading placeholder while fetching data
  if (loading) {
    return (
      <LoadingContainer>
        Loading...
      </LoadingContainer>
    );
  }

  /**
   * Handle booking:
   * - Require login
   * - Require valid dates inside availability
   * - Compute total price based on nights * pricePerNight
   * - Call createBookings API
   * - Refresh only "my bookings" for this listing on success
   */
  const onBook = async () => {
    if (!token) return message.warning('Please log in first');
    if (!dates || !dates[0] || !dates[1])
      return message.warning('Select dates');
    if (!isSelectedInsideAvail)
      return message.error('Selected dates are outside availability.');

    const nights = nightsBetween(dates[0], dates[1]);
    if (nights <= 0)
      return message.warning('End date must be after start date.');

    const total = nights * pricePerNight;
    try {
      await api.createBookings(
        token,
        id,
        { start: dates[0].toISOString(), end: dates[1].toISOString() },
        total
      );
      message.success('Booking requested');

      // Refresh only current user's bookings for this listing
      const b = await api.getBookingDetails(token);
      const me = currentUserEmail(token);
      const mine = (b?.bookings || []).filter(
        (x) =>
          String(x.listingId) === String(id) &&
          String(x.owner || x.user || x.email || '').toLowerCase() === me
      );
      setMyBookings(mine);
    } catch (e) {
      showError(e);
    }
  };

  /**
   * Handle review submission:
   * - Require login
   * - Require at least one accepted booking for this listing
   * - Call addReview API and then refresh listing detail
   */
  const onReview = async () => {
    if (!token) return message.warning('Please log in first');

    // Only allow review if user has at least one accepted booking
    const accepted = myBookings.find((x) => x.status === 'accepted');
    if (!accepted)
      return message.warning('You can review after one booking is accepted.');

    try {
      await api.addReview(token, id, accepted.id, {
        score: Number(score),
        comment,
      });
      message.success('Review posted');

      // Refresh listing detail to show new review
      const d = await api.getListing(id);
      setDetail(d);
      setComment('');
    } catch (e) {
      showError(e);
    }
  };

  /**
   * Price text next to basic info:
   * - If user already selected a date range, show total price per stay
   * - Otherwise, show price per night
   */
  const priceText = (() => {
    if (dates && dates[0] && dates[1]) {
      const nights = nightsBetween(dates[0], dates[1]);
      return `$${nights * pricePerNight} per stay`;
    }
    return `$${pricePerNight} per night`;
  })();

  return (
    <PageCard>
      <FullWidthSpace direction="vertical" size={8}>
        {/* ===== Title + tags row ===== */}
        <Title level={3} style={{ marginBottom: 0 }}>
          {L.title}
        </Title>

        <Space wrap size="small">
          <Tag color="gold">⭐ {rating.toFixed(1)}</Tag>
          <Tag>{(L.reviews || []).length} reviews</Tag>
          <Tag>{L?.metadata?.type || 'entire'}</Tag>
          <Tag color="default">Published: {publishedText}</Tag>
        </Space>

        {/* ===== Image gallery ===== */}
        {imgs.length > 0 && (
          <Image.PreviewGroup>
            <ImageGrid>
              {imgs.map((src, i) => (
                <GalleryImage key={i} src={src} alt={`img-${i}`} />
              ))}
            </ImageGrid>
          </Image.PreviewGroup>
        )}

        {/* ===== Basic info (address / price / rooms / amenities) ===== */}
        <InfoSection direction="vertical" size="small">
          <Text>
            {L?.address?.street
              ? `${L.address.street}, ${L?.address?.city || ''}`
              : L?.address?.city || ''}
          </Text>
          <Text strong>{priceText}</Text>
          <Text>
            Bedrooms: {L?.metadata?.bedrooms ?? 0} | Beds:{' '}
            {L?.metadata?.beds ?? 1} | Bathrooms:{' '}
            {L?.metadata?.bathrooms ?? 1}
          </Text>
          <Paragraph type="secondary">
            Amenities:{' '}
            {(L?.metadata?.amenities || []).join(', ') || '—'}
          </Paragraph>
        </InfoSection>

        {/* ===== Availability section ===== */}
        <SectionCard size="small" title="Availability">
          {availRanges.length === 0 ? (
            <Text type="secondary">No availability provided.</Text>
          ) : (
            <List
              size="small"
              dataSource={availRanges}
              renderItem={(r, idx) => (
                <List.Item key={idx}>
                  <Space>
                    <Tag color="green">Open</Tag>
                    <Text strong>
                      {r.s.format('YYYY-MM-DD')} ~{' '}
                      {r.e.format('YYYY-MM-DD')}
                    </Text>
                    <Text type="secondary">
                      ({dayjs(r.s).fromNow()} – {dayjs(r.e).fromNow()})
                    </Text>
                  </Space>
                </List.Item>
              )}
            />
          )}
        </SectionCard>

        {/* ===== Booking section ===== */}
        <SectionCard size="small" title="Book this place">
          <Space wrap>
            <RangePicker
              value={dates}
              onChange={setDates}
              disabledDate={disabledDate}
              allowClear
            />
            <InputNumber
              min={1}
              value={guest}
              onChange={setGuest}
            />
            <Button
              type="primary"
              onClick={onBook}
              disabled={!isSelectedInsideAvail}
            >
              Confirm booking
            </Button>
          </Space>

          {/* Warning if selected dates are outside all availability ranges */}
          {!isSelectedInsideAvail && (
            <WarningAlert
              type="warning"
              showIcon
              message="Selected dates are not within any availability window."
            />
          )}

          {/* List of current user's bookings for this listing */}
          {myBookings.length > 0 && (
            <MyBookingsWrapper>
              <Text type="secondary">
                Your bookings for this listing:
              </Text>
              <List
                size="small"
                dataSource={myBookings}
                renderItem={(b) => (
                  <List.Item>
                    <Space>
                      <Tag
                        color={
                          b.status === 'accepted'
                            ? 'green'
                            : b.status === 'pending'
                              ? 'blue'
                              : 'red'
                        }
                      >
                        {b.status}
                      </Tag>
                      <Text>
                        {dayjs(b.dateRange?.start).format(
                          'YYYY-MM-DD'
                        )}{' '}
                        ~{' '}
                        {dayjs(b.dateRange?.end).format(
                          'YYYY-MM-DD'
                        )}
                      </Text>
                    </Space>
                  </List.Item>
                )}
              />
            </MyBookingsWrapper>
          )}
        </SectionCard>

        {/* ===== Review input section ===== */}
        <SectionCard size="small" title="Leave a review">
          <Space wrap>
            <InputNumber
              min={1}
              max={5}
              value={score}
              onChange={setScore}
            />
            <Input.TextArea
              placeholder="Say something..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              style={{ width: 360 }}
            />
            <Button onClick={onReview}>Post</Button>
          </Space>
        </SectionCard>

        {/* ===== All reviews section ===== */}
        <SectionCard
          size="small"
          title={`Reviews (${(L.reviews || []).length})`}
        >
          {(L.reviews || []).length === 0 ? (
            <Text type="secondary">No reviews yet.</Text>
          ) : (
            <List
              dataSource={[...(L.reviews || [])].reverse()}
              renderItem={(r, idx) => (
                <List.Item key={idx}>
                  <Space
                    direction="vertical"
                    size={2}
                    style={{ width: '100%' }}
                  >
                    <Space>
                      <Tag color="gold">
                        ⭐ {Number(r.score || 0).toFixed(1)}
                      </Tag>
                      <Text type="secondary">
                        {r.user || 'Anonymous'}
                        {r.createdAt
                          ? ` · ${dayjs(r.createdAt).format(
                            'YYYY-MM-DD'
                          )}`
                          : ''}
                      </Text>
                    </Space>
                    <Text>{r.comment || ''}</Text>
                    {idx !==
                      ((L.reviews || []).length - 1) && (
                      <ReviewDivider />
                    )}
                  </Space>
                </List.Item>
              )}
            />
          )}
        </SectionCard>
      </FullWidthSpace>
    </PageCard>
  );
}
