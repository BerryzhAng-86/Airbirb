import { Card, Space, Input, InputNumber, DatePicker, Select, Button } from 'antd';
import styled from 'styled-components';

const { RangePicker } = DatePicker;

/**
 * Styled wrappers to keep the search bar compact and readable.
 */
const BarCard = styled(Card)`
  && {
    margin-bottom: 16px;
  }
`;

const WideInput = styled(Input)`
  && {
    width: 240px;
  }
`;

const WideSelect = styled(Select)`
  && {
    width: 200px;
  }
`;

/**
 * ListingsSearchBar
 *
 * A controlled search/filter bar for the public listings page.
 *
 * Props:
 * - q, onQ:                           text query for title / city
 * - brMin, brMax, onBrMin, onBrMax:   min/max bedrooms
 * - priceMin, priceMax, onPriceMin, onPriceMax: price range filters
 * - dateRange, onDateRange:           check-in / check-out range (RangePicker value)
 * - rateOrder, onRateOrder:           rating sort order ("asc" | "desc" | undefined)
 * - onSubmit:                         callback when the user clicks "Search"
 */
export default function ListingsSearchBar({
  q,
  onQ,
  brMin,
  onBrMin,
  brMax,
  onBrMax,
  priceMin,
  onPriceMin,
  priceMax,
  onPriceMax,
  dateRange,
  onDateRange,
  rateOrder,
  onRateOrder,
  onSubmit,
}) {
  return (
    <BarCard>
      <Space wrap>
        {/* Keyword search: title / city */}
        <WideInput
          placeholder="Search title or city"
          allowClear
          value={q}
          onChange={(e) => onQ(e.target.value)}
        />

        {/* Bedrooms range */}
        <InputNumber
          placeholder="Bedrooms min"
          min={0}
          value={brMin}
          onChange={onBrMin}
        />
        <InputNumber
          placeholder="Bedrooms max"
          min={0}
          value={brMax}
          onChange={onBrMax}
        />

        {/* Price range */}
        <InputNumber
          placeholder="Price min"
          min={0}
          value={priceMin}
          onChange={onPriceMin}
        />
        <InputNumber
          placeholder="Price max"
          min={0}
          value={priceMax}
          onChange={onPriceMax}
        />

        {/* Date range for stay */}
        <RangePicker value={dateRange} onChange={onDateRange} />

        {/* Rating sort order */}
        <WideSelect
          allowClear
          placeholder="Rating order"
          value={rateOrder}
          onChange={onRateOrder}
          options={[
            { value: 'desc', label: 'Rating high → low' },
            { value: 'asc', label: 'Rating low → high' },
          ]}
        />

        {/* Trigger search with all current filters */}
        <Button type="primary" onClick={onSubmit}>
          Search
        </Button>
      </Space>
    </BarCard>
  );
}
