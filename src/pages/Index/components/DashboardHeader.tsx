import { useEffect, useState } from "react";
import styled from "styled-components";

const Header = styled.header`
  position: absolute;
  inset: 0 0 auto;
  height: 276px;
  z-index: 5;
  pointer-events: none;
`;

const Status = styled.div`
  position: absolute;
  left: 230px;
  top: 58px;
  display: flex;
  align-items: center;
  gap: 25px;
  color: #6fffd2;
  font-size: 46px;
  font-weight: 700;
  letter-spacing: 2px;
  text-shadow: 0 0 18px rgba(30, 255, 178, 0.55);
`;

const StatusDot = styled.span`
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: #31d372;
  border: 7px solid rgba(22, 118, 73, 0.82);
  box-shadow: 0 0 18px rgba(54, 255, 132, 0.72);
`;

const MainTitle = styled.h1`
  position: absolute;
  left: 2033px;
  top: 62px;
  width: 1534px;
  height: 118px;
  margin: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: "YouSheBiaoTiHei", "Microsoft YaHei", sans-serif;
  font-size: 140px;
  font-weight: 400;
  line-height: 1;
  letter-spacing: 18px;
  white-space: nowrap;
  color: rgba(255, 254, 254, 0);
  text-shadow: 0px 7px 0px rgba(0,0,0,0.19);
  background: linear-gradient(0deg, rgba(169,222,254,0.93) 0%, rgba(241,249,255,0.93) 38.7939453125%, rgba(255,251,251,0.93) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;

`;

const Environment = styled.div`
  position: absolute;
  right: 228px;
  top: 60px;
  display: flex;
  align-items: center;
  gap: 76px;
  color: #a9c7da;
  font-size: 42px;
  font-weight: 600;
  letter-spacing: 2px;
  text-shadow: 0 0 12px rgba(91, 190, 246, 0.35);
`;

const Weather = styled.div`
  display: flex;
  align-items: center;
  gap: 22px;
`;

const Cloud = styled.span`
  position: relative;
  width: 48px;
  height: 24px;
  margin-top: 10px;
  border-radius: 20px;
  background: #a9c7da;

  &::before,
  &::after {
    content: "";
    position: absolute;
    bottom: 8px;
    border-radius: 50%;
    background: inherit;
  }

  &::before {
    left: 7px;
    width: 25px;
    height: 25px;
  }

  &::after {
    right: 5px;
    width: 33px;
    height: 33px;
  }
`;

function formatTime(date: Date) {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function DashboardHeader() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <Header>
      <Status>
        <StatusDot />
        运行稳定
      </Status>
      <MainTitle>武汉多式联运服务中心</MainTitle>
      <Environment>
        <time dateTime={now.toISOString()}>{formatTime(now)}</time>
        <Weather>
          <Cloud aria-hidden="true" />
          <span>多云</span>
          <span>23~34℃</span>
        </Weather>
      </Environment>
    </Header>
  );
}
