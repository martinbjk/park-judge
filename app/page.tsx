"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { normaliseraHinder } from "@/lib/hinder";
import BeskarBild from "./BeskarBild";
import {
  KRITERIER,
  KRITERIER_SV,
  type JudgeInput,
  type JudgeResult,
  type Lage,
  type ParkBild,
} from "@/lib/types";
import RunKarta from "./RunKarta";

const EXEMPEL: JudgeInput = {
  lage: "foresla",
  runLangd: 45,
  niva: "Nationell elit",
  sakraTricks:
    "Frontside air, backside air, frontside 360 air, kickflip indy, frontside smith grind, backside lipslide, nosegrind, layback grind, frontside rock, backside 5-0, frontside boardslide",
  prioTricks: "Backside 540, kickflip frontside 360 (inte helt säkra än)",
  park: "Platform quarter, bank, spine, volcano, bridge, två extensions, hip, gap hip, deep end, platform deck",
  run: "",
  bild: null,
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
};

const MAX_SIDA = 1600; // pixlar på längsta sidan efter komprimering

// Gör bilden mindre i webbläsaren innan den skickas, så att den alltid får plats
async function komprimeraBild(fil: File): Promise<ParkBild> {
  const url = URL.createObjectURL(fil);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error("Kunde inte läsa bilden."));
      i.src = url;
    });
    const skala = Math.min(1, MAX_SIDA / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.round(img.naturalWidth * skala);
    const h = Math.round(img.naturalHeight * skala);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Kunde inte bearbeta bilden.");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0, w, h);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    return { mimeType: "image/jpeg", data: dataUrl.split(",")[1] };
  } finally {
    URL.revokeObjectURL(url);
  }
}

function utlatande(b: number) {
  if (b >= 9) return "Medaljrun";
  if (b >= 8) return "Finalklass";
  if (b >= 7) return "Stark semifinal";
  if (b >= 5.5) return "Godkänd tävlingsrun";
  if (b >= 4) return "Under finalnivå";
  return "Långt från final";
}

function farg(b: number) {
  if (b >= 8) return "var(--green)";
  if (b >= 6) return "var(--gold)";
  return "var(--red)";
}

function Gauge({ value }: { value: number }) {
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
        <span>av 10 · Overall</span>
      </div>
    </div>
  );
}

