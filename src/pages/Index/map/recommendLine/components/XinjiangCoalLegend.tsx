import styled from "styled-components";

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


export default function XinjiangColaLegend() {
  return (
    <HbPointLegendPanel>
      <Panel>
        <Title>图例</Title>
        <div>test</div>
      </Panel>
    </HbPointLegendPanel>
  );
}
