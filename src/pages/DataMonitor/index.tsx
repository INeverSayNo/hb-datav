import AutoFit from "@/components/autoFit";
import styled from "styled-components";
import DashboardHeader from "../Index/components/DashboardHeader";

const Dashboard = styled.div`
  position: relative;
  width: 5600px;
  height: 2320px;
  overflow: hidden;
  color: #fff;
  font-family: "Microsoft YaHei", "PingFang SC", "Noto Sans CJK SC", sans-serif;
  background: #061821;
  user-select: none;
`;

export default function Index() {
  return (
    <AutoFit dw={5600} dh={2320} aria-label="武汉多式联运服务中心数据大屏">
      <Dashboard>
        <DashboardHeader type="monitor" title="物流多式联运数据监控中心"/>
      </Dashboard>
    </AutoFit>
  );
}
