import type { Hinder, JudgeResult } from "./types";

// Gör om hinderlistan till objekt och kastar trasiga rutor
export function normaliseraHinder(lista: JudgeResult["hinderIParken"]): Hinder[] {
  return (lista || [])
    .map((h) => (typeof h === "string" ? { namn: h } : h))
    .filter((h): h is Hinder => !!h && typeof h.namn === "string" && h.namn.trim().length > 0)
    .map((h) => ({ namn: h.namn.trim(), box_2d: giltigBox(h.box_2d) }));
}

function giltigBox(b: unknown): number[] | undefined {
  if (!Array.isArray(b) || b.length !== 4 || !b.every((n) => typeof n === "number" && isFinite(n))) return undefined;
  const [ymin, xmin, ymax, xmax] = b.map((n) => Math.max(0, Math.min(1000, n)));
  if (ymax <= ymin || xmax <= xmin) return undefined;
  return [ymin, xmin, ymax, xmax];
}

const enkel = (s: string) =>
  s
    .toLowerCase()
    .replace(/[-_]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

// Hittar hindret som ett tricks "sektion" syftar på
export function hittaHinder(hinder: Hinder[], sektion: string): Hinder | undefined {
  const s = enkel(sektion);
  return (
    hinder.find((h) => enkel(h.namn) === s) ||
    hinder.find((h) => enkel(h.namn).replace(/\s*\(.*\)/, "") === s.replace(/\s*\(.*\)/, "")) ||
    hinder.find((h) => s.includes(enkel(h.namn)) || enkel(h.namn).includes(s))
  );
}

// Mittpunkt i ett hinders ruta, som { x, y } på skala 0–1000
export function mittpunkt(h: Hinder): { x: number; y: number } | undefined {
  if (!h.box_2d) return undefined;
  const [ymin, xmin, ymax, xmax] = h.box_2d;
  return { x: (xmin + xmax) / 2, y: (ymin + ymax) / 2 };
}
