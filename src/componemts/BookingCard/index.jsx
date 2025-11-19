import { Space, DatePicker, InputNumber, Typography, List, Tag } from 'antd';
import dayjs from 'dayjs';
import BookingConfirmButton from './BookingConfirmButton';
import { BlockCard, BookingsWrap, WarnAlert } from '../../uitles/bookingCardCss';

const { RangePicker } = DatePicker;
const { Text } = Typography;

export default function BookingCard({
  dates, onDatesChange, disabledDate,
  guest, onGuestChange,
  onBook,
  myBookings = [],
  isSelectedInsideAvail,
}) {
  return (
    <BlockCard size="small" title="Book this place">
      <Space wrap>
        <RangePicker
          value={dates}
          onChange={onDatesChange}
          disabledDate={disabledDate}
          allowClear
        />
        <InputNumber
          min={1}
          value={guest}
          onChange={onGuestChange}
        />
        <BookingConfirmButton
          disabled={!isSelectedInsideAvail}
          onClick={onBook}
        />
      </Space>

      {!isSelectedInsideAvail && (
        <WarnAlert
          type="warning"
          showIcon
          message="Selected dates are not within any availability window."
        />
      )}

      {myBookings.length > 0 && (
        <BookingsWrap>
          <Text type="secondary">Your bookings for this listing:</Text>
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
                    {dayjs(b.dateRange?.start).format('YYYY-MM-DD')}
                    {' ~ '}
                    {dayjs(b.dateRange?.end).format('YYYY-MM-DD')}
                  </Text>
                </Space>
              </List.Item>
            )}
          />
        </BookingsWrap>
      )}
    </BlockCard>
  );
}
