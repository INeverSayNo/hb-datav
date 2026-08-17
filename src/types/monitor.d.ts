import type {
  ExceptionTypeName,
  LogisticNodeTypeId,
  TransportTypeName,
  CarriageTypeName,
  ServiceTypeName,
} from "@/utils/monitorEnum";

/**
 * 武汉第二屏（物流大屏）数据
 * 接口路径：/api/resource/screen/hb/panel2（GET，无参数）
 */
export interface MonitorTable {
  /** 顶部统计 */
  summary: {
    /** 运单总量 */
    wayBill: number;
    /** 托运人总量 */
    shipper: number;
    /** 服务商总量 */
    provider: number;
  };
  /** 物流托运人 */
  shipperList: {
    /** 托运人名称 */
    name: string;
    /** 联系人 */
    contact: string;
    /** 联系电话 */
    phone: string;
    /** 托运方式（中文文本，见运输方式枚举表） */
    method: string;
  }[];
  /** 多式联运服务商 */
  providerList: {
    /** 服务商名称 */
    name: string;
    /** 联系人 */
    contact: string;
    /** 联系电话 */
    phone: string;
    /** 服务能力（中文文本，见服务能力枚举表） */
    type: ServiceTypeName;
  }[];
  /** 整体数据概览（运单） */
  waybillList: {
    /** 运单号（WL 前缀系统生成） */
    waybillNo: string;
    /** 客户（托运人名称） */
    shipperName: string;
    /** 起点 */
    origin: string;
    /** 终点 */
    dest: string;
    /** 品名 */
    goodsName: string;
    /** 运载方式（中文文本，见运载方式枚举表） */
    carriageMethod: CarriageTypeName;
    /** 运输方式（中文文本，见运输方式枚举表） */
    transportType: TransportTypeName;
    /** 运价 */
    price: string;
  }[];
  /** 重要物流节点流向 */
  nodeFlowList: {
    /** 节点类型：0=铁路，1=水运 */
    nodeType: LogisticNodeTypeId;
    /** 港站（铁路=站点名称，水运=港口名称） */
    terminal: string;
    /** 设施（铁路=车务段，水运=水系） */
    facility: string;
    /** 地址 */
    address: string;
    /** 服务商名称 */
    providerName: string;
    /** 备注（铁路="可办理集装箱/不可办理集装箱"，水运=处理能力文本） */
    remark: string;
  }[];
  /** 实时需求事件流 */
  requestEventList: {
    /** 事件时间，格式 HH:mm:ss */
    eventTime: string;
    /** 起点 */
    origin: string;
    /** 终点 */
    dest: string;
    /** 品名 */
    goodsName: string;
    /** 单价 */
    price: number;
    /** 单价单位（目前仅"元/吨"） */
    unit: string;
    /** 时效要求-开始（天） */
    transitBegin: number;
    /** 时效要求-结束（天） */
    transitEnd: number;
  }[];
  /** 实时公路运力 */
  transportCapacityList: {
    /** 车牌号 */
    plateNo: string;
    /** 司机姓名 */
    driverName: string;
    /** 司机电话 */
    driverPhone: string;
  }[];
  /** 异常预警 */
  exceptionWarningList: {
    /** 异常类型 */
    exceptionType: string;
    /** 异常信息 */
    exceptionMsg: string;
    /** 异常时间，格式 HH:mm:ss */
    exceptionTime: string;
    /** 异常状态（中文文本，见异常状态枚举表） */
    exceptionStatus: ExceptionTypeName;
  }[];
}
