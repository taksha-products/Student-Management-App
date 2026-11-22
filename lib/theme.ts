export const DEFAULT_BRAND_COLOR = "#F97316";

const HEX_PATTERN = /^#[0-9A-Fa-f]{6}$/;

const clamp = (value: number): number => Math.max(0, Math.min(255, Math.round(value)));

const parseHex = (hex: string): { r: number; g: number; b: number } | null => {
  if (!HEX_PATTERN.test(hex)) {
    return null;
  }
  return {
    r: parseInt(hex.slice(1, 3), 16),
    g: parseInt(hex.slice(3, 5), 16),
    b: parseInt(hex.slice(5, 7), 16)
  };
};

const toHex = (r: number, g: number, b: number): string =>
  `#${[r, g, b].map((channel) => channel.toString(16).padStart(2, "0")).join("")}`;

export const normalizeBrandColor = (brandColor?: string | null): string => {
  if (brandColor && HEX_PATTERN.test(brandColor)) {
    return brandColor;
  }
  return DEFAULT_BRAND_COLOR;
};

export const mixWithWhite = (hex: string, whiteRatio: number): string => {
  const rgb = parseHex(hex);
  if (!rgb) {
    return hex;
  }
  const colorRatio = 1 - whiteRatio;
  return toHex(
    clamp(rgb.r * colorRatio + 255 * whiteRatio),
    clamp(rgb.g * colorRatio + 255 * whiteRatio),
    clamp(rgb.b * colorRatio + 255 * whiteRatio)
  );
};

export const darken = (hex: string, amount: number): string => {
  const rgb = parseHex(hex);
  if (!rgb) {
    return hex;
  }
  const factor = 1 - amount;
  return toHex(clamp(rgb.r * factor), clamp(rgb.g * factor), clamp(rgb.b * factor));
};

export interface AppTheme {
  brand: string;
  brandHover: string;
  brandSoft: string;
  brandSofter: string;
  text: string;
  muted: string;
  border: string;
  background: string;
  card: string;
  danger: string;
  success: string;
  displayName: string;
  orgName: string;
  logoUrl: string | null;
}

export const buildTheme = (input?: {
  brandColor?: string | null;
  displayName?: string | null;
  orgName?: string;
  logoUrl?: string | null;
}): AppTheme => {
  const brand = normalizeBrandColor(input?.brandColor);
  return {
    brand,
    brandHover: darken(brand, 0.08),
    brandSoft: mixWithWhite(brand, 0.88),
    brandSofter: mixWithWhite(brand, 0.94),
    text: "#171717",
    muted: "#6B7280",
    border: "#E8E8E8",
    background: "#FFFFFF",
    card: "#FFFFFF",
    danger: "#DC2626",
    success: "#059669",
    displayName: input?.displayName?.trim() || input?.orgName || "School",
    orgName: input?.orgName || "School",
    logoUrl: input?.logoUrl ?? null
  };
};
