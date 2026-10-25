"use client";

import { useRef, useState } from "react";
import type { ParkBild } from "@/lib/types";

type Ruta = { x0: number; y0: number; x1: number; y1: number }; // andelar 0–1 av bilden
type Lage = "flytta" | "nw" | "ne" | "sw" | "se";

const MINSTA = 0.08; // minsta storlek på rutan
const kl = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

// Låter användaren beskära parkbilden med fingret eller musen
export default function BeskarBild({
  bild,
  onKlar,
  onAvbryt,
}: {
  bild: ParkBild;
  onKlar: (ny: ParkBild) => void;
  onAvbryt: () => void;
}) {
  const src = `data:${bild.mimeType};base64,${bild.data}`;
  const ytaRef = useRef<HTMLDivElement>(null);
  const [ruta, setRuta] = useState<Ruta>({ x0: 0.05, y0: 0.05, x1: 0.95, y1: 0.95 });
  const drag = useRef<{ lage: Lage; px: number; py: number; start: Ruta } | null>(null);
  const [sparar, setSparar] = useState(false);

  function borja(lage: Lage, e: React.PointerEvent) {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { lage, px: e.clientX, py: e.clientY, start: ruta };
  }

  function rora(e: React.PointerEvent) {
    const d = drag.current;
    const el = ytaRef.current;
    if (!d || !el || !e.currentTarget.hasPointerCapture(e.pointerId)) return;
    const r = el.getBoundingClientRect();
    const dx = (e.clientX - d.px) / r.width;
    const dy = (e.clientY - d.py) / r.height;
    const s = d.start;
    if (d.lage === "flytta") {
      const b = s.x1 - s.x0;
      const h = s.y1 - s.y0;
      const x0 = kl(s.x0 + dx, 0, 1 - b);
      const y0 = kl(s.y0 + dy, 0, 1 - h);
      setRuta({ x0, y0, x1: x0 + b, y1: y0 + h });
      return;
    }
    const n = { ...s };
    if (d.lage.includes("w")) n.x0 = kl(s.x0 + dx, 0, s.x1 - MINSTA);
    if (d.lage.includes("e")) n.x1 = kl(s.x1 + dx, s.x0 + MINSTA, 1);
    if (d.lage.includes("n")) n.y0 = kl(s.y0 + dy, 0, s.y1 - MINSTA);
    if (d.lage.includes("s")) n.y1 = kl(s.y1 + dy, s.y0 + MINSTA, 1);
    setRuta(n);
  }

  function slapp(e: React.PointerEvent) {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
    drag.current = null;
  }

  async function anvand() {
    setSparar(true);
    try {
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const i = new Image();
        i.onload = () => resolve(i);
        i.onerror = reject;
        i.src = src;
      });
      const sx = Math.round(ruta.x0 * img.naturalWidth);
      const sy = Math.round(ruta.y0 * img.naturalHeight);
      const sb = Math.max(1, Math.round((ruta.x1 - ruta.x0) * img.naturalWidth));
      const sh = Math.max(1, Math.round((ruta.y1 - ruta.y0) * img.naturalHeight));
      const c = document.createElement("canvas");
      c.width = sb;
      c.height = sh;
      const ctx = c.getContext("2d")!;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, sb, sh);
      ctx.drawImage(img, sx, sy, sb, sh, 0, 0, sb, sh);
      const dataUrl = c.toDataURL("image/jpeg", 0.9);
      onKlar({ mimeType: "image/jpeg", data: dataUrl.split(",")[1] });
    } finally {
      setSparar(false);
    }
  }

  const stil = {
    left: `${ruta.x0 * 100}%`,
    top: `${ruta.y0 * 100}%`,
    width: `${(ruta.x1 - ruta.x0) * 100}%`,
    height: `${(ruta.y1 - ruta.y0) * 100}%`,
  };

  const handtag = (lage: Lage) => (
    <span
      className={`beskar-handtag ${lage}`}
      onPointerDown={(e) => borja(lage, e)}
      onPointerMove={rora}
      onPointerUp={slapp}
      onPointerCancel={slapp}
    />
  );

  return (
    <div className="beskar">
      <p className="beskar-info">
        Dra i hörnen så att rutan bara omsluter parken. Ta bort text, marginaler och annat runt omkring.
      </p>
      <div className="beskar-yta" ref={ytaRef}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt="Beskär parkbilden" draggable={false} />
        <div
          className="beskar-ruta"
          style={stil}
          onPointerDown={(e) => borja("flytta", e)}
          onPointerMove={rora}
          onPointerUp={slapp}
          onPointerCancel={slapp}
        >
          {handtag("nw")}
          {handtag("ne")}
          {handtag("sw")}
          {handtag("se")}
        </div>
      </div>
      <div className="park-preview-bar">
        <span>Bilden beskärs innan den skickas till domaren.</span>
        <div className="park-preview-actions">
          <button type="button" className="btn-small" onClick={onAvbryt}>
            Avbryt
          </button>
          <button type="button" className="btn-small gold" onClick={anvand} disabled={sparar}>
            {sparar ? "Beskär…" : "Använd beskärning"}
          </button>
        </div>
      </div>
    </div>
  );
}
