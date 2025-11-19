import styled from "styled-components";
import { NavLink } from "react-router-dom";
export const AppLayoutContainer = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
`;

export const Main = styled.main`
  flex: 1;
  padding: 16px;
`;

export const HeaderContainer = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid #eee;
  position: sticky;
  top: 0;
  background: #fff;
  z-index: 10;
`;

export const NavBar = styled.nav`
  display: flex;
  gap: 12px;
`;
export const LinkItem = styled(NavLink)`
  text-decoration: none;
  padding: 4px 8px;
  border-radius: 8px;

  &.active {
    font-weight: 600;
    background: #f5f5f5;
  }
`;
export const Brand = styled.div`
  font-weight: 700;
`;