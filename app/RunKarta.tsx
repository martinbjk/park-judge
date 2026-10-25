"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Hinder, RunVersion } from "@/lib/types";
import { hittaHinder, mittpunkt } from "@/lib/hinder";

type Punkt = { x: number; y: number };
type Start = Punkt & { gissad: boolean };

const rensaNamn = (t: string) => t.replace(/\s*\((fyllnad|nytt)\)/gi, "");
const begr = (v: number) => Math.max(0, Math.min(1000, v));

// Startposition för en markering:
// 1. egen position på raden (används i demoläget)
// 2. mitten av hindret som tricket görs på
// 3. annars en rad uppe till vänster, att dra till rätt plats
function startPunkt(v: RunVersion, i: number, hinder: Hinder[]): Start {
  const r = v.rader[i];
  if (typeof r.x === "number" && typeof r.y === "number") return { x: begr(r.x), y: begr(r.y), gissad: false };
  const h = hittaHinder(hinder, r.sektion);
  const m = h && mittpunkt(h);
  if (m) return { x: begr(m.x), y: begr(m.y), gissad: false };
  return { x: 40 + (i % 12) * 60, y: 40 + Math.floor(i / 12) * 60, gissad: true };
}

// Sprider markeringar som hamnar ovanpå varandra (t.ex. flera tricks i deep end).
// Avstånd räknas i skärmpixlar så att det fungerar för alla bildformat och skärmstorlekar.
function spridPunkter(starter: Start[], bredd: number, hojd: number, markor: number): Punkt[] {
  const MIN = markor + 4; // pixlar mellan markeringarnas mittpunkter
  const tillPx = (p: Punkt) => ({ x: (p.x / 1000) * bredd, y: (p.y / 1000) * hojd });
  const ut: Punkt[] = [];
  starter.forEach((s) => {
    let p: Punkt = { x: s.x, y: s.y };
    if (!s.gissad && bredd > 0 && hojd > 0) {
      const krockar = (k: Punkt) =>
        ut.some((q) => {
          const a = tillPx(q);
          const b = tillPx(k);
          return Math.hypot(a.x - b.x, a.y - b.y) < MIN;
        });
      for (let forsok = 0; forsok < 18 && krockar(p); forsok++) {
        const varv = 1 + Math.floor(forsok / 6);
        const vinkel = ((forsok % 6) * Math.PI) / 3 - Math.PI / 2 + (varv - 1) * 0.5;
        const avstPx = MIN * varv;
        p = {
          x: begr(s.x + ((Math.cos(vinkel) * avstPx) / bredd) * 1000),
          y: begr(s.y + ((Math.sin(vinkel) * avstPx) / hojd) * 1000),
        };
      }
    }
    ut.push(p);
  });
  return ut;
}

