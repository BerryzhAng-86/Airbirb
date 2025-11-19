import {
  Card, Carousel
} from 'antd';
import styled from 'styled-components';
export const ProfitCard = styled(Card)`
  margin-bottom: 16px;
`;
export const CoverCarousel = styled(Carousel)`
  width: 100%;
  height: 180px;
`;
export const Slide = styled.div`
  height: 180px;
  overflow: hidden;
`;
export const SlideImg = styled.img`
  width: 100%;
  height: 180px;
  object-fit: cover;
  display: block;
`;