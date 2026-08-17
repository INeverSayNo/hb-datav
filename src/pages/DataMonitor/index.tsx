import AutoFit from "@/components/autoFit";
import NumberAnimation from "@/components/numberAnimation";
import monitorArrow from "@/assets/monitor-arrow.png";
import monitorOrderIcon from "@/assets/monitor-order-count.png";
import monitorShipperIcon from "@/assets/monitor-consignment-count.png";
import monitorProviderIcon from "@/assets/monitor-service-count.png";
import monitorWarningIcon from "@/assets/monitor-warnning.png";
import { useMonitorData } from "@/store/useMonitorData";
import type {
  MonitorExceptionWarning,
  MonitorNodeFlow,
  MonitorProvider,
  MonitorRequestEvent,
  MonitorShipper,
  MonitorTransportCapacity,
  MonitorWaybill,
} from "@/types/monitor";
import { useNavigate } from "react-router";
import styled from "styled-components";
import DashboardHeader from "../Index/components/DashboardHeader";
import LoopingTable, { type LoopingTableColumn } from "./LoopingTable";
import { useMonitorStream } from "./useMonitorStream";

const Dashboard = styled.div`
  position: relative;
  width: 5600px;
  height: 2320px;
  overflow: hidden;
  color: #fff;
  font-family: "Microsoft YaHei", "PingFang SC", "Noto Sans CJK SC", sans-serif;
  background:
    radial-gradient(circle at 50% 10%, rgba(7, 78, 91, 0.2), transparent 34%),
    #061821;
  user-select: none;
`;

const Content = styled.main`
  position: absolute;
  z-index: 2;
  top: 310px;
  left: 25px;
  right: 25px;
  height: 1790px;
  display: grid;
  grid-template-columns: 1670px 2120px 1670px;
  gap: 45px;
`;

const Column = styled.section`
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
`;

const SummaryGrid = styled.div`
  height: 240px;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 45px;
`;

const SummaryCard = styled.article<{ $accent: string }>`
  display: flex;
  align-items: center;
  min-width: 0;
  height: 240px;
  padding: 20px 28px;
  border: 3px solid ${({ $accent }) => $accent};
  background: ${({ $accent }) => `${$accent}18`};
  box-shadow: inset 0 0 50px rgba(2, 39, 51, 0.54);
`;

const SummaryIcon = styled.img`
  width: 150px;
  height: 174px;
  flex: 0 0 auto;
  object-fit: contain;
`;

const SummaryText = styled.div`
  min-width: 0;
  margin-left: 25px;
`;

const SummaryValue = styled(NumberAnimation)`
  color: #f3fbff;
  font-size: 52px;
  font-weight: 800;
  line-height: 1.18;
  letter-spacing: 1px;
  text-shadow: 0 0 18px rgba(104, 222, 255, 0.34);
`;

const SummaryLabel = styled.div`
  margin-top: 10px;
  color: #d3e6ee;
  font-size: 34px;
  font-weight: 700;
  white-space: nowrap;
`;

const Panel = styled.section<{ $height: number; $marginTop?: number }>`
  height: ${({ $height }) => $height}px;
  margin-top: ${({ $marginTop = 0 }) => $marginTop}px;
  min-height: 0;
  display: flex;
  flex-direction: column;
`;

const PanelHeading = styled.div`
  height: 76px;
  flex: 0 0 76px;
  display: flex;
  align-items: center;
  min-width: 0;
`;

const HeadingArrow = styled.img`
  width: 34px;
  height: 28px;
  margin-right: 16px;
  object-fit: contain;
`;

const HeadingText = styled.h2`
  margin: 0;
  color: #e7f4f8;
  font-size: 45px;
  font-weight: 600;
  line-height: 1;
  letter-spacing: 2px;
  white-space: nowrap;
`;

const LiveLabel = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 13px;
  margin-left: 26px;
  color: #2ddc82;
  font-size: 39px;
  font-weight: 600;
  white-space: nowrap;
