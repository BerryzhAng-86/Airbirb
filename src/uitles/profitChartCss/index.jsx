import styled from 'styled-components';

const WIDTH = 760;
const HEIGHT = 200;

export const Container = styled.div`
  position: relative;
  width: ${WIDTH}px;
  height: ${HEIGHT}px;
`;

export const TooltipTitle = styled.div`
  line-height: 1.2;
`;

// styled-components
export const HotArea = styled.div`
  position: absolute;
  left: ${({ $left }) => `${$left}px`};
  top: ${({ $top }) => `${$top}px`};
  width: ${({ $width }) => `${$width}px`};
  height: ${({ $height }) => `${$height}px`};
  background: transparent;
  min-width: ${({ $minWidth }) => `${$minWidth}px`};
  transform: ${({ $translateX }) =>
    Number.isFinite($translateX) ? `translateX(${$translateX}px)` : 'none'};
`;