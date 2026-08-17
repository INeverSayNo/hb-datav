/**
 * POI 标签碰撞处理：标签重叠时堆叠错开，并用指向性线条连接节点。
 * 由 three.tsx（湖北 POI）与 recommendLine（精品线路 POI）共用。
 *
 * DOM 约定：
 * - marker 内含 [data-poi-icon]（节点/图标，导引线指向其顶部）
 * - marker 内含 [data-poi-label]（标签本体）
 * - 解析结果写回 marker 的 CSS 变量：
 *   --poi-label-offset-y     标签向上平移量（marker 局部 CSS px）
 *   --poi-leader-display     none / block
 *   --poi-leader-top / --poi-leader-height  导引线位置与高度
 * - 当 leaderMarkers 存在时，同步把导引线变量写入独立的低层级 marker
 *
 * 同时兼容两种布局：
 * - three.tsx：marker 为真实尺寸的流式 flex 布局
 * - recommendLine：marker 为 0×0 定位容器 + 绝对定位子元素
 * 横向中心统一取 icon 中心；纵向基准用 label.offsetTop（不含 transform），
 * 因此重复调用不会因上一次设置的 translateY 产生反馈漂移。
 * placement 默认为 above，Europe 小地图可显式传 below向节点下方堆叠。
 */
export type LabelScreenRect = {
  bottom: number;
  left: number;
  right: number;
  top: number;
};

export const POI_LABEL_COLLISION_PADDING = 4;
export const POI_LABEL_ABOVE_GAP = 28;
export const POI_LABEL_BELOW_GAP = 18;
export const POI_LABEL_STACK_GAP = 6;
export const POI_LABEL_MAX_LEVELS = 12;

export type PoiLabelCollisionOptions = {
  leaderMarkers?: Array<HTMLDivElement | null>;
  placement?: "above" | "below";
};

function labelsOverlap(a: LabelScreenRect, b: LabelScreenRect) {
  return !(
    a.right + POI_LABEL_COLLISION_PADDING <= b.left ||
    a.left >= b.right + POI_LABEL_COLLISION_PADDING ||
    a.bottom + POI_LABEL_COLLISION_PADDING <= b.top ||
    a.top >= b.bottom + POI_LABEL_COLLISION_PADDING
  );
}

export function resolvePoiLabelCollisions(
  markers: Array<HTMLDivElement | null>,
  {
    leaderMarkers,
    placement = "above",
  }: PoiLabelCollisionOptions = {},
) {
  const accepted: LabelScreenRect[] = [];

  markers.forEach((marker, markerIndex) => {
    if (!marker) return;

    const setMarkerProperty = (property: string, value: string) => {
      marker.style.setProperty(property, value);
      leaderMarkers?.[markerIndex]?.style.setProperty(property, value);
    };

    const icon = marker.querySelector<HTMLElement>("[data-poi-icon]");
    const label = marker.querySelector<HTMLElement>("[data-poi-label]");
    if (!icon || !label) return;

    const labelRect = label.getBoundingClientRect();
    // 标签尚未完成布局时跳过（替代原 marker.offsetWidth === 0 的守卫，
    // 兼容 0×0 的 PoiMarkerWrap）。
    if (labelRect.width === 0 || labelRect.height === 0) return;

    // CSS 缩放比：屏幕像素 / 布局像素（AutoFit 会对整页做 CSS 缩放）。
    // 用 label 自身宽度计算，兼容 marker 宽度为 0 的情况。
    const screenScale = labelRect.width / label.offsetWidth;
    if (!Number.isFinite(screenScale) || screenScale <= 0) return;

    const markerRect = marker.getBoundingClientRect();
    const iconRect = icon.getBoundingClientRect();
    const iconCenterX = iconRect.left + iconRect.width / 2;
    const iconTop = iconRect.top;
    // 基准位置：offsetTop 是布局偏移（不含 transform），无反馈漂移
    const baseTop = markerRect.top + label.offsetTop * screenScale;
    const width = label.offsetWidth * screenScale;
    const height = label.offsetHeight * screenScale;
    const baseLeft = iconCenterX - width / 2;

    let candidate: LabelScreenRect = {
      bottom: baseTop + height,
      left: baseLeft,
      right: baseLeft + width,
      top: baseTop,
    };
    let offsetY = 0;

    if (accepted.some((other) => labelsOverlap(candidate, other))) {
      const levelStep =
        height +
        POI_LABEL_COLLISION_PADDING +
        POI_LABEL_STACK_GAP * screenScale;

      for (let level = 0; level < POI_LABEL_MAX_LEVELS; level += 1) {
        const candidateTop =
          placement === "below"
            ? iconRect.bottom +
              POI_LABEL_BELOW_GAP * screenScale +
              level * levelStep
            : iconTop -
              height -
              POI_LABEL_ABOVE_GAP * screenScale -
              level * levelStep;
        candidate = {
          bottom: candidateTop + height,
          left: iconCenterX - width / 2,
          right: iconCenterX + width / 2,
          top: candidateTop,
        };
        offsetY = (candidateTop - baseTop) / screenScale;
        if (!accepted.some((other) => labelsOverlap(candidate, other))) break;
      }
    }

    setMarkerProperty("--poi-label-offset-y", `${offsetY}px`);
    if (offsetY !== 0) {
      const isBelow = placement === "below";
      const labelEdge = isBelow
        ? label.offsetTop + offsetY
        : label.offsetTop + offsetY + label.offsetHeight;
      const iconEdge = isBelow
        ? icon.offsetTop + icon.offsetHeight
        : icon.offsetTop;
      const leaderTop = isBelow ? iconEdge : labelEdge;
      const leaderHeight = Math.max(
        0,
        isBelow ? labelEdge - iconEdge : iconEdge - labelEdge,
      );
      setMarkerProperty("--poi-leader-display", "block");
      setMarkerProperty("--poi-leader-top", `${leaderTop}px`);
      setMarkerProperty("--poi-leader-height", `${leaderHeight}px`);
    } else {
      setMarkerProperty("--poi-leader-display", "none");
    }

    accepted.push(candidate);
  });
}
