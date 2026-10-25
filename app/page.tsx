"use client";

import { useState } from "react";
import { KRITERIER, KRITERIER_SV, type JudgeInput, type JudgeResult } from "@/lib/types";

const EXEMPEL: JudgeInput = {
  runLangd: 45,
  niva: "Nationell elit",
  sakraTricks:
    "Frontside air, backside air, frontside 360 air, kickflip indy, frontside smith grind, backside lipslide, nosegrind, layback grind, frontside rock, backside 5-0 på coping, frontside boardslide på rail",
  prioTricks: "Backside 540, kickflip frontside 360 (inte helt säkra än)",
  park: "Bowl med deep end och shallow end, spine i mitten, hip till vänster, extension på deep end, handrail och ledge på streetdelen",
  run: `1. Frontside air på deep end
2. Backside air på deep end
3. Frontside smith grind på shallow end
4. Frontside air över spinen
5. Backside lipslide på shallow end
6. Frontside air på deep end
7. Kickflip indy på hipen
8. Nosegrind på extensionen
9. Frontside 360 air på deep end
10. Frontside rock`,
};

const TOM: JudgeInput = { runLangd: 45, niva: "", sakraTricks: "", prioTricks: "", park: "", run: "" };

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
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState(0);

  const set = (k: keyof JudgeInput) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setF({ ...f, [k]: k === "runLangd" ? Number(e.target.value) : e.target.value });

  async function bedom(e: React.FormEvent) {
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
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Något gick fel.");
      setRes(data);
      setTab(1);
      setTimeout(() => document.getElementById("resultat")?.scrollIntoView({ behavior: "smooth" }), 50);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Något gick fel.");
    } finally {
      setBusy(false);
    }
  }

  const ordnade = res
    ? KRITERIER.map((k) => res.kriterier.find((x) => x.namn === k)).filter(Boolean)
    : [];

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
        <div className="live"><i /> World Skate-kriterier</div>
      </header>

      <section className="hero">
        <h2>
          Bygg runnen som <span>domarna</span> vill se
        </h2>
        <p>
          Beskriv din run så bedöms den som ett helhetsintryck utifrån de sju kriterier som används i OS. Du får
          ett betyg, konkreta förbättringar och tre färdiga versioner av runnen.
        </p>
        <div className="chips">
          {KRITERIER.map((k) => (
            <span className="chip" key={k}>
              <b>{KRITERIER_SV[k]}</b> · {k}
            </span>
          ))}
        </div>
      </section>

      <form className="panel no-print" onSubmit={bedom}>
        <h3 className="panel-title">1 · Åkaren</h3>
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
          <label htmlFor="safe">Tricks åkaren landar säkert</label>
          <textarea id="safe" value={f.sakraTricks} onChange={set("sakraTricks")} placeholder="t.ex. frontside air, backside smith grind, kickflip indy…" />
        </div>
        <div className="field">
          <label htmlFor="prio">Tricks att prioritera</label>
          <textarea id="prio" value={f.prioTricks} onChange={set("prioTricks")} placeholder="Tricks du vill få med, även om de inte sitter 100 %" />
        </div>

        <h3 className="panel-title">2 · Parken</h3>
        <div className="field">
          <textarea id="park" value={f.park} onChange={set("park")} placeholder="Beskriv bowl, deep end, hips, spine, rails, extensions… Lämna tomt om okänd." />
        </div>

        <h3 className="panel-title">3 · Den tänkta runnen</h3>
        <div className="field">
          <span className="hint">Ett trick per rad, i ordning. Skriv gärna var i parken det görs.</span>
          <textarea className="run" required value={f.run} onChange={set("run")} placeholder={"1. Frontside air på deep end\n2. Backside smith grind på shallow end\n3. …"} />
        </div>

        <div className="actions">
          <button className="btn btn-primary" disabled={busy}>
            {busy ? "Domarna bedömer…" : "Bedöm runnen"}
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => setF(EXEMPEL)}>
            Fyll i exempel
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => { setF(TOM); setRes(null); setErr(""); }}>
            Rensa
          </button>
        </div>
        {err && <div className="error">{err}</div>}
      </form>

      {busy && (
        <div className="panel">
          <div className="loading">
            <div className="spinner" /> Domarpanelen analyserar runnen. Det tar oftast 10–30 sekunder.
          </div>
        </div>
      )}

      {res && (
        <div id="resultat" style={{ marginTop: 20 }}>
          <section className="panel">
            <h3 className="panel-title">Domarnas helhetsintryck</h3>
            <div className="scoreboard">
              <Gauge value={res.betyg} />
              <div>
                <p className="verdict" style={{ color: farg(res.betyg) }}>{utlatande(res.betyg)}</p>
                <p className="summary">{res.sammanfattning}</p>
                <div className="stats">
                  <div className="stat"><small>Uppskattad tid</small><b>{Math.round(res.analys.totalTidSek)} s</b></div>
                  <div className="stat"><small>Antal tricks</small><b>{res.analys.antalTricks}</b></div>
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

          <section className="panel">
            <h3 className="panel-title">De sju kriterierna</h3>
            <div className="crit">
              {ordnade.map((k) => k && (
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
              ))}
            </div>
          </section>

          <section className="panel">
            <div className="pm">
              <div className="up">
                <h4>Höjer poängen</h4>
                <ul>{res.hojer.map((x, i) => <li key={i}>{x}</li>)}</ul>
              </div>
              <div className="down">
                <h4>Drar ner poängen</h4>
                <ul>{res.sanker.map((x, i) => <li key={i}>{x}</li>)}</ul>
              </div>
            </div>
          </section>

          <section className="panel">
            <h3 className="panel-title">Förändringar med störst effekt</h3>
            <ol className="steps">{res.atgarder.map((x, i) => <li key={i}>{x}</li>)}</ol>
          </section>

          <section className="panel">
            <h3 className="panel-title">Förbättrade runs</h3>
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
                <h4 className="print-only">{v.typ} · {v.uppskattatBetyg.toFixed(1)} / 10</h4>
                <p className="vdesc">{v.beskrivning}</p>
                <div className="table-scroll">
                  <table>
                    <thead>
                      <tr><th>Tid</th><th>Sektion</th><th>Trick</th><th>Motivering</th></tr>
                    </thead>
                    <tbody>
                      {v.rader.map((r, j) => (
                        <tr key={j}>
                          <td className="time">{r.tid}</td>
                          <td className="sek">{r.sektion}</td>
                          <td className="trick">{r.trick}</td>
                          <td>
                            {r.motivering}
                            <div className="tags">
                              {r.kriterier.map((k) => <span className="tag" key={k}>{KRITERIER_SV[k] ?? k}</span>)}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </section>

          <section className="panel">
            <details className="reason">
              <summary>Så resonerade domaren</summary>
              <p>{res.tankesatt}</p>
            </details>
          </section>

          <div className="actions no-print" style={{ marginTop: 20 }}>
            <button className="btn btn-ghost" onClick={() => window.print()}>Skriv ut / spara som PDF</button>
          </div>
        </div>
      )}

      <p className="footer">
        Betyget är en AI-uppskattning baserad på World Skates kriterier, inte en officiell domarbedömning.
      </p>
    </main>
  );
}
