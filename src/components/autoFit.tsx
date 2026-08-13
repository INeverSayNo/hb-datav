import {
  useLayoutEffect,
  useState,
  type HTMLAttributes,
  type PropsWithChildren,
} from "react";
import styled from "styled-components";

const Viewport = styled.div`
  position: fixed;
  inset: 0;
  overflow: hidden;
  background: #061821;
`;

const Stage = styled.div<{
  $designWidth: number;
  $designHeight: number;
  $scale: number;
}>`
  position: absolute;
  left: 50%;
  top: 50%;
  width: ${({ $designWidth }) => $designWidth}px;
  height: ${({ $designHeight }) => $designHeight}px;
  transform: translate(-50%, -50%) scale(${({ $scale }) => $scale});
  transform-origin: center;
  overflow: hidden;
`;

export type AutoFitProps = PropsWithChildren<
  Omit<HTMLAttributes<HTMLDivElement>, "children"> & {
    dw?: number;
    dh?: number;
  }
>;

export default function AutoFit({
  dw = 1920,
  dh = 1080,
  children,
  ...props
}: AutoFitProps) {
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const updateScale = () => {
      setScale(Math.min(window.innerWidth / dw, window.innerHeight / dh));
    };

    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, [dw, dh]);

  return (
    <Viewport>
      <Stage
        $designWidth={dw}
        $designHeight={dh}
        $scale={scale}
        {...props}>
        {children}
      </Stage>
    </Viewport>
  );
}
