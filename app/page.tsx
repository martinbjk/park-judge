"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { normaliseraHinder } from "@/lib/hinder";
import BeskarBild from "./BeskarBild";
import MarkeraHinder from "./MarkeraHinder";
import { bildMedEtiketter, hamtaParker, kantKlass, sparaPark, taBortPark, type SparadPark } from "@/lib/parker";
import {
  KRITERIER,
  type JudgeInput,
  type JudgeResult,
  type Lage,
  type ParkBild,
  VERSIONSTYPER,
  huvudversion,
  type VersionsTyp,
  UTFORANDE_DELAR,
  type UtforandeNiva,
} from "@/lib/types";
import { SPRAK, TEXTER, lasSprak, sparaSprak, type Sprak, type Texter } from "@/lib/i18n";
import RunKarta from "./RunKarta";

// Exemplet fylls i på valt språk (Gemini förstår båda)
const EXEMPEL: Record<Sprak, Pick<JudgeInput, "niva" | "sakraTricks" | "prioTricks" | "park">> = {
  sv: {
    niva: "Nationell elit",
    sakraTricks:
      "Frontside air, backside air, frontside 360 air, kickflip indy, frontside smith grind, backside lipslide, nosegrind, layback grind, frontside rock, backside 5-0, frontside boardslide",
    prioTricks: "Backside 540, kickflip frontside 360 (inte helt säkra än)",
    park: "Platform quarter, bank, spine, volcano, bridge, två extensions, hip, gap hip, deep end, platform deck",
  },
  en: {
    niva: "National elite",
    sakraTricks:
      "Frontside air, backside air, frontside 360 air, kickflip indy, frontside smith grind, backside lipslide, nosegrind, layback grind, frontside rock, backside 5-0, frontside boardslide",
    prioTricks: "Backside 540, kickflip frontside 360 (not fully consistent yet)",
    park: "Platform quarter, bank, spine, volcano, bridge, two extensions, hip, gap hip, deep end, platform deck",
  },
};

const TOM: JudgeInput = {
  lage: "foresla",
  runLangd: 45,
  niva: "",
  sakraTricks: "",
  prioTricks: "",
  park: "",
  run: "",
  bild: null,
  versioner: ["Vinnarversion"],
};

const MAX_SIDA = 1600; // pixlar på längsta sidan efter komprimering

// Gör bilden mindre i webbläsaren innan den skickas, så att den alltid får plats
async function komprimeraBild(fil: File, felText: string): Promise<ParkBild> {
  const url = URL.createObjectURL(fil);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error(felText));
      i.src = url;
    });
    const skala = Math.min(1, MAX_SIDA / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.round(img.naturalWidth * skala);
    const h = Math.round(img.naturalHeight * skala);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error(felText);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0, w, h);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    return { mimeType: "image/jpeg", data: dataUrl.split(",")[1] };
  } finally {
    URL.revokeObjectURL(url);
  }
}

// Tal med mellanslag som tusentalsavgränsare, t.ex. 4 300
const tal = (n: number) => n.toLocaleString("sv-SE");

function farg(b: number) {
  if (b >= 8) return "var(--green)";
  if (b >= 6) return "var(--gold)";
  return "var(--red)";
}

function Gauge({ value, t }: { value: number; t: Texter }) {
  const r = 100;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(10, value)) / 10;
  return (
    <div className="gauge">
      <svg viewBox="0 0 240 240">
        <circle cx="120" cy="120" r={r} fill="none" stroke="var(--line)" strokeWidth="16" />
        <circle
          cx="120"
          cy="120"
          r={r}
          fill="none"
          stroke={farg(value)}
          strokeWidth="16"
          strokeLinecap="round"
          strokeDasharray={`${c * pct} ${c}`}
          style={{ transition: "stroke-dasharray 1s ease", filter: `drop-shadow(0 0 8px ${farg(value)})` }}
        />
      </svg>
      <div className="num">
        <b style={{ color: farg(value) }}>{value.toFixed(1)}</b>
        <span>{t.av10}</span>
      </div>
    </div>
  );
}

