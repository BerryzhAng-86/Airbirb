import {  Typography, Space } from 'antd';
import styled from 'styled-components';

export const HeaderBar = styled(Space)`
  width: 100%;
  justify-content: space-between;
  margin-bottom: 16px;
`;
export const HeaderTitle = styled(Typography.Title)`
  && { margin: 0; }
`;