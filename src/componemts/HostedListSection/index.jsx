// src/componemts/HostedListSection.jsx

import { List, Card, Space, Tag, Popconfirm, Button, Empty, Typography } from 'antd';

import ProfitChart from '../profitChart';
import HostedPublishModal from '../hostedPublishModal';
import { ProfitCard, CoverCarousel, Slide, SlideImg } from '../../uitles/hostedListSectionCss';

const { Text } = Typography;

/**
 * Main section for the "My Listings" screen.
 *
 * Responsibilities:
 * - Display profit chart for current listings
 * - Render a grid of hosted listing cards (or Empty state)
 * - Provide actions (edit, bookings, publish/unpublish, delete)
 * - Control the publish modal and date range selection
 */
export default function HostedListSection({ series, data, loading, actioningId, onEdit, onBookings, onUnpublish, onOpenPublish, onDelete, getCardImages, getRatingAvg, StarRating, pubOpen, onClosePublish, onPublish, okLoading, pubRanges, tempRange, setTempRange, addOneRange, removeRangeAt, apiAvailFormat, emptyOwnerLabel, }) {
  return (
    <>
      {/* Profit chart summary for hosted listings */}
      <ProfitCard size="small">
        <ProfitChart series={series} />
      </ProfitCard>

      {/* Listing grid or empty placeholder */}
      {(data?.length ?? 0) === 0 ? (
        <Empty
          description={
            <span>
              No listings found for <b>{emptyOwnerLabel}</b>
            </span>
          }
        />
      ) : (
        <List
          loading={loading}
          grid={{ gutter: 16, column: 3 }}
          dataSource={data}
          renderItem={(item) => {
            const imgs = getCardImages(item);
            const busy = actioningId === item.id;
            const rating = getRatingAvg(item.reviews);
            const reviewsCount = Array.isArray(item.reviews)
              ? item.reviews.length
              : 0;

            return (
              <List.Item key={item.id}>
                <Card
                  hoverable
                  cover={
                    imgs.length > 0 ? (
                      <CoverCarousel dots autoplay>
                        {imgs.map((src, i) => (
                          <Slide key={i}>
                            <SlideImg
                              alt={item.title}
                              src={src}
                              onError={(e) => {
                                // Fallback for broken images: simple inline SVG
                                e.currentTarget.src =
                                  'data:image/svg+xml;base64,PHN2Zy8+';
                              }}
                            />
                          </Slide>
                        ))}
                      </CoverCarousel>
                    ) : null
                  }
                  actions={[
                    <Button
                      key={`edit-${item.id}`}
                      type="link"
                      onClick={() => onEdit(item.id)}
                      disabled={busy}
                    >
                      Edit
                    </Button>,
                    <Button
                      key={`bookings-${item.id}`}
                      type="link"
                      onClick={() => onBookings(item.id)}
                      disabled={busy}
                    >
                      Bookings
                    </Button>,
                    item.published ? (
                      <Button
                        key={`unpublish-${item.id}`}
                        danger
                        type="link"
                        onClick={() => onUnpublish(item.id)}
                        loading={busy}
                      >
                        Unpublish
                      </Button>
                    ) : (
                      <Button
                        key={`publish-${item.id}`}
                        type="link"
                        onClick={() => onOpenPublish(item.id)}
                        disabled={busy}
                      >
                        Publish
                      </Button>
                    ),
                    <Popconfirm
                      key={`delete-${item.id}`}
                      title="Delete this listing?"
                      okText="Delete"
                      okButtonProps={{ danger: true, loading: busy }}
                      onConfirm={() => onDelete(item.id)}
                      disabled={busy}
                    >
                      <Button type="link" danger disabled={busy}>
                        Delete
                      </Button>
                    </Popconfirm>,
                  ]}
                >
                  <Card.Meta
                    title={
                      <Space
                        direction="vertical"
                        size={2}
                        style={{ width: '100%' }}
                      >
                        <Text>{item.title}</Text>
                        <Space align="center" size={6}>
                          <StarRating value={rating} size={16} />
                          <Text
                            type="secondary"
                            style={{ marginLeft: 4 }}
                          >
                            {rating.toFixed(1)} · {reviewsCount} reviews
                          </Text>
                        </Space>
                      </Space>
                    }
                    description={
                      <Space direction="vertical" size={6}>
                        <Space size={12} wrap>
                          <Tag color="blue">
                            {item?.metadata?.type ||
                              item?.type ||
                              '—'}
                          </Tag>
                          <Tag>
                            Beds:{' '}
                            {item?.metadata?.beds ?? item?.beds ?? '—'}
                          </Tag>
                          <Tag>
                            Bathrooms:{' '}
                            {item?.metadata?.bathrooms ??
                              item?.bathrooms ??
                              '—'}
                          </Tag>
                        </Space>
                        <Text strong>
                          ${Number(item.price || 0)}{' '}
                          <Text type="secondary">/ night</Text>
                        </Text>
                        {item.published ? (
                          <Tag color="green">Published</Tag>
                        ) : (
                          <Tag>Draft</Tag>
                        )}
                        <Text type="secondary">
                          Owner: {item.owner}
                        </Text>
                      </Space>
                    }
                  />
                </Card>
              </List.Item>
            );
          }}
        />
      )}

      {/* Publish modal: pick availability ranges for the selected listing */}
      <HostedPublishModal
        open={pubOpen}
        onCancel={onClosePublish}
        onOk={onPublish}
        okLoading={okLoading}
        pubRanges={pubRanges}
        tempRange={tempRange}
        onChangeTempRange={setTempRange}
        onAddRange={addOneRange}
        onRemoveRange={removeRangeAt}
        apiAvailFormat={apiAvailFormat}
      />
    </>
  );
}