export default function RunKarta({
  version,
  bildSrc,
  hinder,
}: {
  version: RunVersion;
  bildSrc: string | null;
  hinder: Hinder[];
}) {
  const [flyttade, setFlyttade] = useState<Record<number, Punkt>>({});
  const [aktiv, setAktiv] = useState<number | null>(null);
  const [laddar, setLaddar] = useState(false);
  const ytaRef = useRef<HTMLDivElement>(null);
  const [yta, setYta] = useState({ b: 0, h: 0 });

  // Mät bildytan så att spridningen räknas i verkliga pixlar
  useEffect(() => {
    const el = ytaRef.current;
    if (!el) return;
    const mat = () => setYta({ b: el.clientWidth, h: el.clientHeight });
    mat();
    const ro = new ResizeObserver(mat);
    ro.observe(el);
    return () => ro.disconnect();
  }, [bildSrc]);

  const starter = useMemo(() => version.rader.map((_, i) => startPunkt(version, i, hinder)), [version, hinder]);
  const markorPx = yta.b > 0 && yta.b < 500 ? 24 : 30;
  const baspunkter = useMemo(
    () => spridPunkter(starter, yta.b, yta.h, markorPx),
    [starter, yta.b, yta.h, markorPx]
  );

  const punkt = (i: number) => flyttade[i] ?? baspunkter[i];
  const nagonGissad = starter.some((s, i) => s.gissad && !flyttade[i]);

  function flytta(i: number, e: React.PointerEvent) {
    const el = ytaRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setFlyttade((prev) => ({
      ...prev,
      [i]: {
        x: begr(((e.clientX - r.left) / r.width) * 1000),
        y: begr(((e.clientY - r.top) / r.height) * 1000),
      },
    }));
  }

  async function laddaNer() {
    if (!bildSrc) return;
    setLaddar(true);
    try {
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const i = new Image();
        i.onload = () => resolve(i);
        i.onerror = reject;
        i.src = bildSrc;
      });
      const bildB = Math.min(1400, img.naturalWidth);
      const bildH = Math.round((img.naturalHeight / img.naturalWidth) * bildB);
      const listB = 520;
      const pad = 40;
      const radH = 34;
      const listH = 90 + version.rader.length * radH;
      const B = pad + listB + pad + bildB + pad;
      const H = Math.max(bildH, listH) + pad * 2;

      const c = document.createElement("canvas");
      c.width = B;
      c.height = H;
      const ctx = c.getContext("2d")!;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, B, H);

      // Tricklistan
      ctx.fillStyle = "#111111";
      ctx.font = "bold 34px Arial, sans-serif";
      ctx.fillText(version.typ, pad, pad + 34);
      ctx.font = "18px Arial, sans-serif";
      ctx.fillStyle = "#555555";
      ctx.fillText(`Uppskattat ${version.uppskattatBetyg.toFixed(1)} / 10 · Park Judge`, pad, pad + 64);
      ctx.font = "22px Arial, sans-serif";
      ctx.fillStyle = "#111111";
      version.rader.forEach((r, i) => {
        let text = `${i + 1}. ${rensaNamn(r.trick)}`;
        while (ctx.measureText(text).width > listB && text.length > 4) text = text.slice(0, -2) + "…";
        ctx.fillText(text, pad, pad + 110 + i * radH);
      });

      // Bilden med nummer
      const bx = pad + listB + pad;
      const by = pad;
      ctx.drawImage(img, bx, by, bildB, bildH);
      const rad = Math.max(16, Math.round(bildB * 0.018));
      version.rader.forEach((_, i) => {
        const p = punkt(i);
        const cx = bx + (p.x / 1000) * bildB;
        const cy = by + (p.y / 1000) * bildH;
        ctx.beginPath();
        ctx.arc(cx, cy, rad, 0, Math.PI * 2);
        ctx.fillStyle = "#ffffff";
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.strokeStyle = "#111111";
        ctx.stroke();
        ctx.fillStyle = "#111111";
        ctx.font = `bold ${Math.round(rad * 1.1)}px Arial, sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(String(i + 1), cx, cy + 1);
        ctx.textAlign = "left";
        ctx.textBaseline = "alphabetic";
      });

      const blob = await new Promise<Blob | null>((res) => c.toBlob(res, "image/png"));
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `park-judge-${version.typ.toLowerCase().replace(/[^a-zåäö]+/g, "-")}.png`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    } finally {
      setLaddar(false);
    }
  }

  return (
    <div className={`karta ${bildSrc ? "" : "utan-bild"}`}>
      <ol className="karta-lista">
        {version.rader.map((r, i) => {
          const fyllnad = /\(fyllnad\)/i.test(r.trick);
          return (
            <li
              key={i}
              className={`${aktiv === i ? "aktiv" : ""} ${fyllnad ? "fyllnad" : ""}`}
              onMouseEnter={() => setAktiv(i)}
              onMouseLeave={() => setAktiv(null)}
            >
              <span className="nr">{i + 1}</span>
              <span className="karta-trick">
                {rensaNamn(r.trick)}
                <small>{r.sektion}</small>
              </span>
            </li>
          );
        })}
      </ol>

      {bildSrc && (
        <div className="karta-bild">
          <div className="karta-yta" ref={ytaRef}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={bildSrc} alt="Parken med numrerade tricks" draggable={false} />
            {version.rader.map((r, i) => {
              const p = punkt(i);
              return (
                <button
                  type="button"
                  key={i}
                  className={`markor ${aktiv === i ? "aktiv" : ""} ${
                    starter[i].gissad && !flyttade[i] ? "gissad" : ""
                  }`}
                  style={{ left: `${p.x / 10}%`, top: `${p.y / 10}%` }}
                  title={`${i + 1}. ${rensaNamn(r.trick)} – dra för att flytta`}
                  aria-label={`${i + 1}. ${rensaNamn(r.trick)}`}
                  onMouseEnter={() => setAktiv(i)}
                  onMouseLeave={() => setAktiv(null)}
                  onPointerDown={(e) => {
                    e.currentTarget.setPointerCapture(e.pointerId);
                    setAktiv(i);
                  }}
                  onPointerMove={(e) => {
                    if (e.currentTarget.hasPointerCapture(e.pointerId)) flytta(i, e);
                  }}
                  onPointerUp={(e) => e.currentTarget.releasePointerCapture(e.pointerId)}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>
          <div className="karta-verktyg no-print">
            <span>
              {nagonGissad
                ? "Några tricks kunde inte kopplas till ett hinder och ligger uppe till vänster. Dra dem till rätt plats."
                : "Dra en siffra om den hamnat fel."}
            </span>
            <div className="park-preview-actions">
              {Object.keys(flyttade).length > 0 && (
                <button type="button" className="btn-small" onClick={() => setFlyttade({})}>
                  Återställ
                </button>
              )}
              <button type="button" className="btn-small gold" onClick={laddaNer} disabled={laddar}>
                {laddar ? "Skapar bild…" : "Ladda ner bild"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
