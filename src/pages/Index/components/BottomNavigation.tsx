import styled from "styled-components";

import leftButton from "@/assets/network-button-bg.png";
import activeButton from "@/assets/province-logistic-network.png";
import rightButton from "@/assets/network-button-bg.png";

const Navigation = styled.nav`
  position: absolute;
  left: 50%;
  bottom: -12px;
  z-index: 6;
  width: 1250px;
  height: 190px;
  transform: translateX(-50%);
  display: flex;
  align-items: flex-end;
  justify-content: center;
`;

const NavButton = styled.button<{ $active?: boolean; $side?: "left" | "right" }>`
  position: relative;
  width: ${({ $active }) => ($active ? 515 : 354)}px;
  height: ${({ $active }) => ($active ? 184 : 166)}px;
  margin: 0 ${({ $active }) => ($active ? -38 : -25)}px;
  padding: 0;
  border: 0;
  background: transparent;
  color: #f3feff;
  cursor: pointer;
  filter: ${({ $active }) => ($active ? "brightness(1.12)" : "brightness(.86)")};
  transition: transform 160ms ease, filter 160ms ease;

  &:hover,
  &:focus-visible {
    filter: brightness(1.24);
    transform: translateY(-7px);
    outline: none;
  }

  &:active {
    transform: translateY(-3px) scale(0.99);
  }

  img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: fill;
  }
`;

const Label = styled.span<{ $active?: boolean }>`
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding-top: ${({ $active }) => ($active ? 4 : 16)}px;
  font-family: 'YouSheBiaoTiHei', "Microsoft YaHei", sans-serif;
  font-size: ${({ $active }) => ($active ? 58 : 42)}px;
  letter-spacing: 4px;
  text-shadow: 0 4px 4px rgba(0, 0, 0, 0.55), 0 0 15px rgba(89, 255, 226, 0.7);
`;

export default function BottomNavigation() {
  return (
    <Navigation aria-label="大屏视图切换">
      <NavButton type="button" $side="left">
        <img src={leftButton} alt="" />
        <Label>武汉通道网</Label>
      </NavButton>
      <NavButton type="button" $active aria-current="page">
        <img src={activeButton} alt="" />
        <Label $active>全省物流网</Label>
      </NavButton>
      <NavButton type="button" $side="right">
        <img src={rightButton} alt="" />
        <Label>精品线路网</Label>
      </NavButton>
    </Navigation>
  );
}
