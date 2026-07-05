export type PageSize = "letter" | "a4" | "legal" | "tabloid";
export type Orientation = "portrait" | "landscape";
export type MarginSize = "narrow" | "normal" | "wide" | "custom";
export type FontSize = "small" | "normal" | "large";
export type RowSize = "compact" | "normal" | "spacious";
export type ColorMode = "color" | "grayscale";

export interface PrintSettings {
  pageSize: PageSize;
  orientation: Orientation;
  margin: MarginSize;
  marginTopIn: number;
  marginRightIn: number;
  marginBottomIn: number;
  marginLeftIn: number;
  fontSize: FontSize;
  rowSize: RowSize;
  colorMode: ColorMode;
  repeatHeader: boolean;
}

export const DEFAULT_PRINT_SETTINGS: PrintSettings = {
  pageSize: "letter",
  orientation: "landscape",
  margin: "normal",
  marginTopIn: 0.5,
  marginRightIn: 0.5,
  marginBottomIn: 0.5,
  marginLeftIn: 0.5,
  fontSize: "normal",
  rowSize: "normal",
  colorMode: "color",
  repeatHeader: true,
};

const PAGE_SIZES_IN: Record<PageSize, [number, number]> = {
  letter: [8.5, 11],
  a4: [8.27, 11.69],
  legal: [8.5, 14],
  tabloid: [11, 17],
};

const PRESET_MARGINS_IN: Record<"narrow" | "normal" | "wide", number> = { narrow: 0.25, normal: 0.5, wide: 1 };

const DPI = 96;

export interface MarginsIn {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export function marginsIn(settings: PrintSettings): MarginsIn {
  if (settings.margin === "custom") {
    return { top: settings.marginTopIn, right: settings.marginRightIn, bottom: settings.marginBottomIn, left: settings.marginLeftIn };
  }
  const v = PRESET_MARGINS_IN[settings.margin];
  return { top: v, right: v, bottom: v, left: v };
}

export function pageDimensionsPx(settings: PrintSettings) {
  let [wIn, hIn] = PAGE_SIZES_IN[settings.pageSize];
  if (settings.orientation === "landscape") [wIn, hIn] = [hIn, wIn];
  const m = marginsIn(settings);
  return {
    pageWidthPx: Math.round(wIn * DPI),
    pageHeightPx: Math.round(hIn * DPI),
    contentWidthPx: Math.round((wIn - m.left - m.right) * DPI),
    contentHeightPx: Math.round((hIn - m.top - m.bottom) * DPI),
    marginTopPx: Math.round(m.top * DPI),
    marginRightPx: Math.round(m.right * DPI),
    marginBottomPx: Math.round(m.bottom * DPI),
    marginLeftPx: Math.round(m.left * DPI),
  };
}

export function pageCssSize(settings: PrintSettings): string {
  if (settings.pageSize === "tabloid") {
    return settings.orientation === "landscape" ? "17in 11in" : "11in 17in";
  }
  const names: Record<PageSize, string> = { letter: "letter", a4: "A4", legal: "legal", tabloid: "" };
  return `${names[settings.pageSize]} ${settings.orientation}`;
}

export function marginCss(settings: PrintSettings): string {
  const m = marginsIn(settings);
  return `${m.top}in ${m.right}in ${m.bottom}in ${m.left}in`;
}

export const FONT_SCALE: Record<FontSize, number> = { small: 0.85, normal: 1, large: 1.2 };
export const ROW_PADDING_PX: Record<RowSize, number> = { compact: 2, normal: 5, spacious: 9 };

export const PAGE_SIZE_LABELS: Record<PageSize, string> = {
  letter: "Letter (8.5×11 in)",
  a4: "A4 (210×297 mm)",
  legal: "Legal (8.5×14 in)",
  tabloid: "Tabloid (11×17 in)",
};

export const MARGIN_LABELS: Record<MarginSize, string> = {
  narrow: "Narrow",
  normal: "Normal",
  wide: "Wide",
  custom: "Custom",
};

export const FONT_SIZE_LABELS: Record<FontSize, string> = {
  small: "Small",
  normal: "Normal",
  large: "Large",
};

export const ROW_SIZE_LABELS: Record<RowSize, string> = {
  compact: "Compact",
  normal: "Normal",
  spacious: "Spacious",
};
