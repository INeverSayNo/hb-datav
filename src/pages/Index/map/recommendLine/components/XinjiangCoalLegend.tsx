import styled from "styled-components";

import hbMainPorts from "@/assets/hb-main-port.json";

const LEGEND_COLUMN_COUNT = 3;
const legendItemCount =
  Math.ceil(hbMainPorts.length / LEGEND_COLUMN_COUNT) * LEGEND_COLUMN_COUNT;
const legendItems = Array.from(
  { length: legendItemCount },
  (_, index) => hbMainPorts[index % hbMainPorts.length],
);

const HbPointLegendPanel = styled.div`
  position: absolute;
  left: 100px;
  bottom: 0;
  z-index: 3;
  display: flex;
  align-items: stretch;
  gap: 28px;
  max-width: 3200px;
  pointer-events: none;
`;

const Panel = styled.section`
  width: 668px;
  padding: 22px 30px 28px;
  box-sizing: border-box;
  border: 2px solid rgba(126, 165, 180, 0.45);
  border-radius: 12px;
  background: rgba(8, 28, 40, 0.78);
  pointer-events: none;
`;

const Title = styled.h3`
  margin: 0;
  color: #f2f9fc;
  font-size: 34px;
  line-height: 44px;
  font-weight: 700;
  letter-spacing: 2px;
`;

const ScrollViewport = styled.div`
  height: 104px;
  margin-top: 20px;
  overflow: hidden;
  mask-image: linear-gradient(
    to bottom,
    transparent 0,
    #000 10px,
    #000 calc(100% - 10px),
    transparent 100%
  );
  -webkit-mask-image: linear-gradient(
    to bottom,
    transparent 0,
    #000 10px,
    #000 calc(100% - 10px),
    transparent 100%
  );
`;

const ScrollTrack = styled.div`
  display: flex;
  flex-direction: column;
  will-change: transform;
  animation: xinjiang-coal-legend-scroll 18s linear infinite;

  @keyframes xinjiang-coal-legend-scroll {
    from {
      transform: translateY(0);
    }
    to {
      transform: translateY(-50%);
    }
  }
`;

const LegendGrid = styled.div`
  display: grid;
  flex: none;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  grid-auto-rows: 52px;
  align-items: center;
  column-gap: 18px;
`;

const LegendItem = styled.div`
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 10px;
  color: rgba(242, 249, 252, 0.94);
  font-size: 18px;
  line-height: 1;
  white-space: nowrap;
`;

const ColorDot = styled.i<{ $color: string }>`
  width: 18px;
  height: 18px;
  flex: 0 0 18px;
  border: 2px solid rgba(255, 255, 255, 0.75);
  border-radius: 50%;
  background: ${({ $color }) => $color};
  box-shadow: 0 0 12px ${({ $color }) => `${$color}cc`};
`;

function LegendItems() {
  return (
    <>
      {legendItems.map((item, index) => (
        <LegendItem key={`${item.label}-${index}`}>
          <ColorDot $color={item.color} />
          <span>{item.label}</span>
        </LegendItem>
      ))}
    </>
  );
}

export default function XinjiangCoalLegend() {
  return (
    <HbPointLegendPanel>
      <Panel>
        <Title>图例</Title>
        <ScrollViewport>
          <ScrollTrack>
            <LegendGrid>
              <LegendItems />
            </LegendGrid>
            <LegendGrid aria-hidden="true">
              <LegendItems />
            </LegendGrid>
          </ScrollTrack>
        </ScrollViewport>
      </Panel>
    </HbPointLegendPanel>
  );
}
