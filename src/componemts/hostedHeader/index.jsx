// src/componemts/HostedHeader.jsx
import { Button} from 'antd';
import { HeaderBar,HeaderTitle } from '../../uitles/hostedHeaderCss';

export default function HostedHeader({ onNew }) {
  return (
    <HeaderBar>
      <HeaderTitle level={4}>My Listings</HeaderTitle>
      <Button type="primary" onClick={onNew}>New Listing</Button>
    </HeaderBar>
  );
}
