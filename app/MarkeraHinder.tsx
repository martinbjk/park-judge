"use client";

import { useRef, useState } from "react";
import type { ParkBild, ParkMarkering } from "@/lib/types";
import { kantKlass } from "@/lib/parker";
import type { Texter } from "@/lib/i18n";

// Vanliga hindernamn som snabbval. Man kan alltid skriva egna.
const FORSLAG = [
  "Deep end",
  "Shallow end",
  "Volcano",
  "Spine",
  "Bank",
  "Hip",
  "Extension",
  "Corner",
  "Platform deck",
  "Platform quarter",
  "Quarter pipe",
  "Vert",
  "Rail",
  "Ledge",
  "Bowl",
  "Roll in",
];

const kl = (v: number) => Math.max(0, Math.min(1000, v));

// Låter tränaren peka ut parkens hinder på bilden och ge dem namn
export default function MarkeraHinder({
  bild,
  t,
  startMarkeringar,
  startNamn,
  onKlar,
  onAvbryt,
}: {
  bild: ParkBild;
  t: Texter;
  startMarkeringar: ParkMarkering[];
  startNamn: string;
  onKlar: (markeringar: ParkMarkering[], parkNamn: string) => void;
  onAvbryt: () => void;
}) {
  const src = `data:${bild.mimeType};base64,${bild.data}`;
  const ytaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [markeringar, setMarkeringar] = useState<ParkMarkering[]>(startMarkeringar);
  const [punkt, setPunkt] = useState<{ x: number; y: number } | null>(null);
  const [namn, setNamn] = useState("");
  const [parkNamn, setParkNamn] = useState(startNamn);

  function tryck(e: React.MouseEvent<HTMLDivElement>) {
    const el = ytaRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setPunkt({
      x: kl(((e.clientX - r.left) / r.width) * 1000),
      y: kl(((e.clientY - r.top) / r.height) * 1000),
    });
    setTimeout(() => inputRef.current?.focus(), 30);
  }

  function laggTill(text = namn) {
    const t = text.trim().slice(0, 40);
    if (!punkt || !t) return;
    setMarkeringar((prev) => [...prev, { namn: t, x: Math.round(punkt.x), y: Math.round(punkt.y) }]);
    setPunkt(null);
    setNamn("");
  }

  // Två hinder med samma namn får ett nummer så att domaren kan skilja dem åt
  function unikaNamn(lista: ParkMarkering[]): ParkMarkering[] {
    const antal = new Map<string, number>();
    lista.forEach((m) => antal.set(m.namn.toLowerCase(), (antal.get(m.namn.toLowerCase()) || 0) + 1));
    const raknare = new Map<string, number>();
    return lista.map((m) => {
      const k = m.namn.toLowerCase();
      if ((antal.get(k) || 0) < 2) return m;
      const n = (raknare.get(k) || 0) + 1;
      raknare.set(k, n);
      return { ...m, namn: `${m.namn} ${n}` };
    });
  }

  return (
    <div className="markera">
      <p className="beskar-info">
        <b>1.</b> {t.markeraSteg1} <b>2.</b> {t.markeraSteg2} <b>3.</b> {t.markeraSteg3}
      </p>

      <div className="markera-yta" ref={ytaRef} onClick={tryck}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={t.markeraAlt} draggable={false} />
        {markeringar.map((m, i) => (
          <button
            key={i}
            type="button"
            className={`markering ${kantKlass(m.x)}`}
            style={{ left: `${m.x / 10}%`, top: `${m.y / 10}%` }}
            title={t.tryckForAttTaBort}
            onClick={(e) => {
              e.stopPropagation();
              setMarkeringar((prev) => prev.filter((_, j) => j !== i));
            }}
          >
            <span className="prick" />
            <span className="etikett">
              {m.namn} <i>×</i>
            </span>
          </button>
        ))}
        {punkt && <span className="ny-prick" style={{ left: `${punkt.x / 10}%`, top: `${punkt.y / 10}%` }} />}
      </div>

      <div className="markera-panel">
        {punkt ? (
          <>
            <div className="markera-rad">
              <input
                ref={inputRef}
                value={namn}
                maxLength={40}
                placeholder={t.vadArDet}
                onChange={(e) => setNamn(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault(); // annars skickas hela formuläret
                    laggTill();
                  }
                }}
              />
              <button type="button" className="btn-small gold" onClick={() => laggTill()} disabled={!namn.trim()}>
                {t.laggTill}
              </button>
              <button type="button" className="btn-small" onClick={() => setPunkt(null)}>
                {t.avbryt}
              </button>
            </div>
            <div className="forslag">
              {FORSLAG.map((f) => (
                <button key={f} type="button" className="forslag-chip" onClick={() => laggTill(f)}>
                  {f}
                </button>
              ))}
            </div>
          </>
        ) : (
          <p className="hint" style={{ margin: 0 }}>
            {markeringar.length === 0 ? t.ingaHinderAn : t.hinderUtmarktaFler(markeringar.length)}
          </p>
        )}

        <div className="markera-rad" style={{ marginTop: 12 }}>
          <input
            value={parkNamn}
            maxLength={60}
            placeholder={t.parkNamnPlaceholder}
            onChange={(e) => setParkNamn(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && e.preventDefault()}
          />
        </div>
        <div className="park-preview-actions" style={{ marginTop: 10, justifyContent: "flex-end" }}>
          <button type="button" className="btn-small" onClick={onAvbryt}>
            {t.avbryt}
          </button>
          <button
            type="button"
            className="btn-small gold"
            disabled={markeringar.length === 0}
            onClick={() => onKlar(unikaNamn(markeringar), parkNamn.trim())}
          >
            {parkNamn.trim() ? t.klarOchSpara : t.klar}
          </button>
        </div>
      </div>
    </div>
  );
}
