// components/listingForm.jsx
import React from 'react';
import {
  Form,
  Input,
  InputNumber,
  Select,
  Upload,
  Button,
  Space,
  Tooltip,
} from 'antd';
import { PlusOutlined } from '@ant-design/icons';

/* ====== Helpers (reusing your existing logic) ====== */
const fileToBase64 = (file) =>
  new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result);
    r.onerror = rej;
    r.readAsDataURL(file);
  });

const stringsToFileList = (arr) =>
  Array.isArray(arr)
    ? arr
      .filter(Boolean)
      .map((url, i) => ({
        uid: `img-${i}`,
        name: `img-${i}`,
        status: 'done',
        url,
      }))
    : [];

const fileListToStrings = async (val) => {
  if (!val) return [];
  const files = val.fileList || val;
  const out = [];
  for (const f of files) {
    if (typeof f === 'string') {
      out.push(f);
      continue;
    }
    if (f.url || f.thumbUrl) {
      out.push(f.url || f.thumbUrl);
      continue;
    }
    out.push(await fileToBase64(f.originFileObj || f));
  }
  return out;
};

const toThumbString = (x) => {
  if (typeof x === 'string') return x || '';
  if (!x) return '';
  if (x.thumbUrl || x.url) return x.thumbUrl || x.url;
  if (Array.isArray(x.fileList) && x.fileList.length) {
    const f = x.fileList[0];
    return f?.thumbUrl || f?.url || '';
  }
  return '';
};

/* ===================================== */

/**
 * Common amenity options shown as suggestions in the tags Select.
 */
const AMENITY_OPTIONS = [
  'Wi-Fi',
  'Air conditioning',
  'Heating',
  'Kitchen',
  'Washer',
  'Dryer',
  'TV',
  'Free parking',
  'Paid parking',
  'Pool',
  'Gym',
  'Dedicated workspace',
  'Breakfast',
  'Pets allowed',
  'Smoke alarm',
  'First aid kit',
].map((x) => ({ label: x, value: x }));

/**
 * ListingForm
 *
 * A reusable form for creating / editing a listing:
 * - handles thumbnail + gallery uploads
 * - exposes amenities as a tags Select
 * - sends a normalised payload to `onSubmit`
 */
