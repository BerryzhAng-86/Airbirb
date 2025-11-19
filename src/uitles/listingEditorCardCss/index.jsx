// src/components/edit/ListingEditorCard.jsx
import styled from 'styled-components';
import { Card } from 'antd';

const ListingEditorCard = styled(Card)`
  && {
    width: 100%;
    max-width: 720px;
    margin: 24px auto;
  }

  @media (max-width: 768px) {
    && { margin: 16px 12px; }
  }
`;

export const CoverImg = styled.img`
  width: 100%;
  height: 160px;
  object-fit: cover;
  display: block;
`;
export default ListingEditorCard;
