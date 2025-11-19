// src/componemts/listings/ListingsGrid.jsx
import { List } from 'antd';
import ListingCard from '../listingCard';

/**
 * Grid wrapper for public listings.
 *
 * Props:
 * - data:      array of items passed to <ListingCard />
 * - loading:   boolean spinner state for the List
 * - dateRange: currently selected check-in/check-out (passed down to detail)
 * - onOpenDetail(id, dateRange): callback when a card is clicked
 */
export default function ListingsGrid({
  data,
  loading,
  dateRange,
  onOpenDetail,
}) {
  return (
    <List
      loading={loading}
      grid={{ gutter: 16, column: 4 }}
      dataSource={data}
      renderItem={(x) => (
        <List.Item key={x.base.id}>
          <ListingCard
            item={x}
            dateRange={dateRange}
            onClick={() => onOpenDetail(x.base.id, dateRange)}
          />
        </List.Item>
      )}
    />
  );
}
