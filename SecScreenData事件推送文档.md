# 武汉大屏第二页实时事件推送对接文档

## 1. 推送方式

**SSE（Server-Sent Events）**，HTTP GET 长连接，服务端主动推事件，前端无需轮询。

### 1.1 订阅地址

```
GET /api/resource/screen/subscribe/{clientId}?lastEventId={lastEventId}
```

| 参数 | 必填 | 说明 |
|---|---|---|
| clientId | 是 | 客户端唯一标识，前端自行生成（建议存 localStorage 复用），服务端用它跟踪连接和消费位置 |
| lastEventId | 否 | 断线重连时传入，值为最后收到事件的 eventId；服务端会先补发断线期间错过的历史事件，再接实时流 |

### 1.2 前端订阅示例

```js
//ignore 😄
```

## 2. 事件结构

服务端推送的事件 `data` 字段为 JSON 字符串，结构如下：

```json
{
  "eventId": "3f2a8c1e-...-guid",
  "eventType": "wh-shipper:created",
  "dataType": "wh-shipper",
  "data": { ... }
}
```

| 字段 | 类型 | 说明 |
|---|---|---|
| eventId | string | 事件唯一 ID（GUID），用于断线重连时定位消费位置 |
| eventType | string | 事件类型：`数据类型:操作`，如 `wh-shipper:created` |
| dataType | string | 数据类型（哪张表），见表 1 |
| data | object | 变更记录的完整数据，结构与 panel2 接口对应列表项**完全一致**（含 id），见表 2 |

## 3. 类型约定

### 表 1：dataType / eventType 对照

| dataType | 业务 | eventType（操作后缀） |
|---|---|---|
| wh-shipper | 物流托运人 | :created   :updated   :deleted |
| wh-provider | 多式联运服务商 | :created   :updated   :deleted |
| wh-waybill | 整体数据概览（运单） | :created   :updated   :deleted |
| wh-nodeflow | 物流节点流向 | :created   :updated    :deleted |
| wh-request-event | 需求事件流 | :created   :updated   :deleted |
| wh-transport-capacity | 公路运力 | :created   :updated   :deleted |
| wh-exception-warning | 异常预警 | :created   :updated   :deleted |

### 表 2：data 字段结构（与 panel2 接口列表项同构）

**wh-shipper / 托运人**

| 字段 | 类型 | 说明 |
|---|---|---|
| id | string | 主键（Guid） |
| name | string | 托运人名称 |
| contact | string | 联系人 |
| phone | string | 联系电话 |
| method | string | 托运方式（中文文本） |

**wh-provider / 服务商**

| 字段 | 类型 | 说明 |
|---|---|---|
| id | string | 主键 |
| name | string | 服务商名称 |
| contact | string | 联系人 |
| phone | string | 联系电话 |
| type | string | 服务能力（中文文本） |

**wh-waybill / 运单**

| 字段 | 类型 | 说明 |
|---|---|---|
| id | string | 主键 |
| waybillNo | string | 运单号（WL 前缀系统生成） |
| shipperName | string | 客户（托运人名称） |
| origin | string | 起点 |
| dest | string | 终点 |
| goodsName | string | 品名 |
| carriageMethod | string | 运载方式（中文文本） |
| transportType | string | 运输方式（中文文本） |
| price | decimal | 运价 |

**wh-nodeflow / 节点流向**

| 字段 | 类型 | 说明 |
|---|---|---|
| id | string | 主键 |
| nodeType | int | 节点类型：0=铁路，1=水运 |
| terminal | string | 港站（铁路=站点名称，水运=港口名称） |
| facility | string | 设施（铁路=车务段，水运=水系） |
| address | string | 地址 |
| providerName | string | 服务商名称 |
| remark | string | 备注（铁路=可办理集装箱/不可办理集装箱，水运=处理能力） |

**wh-request-event / 需求事件**

| 字段 | 类型 | 说明 |
|---|---|---|
| id | string | 主键 |
| eventTime | string | 事件时间（HH:mm:ss） |
| origin | string | 起点 |
| dest | string | 终点 |
| goodsName | string | 品名 |
| price | decimal | 单价 |
| unit | string | 单价单位 |
| transitBegin | int | 时效开始（天） |
| transitEnd | int | 时效结束（天） |

**wh-transport-capacity / 公路运力**

| 字段 | 类型 | 说明 |
|---|---|---|
| id | string | 主键 |
| plateNo | string | 车牌号 |
| driverName | string | 司机姓名 |
| driverPhone | string | 司机电话 |

**wh-exception-warning / 异常预警**

| 字段 | 类型 | 说明 |
|---|---|---|
| id | string | 主键 |
| exceptionType | string | 异常类型 |
| exceptionMsg | string | 异常信息 |
| exceptionTime | string | 异常时间（HH:mm:ss） |
| exceptionStatus | string | 异常状态（中文文本） |

## 4. 前端处理规则（增量更新）

| eventType 后缀 | 处理 |
|---|---|
| :created | 按 data 在对应列表**头部插入一行** |
| :updated | 按 `data.id` 找到对应行**替换整行数据** |
| :deleted | 按 `data.id` **移除对应行** |

处理示例：

```js
//ignore 😄
```
