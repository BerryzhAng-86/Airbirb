import React from 'react';
import {
  Card,
  Typography,
  List,
  Space,
  Tag,
  Button,
  Statistic,
  Row,
  Col,
  message,
} from 'antd';
import dayjs from 'dayjs';
import { useParams } from 'react-router-dom';
import { api } from '../../uitles/api';
import { showError } from '../../componemts/showError';

const { Title, Text } = Typography;

// Helper: number of nights between two dates (based on whole days)
const nightsBetween = (s, e) =>
  Math.max(
    0,
    dayjs(e).startOf('day').diff(dayjs(s).startOf('day'), 'day')
  );

/**
 * HostedBookingsPage
 *
 * Host-side booking management screen for a single listing:
 * - Loads listing details and all bookings
 * - Shows basic stats (online days, booked days, profit this year)
 * - Allows accepting / declining pending requests
 * - Shows a history of all booking requests
 */
export default function HostedBookingsPage() {
  // Listing ID from route params
  const { id } = useParams();

  // Auth token from localStorage (if available)
  const token =
    typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null;

  // Listing detail (title, price, etc.)
  const [detail, setDetail] = React.useState(null);
  // All bookings associated with this listing
  const [bookings, setBookings] = React.useState([]);
  // Global loading state for the page
  const [loading, setLoading] = React.useState(true);

  // Current year number, used for yearly stats
  const THIS_YEAR = dayjs().year();

  /**
   * Reload listing detail and booking list.
   * - Fetch listing info
   * - Fetch all bookings, then filter to only this listing
   */
  const reload = React.useCallback(async () => {
    setLoading(true);
    try {
      const d = await api.getListing(id);
      const all = await api.getBookingDetails(token);
      setDetail(d);
      setBookings(
        (all?.bookings || []).filter(
          (b) => String(b.listingId) === String(id)
        )
      );
    } catch (e) {
      showError(e);
    } finally {
      setLoading(false);
    }
  }, [id, token]);

  // Initial load on mount, and when id/token changes
  React.useEffect(() => {
    reload();
  }, [reload]);

  /**
   * Accept a booking by ID, then reload data.
   */
  const accept = async (bid) => {
    try {
      await api.acceptBookings(token, bid);
      message.success('Accepted');
      reload();
    } catch (e) {
      showError(e);
    }
  };

  /**
   * Decline a booking by ID, then reload data.
   */
  const decline = async (bid) => {
    try {
      await api.declineBookings(token, bid);
      message.success('Declined');
      reload();
    } catch (e) {
      showError(e);
    }
  };

  // ------ Aggregated statistics ------

  // How many days this listing has been online (since published/created)
  const onlineDays = (() => {
    const publishedAt =
      detail?.listing?.publishedOn ||
      detail?.listing?.postedOn ||
      detail?.listing?.createdAt;
    if (!publishedAt) return 0;
    return Math.max(0, dayjs().diff(dayjs(publishedAt), 'day'));
  })();

  // Only accepted bookings starting in the current year
  const acceptedThisYear = bookings.filter(
    (b) =>
      b.status === 'accepted' &&
      dayjs(b.dateRange?.start).year() === THIS_YEAR
  );

  // Total booked nights in the current year
  const daysThisYear = acceptedThisYear.reduce(
    (acc, b) =>
      acc + nightsBetween(b.dateRange?.start, b.dateRange?.end),
    0
  );

  // Price per night taken from listing detail
  const pricePerNight = Number(detail?.listing?.price || 0);

  // Profit this year (simple price * nights, no fees/discounts)
  const profitThisYear = acceptedThisYear.reduce(
    (acc, b) =>
      acc +
      nightsBetween(b.dateRange?.start, b.dateRange?.end) *
        pricePerNight,
    0
  );

  // Pending requests for the "Pending" section
  const pendings = bookings.filter((b) => b.status === 'pending');

  // History list: all bookings sorted by creation time (latest first)
  const history = bookings.sort(
    (a, b) => dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf()
  );

  return (
    <Card
      loading={loading}
      style={{ maxWidth: 960, margin: '24px auto' }}
    >
      {/* Header: title + listing name */}
      <Title level={4}>Booking Requests &amp; History</Title>
      <Text type="secondary">
        Listing: {detail?.listing?.title}
      </Text>

      {/* Top summary stats */}
      <Row gutter={16} style={{ marginTop: 12 }}>
        <Col span={6}>
          <Statistic title="Online (days)" value={onlineDays} />
        </Col>
        <Col span={6}>
          <Statistic
            title={`Booked days in ${THIS_YEAR}`}
            value={daysThisYear}
          />
        </Col>
        <Col span={6}>
          <Statistic
            title={`Profit in ${THIS_YEAR}`}
            prefix="$"
            value={profitThisYear}
          />
        </Col>
      </Row>

      {/* Pending requests section */}
      <Card
        size="small"
        title="Pending requests"
        style={{ marginTop: 16 }}
      >
        <List
          dataSource={pendings}
          locale={{ emptyText: 'No pending requests' }}
          renderItem={(b) => (
            <List.Item
              actions={[
                <Button
                  type="link"
                  key={b.id}
                  onClick={() => accept(b.id)}
                >
                  Accept
                </Button>,
                <Button
                  danger
                  type="link"
                  key={b.id}
                  onClick={() => decline(b.id)}
                >
                  Decline
                </Button>,
              ]}
            >
              <Space>
                <Tag color="blue">pending</Tag>
                <Text>
                  {dayjs(b.dateRange?.start).format('YYYY-MM-DD')} ~{' '}
                  {dayjs(b.dateRange?.end).format('YYYY-MM-DD')}
                </Text>
                <Text type="secondary">
                  requested on{' '}
                  {dayjs(b.createdAt).format('YYYY-MM-DD')}
                </Text>
              </Space>
            </List.Item>
          )}
        />
      </Card>

      {/* History section: all past requests */}
      <Card
        size="small"
        title="All requests (history)"
        style={{ marginTop: 16 }}
      >
        <List
          dataSource={history}
          renderItem={(b) => (
            <List.Item>
              <Space wrap>
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
                <Text strong>
                  {dayjs(b.dateRange?.start).format('YYYY-MM-DD')} ~{' '}
                  {dayjs(b.dateRange?.end).format('YYYY-MM-DD')}
                </Text>
                <Text type="secondary">
                  created {dayjs(b.createdAt).format('YYYY-MM-DD')}
                </Text>
              </Space>
            </List.Item>
          )}
        />
      </Card>
    </Card>
  );
}
