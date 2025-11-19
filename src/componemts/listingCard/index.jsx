// src/componemts/listings/ListingCard.jsx
import { Card, Space, Typography, Tag } from 'antd';

import { toStr } from '../hostComponents';
import { CoverImg } from '../../uitles/listingEditorCardCss';
const { Text } = Typography;


/**
 * Single listing card used on the public landing page.
 *
 * Props:
 * - item.base:   basic listing info from the /listings response
 * - item.detail: expanded detail (price, address, etc.)
 * - item.rating: pre-computed average rating
 * - item.reviews: total review count
 * - item.hasPriority: true if the current user has a booking (highlight badge)
 */
export default function ListingCard({ item, onClick }) {
  const cover =
    toStr(item.detail?.listing?.thumbnail) ||
    toStr(item.base?.thumbnail);

  const price = Number(
    item.detail?.listing?.price ?? item.base?.price ?? 0
  );

  return (
    <Card
      hoverable
      cover={cover ? <CoverImg alt={item.base.title} src={cover} /> : null}
      onClick={onClick}
      data-cy="listing-card"
    >
      <Card.Meta
        title={item.base.title}
        description={
          <Space direction="vertical" size={2}>
            {/* City / location */}
            <Text type="secondary">
              {item.detail?.listing?.address?.city || ''}
            </Text>

            {/* Price per night */}
            <div>
              <Text strong>${price}</Text>{' '}
              <Text type="secondary">/ night</Text>
            </div>

            {/* Reviews, rating, and "booked by you" badge */}
            <div>
              <Tag>{item.reviews} reviews</Tag>
              <Tag color="gold">⭐ {item.rating.toFixed(1)}</Tag>
              {item.hasPriority && (
                <Tag color="blue">Booked by you</Tag>
              )}
            </div>
          </Space>
        }
      />
    </Card>
  );
}
