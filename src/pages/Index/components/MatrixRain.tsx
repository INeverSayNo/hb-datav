import { useEffect, useRef } from "react";
import styled from "styled-components";

// 数字雨覆盖区域（大屏 5600x2320 坐标系），略大于中央地图舞台，
// 中间部分会被地图遮挡，四周通过 mask 渐隐、避免压到左右面板
const RAIN_LEFT = 1430;
const RAIN_TOP = 230;
const RAIN_WIDTH = 2760;
const RAIN_HEIGHT = 1760;

const FONT_SIZE = 30;
const COLUMN_WIDTH = 38;
const STEP_MS = 90; // 每步下落一格的间隔，步进感与 demo 一致
const HEAD_COLOR = "rgba(140, 235, 215, 0.9)"; // 暗青色，贴合大屏主色调
const TRAIL_FADE = 0.13; // 每步拖尾衰减量，值越大拖尾越短

const Canvas = styled.canvas`
  position: absolute;
  left: ${RAIN_LEFT}px;
  top: ${RAIN_TOP}px;
  width: ${RAIN_WIDTH}px;
  height: ${RAIN_HEIGHT}px;
  z-index: 1;
  opacity: 0.62;
  pointer-events: none;
  mask-image: radial-gradient(
    ellipse 60% 60% at 50% 50%,
    rgba(0, 0, 0, 1) 32%,
    rgba(0, 0, 0, 0.5) 62%,
    transparent 84%
  );
  -webkit-mask-image: radial-gradient(
    ellipse 60% 60% at 50% 50%,
    rgba(0, 0, 0, 1) 32%,
    rgba(0, 0, 0, 0.5) 62%,
    transparent 84%
  );
`;

interface MatrixRainProps {
  /** 控制数字雨显示 / 隐藏，false 时卸载画布并停止动画 */
  visible?: boolean;
}

export default function MatrixRain({ visible = true }: MatrixRainProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!visible) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const columns = Math.floor(RAIN_WIDTH / COLUMN_WIDTH);
    // 每列一个雨滴：入场时间错开，速度（每步前进概率）不同形成参差感
    const drops = Array.from({ length: columns }, () => ({
      row: -Math.floor(Math.random() * (RAIN_HEIGHT / FONT_SIZE) * 2),
      speed: 0.45 + Math.random() * 0.55,
    }));

    let raf = 0;
    let last = 0;

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      if (now - last < STEP_MS) return;
      last = now;

      // 以 destination-out 逐步降低已绘字符的透明度，形成拖尾且保持画布透明
      ctx.globalCompositeOperation = "destination-out";
      ctx.fillStyle = `rgba(0, 0, 0, ${TRAIL_FADE})`;
      ctx.fillRect(0, 0, RAIN_WIDTH, RAIN_HEIGHT);
      ctx.globalCompositeOperation = "source-over";

      ctx.font = `${FONT_SIZE}px "Courier New", Consolas, monospace`;
      ctx.fillStyle = HEAD_COLOR;
      for (let i = 0; i < columns; i++) {
        const drop = drops[i];
        if (Math.random() > drop.speed) continue;
        drop.row += 1;
        const y = drop.row * FONT_SIZE;
        if (y > 0 && y < RAIN_HEIGHT + FONT_SIZE) {
          ctx.fillText(Math.random() < 0.5 ? "0" : "1", i * COLUMN_WIDTH, y);
        }
        if (y > RAIN_HEIGHT + FONT_SIZE) {
          drop.row = -Math.floor(Math.random() * 30);
          drop.speed = 0.45 + Math.random() * 0.55;
        }
      }
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [visible]);

  if (!visible) return null;
  return (
    <Canvas
      ref={canvasRef}
      width={RAIN_WIDTH}
      height={RAIN_HEIGHT}
      aria-hidden="true"
    />
  );
}
