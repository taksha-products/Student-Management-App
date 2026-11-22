/** Soft pastel card palette used for feature cards (cycled per item). */
export interface Pastel {
  bg: string;
  accent: string;
  soft: string;
}

export const PASTELS: Pastel[] = [
  { bg: "#DCE8EE", accent: "#2F5F7A", soft: "#C3D8E3" },
  { bg: "#F0E3D9", accent: "#A8562F", soft: "#E6CDBB" },
  { bg: "#E0DBF1", accent: "#4E3F99", soft: "#CBC2E8" },
  { bg: "#DBEDDF", accent: "#2E7349", soft: "#C1E0C8" }
];

export const pastelAt = (index: number): Pastel => PASTELS[index % PASTELS.length];

/** Near-black used for active states and the raised action button. */
export const INK = "#141414";
export const INK_MUTED = "#8A8F98";
/** Light grey surface for flat tiles and list rows. */
export const TILE = "#F4F5F6";
/** Muted text on white / tiles. */
export const SOFT_TEXT = "#A1A1AA";
export const SUCCESS_GREEN = "#4CB963";
/** Product (EduNex) brand orange — used before login, where no school is known yet. */
export const PRODUCT_ORANGE = "#FF8A3D";
/** Darker orange for text/icons on light peach. */
export const PRODUCT_ORANGE_DARK = "#E86A1A";
/** Soft peach tints for backgrounds and decorative shapes. */
export const PRODUCT_PEACH = "#FFF3E8";
export const PRODUCT_PEACH_DEEP = "#FFE2C7";