`;

const LiveDot = styled.span`
  width: 27px;
  height: 27px;
  border: 8px solid rgba(25, 117, 72, 0.75);
  border-radius: 50%;
  background: #3de37d;
  box-shadow: 0 0 14px rgba(53, 225, 124, 0.65);
`;

const HeadingSpacer = styled.div`
  flex: 1;
`;

const NodeLegend = styled.div`
  display: flex;
  gap: 28px;
`;

const NodeTag = styled.span`
  min-width: 178px;
  padding: 16px 28px;
  border-radius: 6px;
  color: #d8f4fb;
  background: rgba(8, 63, 76, 0.88);
  font-size: 34px;
  line-height: 1;
  text-align: center;
  letter-spacing: 2px;
`;

const TableBody = styled.div`
  min-height: 0;
  flex: 1;
`;

const RequestLine = styled.div`
  display: flex;
  align-items: center;
  width: 100%;
  min-width: 0;
  gap: 28px;
  font-size: 34px;
  white-space: nowrap;
`;

const EventTime = styled.time`
  flex: 0 0 170px;
  color: #9bb1bb;
`;

const EventRoute = styled.span`
  flex: 1 1 260px;
  min-width: 0;
  overflow: hidden;
  color: #28cf77;
  text-overflow: ellipsis;
`;

const EventGoods = styled.span`
  flex: 0 1 250px;
  min-width: 0;
  overflow: hidden;
  color: #e8f1f4;
  text-overflow: ellipsis;
`;

const EventPrice = styled.span`
  flex: 0 0 auto;
  color: #ff9c14;
  font-weight: 700;
`;

const EventTransit = styled.span`
  flex: 0 0 auto;
  color: #e2ecef;
`;

const WarningType = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 18px;
  color: #b64d77;
`;

const WarningIcon = styled.img`
  width: 43px;
  height: 38px;
  object-fit: contain;
`;

const StatusBadge = styled.span<{ $status: string }>`
  display: inline-block;
  min-width: 112px;
  padding: 9px 18px;
  border-radius: 5px;
  color: #ffe8ef;
  background: ${({ $status }) =>
    $status === "已关闭" ? "#485769" : "rgba(128, 24, 67, 0.9)"};
  font-size: 31px;
  line-height: 1.1;
  text-align: center;
`;

const Footer = styled.footer`
  position: absolute;
  left: 0;
  right: 0;
  bottom: 76px;
  color: rgba(40, 105, 130, 0.6);
  font-size: 32px;
  font-weight: 700;
  text-align: center;
  letter-spacing: 2px;
`;

function SectionTitle({
  children,
  live,
  legend,
}: {
  children: string;
  live?: "scroll" | "live";
  legend?: boolean;
}) {
  return (
    <PanelHeading>
      <HeadingArrow src={monitorArrow} alt="" />
      <HeadingText>{children}</HeadingText>
      {live && (
        <LiveLabel>
          {live === "live" && <LiveDot />}
          {live === "live" ? "LIVE" : "实时滚动"}
        </LiveLabel>
      )}
      {legend && (
        <>
          <HeadingSpacer />
          <NodeLegend aria-label="节点类型图例">
            <NodeTag>水运节点</NodeTag>
            <NodeTag>铁路节点</NodeTag>
          </NodeLegend>
        </>
      )}
    </PanelHeading>
  );
}

function formatMoney(value: number) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "--";
  if (Math.abs(amount) >= 1000) {
    const compact = amount / 1000;
    return `¥${compact.toFixed(compact % 1 === 0 ? 0 : 1)}K`;
  }
  return `¥${amount.toLocaleString("zh-CN", { maximumFractionDigits: 2 })}`;
}

function formatUnitPrice(value: number, unit: string) {
  const amount = Number(value);
  return Number.isFinite(amount) ? `¥${amount.toFixed(2)}${unit}` : "--";
}

