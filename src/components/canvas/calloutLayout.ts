import { HddPartData, isInternalPartId } from '../../data/hddParts';

export interface ScreenAnchor {
  part: HddPartData;
  x: number;
  y: number;
  visible: boolean;
}

export interface PlacedLabel {
  part: HddPartData;
  anchorX: number;
  anchorY: number;
  badgeX: number;
  labelY: number;
  gutter: 'left' | 'right';
  isSelected: boolean;
  isHovered: boolean;
}

export const CALLOUT_BADGE_WIDTH = 220;
const GUTTER_PADDING_X = 14;
const VERTICAL_MARGIN = 70;
const CLOSED_VERTICAL_STEP = 48;
const CLOSED_VERTICAL_INSET = 25;

interface RawAnchorItem {
  part: HddPartData;
  anchorX: number;
  anchorY: number;
}

function distributeGutter(
  rawList: RawAnchorItem[],
  gutter: 'left' | 'right',
  viewportWidth: number,
  viewportHeight: number,
  isLidClosed: boolean,
  selectedPartId: string | null,
  hoveredPartId: string | null
): PlacedLabel[] {
  if (rawList.length === 0) return [];

  const sorted = [...rawList].sort((a, b) => a.anchorY - b.anchorY);
  const n = sorted.length;
  const topMargin = VERTICAL_MARGIN;
  const bottomMargin = Math.max(topMargin + 40, viewportHeight - VERTICAL_MARGIN);
  const positions = new Array<number>(n);

  if (isLidClosed) {
    if (gutter === 'left') {
      for (let i = 0; i < n; i++) {
        positions[i] = topMargin + CLOSED_VERTICAL_INSET + i * CLOSED_VERTICAL_STEP;
      }
    } else {
      const startY = bottomMargin - (n - 1) * CLOSED_VERTICAL_STEP - CLOSED_VERTICAL_INSET;
      for (let i = 0; i < n; i++) {
        positions[i] = startY + i * CLOSED_VERTICAL_STEP;
      }
    }
  } else if (n === 1) {
    positions[0] = Math.max(topMargin, Math.min(bottomMargin, sorted[0].anchorY));
  } else {
    const step = (bottomMargin - topMargin) / (n - 1);
    for (let i = 0; i < n; i++) {
      positions[i] = topMargin + i * step;
    }
  }

  const badgeX =
    gutter === 'left'
      ? GUTTER_PADDING_X
      : Math.max(GUTTER_PADDING_X, viewportWidth - CALLOUT_BADGE_WIDTH - GUTTER_PADDING_X);

  return sorted.map((item, idx) => ({
    part: item.part,
    anchorX: item.anchorX,
    anchorY: item.anchorY,
    badgeX,
    labelY: positions[idx],
    gutter,
    isSelected: selectedPartId === item.part.id,
    isHovered: hoveredPartId === item.part.id,
  }));
}

/**
 * Pure collision-free 2D layout computation for floating technical callout badges.
 * Hides occluded internal cavity markers when the top cover is closed unless selected or in X-Ray.
 */
export function computeCalloutLayout(params: {
  anchors: ReadonlyArray<ScreenAnchor>;
  viewportWidth: number;
  viewportHeight: number;
  isLidClosed: boolean;
  isXRayMode: boolean;
  selectedPartId: string | null;
  hoveredPartId: string | null;
}): PlacedLabel[] {
  const {
    anchors,
    viewportWidth,
    viewportHeight,
    isLidClosed,
    isXRayMode,
    selectedPartId,
    hoveredPartId,
  } = params;

  if (!anchors.length) return [];

  const hideOccludedInternals = isLidClosed && !isXRayMode;
  const leftRaw: RawAnchorItem[] = [];
  const rightRaw: RawAnchorItem[] = [];

  for (let i = 0; i < anchors.length; i++) {
    const { part, x, y, visible } = anchors[i];
    if (!visible) continue;
    if (hideOccludedInternals && isInternalPartId(part.id) && selectedPartId !== part.id) {
      continue;
    }

    const item = { part, anchorX: x, anchorY: y };
    if (part.gutterSide === 'left') {
      leftRaw.push(item);
    } else {
      rightRaw.push(item);
    }
  }

  return [
    ...distributeGutter(
      leftRaw,
      'left',
      viewportWidth,
      viewportHeight,
      hideOccludedInternals,
      selectedPartId,
      hoveredPartId
    ),
    ...distributeGutter(
      rightRaw,
      'right',
      viewportWidth,
      viewportHeight,
      hideOccludedInternals,
      selectedPartId,
      hoveredPartId
    ),
  ];
}
