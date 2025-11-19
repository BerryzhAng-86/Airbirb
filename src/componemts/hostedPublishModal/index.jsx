import { Modal, Space, DatePicker, Tag, Empty, Button } from 'antd';
import {
  Vertical,
  Hint,
  Row,
  RangeWrapper,
  AddedLabel,
  ModalNote,
} from '../../uitles/hostedPublishModalCss';

const { RangePicker } = DatePicker;

/**
 * Modal for publishing a listing with one or more availability ranges.
 */
export default function HostedPublishModal({
  open,
  onCancel,
  onOk,
  okLoading,
  pubRanges,
  tempRange,
  onChangeTempRange,
  onAddRange,
  onRemoveRange,
  apiAvailFormat,
}) {
  return (
    <Modal
      title="Publish listing"
      open={open}
      onCancel={onCancel}
      onOk={onOk}
      okButtonProps={{
        disabled: pubRanges.length === 0,
        loading: okLoading,
      }}
    >
      <Vertical direction="vertical" size="middle">
        {/* Instruction for selecting ranges */}
        <Hint>
          Choose a date range first, then click <b>Add</b>. You can add multiple
          ranges.
        </Hint>

        <Row>
          <RangeWrapper>
            <RangePicker value={tempRange} onChange={onChangeTempRange} />
          </RangeWrapper>
          <Button type="primary" onClick={onAddRange}>
            Add
          </Button>
        </Row>

        <AddedLabel>Added ranges:</AddedLabel>
        {pubRanges.length === 0 ? (
          <Empty
            description="No ranges added yet"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ) : (
          <Space wrap>
            {pubRanges.map(([s, e], i) => (
              <Tag key={i} closable onClose={() => onRemoveRange(i)}>
                {s.format('YYYY-MM-DD')} ~ {e.format('YYYY-MM-DD')}
              </Tag>
            ))}
          </Space>
        )}

        <ModalNote>
          API format:{' '}
          <b>
            {apiAvailFormat === 'objects'
              ? 'Example: [{ start, end }]'
              : 'Example: ["2025-01-01", "2025-01-02", ...]'}
          </b>
        </ModalNote>
      </Vertical>
    </Modal>
  );
}