const shipperColumns: LoopingTableColumn<MonitorShipper>[] = [
  { title: "名称", dataIndex: "name", width: 1.2 },
  { title: "联系人", dataIndex: "contact", width: 0.9 },
  { title: "联系电话", dataIndex: "phone", width: 1.15 },
  { title: "托运方式", dataIndex: "method", width: 0.8 },
];

const providerColumns: LoopingTableColumn<MonitorProvider>[] = [
  { title: "名称", dataIndex: "name", width: 1.2 },
  { title: "联系人", dataIndex: "contact", width: 0.9 },
  { title: "联系电话", dataIndex: "phone", width: 1.15 },
  { title: "服务能力", dataIndex: "type", width: 0.8 },
];

const waybillColumns: LoopingTableColumn<MonitorWaybill>[] = [
  { title: "运单号", dataIndex: "waybillNo", width: 1.35 },
  { title: "客户", dataIndex: "shipperName", width: 1.2 },
  {
    title: "起讫点(OD)",
    render: (item) => `${item.origin}→${item.dest}`,
    width: 1,
  },
  { title: "品名", dataIndex: "goodsName", width: 0.65 },
  { title: "运载方式", dataIndex: "carriageMethod", width: 0.9 },
  { title: "运输方式", dataIndex: "transportType", width: 0.9 },
  { title: "运价", render: (item) => formatMoney(item.price), width: 0.72 },
];

const nodeColumns: LoopingTableColumn<MonitorNodeFlow>[] = [
  { dataIndex: "terminal", width: 1.05 },
  { dataIndex: "facility", width: 0.95 },
  { dataIndex: "remark", width: 0.95 },
  { dataIndex: "address", width: 1.75 },
  { dataIndex: "providerName", width: 1.5 },
];

const requestColumns: LoopingTableColumn<MonitorRequestEvent>[] = [
  {
    width: 1,
    render: (item) => (
      <RequestLine>
        <EventTime>{item.eventTime}</EventTime>
        <EventRoute>{`${item.origin}至${item.dest}`}</EventRoute>
        <EventGoods>品名:{item.goodsName}</EventGoods>
        <EventPrice>{formatUnitPrice(item.price, item.unit)}</EventPrice>
        <EventTransit>{`时效要求:${item.transitBegin}-${item.transitEnd}天`}</EventTransit>
      </RequestLine>
    ),
  },
];

const capacityColumns: LoopingTableColumn<MonitorTransportCapacity>[] = [
  { dataIndex: "plateNo", width: 1 },
  { dataIndex: "driverName", width: 0.8 },
  { dataIndex: "driverPhone", width: 1.05 },
];

const warningColumns: LoopingTableColumn<MonitorExceptionWarning>[] = [
  {
    title: "预警类型",
    width: 1.05,
    render: (item) => (
      <WarningType>
        <WarningIcon src={monitorWarningIcon} alt="" />
        {item.exceptionType}
      </WarningType>
    ),
  },
  { title: "预警内容", dataIndex: "exceptionMsg", width: 1.8 },
  { title: "预警时间", dataIndex: "exceptionTime", width: 0.8 },
  {
    title: "状态",
    width: 0.72,
    align: "center",
    render: (item) => (
      <StatusBadge $status={item.exceptionStatus}>
        {item.exceptionStatus}
      </StatusBadge>
    ),
  },
];

