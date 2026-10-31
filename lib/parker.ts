import type { ParkBild, ParkMarkering } from "./types";

// Parker som tränaren har märkt ut sparas i webbläsaren, så att man slipper göra om det.
// Obs: sparas bara i den här webbläsaren på den här enheten.

export type SparadPark = {
  id: string;
  namn: string;
  bild: ParkBild; // bilden utan etiketter
  markeringar: ParkMarkering[];
  sparad: number;
};

const NYCKEL = "parkjudge.parker.v1";

export function hamtaParker(): SparadPark[] {
  try {
    const raw = localStorage.getItem(NYCKEL);
    const lista = raw ? JSON.parse(raw) : [];
    return Array.isArray(lista) ? lista.filter((p) => p && p.id && p.bild && Array.isArray(p.markeringar)) : [];
  } catch {
    return [];
  }
}

// Sparar (eller ersätter parken med samma namn). Ger ett felmeddelande om det inte gick.
export function sparaPark(park: Omit<SparadPark, "id" | "sparad">): { ok: true; park: SparadPark } | { ok: false; fel: string } {
  const ny: SparadPark = { ...park, id: `${Date.now()}`, sparad: Date.now() };
  try {
    const ovriga = hamtaParker().filter((p) => p.namn.trim().toLowerCase() !== park.namn.trim().toLowerCase());
    localStorage.setItem(NYCKEL, JSON.stringify([ny, ...ovriga]));
    return { ok: true, park: ny };
  } catch {
    return {
      ok: false,
      fel: "Parken kunde inte sparas i webbläsaren, troligen är minnet fullt. Ta bort en gammal park och försök igen. Hindren gäller ändå för den här bedömningen.",
    };
  }
}

export function taBortPark(id: string): SparadPark[] {
  try {
    const kvar = hamtaParker().filter((p) => p.id !== id);
    localStorage.setItem(NYCKEL, JSON.stringify(kvar));
    return kvar;
  } catch {
    return hamtaParker();
  }
}

// Ritar in hindrens namn på bilden, i samma stil som en utmärkt parkritning (vit text på svart).
// Den här bilden skickas till domaren och visas på kartan.
export async function bildMedEtiketter(bild: ParkBild, markeringar: ParkMarkering[]): Promise<ParkBild> {
  if (!markeringar.length) return bild;
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = reject;
    i.src = `data:${bild.mimeType};base64,${bild.data}`;
  });
  const b = img.naturalWidth;
  const h = img.naturalHeight;
  const c = document.createElement("canvas");
  c.width = b;
  c.height = h;
  const ctx = c.getContext("2d")!;
  ctx.drawImage(img, 0, 0);
  const storlek = Math.max(13, Math.round(Math.min(b, h) * 0.028));
  ctx.font = `bold ${storlek}px Arial, sans-serif`;
  ctx.textBaseline = "middle";
  ctx.textAlign = "center";
  for (const m of markeringar) {
    const x = (m.x / 1000) * b;
    const y = (m.y / 1000) * h;
    const text = m.namn.toUpperCase();
    const tb = ctx.measureText(text).width + storlek * 0.8;
    const th = storlek * 1.5;
    // liten prick där hindret är
    ctx.beginPath();
    ctx.arc(x, y, storlek * 0.3, 0, Math.PI * 2);
    ctx.fillStyle = "#f5b82e";
    ctx.fill();
    // etiketten strax ovanför pricken
    const ey = Math.max(th / 2, y - th * 0.9);
    const ex = Math.min(Math.max(tb / 2, x), b - tb / 2);
    ctx.fillStyle = "#000000";
    ctx.fillRect(ex - tb / 2, ey - th / 2, tb, th);
    ctx.fillStyle = "#ffffff";
    ctx.fillText(text, ex, ey + 1);
  }
  const dataUrl = c.toDataURL("image/jpeg", 0.88);
  return { mimeType: "image/jpeg", data: dataUrl.split(",")[1] };
}

// Etiketter nära bildkanten läggs inåt så att namnet inte kapas
export function kantKlass(x: number): string {
  if (x < 150) return "vanster";
  if (x > 850) return "hoger";
  return "";
}