export default function Page() {
  const [f, setF] = useState<JudgeInput>(TOM);
  const [res, setRes] = useState<JudgeResult | null>(null);
  const [resLage, setResLage] = useState<Lage>("foresla");
  const [resBild, setResBild] = useState<string | null>(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [sekunder, setSekunder] = useState(0);

  // Räknar sekunder medan domaren arbetar
  useEffect(() => {
    if (!busy) return;
    setSekunder(0);
    const t = setInterval(() => setSekunder((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [busy]);
  const [tab, setTab] = useState(1);
  const [bildLaddar, setBildLaddar] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [beskar, setBeskar] = useState(false);
  const filRef = useRef<HTMLInputElement>(null);

  const set =
    (k: keyof JudgeInput) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setF((prev) => ({ ...prev, [k]: k === "runLangd" ? Number(e.target.value) : e.target.value }));

  async function valjBild(fil: File | undefined | null) {
    if (!fil) return;
    if (!fil.type.startsWith("image/")) {
      setErr("Filen måste vara en bild (JPG, PNG eller WebP).");
      return;
    }
    setErr("");
    setBildLaddar(true);
    try {
      const bild = await komprimeraBild(fil);
      setF((prev) => ({ ...prev, bild }));
      setBeskar(false);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Kunde inte läsa bilden.");
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
  }, []);

  async function skicka(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setRes(null);
    setBusy(true);
    try {
      const r = await fetch("/api/judge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(f),
      });
      const data = await r.json().catch(() => ({
        error:
          r.status === 504 || r.status === 408
            ? "Domaren hann inte bli klar i tid. Försök igen."
            : r.status === 413
              ? "Bilden är för stor. Beskär den eller välj en mindre bild."
              : `Oväntat svar från servern (felkod ${r.status}).`,
      }));
      if (!r.ok) throw new Error(data.error || "Något gick fel.");
      setRes(data);
      setResLage(f.lage);
      setResBild(f.bild ? `data:${f.bild.mimeType};base64,${f.bild.data}` : null);
      setTab(1);
      setTimeout(() => document.getElementById("resultat")?.scrollIntoView({ behavior: "smooth" }), 50);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Något gick fel.");
    } finally {
      setBusy(false);
    }
  }

  const hinder = useMemo(() => normaliseraHinder(res?.hinderIParken), [res]);

  const ordnade = res
    ? KRITERIER.map((k) => res.kriterier.find((x) => x.namn === k)).filter(Boolean)
    : [];

  const bildSrc = f.bild ? `data:${f.bild.mimeType};base64,${f.bild.data}` : null;
  const foresla = f.lage === "foresla";

  const versionerPanel = res && (
    <section className="panel">
      <h3 className="panel-title">{resLage === "foresla" ? "Föreslagna runs" : "Förbättrade runs"}</h3>
      <div className="tabs no-print">
        {res.versioner.map((v, i) => (
          <button key={v.typ} className={`tab ${tab === i ? "active" : ""}`} onClick={() => setTab(i)}>
            {v.typ}
            <small>Uppskattat {v.uppskattatBetyg.toFixed(1)} / 10</small>
          </button>
        ))}
      </div>
      {res.versioner.map((v, i) => (
        <div key={v.typ} className={`version ${tab === i ? "" : "hidden"}`}>
          <h4 className="print-only">
            {v.typ} · {v.uppskattatBetyg.toFixed(1)} / 10
          </h4>
          <p className="vdesc">{v.beskrivning}</p>
          <RunKarta key={`${v.typ}-${resBild?.length ?? 0}`} version={v} bildSrc={resBild} hinder={hinder} />
          <h4 className="sub-title">Detaljer per trick</h4>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Tid</th>
                  <th>Hinder</th>
                  <th>Trick</th>
                  <th>Motivering</th>
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
                        {fyllnad && <span className="mark fill">Fyllnad</span>}
                        {nytt && <span className="mark new">Nytt</span>}
                      </td>
                      <td>
                        {r.motivering}
                        <div className="tags">
                          {r.kriterier.map((k) => (
                            <span className="tag" key={k}>
                              {KRITERIER_SV[k] ?? k}
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
            <small>AI-domare · park-skateboarding</small>
          </div>
        </div>
        <div className="live">
          <i /> World Skate-kriterier
        </div>
      </header>

      <section className="hero">
        <h2>
          Bygg runnen som <span>domarna</span> vill se
        </h2>
        <p>
          Ange dina tricks och ladda upp en bild på parken. Du får en färdig run anpassad efter hindren, eller en
          bedömning av din egen run, utifrån de sju kriterier som används i OS.
        </p>
        <div className="chips">
          {KRITERIER.map((k) => (
            <span className="chip" key={k}>
              <b>{KRITERIER_SV[k]}</b> · {k}
            </span>
          ))}
        </div>
      </section>

      <form className="panel no-print" onSubmit={skicka}>
        <h3 className="panel-title">1 · Åkaren och tricken</h3>
        <div className="grid2">
          <div className="field">
            <label htmlFor="len">Run-längd (sekunder)</label>
            <input id="len" type="number" min={20} max={90} value={f.runLangd} onChange={set("runLangd")} />
          </div>
          <div className="field">
            <label htmlFor="niva">Nivå</label>
            <select id="niva" value={f.niva} onChange={set("niva")}>
              <option value="">Välj nivå</option>
              <option>Nybörjare tävling</option>
              <option>Regional</option>
              <option>Nationell</option>
              <option>Nationell elit</option>
              <option>Internationell / World Skate Tour</option>
              <option>OS-nivå</option>
            </select>
          </div>
        </div>
        <div className="field">
          <label htmlFor="safe">Tricks du vill göra</label>
          <textarea
            id="safe"
            value={f.sakraTricks}
            onChange={set("sakraTricks")}
            placeholder="t.ex. frontside air, backside 540, kickflip indy, frontside smith grind…"
          />
          <span className="hint">
            Frontside- och backside-grinds läggs till automatiskt för att fylla ut runnen.
          </span>
        </div>
        <div className="field">
          <label htmlFor="prio">Tricks att prioritera (valfritt)</label>
          <textarea
            id="prio"
            value={f.prioTricks}
            onChange={set("prioTricks")}
            placeholder="Tricks du vill få med, även om de inte sitter 100 %"
          />
        </div>

        <h3 className="panel-title">2 · Parken</h3>
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
            onAvbryt={() => setBeskar(false)}
            onKlar={(ny) => {
              setF((prev) => ({ ...prev, bild: ny }));
              setBeskar(false);
            }}
          />
        ) : bildSrc ? (
          <div className="park-preview">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={bildSrc} alt="Uppladdad bild på parken" />
            <div className="park-preview-bar">
              <span>Syns text eller marginaler runt parken? Beskär bilden så hittar domaren rätt.</span>
              <div className="park-preview-actions">
                <button type="button" className="btn-small gold" onClick={() => setBeskar(true)}>
                  Beskär
                </button>
                <button type="button" className="btn-small" onClick={() => filRef.current?.click()}>
                  Byt bild
                </button>
                <button
                  type="button"
                  className="btn-small danger"
                  onClick={() => setF((prev) => ({ ...prev, bild: null }))}
                >
                  Ta bort
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
            <b>{bildLaddar ? "Läser in bilden…" : "Ladda upp en bild på parken"}</b>
            <span>Klicka, dra hit en bild eller klistra in med Ctrl+V. Gärna en bild med hindren utmärkta.</span>
          </button>
        )}
        <div className="field" style={{ marginTop: 14 }}>
          <label htmlFor="park">Beskrivning av parken (valfritt)</label>
          <textarea
            id="park"
            value={f.park}
            onChange={set("park")}
            placeholder="Komplettera bilden: deep end, spine, volcano, gap hip… Lämna tomt om bilden räcker."
          />
        </div>

        <h3 className="panel-title">3 · Vad vill du ha hjälp med?</h3>
        <div className="mode" role="radiogroup">
          <button
            type="button"
            role="radio"
            aria-checked={foresla}
            className={`mode-btn ${foresla ? "active" : ""}`}
            onClick={() => setF((prev) => ({ ...prev, lage: "foresla" }))}
          >
            <b>Föreslå en run</b>
            <small>Domaren bygger den bästa runnen utifrån dina tricks och parken.</small>
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={!foresla}
            className={`mode-btn ${!foresla ? "active" : ""}`}
            onClick={() => setF((prev) => ({ ...prev, lage: "bedom" }))}
          >
            <b>Bedöm min run</b>
            <small>Du skriver in en run och får betyg och förbättringar.</small>
          </button>
        </div>

        {!foresla && (
          <div className="field" style={{ marginTop: 14 }}>
            <label htmlFor="run">Din run</label>
            <span className="hint">Ett trick per rad, i ordning. Skriv gärna på vilket hinder det görs.</span>
            <textarea
              id="run"
              className="run"
              value={f.run}
              onChange={set("run")}
              placeholder={"1. Frontside air på deep end\n2. Backside smith grind på spinen\n3. …"}
            />
          </div>
        )}

        <div className="actions" style={{ marginTop: 18 }}>
          <button className="btn btn-primary" disabled={busy || bildLaddar || beskar}>
            {busy ? "Domarna arbetar…" : foresla ? "Föreslå en run" : "Bedöm runnen"}
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => setF((prev) => ({ ...EXEMPEL, bild: prev.bild, lage: prev.lage }))}
          >
            Fyll i exempel
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => {
              setF(TOM);
              setRes(null);
              setErr("");
            }}
          >
            Rensa
          </button>
        </div>
        <p className="privacy">
          Text och bild skickas till Google Gemini. På gratisnivån kan Google använda innehållet för att förbättra
          sina tjänster. Skicka inte personuppgifter.
        </p>
        {err && <div className="error">{err}</div>}
      </form>

      {busy && (
        <div className="panel">
          <div className="loading">
            <div className="spinner" />
            <span>
              {foresla
                ? "Domaren läser av parken och bygger runnen. Det kan ta upp till en minut."
                : "Domarpanelen analyserar runnen. Det kan ta upp till en minut."}
              <b className="sekunder"> {sekunder} s</b>
            </span>
          </div>
        </div>
      )}

      {res && (
        <div id="resultat" style={{ marginTop: 20 }}>
          <section className="panel">
            <h3 className="panel-title">
              {resLage === "foresla" ? "Föreslagen run · Vinnarversion" : "Domarnas helhetsintryck"}
            </h3>
            <div className="scoreboard">
              <Gauge value={res.betyg} />
              <div>
                <p className="verdict" style={{ color: farg(res.betyg) }}>
                  {utlatande(res.betyg)}
                </p>
                <p className="summary">{res.sammanfattning}</p>
                <div className="stats">
                  <div className="stat">
                    <small>Uppskattad tid</small>
                    <b>{Math.round(res.analys.totalTidSek)} s</b>
                  </div>
                  <div className="stat">
                    <small>Antal tricks</small>
                    <b>{res.analys.antalTricks}</b>
                  </div>
                  <div className="stat">
                    <small>Realistisk</small>
                    <b style={{ color: res.analys.realistisk ? "var(--green)" : "var(--red)" }}>
                      {res.analys.realistisk ? "Ja" : "Nej"}
                    </b>
                  </div>
                </div>
                <p className="timenote">{res.analys.tidskommentar}</p>
              </div>
            </div>
          </section>

          {hinder.length > 0 && (
            <section className="panel">
              <h3 className="panel-title">Hinder domaren hittade</h3>
              <div className="obstacles">
                {resBild && (
                  <div className="obstacles-yta">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={resBild} alt="Parken med hindren markerade" />
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
                      Rutorna visar var domaren tror att hindren ligger. Numren i runnen placeras utifrån dem.
                      Ligger rutorna fel, prova att beskära bilden så att bara parken syns.
                    </p>
                  )}
                </div>
              </div>
            </section>
          )}

          {resLage === "foresla" && versionerPanel}

          <section className="panel">
            <h3 className="panel-title">De sju kriterierna</h3>
            <div className="crit">
              {ordnade.map(
                (k) =>
                  k && (
                    <div className={`crit-card ${k.omdome}`} key={k.namn}>
                      <div className="crit-head">
                        <div>
                          <h4>{KRITERIER_SV[k.namn]}</h4>
                          <em>{k.namn}</em>
                        </div>
                        <span className={`badge ${k.omdome}`}>{k.omdome}</span>
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
                <h4>Höjer poängen</h4>
                <ul>
                  {res.hojer.map((x, i) => (
                    <li key={i}>{x}</li>
                  ))}
                </ul>
              </div>
              <div className="down">
                <h4>Drar ner poängen</h4>
                <ul>
                  {res.sanker.map((x, i) => (
                    <li key={i}>{x}</li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          <section className="panel">
            <h3 className="panel-title">
              {resLage === "foresla" ? "Träna på detta för att höja runnen" : "Förändringar med störst effekt"}
            </h3>
            <ol className="steps">
              {res.atgarder.map((x, i) => (
                <li key={i}>{x}</li>
              ))}
            </ol>
          </section>

          {resLage === "bedom" && versionerPanel}

          <section className="panel">
            <details className="reason">
              <summary>Så resonerade domaren</summary>
              <p>{res.tankesatt}</p>
            </details>
          </section>

          <div className="actions no-print" style={{ marginTop: 20 }}>
            <button className="btn btn-ghost" onClick={() => window.print()}>
              Skriv ut / spara som PDF
            </button>
          </div>
        </div>
      )}

      <p className="footer">
        Betyget är en AI-uppskattning baserad på World Skates kriterier, inte en officiell domarbedömning.
      </p>
    </main>
  );
}