function MonitorDashboard() {
  const navigate = useNavigate();
  const summary = useMonitorData((state) => state.summary);
  const shipperList = useMonitorData((state) => state.shipperList);
  const providerList = useMonitorData((state) => state.providerList);
  const waybillList = useMonitorData((state) => state.waybillList);
  const nodeFlowList = useMonitorData((state) => state.nodeFlowList);
  const requestEventList = useMonitorData((state) => state.requestEventList);
  const transportCapacityList = useMonitorData(
    (state) => state.transportCapacityList,
  );
  const exceptionWarningList = useMonitorData(
    (state) => state.exceptionWarningList,
  );

  useMonitorStream();

  return (
    <Dashboard>
      <DashboardHeader
        type="monitor"
        title="物流多式联运数据监控中心"
        onBack={() => navigate("/")}
      />
      <Content>
        <Column>
          <SummaryGrid>
            <SummaryCard $accent="#036270">
              <SummaryIcon src={monitorOrderIcon} alt="" />
              <SummaryText>
                <SummaryValue value={summary.wayBill} duration={0.5} />
                <SummaryLabel>运单数量</SummaryLabel>
              </SummaryText>
            </SummaryCard>
            <SummaryCard $accent="#075084">
              <SummaryIcon src={monitorShipperIcon} alt="" />
              <SummaryText>
                <SummaryValue value={summary.shipper} duration={0.5} />
                <SummaryLabel>托运人</SummaryLabel>
              </SummaryText>
            </SummaryCard>
            <SummaryCard $accent="#036270">
              <SummaryIcon src={monitorProviderIcon} alt="" />
              <SummaryText>
                <SummaryValue value={summary.provider} duration={0.5} />
                <SummaryLabel>服务商</SummaryLabel>
              </SummaryText>
            </SummaryCard>
          </SummaryGrid>

          <Panel $height={560} $marginTop={32}>
            <SectionTitle live="scroll">物流托运人</SectionTitle>
            <TableBody>
              <LoopingTable
                data={shipperList}
                columns={shipperColumns}
                visibleRows={4}
                rowHeight={98}
              />
            </TableBody>
          </Panel>

          <Panel $height={926} $marginTop={32}>
            <SectionTitle live="scroll">物流多式联运服务商</SectionTitle>
            <TableBody>
              <LoopingTable
                data={providerList}
                columns={providerColumns}
                visibleRows={7}
                rowHeight={108}
              />
            </TableBody>
          </Panel>
        </Column>

        <Column>
          <Panel $height={850}>
            <SectionTitle live="scroll">多式联运整体数据概览</SectionTitle>
            <TableBody>
              <LoopingTable
                data={waybillList}
                columns={waybillColumns}
                visibleRows={7}
                rowHeight={97}
              />
            </TableBody>
          </Panel>

          <Panel $height={905} $marginTop={35}>
            <SectionTitle live="scroll" legend>
              重要物流节点流向
            </SectionTitle>
            <TableBody>
              <LoopingTable
                data={nodeFlowList}
                columns={nodeColumns}
                visibleRows={5}
                rowHeight={165}
                showHeader={false}
              />
            </TableBody>
          </Panel>
        </Column>

        <Column>
          <Panel $height={850}>
            <SectionTitle live="live">实时需求事件流</SectionTitle>
            <TableBody>
              <LoopingTable
                data={requestEventList}
                columns={requestColumns}
                visibleRows={7}
                rowHeight={110}
                showHeader={false}
                rowPadding="0 34px"
              />
            </TableBody>
          </Panel>

          <Panel $height={425} $marginTop={35}>
            <SectionTitle live="scroll">实时公路运力</SectionTitle>
            <TableBody>
              <LoopingTable
                data={transportCapacityList}
                columns={capacityColumns}
                visibleRows={3}
                rowHeight={115}
                showHeader={false}
              />
            </TableBody>
          </Panel>

          <Panel $height={445} $marginTop={35}>
            <SectionTitle>异常预警</SectionTitle>
            <TableBody>
              <LoopingTable
                data={exceptionWarningList}
                columns={warningColumns}
                visibleRows={2}
                rowHeight={136}
                borderColor="rgba(117, 28, 65, 0.96)"
                headerBackground="rgba(112, 28, 62, 0.94)"
              />
            </TableBody>
          </Panel>
        </Column>
      </Content>
      <Footer>武汉市多式联运服务中心&nbsp;&nbsp;数据经脱敏处理</Footer>
    </Dashboard>
  );
}

export default function Index() {
  return (
    <AutoFit
      dw={5600}
      dh={2320}
      aria-label="武汉多式联运服务中心数据大屏"
    >
      <MonitorDashboard />
    </AutoFit>
  );
}