export default function ListingForm({
  initialValues,
  onSubmit,
  submitting,
  onValuesChange,
}) {
  const [form] = Form.useForm();
  const thumb = Form.useWatch('thumbnail', form);

  React.useEffect(() => {
    if (!initialValues) return;

    const coverFromInitial = toThumbString(initialValues?.thumbnail);
    const imagesFromInitial = initialValues?.metadata?.images || [];
    const fallbackCover =
      Array.isArray(imagesFromInitial) && imagesFromInitial.length
        ? imagesFromInitial[0]
        : '';

    form.setFieldsValue({
      title: initialValues.title,
      price: initialValues.price,
      address: { city: initialValues?.address?.city || '' },
      thumbnail: coverFromInitial || fallbackCover,
      images: stringsToFileList(imagesFromInitial),
      metadata: {
        type: initialValues?.metadata?.type || 'entire',
        bedrooms: initialValues?.metadata?.bedrooms ?? 0,
        beds: initialValues?.metadata?.beds ?? 1,
        bathrooms: initialValues?.metadata?.bathrooms ?? 1,
        // Initial amenities value (always normalised to an array)
        amenities: Array.isArray(initialValues?.metadata?.amenities)
          ? initialValues.metadata.amenities
          : [],
      },
    });
  }, [initialValues, form]);

  const handleFinish = async (values) => {
    const imgs = await fileListToStrings(values.images);
    const amen = Array.isArray(values?.metadata?.amenities)
      ? values.metadata.amenities.filter(Boolean)
      : [];

    const payload = {
      title: values.title,
      price: Number(values.price),
      address: { city: values?.address?.city || '' },
      thumbnail: toThumbString(values.thumbnail) || imgs[0] || '',
      metadata: {
        type: values?.metadata?.type || 'entire',
        bedrooms: Number(values?.metadata?.bedrooms || 0),
        beds: Number(values?.metadata?.beds || 1),
        bathrooms: Number(values?.metadata?.bathrooms || 1),
        images: imgs,
        amenities: amen,
      },
    };
    await onSubmit(payload);
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleFinish}
      // Propagate form changes to the parent (e.g. for autosave / draft)
      onValuesChange={(_, allValues) => onValuesChange?.(form, allValues)}
    >
      <Form.Item
        name="title"
        label="Title"
        rules={[{ required: true }]}
      >
        <Input placeholder="Cozy studio near UNSW" />
      </Form.Item>

      <Form.Item
        name={['address', 'city']}
        label="City"
        rules={[{ required: true }]}
      >
        <Input placeholder="Kensington" />
      </Form.Item>

      <Form.Item
        name="price"
        label="Price per night (AUD)"
        rules={[{ required: true }]}
      >
        <InputNumber min={1} style={{ width: '100%' }} />
      </Form.Item>

      <Form.Item
        name={['metadata', 'type']}
        label="Type"
        rules={[{ required: true }]}
      >
        <Select
          options={[
            { value: 'entire', label: 'Entire place' },
            { value: 'private', label: 'Private room' },
            { value: 'shared', label: 'Shared room' },
          ]}
        />
      </Form.Item>

      <Space.Compact style={{ width: '100%' }}>
        <Form.Item
          name={['metadata', 'bedrooms']}
          label="Bedrooms"
          rules={[{ required: true }]}
          style={{ flex: 1 }}
        >
          <InputNumber min={0} style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item
          name={['metadata', 'beds']}
          label="Beds"
          rules={[{ required: true }]}
          style={{ flex: 1, marginLeft: 12 }}
        >
          <InputNumber min={1} style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item
          name={['metadata', 'bathrooms']}
          label="Bathrooms"
          rules={[{ required: true }]}
          style={{ flex: 1, marginLeft: 12 }}
        >
          <InputNumber min={1} style={{ width: '100%' }} />
        </Form.Item>
      </Space.Compact>

      {/* Amenities: multi-select with suggested options + custom tags */}
      <Form.Item
        name={['metadata', 'amenities']}
        label={
          <Space size={6}>
            <span>Amenities</span>
            <Tooltip title="Select common amenities or type your own and press Enter.">
              <span style={{ color: '#999', fontWeight: 400 }}>
                (multi-select / custom)
              </span>
            </Tooltip>
          </Space>
        }
      >
        <Select
          mode="tags" // allow custom tags
          allowClear
          options={AMENITY_OPTIONS}
          placeholder="Wi-Fi, Air conditioning, Washer..."
          tokenSeparators={[',']}
        />
      </Form.Item>

      <Form.Item
        label="Cover thumbnail"
        extra="Single cover image. If not selected, the first item in “Images” will be used as the cover."
      >
        <Upload
          accept="image/*"
          listType="picture-card"
          maxCount={1}
          showUploadList={false}
          beforeUpload={async (file) => {
            const b64 = await fileToBase64(file);
            form.setFieldValue('thumbnail', b64);
            return false;
          }}
        >
          {thumb ? (
            <img
              alt="thumbnail"
              src={toThumbString(thumb)}
              style={{ width: '100%' }}
            />
          ) : (
            <div>
              <PlusOutlined />
              <div style={{ marginTop: 8 }}>Upload</div>
            </div>
          )}
        </Upload>
      </Form.Item>
      {/* Hidden field to store thumbnail value in the form model */}
      <Form.Item name="thumbnail" hidden>
        <Input />
      </Form.Item>

      <Form.Item
        name="images"
        label="Images"
        valuePropName="fileList"
        getValueFromEvent={(e) => e?.fileList || e}
        extra="You can upload multiple images. These will appear in the carousel on “My Listings”."
      >
        <Upload
          accept="image/*"
          listType="picture-card"
          multiple
          beforeUpload={() => false}
        >
          <div>
            <PlusOutlined />
            <div style={{ marginTop: 8 }}>Add</div>
          </div>
        </Upload>
      </Form.Item>

      <Form.Item>
        <Button type="primary" htmlType="submit" loading={submitting}>
          Save
        </Button>
      </Form.Item>
    </Form>
  );
}
