import { useState } from "react";
import styled from "styled-components";

const ROUTES = ["北粮南运", "赶肉下江", "楚天翼连", "棉纺丝路", "疆煤入鄂"];

const Group = styled.div`
  position: absolute;
  left: 1740px;
  top: 600px;
  z-index: 6;
  display: flex;
  align-items: center;
  gap: 28px;
`;

const RouteButton = styled.button<{ $active: boolean }>`
  padding: 14px 34px;
  border-radius: 8px;
  border: 2px solid ${({ $active }) => ($active ? "#15CBFF" : "#004F74")};
  background: ${({ $active }) =>
    $active
      ? "linear-gradient(180deg, #081920, #1D6F87)"
      : "rgba(3, 27, 40, 0.5)"};
  color: ${({ $active }) => ($active ? "#f2f9fc" : "#9fc4d8")};
  font-size: 32px;
  line-height: 44px;
  letter-spacing: 2px;
  white-space: nowrap;
  cursor: pointer;
  transition:
    border-color 180ms ease,
    background 180ms ease,
    color 180ms ease;
`;

export default function RouteButtons() {
  const [active, setActive] = useState(ROUTES[0]);

  return (
    <Group aria-label="精品线路选择">
      {ROUTES.map((route) => (
        <RouteButton
          key={route}
          type="button"
          $active={active === route}
          onClick={() => setActive(route)}
        >
          {route}
        </RouteButton>
      ))}
    </Group>
  );
}
