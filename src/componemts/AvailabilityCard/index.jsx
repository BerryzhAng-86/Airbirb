import { Card, List, Space, Tag, Typography } from 'antd';
import dayjs from 'dayjs';
import styled from 'styled-components';

const { Text } = Typography;

const BlockCard = styled(Card)`
  margin-top: 12px;
`;

export default function AvailabilityCard({ ranges = [] }) {
  return (
    <BlockCard size="small" title="Availability">
      {ranges.length === 0 ? (
        <Text type="secondary">No availability provided.</Text>
      ) : (
        <List
          size="small"
          dataSource={ranges}
          renderItem={(r, idx) => (
            <List.Item key={idx}>
              <Space>
                <Tag color="green">Open</Tag>
                <Text strong>
                  {r.s.format('YYYY-MM-DD')} ~ {r.e.format('YYYY-MM-DD')}
                </Text>
                <Text type="secondary">({dayjs(r.s).fromNow()} – {dayjs(r.e).fromNow()})</Text>
              </Space>
            </List.Item>
          )}
        />
      )}
    </BlockCard>
  );
}
