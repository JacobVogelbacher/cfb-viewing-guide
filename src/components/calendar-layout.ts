export const NATURAL_TIME_COL_PX = 112;
export const NATURAL_NETWORK_COL_PX = 96;
export const NATURAL_ROW_HEIGHT_PX = 68;
export const NATURAL_HEADER_HEIGHT_PX = 40;
export const NATURAL_LOGO_PX = 36;

export type CalendarLayout = {
  timeCol: number;
  networkCol: number;
  rowHeight: number;
  headerHeight: number;
  logoSize: number;
  tableWidth: number;
  timelineWidth: number;
  scale: number;
};

export function naturalTableSize(hourCount: number, laneCount: number) {
  const width = NATURAL_NETWORK_COL_PX + hourCount * NATURAL_TIME_COL_PX;
  const height = NATURAL_HEADER_HEIGHT_PX + laneCount * NATURAL_ROW_HEIGHT_PX;
  return { width, height };
}

/** Scale layout so table width matches container (Fit to Screen). */
export function computeLayoutFitWidth(
  hourCount: number,
  containerWidth: number,
): CalendarLayout {
  const naturalTable = NATURAL_NETWORK_COL_PX + hourCount * NATURAL_TIME_COL_PX;
  const scale =
    containerWidth > 0 && naturalTable > 0
      ? containerWidth / naturalTable
      : 1;
  return layoutFromScale(hourCount, scale);
}

/** Uniform scale (used for screenshot modal: fit width + height). */
export function layoutFromScale(
  hourCount: number,
  scale: number,
): CalendarLayout {
  const s = Math.max(0.05, scale);
  const timeCol = NATURAL_TIME_COL_PX * s;
  const networkCol = NATURAL_NETWORK_COL_PX * s;
  const rowHeight = NATURAL_ROW_HEIGHT_PX * s;
  const headerHeight = NATURAL_HEADER_HEIGHT_PX * s;
  const logoSize = NATURAL_LOGO_PX * s;
  const timelineWidth = hourCount * timeCol;
  const tableWidth = networkCol + timelineWidth;

  return {
    timeCol,
    networkCol,
    rowHeight,
    headerHeight,
    logoSize,
    tableWidth,
    timelineWidth,
    scale: s,
  };
}

/** Scale that fits the full table inside a box (no crop, no scroll). */
export function fitScaleToViewport(
  hourCount: number,
  laneCount: number,
  availableWidth: number,
  availableHeight: number,
): number {
  const { width, height } = naturalTableSize(hourCount, laneCount);
  if (availableWidth <= 0 || availableHeight <= 0 || width <= 0 || height <= 0) {
    return 1;
  }
  return Math.min(availableWidth / width, availableHeight / height);
}
