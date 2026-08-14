import { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import AliIcon from "@/components/aliIcon";
import { GetWeather } from "@/api/modules/baseDataApi";
import { useConfigStore } from "@/store/useLocationStore";
import type { WeatherInfo } from "@/types/weather";

const iconName = new Map([
  [["晴"], "lieri"],
  [["雨夹雪"], "yujiaxue"],
  [["多云"], "duoyun"],
  [["阴"], "yun"],
  [["阵雨", "小雨", "中雨", "小到中雨", "中到大雨", "雨", "冻雨"], "xiaoyu"],
  [
    [
      "大雨",
      "暴雨",
      "大暴雨",
      "特大暴雨",
      "大到暴雨",
      "暴雨到大暴雨",
      "大暴雨到特大暴雨",
    ],
    "dayu",
  ],
  [["雷阵雨", "雷阵雨伴有冰雹"], "leidian"],
  [
    ["阵雪", "小雪", "中雪", "小到中雪", "中到大雪", "雪", "弱高吹雪"],
    "zhongxue",
  ],
  [["大雪", "暴雪", "大到暴雪"], "daxue"],
  [
    [
      "雾",
      "浓雾",
      "强浓雾",
      "大雾",
      "轻雾",
      "霾",
      "中度霾",
      "重度霾",
      "严重霾",
      "特强浓雾",
    ],
    "wuqi",
  ],
  [["龙卷风", "强沙尘暴", "扬沙", "浮尘", "沙尘暴"], "feng"],
]);

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
  text-shadow: 0px 7px 0px rgba(0, 0, 0, 0.19);
  background: linear-gradient(
    0deg,
    rgba(169, 222, 254, 0.93) 0%,
    rgba(241, 249, 255, 0.93) 38.7939453125%,
    rgba(255, 251, 251, 0.93) 100%
  );
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

function formatTime(date: Date) {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate(),
  )} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function DashboardHeader() {
  const [now, setNow] = useState(() => new Date());

  const [weather, setWeather] = useState<WeatherInfo | null>(null);

  const district = useConfigStore((s) => s.district);
  const cityName = useConfigStore((s) => s.cityName);

  const weatherIcon = useMemo(() => {
    const text = weather?.text;
    if (!text) return "nongyun";

    for (const [texts, icon] of iconName) {
      if (texts.includes(text)) return icon;
    }
    return "nongyun";
  }, [weather?.text]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const target = district || cityName;
    let cancelled = false;
    const fetchWeather = async () => {
      const [_err, data] = await GetWeather(target);
      if (!cancelled && data && data.result) {
        setWeather(data.result);
      }
    };
    fetchWeather();
    return () => {
      cancelled = true;
    };
  }, [district, cityName]);

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
          <AliIcon name={weatherIcon}></AliIcon>
          <span>{weather?.text}</span>
          <span>{weather?.temp}℃</span>
        </Weather>
      </Environment>
    </Header>
  );
}