export default function Page() {
  const [sprak, setSprak] = useState<Sprak>("sv");
  const t = TEXTER[sprak];
  const [f, setF] = useState<JudgeInput>(TOM);
  const [res, setRes] = useState<JudgeResult | null>(null);
  const [resLage, setResLage] = useState<Lage>("foresla");
  const [resBild, setResBild] = useState<string | null>(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [sekunder, setSekunder] = useState(0);
  const [tab, setTab] = useState(1);
  const [bildLaddar, setBildLaddar] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [beskar, setBeskar] = useState(false);
  const [markera, setMarkera] = useState(false);
  const [parkNamn, setParkNamn] = useState("");
  const [parker, setParker] = useState<SparadPark[]>([]);
  const [parkInfo, setParkInfo] = useState("");
  const filRef = useRef<HTMLInputElement>(null);

  // Språk och sparade parker finns bara i webbläsaren, så de läses in när sidan har laddats
  useEffect(() => {
    setSprak(lasSprak());
    setParker(hamtaParker());
  }, []);

  useEffect(() => {
    document.documentElement.lang = sprak;
  }, [sprak]);

  function bytSprak(s: Sprak) {
    setSprak(s);
    sparaSprak(s);
    setParkInfo("");
  }

  // Räknar sekunder medan domaren arbetar
  useEffect(() => {
    if (!busy) return;
    setSekunder(0);
    const id = setInterval(() => setSekunder((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [busy]);

  function valjSparadPark(p: SparadPark) {
    setF((prev) => ({ ...prev, bild: p.bild, markeringar: p.markeringar }));
    setParkNamn(p.namn);
    setBeskar(false);
    setMarkera(false);
    setParkInfo(t.parkVald(p.namn, p.markeringar.length));
  }

  const set =
    (k: keyof JudgeInput) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setF((prev) => ({ ...prev, [k]: k === "runLangd" ? Number(e.target.value) : e.target.value }));

  // Senaste språket behövs i klistra-in-lyssnaren, som bara registreras en gång
  const tRef = useRef(t);
  tRef.current = t;

  async function valjBild(fil: File | undefined | null) {
    if (!fil) return;
    const tx = tRef.current;
    if (!fil.type.startsWith("image/")) {
      setErr(tx.filInteBild);
      return;
    }
    setErr("");
    setBildLaddar(true);
    try {
      const bild = await komprimeraBild(fil, tx.kundeInteLasaBild);
      setF((prev) => ({ ...prev, bild, markeringar: [] }));
      setBeskar(false);
      setMarkera(false);
      setParkNamn("");
      setParkInfo("");
    } catch (e) {
      setErr(e instanceof Error ? e.message : tx.kundeInteLasaBild);
    } finally {
      setBildLaddar(false);
    }
  }

  // Klistra in en bild med Ctrl+V var som helst på sidan
  useEffect(() => {
    function onPaste(e: ClipboardEvent) {
      const item = Array.from(e.clipboardData?.items || []).find((i) => i.type.startsWith("image/"));
      if (item) {
        e.preventDefault();
        valjBild(item.getAsFile());
      }
    }
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function skicka(e: React.FormEvent) {
    e.preventDefault();
    const markeringar = f.bild ? f.markeringar || [] : [];
    // Med utmärkta hinder skickas bilden med namnen inritade, så att domaren läser dem säkert
    const bildAttSkicka = f.bild && markeringar.length ? await bildMedEtiketter(f.bild, markeringar) : f.bild;
    const skickas: JudgeInput = { ...f, bild: bildAttSkicka, markeringar, sprak };
    setErr("");
    setRes(null);
    setBusy(true);
    try {
      const r = await fetch("/api/judge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(skickas),
      });
      const data = await r.json().catch(() => ({
        error: r.status === 504 || r.status === 408 ? t.felTid : r.status === 413 ? t.felForStor : t.felOvantat(r.status),
      }));
      if (!r.ok) throw new Error(data.error || t.felNagot);
      setRes(data);
      setResLage(f.lage);
      setResBild(bildAttSkicka ? `data:${bildAttSkicka.mimeType};base64,${bildAttSkicka.data}` : null);
      const typer = (data as JudgeResult).versioner.map((v) => v.typ);
      setTab(Math.max(0, typer.indexOf(huvudversion(typer))));
      setTimeout(() => document.getElementById("resultat")?.scrollIntoView({ behavior: "smooth" }), 50);
    } catch (e) {
      setErr(e instanceof Error ? e.message : t.felNagot);
    } finally {
      setBusy(false);
    }
  }

  const hinder = useMemo(() => normaliseraHinder(res?.hinderIParken), [res]);

  const ordnade = res ? KRITERIER.map((k) => res.kriterier.find((x) => x.namn === k)).filter(Boolean) : [];

  const bildSrc = f.bild ? `data:${f.bild.mimeType};base64,${f.bild.data}` : null;
  const foresla = f.lage === "foresla";
  const valda: VersionsTyp[] = VERSIONSTYPER.filter((v) =>
    (f.versioner?.length ? f.versioner : ["Vinnarversion"]).includes(v)
  );

  const versionerPanel = res && (
    <section className="panel">
      <h3 className="panel-title">{resLage === "foresla" ? t.foreslagnaRuns : t.forbattradeRuns}</h3>
      <div className="tabs no-print">
        {res.versioner.map((v, i) => (
          <button key={v.typ} className={`tab ${tab === i ? "active" : ""}`} onClick={() => setTab(i)}>
            {t.versioner[v.typ] ?? v.typ}
            <small>{t.uppskattat(v.uppskattatBetyg.toFixed(1))}</small>
          </button>
        ))}
      </div>
      {res.versioner.map((v, i) => (
        <div key={v.typ} className={`version ${tab === i ? "" : "hidden"}`}>
          <h4 className="print-only">
            {t.versioner[v.typ] ?? v.typ} · {v.uppskattatBetyg.toFixed(1)} / 10
          </h4>
          <p className="vdesc">{v.beskrivning}</p>
          <RunKarta
            key={`${v.typ}-${resBild?.length ?? 0}`}
            version={v}
            bildSrc={resBild}
            hinder={hinder}
            t={t}
          />
          <h4 className="sub-title">{t.detaljerPerTrick}</h4>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>{t.kolTid}</th>
                  <th>{t.kolHinder}</th>
                  <th>{t.kolTrick}</th>
                  <th>{t.kolMotivering}</th>
                </tr>
              </thead>
              <tbody>
                {v.rader.map((r, j) => {
                  const fyllnad = /\(fyllnad\)/i.test(r.trick);
                  const nytt = /\(nytt\)/i.test(r.trick);
                  const namn = r.trick.replace(/\s*\((fyllnad|nytt)\)/gi, "");
                  return (
                    <tr key={j} className={fyllnad ? "fill-row" : ""}>
                      <td className="rownr">{j + 1}</td>
                      <td className="time">{r.tid}</td>
                      <td className="sek">{r.sektion}</td>
                      <td className="trick">
                        {namn}
                        {fyllnad && <span className="mark fill">{t.fyllnad}</span>}
                        {nytt && <span className="mark new">{t.nytt}</span>}
                      </td>
                      <td>
                        {r.motivering}
                        <div className="tags">
                          {r.kriterier.map((k) => (
                            <span className="tag" key={k}>
                              {t.kriterier[k] ?? k}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </section>
  );

  return (
    <main className="wrap">
      <header className="top">
        <div className="brand">
          <div className="logo">PJ</div>
          <div>
            <h1>Park Judge</h1>
            <small>{t.undertitel}</small>
          </div>
        </div>
        <div className="top-hoger">
          <div className="live">
            <i /> {t.kriterierEtikett}
          </div>
          <div className="sprakval" role="group" aria-label="Språk / Language">
            {SPRAK.map((s) => (
              <button
                key={s}
                type="button"
                aria-pressed={sprak === s}
                className={sprak === s ? "vald" : ""}
                onClick={() => bytSprak(s)}
              >
                {s.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </header>

      <section className="hero">
        <h2>
          {t.rubrikFore}
          <span>{t.rubrikMarkerad}</span>
          {t.rubrikEfter}
        </h2>
        <p>{t.ingress}</p>
        <div className="chips">
          {KRITERIER.map((k) => (
            <span className="chip" key={k}>
              <b>{t.kriterier[k]}</b>
              {t.kriterier[k] !== k && <> · {k}</>}
            </span>
          ))}
        </div>
      </section>

      <form className="panel no-print" onSubmit={skicka}>
        <h3 className="panel-title">{t.steg1}</h3>
        <div className="grid2">
          <div className="field">
            <label htmlFor="len">{t.runLangd}</label>
            <input id="len" type="number" min={20} max={90} value={f.runLangd} onChange={set("runLangd")} />
          </div>
          <div className="field">
            <label htmlFor="niva">{t.niva}</label>
            <select id="niva" value={f.niva} onChange={set("niva")}>
              <option value="">{t.valjNiva}</option>
              {/* Ett tidigare val på det andra språket ska fortfarande synas */}
              {f.niva && !t.nivaer.includes(f.niva) && <option>{f.niva}</option>}
              {t.nivaer.map((n) => (
                <option key={n}>{n}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="field">
          <label htmlFor="safe">{t.tricksDuVillGora}</label>
          <textarea id="safe" value={f.sakraTricks} onChange={set("sakraTricks")} placeholder={t.tricksPlaceholder} />
          <span className="hint">{t.tricksHint}</span>
        </div>
        <div className="field">
          <label htmlFor="prio">{t.prioTricks}</label>
          <textarea id="prio" value={f.prioTricks} onChange={set("prioTricks")} placeholder={t.prioPlaceholder} />
        </div>

        <div className="field">
          <label>{t.utforandeRubrik}</label>
          <span className="hint">{t.utforandeHint}</span>
          <div className="utforande">
            {UTFORANDE_DELAR.map((del) => (
              <div className="utforande-rad" key={del} role="radiogroup" aria-label={t.utforandeDelar[del]}>
                <span className="utforande-namn">{t.utforandeDelar[del]}</span>
                <div className="utforande-val">
                  {(["", "lag", "medel", "hog"] as const).map((niva) => {
                    const vald = (f.utforande?.[del] ?? "") === niva;
                    return (
                      <button
                        key={niva || "vetej"}
                        type="button"
                        role="radio"
                        aria-checked={vald}
                        className={`utforande-knapp ${niva || "vetej"} ${vald ? "vald" : ""}`}
                        onClick={() =>
                          setF((prev) => {
                            const ny = { ...(prev.utforande || {}) };
                            if (niva) ny[del] = niva as UtforandeNiva;
                            else delete ny[del];
                            return { ...prev, utforande: ny };
                          })
                        }
                      >
                        {t.utforandeNivaer[niva]}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        <h3 className="panel-title">{t.steg2}</h3>
        {parker.length > 0 && !markera && !beskar && (
          <div className="sparade-parker">
            <span className="hint">{t.sparadeParker}</span>
            {parker.map((p) => (
              <span key={p.id} className={`park-chip ${parkNamn === p.namn ? "vald" : ""}`}>
                <button type="button" onClick={() => valjSparadPark(p)}>
                  {p.namn} <small>· {t.hinderAntal(p.markeringar.length)}</small>
                </button>
                <button
                  type="button"
                  className="park-ta-bort"
                  aria-label={t.taBortPark(p.namn)}
                  title={t.taBortSparadPark}
                  onClick={() => {
                    setParker(taBortPark(p.id));
                    if (parkNamn === p.namn) setParkNamn("");
                  }}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
        <input
          ref={filRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          hidden
          onChange={(e) => {
            valjBild(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
        {f.bild && beskar ? (
          <BeskarBild
            bild={f.bild}
            t={t}
            onAvbryt={() => setBeskar(false)}
            onKlar={(ny) => {
              setF((prev) => ({ ...prev, bild: ny, markeringar: [] }));
              setBeskar(false);
            }}
          />
        ) : f.bild && markera ? (
          <MarkeraHinder
            bild={f.bild}
            t={t}
            startMarkeringar={f.markeringar || []}
            startNamn={parkNamn}
            onAvbryt={() => setMarkera(false)}
            onKlar={(markeringar, namn) => {
              setF((prev) => ({ ...prev, markeringar }));
              setMarkera(false);
              setParkNamn(namn);
              if (namn && f.bild) {
                const r = sparaPark({ namn, bild: f.bild, markeringar });
                if (r.ok) {
                  setParker(hamtaParker());
                  setParkInfo(t.parkSparad(namn, markeringar.length));
                } else setParkInfo(t.parkKundeInteSparas);
              } else {
                setParkInfo(t.parkEjSparad(markeringar.length));
              }
            }}
          />
        ) : bildSrc ? (
          <div className="park-preview">
            <div className="markera-yta visning">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={bildSrc} alt={t.uppladdadBild} />
              {(f.markeringar || []).map((m, i) => (
                <span
                  key={i}
                  className={`markering ${kantKlass(m.x)}`}
                  style={{ left: `${m.x / 10}%`, top: `${m.y / 10}%` }}
                >
                  <span className="prick" />
                  <span className="etikett">{m.namn}</span>
                </span>
              ))}
            </div>
            <div className="park-preview-bar">
              <span>{f.markeringar?.length ? t.hinderUtmarkta(parkNamn, f.markeringar.length) : t.markUtTips}</span>
              <div className="park-preview-actions">
                <button type="button" className="btn-small gold" onClick={() => setMarkera(true)}>
                  {f.markeringar?.length ? t.andraHinder : t.markUtHinder}
                </button>
                {!f.markeringar?.length && (
                  <button type="button" className="btn-small" onClick={() => setBeskar(true)}>
                    {t.beskar}
                  </button>
                )}
                <button type="button" className="btn-small" onClick={() => filRef.current?.click()}>
                  {t.bytBild}
                </button>
                <button
                  type="button"
                  className="btn-small danger"
                  onClick={() => {
                    setF((prev) => ({ ...prev, bild: null, markeringar: [] }));
                    setParkNamn("");
                    setParkInfo("");
                  }}
                >
                  {t.taBort}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <button
            type="button"
            className={`dropzone ${dragOver ? "over" : ""}`}
            onClick={() => filRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              valjBild(e.dataTransfer.files?.[0]);
            }}
          >
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M4 16l4.5-4.5a2 2 0 012.8 0L16 16m-2-2l1.5-1.5a2 2 0 012.8 0L20 14M14 8h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <b>{bildLaddar ? t.laserBild : t.laddaUppBild}</b>
            <span>{t.laddaUppHint}</span>
          </button>
        )}
        {parkInfo && !markera && <p className="park-info">{parkInfo}</p>}
        <div className="field" style={{ marginTop: 14 }}>
          <label htmlFor="park">{t.parkBeskrivning}</label>
          <textarea id="park" value={f.park} onChange={set("park")} placeholder={t.parkPlaceholder} />
        </div>

        <h3 className="panel-title">{t.steg3}</h3>
        <div className="mode" role="radiogroup">
          <button
            type="button"
            role="radio"
            aria-checked={foresla}
            className={`mode-btn ${foresla ? "active" : ""}`}
            onClick={() => setF((prev) => ({ ...prev, lage: "foresla" }))}
          >
            <b>{t.foreslaRun}</b>
            <small>{t.foreslaRunText}</small>
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={!foresla}
            className={`mode-btn ${!foresla ? "active" : ""}`}
            onClick={() => setF((prev) => ({ ...prev, lage: "bedom" }))}
          >
            <b>{t.bedomMinRun}</b>
            <small>{t.bedomMinRunText}</small>
          </button>
        </div>

        <div className="field" style={{ marginTop: 16, marginBottom: 0 }}>
          <label>{t.vilkaVersioner}</label>
          <div className="val-versioner" role="group" aria-label={t.versionerAria}>
            {VERSIONSTYPER.map((typ) => {
              const vald = valda.includes(typ);
              return (
                <button
                  key={typ}
                  type="button"
                  aria-pressed={vald}
                  className={`val-chip ${vald ? "vald" : ""}`}
                  onClick={() =>
                    setF((prev) => {
                      const nu = prev.versioner?.length ? prev.versioner : (["Vinnarversion"] as VersionsTyp[]);
                      const ny = nu.includes(typ) ? nu.filter((v) => v !== typ) : [...nu, typ];
                      return { ...prev, versioner: ny.length ? ny : nu }; // minst en måste vara vald
                    })
                  }
                >
                  <span className="bock">{vald ? "✓" : ""}</span>
                  {t.versionKort[typ]}
                </button>
              );
            })}
          </div>
          <span className="hint">{valda.length === 1 ? t.enVersionSnabbast : t.extraVersionTar}</span>
        </div>

        {!foresla && (
          <div className="field" style={{ marginTop: 14 }}>
            <label htmlFor="run">{t.dinRun}</label>
            <span className="hint">{t.dinRunHint}</span>
            <textarea id="run" className="run" value={f.run} onChange={set("run")} placeholder={t.dinRunPlaceholder} />
          </div>
        )}

        <div className="actions" style={{ marginTop: 18 }}>
          <button className="btn btn-primary" disabled={busy || bildLaddar || beskar || markera}>
            {busy ? t.domarnaArbetar : foresla ? t.foreslaRun : t.bedomRunnen}
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => setF((prev) => ({ ...prev, ...EXEMPEL[sprak], runLangd: 45 }))}
          >
            {t.fyllExempel}
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => {
              setF(TOM);
              setRes(null);
              setErr("");
              setParkNamn("");
              setParkInfo("");
            }}
          >
            {t.rensa}
          </button>
        </div>
        <p className="privacy">{t.integritet}</p>
        {err && <div className="error">{err}</div>}
      </form>

      {busy && (
        <div className="panel">
          <div className="loading">
            <div className="spinner" />
            <span>
              {foresla ? t.vantarForesla : t.vantarBedom}
              <b className="sekunder"> {sekunder} s</b>
              <small className="ko-info">{t.koInfo}</small>
            </span>
          </div>
        </div>
      )}

      {res && (
        <div id="resultat" style={{ marginTop: 20 }}>
          <section className="panel">
            <h3 className="panel-title">
              {resLage === "foresla"
                ? t.foreslagenRun(t.versioner[huvudversion(res.versioner.map((v) => v.typ))])
                : t.helhetsintryck}
            </h3>
            <div className="scoreboard">
              <Gauge value={res.betyg} t={t} />
              <div>
                <p className="verdict" style={{ color: farg(res.betyg) }}>
                  {t.utlatande(res.betyg)}
                </p>
                <p className="summary">{res.sammanfattning}</p>
                <div className="stats">
                  <div className="stat">
                    <small>{t.uppskattadTid}</small>
                    <b>{Math.round(res.analys.totalTidSek)} s</b>
                  </div>
                  <div className="stat">
                    <small>{t.antalTricks}</small>
                    <b>{res.analys.antalTricks}</b>
                  </div>
                  <div className="stat">
                    <small>{t.realistisk}</small>
                    <b style={{ color: res.analys.realistisk ? "var(--green)" : "var(--red)" }}>
                      {res.analys.realistisk ? t.ja : t.nej}
                    </b>
                  </div>
                </div>
                <p className="timenote">{res.analys.tidskommentar}</p>
              </div>
            </div>
          </section>

          {hinder.length > 0 && (
            <section className="panel">
              <h3 className="panel-title">{t.hinderHittade}</h3>
              <div className="obstacles">
                {resBild && (
                  <div className="obstacles-yta">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={resBild} alt={t.hinderBildAlt} />
                    {hinder.map(
                      (h, i) =>
                        h.box_2d && (
                          <div
                            key={i}
                            className="hinder-ruta"
                            style={{
                              top: `${h.box_2d[0] / 10}%`,
                              left: `${h.box_2d[1] / 10}%`,
                              height: `${(h.box_2d[2] - h.box_2d[0]) / 10}%`,
                              width: `${(h.box_2d[3] - h.box_2d[1]) / 10}%`,
                            }}
                          >
                            <span>{h.namn}</span>
                          </div>
                        )
                    )}
                  </div>
                )}
                <div>
                  <div className="chips" style={{ marginTop: 0 }}>
                    {hinder.map((h, i) => (
                      <span className="chip obstacle" key={i}>
                        {h.namn}
                      </span>
                    ))}
                  </div>
                  {resBild && (
                    <p className="hint" style={{ marginTop: 12 }}>
                      {t.hinderRutorHint}
                    </p>
                  )}
                </div>
              </div>
            </section>
          )}

          {resLage === "foresla" && versionerPanel}

          <section className="panel">
            <h3 className="panel-title">{t.sjuKriterier}</h3>
            <div className="crit">
              {ordnade.map(
                (k) =>
                  k && (
                    <div className={`crit-card ${k.omdome}`} key={k.namn}>
                      <div className="crit-head">
                        <div>
                          <h4>{t.kriterier[k.namn]}</h4>
                          {t.kriterier[k.namn] !== k.namn && <em>{k.namn}</em>}
                        </div>
                        <span className={`badge ${k.omdome}`}>{t.omdome[k.omdome] ?? k.omdome}</span>
                      </div>
                      <p>{k.kommentar}</p>
                    </div>
                  )
              )}
            </div>
          </section>

          <section className="panel">
            <div className="pm">
              <div className="up">
                <h4>{t.hojer}</h4>
                <ul>
                  {res.hojer.map((x, i) => (
                    <li key={i}>{x}</li>
                  ))}
                </ul>
              </div>
              <div className="down">
                <h4>{t.sanker}</h4>
                <ul>
                  {res.sanker.map((x, i) => (
                    <li key={i}>{x}</li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          <section className="panel">
            <h3 className="panel-title">{resLage === "foresla" ? t.tranaPa : t.forandringar}</h3>
            <ol className="steps">
              {res.atgarder.map((x, i) => (
                <li key={i}>{x}</li>
              ))}
            </ol>
          </section>

          {resLage === "bedom" && versionerPanel}

          {res.kreativaForslag && res.kreativaForslag.length > 0 && (
            <section className="panel kreativa">
              <h3 className="panel-title">{t.kreativaRubrik}</h3>
              <p className="kreativa-ingress">{t.kreativaIngress}</p>
              <div className="kreativa-lista">
                {res.kreativaForslag.map((k, i) => (
                  <div className="kreativ" key={i}>
                    <div className="kreativ-topp">
                      <span className="kreativ-nr">{i + 1}</span>
                      <div className="kreativ-namn">
                        <h4>{k.trick}</h4>
                        <small>{k.hinder}</small>
                      </div>
                      <span className={`risk risk-${k.risk === "Hög" ? "hog" : k.risk === "Medel" ? "medel" : "lag"}`}>
                        {t.riskEtikett}: {t.risk[k.risk] ?? k.risk}
                      </span>
                    </div>
                    <p>{k.varforSallsynt}</p>
                    <p className="kreativ-bygger">
                      <b>{t.byggerPa}:</b> {k.byggerPa}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="panel">
            <details className="reason">
              <summary>{t.resonemang}</summary>
              <p>{res.tankesatt}</p>
            </details>
          </section>

          {res.matning && (
            <p className="matning">
              {t.matning({
                modell: res.matning.modell,
                geminiSek: res.matning.geminiSek,
                totalSek: res.matning.totalSek,
                forsok: res.matning.forsok,
                svar: tal(res.matning.svarTokens + res.matning.tankeTokens),
                tanke: tal(res.matning.tankeTokens),
                in: tal(res.matning.inTokens),
              })}
            </p>
          )}

          <div className="actions no-print" style={{ marginTop: 20 }}>
            <button className="btn btn-ghost" onClick={() => window.print()}>
              {t.skrivUt}
            </button>
          </div>
        </div>
      )}

      <p className="footer">{t.fotnot}</p>
    </main>
  );
}
