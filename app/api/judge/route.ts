import { NextResponse } from "next/server";
import { SYSTEM_PROMPT, buildUserPrompt, BAS_SCHEMA, VERSION_SCHEMA } from "@/lib/prompt";
import type { JudgeInput, JudgeResult, RunVersion, Steg } from "@/lib/types";
import { DEMO_RESULT } from "@/lib/demo";

export const runtime = "nodejs";
// Vercel Hobby med Fluid compute tillåter upp till 300 sekunder
export const maxDuration = 300;
// Egen gräns lite under Vercels, så att vi hinner svara med ett tydligt fel
const TIDSGRANS_MS = Number(process.env.GEMINI_TIMEOUT_MS) || 280_000;

const API = "https://generativelanguage.googleapis.com/v1beta";

// Provas i ordning. Google byter modeller ofta, därför finns även automatisk sökning nedan.
const KANDA_MODELLER = [
  "gemini-flash-latest",
  "gemini-3.8-flash",
  "gemini-3.6-flash",
  "gemini-3.5-flash",
  "gemini-flash-lite-latest",
  "gemini-3.5-flash-lite",
  "gemini-2.5-flash",
];

const TILLATNA_BILDTYPER = ["image/jpeg", "image/png", "image/webp"];
const MAX_BILD_BASE64 = 4_000_000; // cirka 3 MB bild. Vercel tar max 4,5 MB per anrop.

// Kommer ihåg vilken modell som fungerade så länge funktionen är varm
let fungerandeModell: string | undefined;

// Enkel spärr per besökare. Den nollställs när servern startar om,
// så den skyddar mot misstag och enklare missbruk, inte mot allt.
// Bara steg "bas" räknas som en bedömning. De två extra versionerna har en egen, större kvot.
const traffar = new Map<string, number[]>();

function forMangaForfragningar(nyckel: string, grans: number): boolean {
  const nu = Date.now();
  const lista = (traffar.get(nyckel) || []).filter((t) => nu - t < 3_600_000);
  if (lista.length >= grans) {
    traffar.set(nyckel, lista);
    return true;
  }
  lista.push(nu);
  traffar.set(nyckel, lista);
  return false;
}

function fel(meddelande: string, status: number) {
  return NextResponse.json({ error: meddelande }, { status });
}

const TYP_FOR_STEG: Record<Exclude<Steg, "bas">, RunVersion["typ"]> = {
  saker: "Säker version",
  maxrisk: "Max-risk version",
};

export async function POST(req: Request) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    return fel("GEMINI_API_KEY saknas. Lägg in den i Vercel under Settings → Environment Variables.", 500);
  }

  let input: JudgeInput;
  try {
    input = await req.json();
  } catch {
    return fel("Ogiltig förfrågan. Bilden kan vara för stor, prova en mindre.", 400);
  }

  const steg: Steg = input.steg === "saker" || input.steg === "maxrisk" ? input.steg : "bas";
  input.steg = steg;

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "okänd";
  const grans = Number(process.env.RATE_LIMIT_PER_HOUR || 10);
  if (
    steg === "bas"
      ? forMangaForfragningar(`bas:${ip}`, grans)
      : forMangaForfragningar(`version:${ip}`, grans * 3)
  ) {
    return fel("Du har nått gränsen för bedömningar den här timmen. Försök igen senare.", 429);
  }

  const lage = input.lage === "bedom" ? "bedom" : "foresla";
  input.lage = lage;

  if (steg === "bas") {
    if (lage === "bedom" && (!input.run || input.run.trim().length < 5)) {
      return fel("Skriv in runnen du vill få bedömd, eller välj Föreslå en run.", 400);
    }
    if (lage === "foresla" && (!input.sakraTricks || input.sakraTricks.trim().length < 3)) {
      return fel("Skriv in vilka tricks åkaren vill göra, så kan en run föreslås.", 400);
    }
  } else if (!input.kontext?.vinnare || !Array.isArray(input.kontext.vinnare.rader)) {
    return fel("Vinnarversionen saknas. Gör om bedömningen.", 400);
  }

  const bild = input.bild || null;
  if (bild) {
    if (!TILLATNA_BILDTYPER.includes(bild.mimeType) || typeof bild.data !== "string") {
      return fel("Bilden måste vara JPG, PNG eller WebP.", 400);
    }
    if (bild.data.length > MAX_BILD_BASE64) {
      return fel("Bilden är för stor. Prova en mindre bild.", 400);
    }
  }

  const textdel = { ...input, bild: undefined };
  if (JSON.stringify(textdel).length > 20_000) {
    return fel("Texten är för lång. Korta ner beskrivningen.", 400);
  }

  if (key === "demo") return demoSvar(steg);

  const parts: object[] = [];
  if (bild) parts.push({ inlineData: { mimeType: bild.mimeType, data: bild.data } });
  parts.push({ text: buildUserPrompt(input, steg) });
  const schema = steg === "bas" ? BAS_SCHEMA : VERSION_SCHEMA;

  // Tänkande styr hur länge Gemini resonerar innan svaret. Lägre nivå = snabbare svar.
  // Gemini 3+ använder thinkingLevel, Gemini 2.5 använder thinkingBudget.
  const tankeniva = (process.env.GEMINI_THINKING || "LOW").toUpperCase();
  function tankeConfig(model: string): object | undefined {
    if (tankeniva === "AV") return undefined;
    if (/gemini-2\.5/.test(model)) {
      const budget = { MINIMAL: 512, LOW: 1024, MEDIUM: 4096, HIGH: 8192 }[tankeniva] ?? 1024;
      return { thinkingBudget: budget };
    }
    return { thinkingLevel: tankeniva };
  }

  function bygg(model: string, medTanke: boolean) {
    const tanke = medTanke ? tankeConfig(model) : undefined;
    return JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: [{ role: "user", parts }],
      generationConfig: {
        temperature: 0.4,
        responseMimeType: "application/json",
        responseSchema: schema,
        ...(tanke ? { thinkingConfig: tanke } : {}),
      },
    });
  }

  // Gör om Geminis svar till det sidan förväntar sig, eller null om något saknas
  function tolka(parsed: unknown): JudgeResult | RunVersion | null {
    if (steg === "bas") {
      if (!parsed || typeof parsed !== "object") return null;
      const { vinnarversion, ...rest } = parsed as Record<string, unknown>;
      if (!arGiltigVersion(vinnarversion)) return null;
      const res = { ...rest, versioner: [{ ...(vinnarversion as RunVersion), typ: "Vinnarversion" }] };
      return arGiltigtSvar(res) ? (res as unknown as JudgeResult) : null;
    }
    if (!arGiltigVersion(parsed)) return null;
    return { ...(parsed as RunVersion), typ: TYP_FOR_STEG[steg] };
  }

  const start = Date.now();
  const tidKvar = () => TIDSGRANS_MS - (Date.now() - start);

  const provade = new Set<string>();
  const serverfelForsok = new Set<string>();
  let senasteStatus = 0;
  let senasteFel = "";

  // omforsok = samma modell provas igen (utan tankeinställning eller efter tillfälligt fel)
  async function prova(model: string, medTanke = true, omforsok = false): Promise<Response | null> {
    if (!omforsok) {
      if (provade.has(model)) return null;
      provade.add(model);
    }
    if (tidKvar() < 15_000) throw new Error("TIDEN_SLUT");
    const avbryt = new AbortController();
    const timer = setTimeout(() => avbryt.abort(), tidKvar());
    let res: Response;
    try {
      res = await fetch(`${API}/models/${model}:generateContent`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": key! },
        body: bygg(model, medTanke),
        signal: avbryt.signal,
      });
    } catch (e) {
      if (avbryt.signal.aborted) throw new Error("TIDEN_SLUT");
      throw e;
    } finally {
      clearTimeout(timer);
    }
    if (res.ok) {
      const data = await res.json();
      // Hoppa över eventuella tankedelar och ta själva svaret
      const delar: { text?: string; thought?: boolean }[] = data?.candidates?.[0]?.content?.parts || [];
      const text = delar
        .filter((p) => !p.thought && typeof p.text === "string")
        .map((p) => p.text)
        .join("");
      if (!text) {
        senasteStatus = 502;
        senasteFel = "tomt svar";
        return null;
      }
      let parsed: unknown;
      try {
        parsed = JSON.parse(text);
      } catch {
        parsed = null;
      }
      const resultat = tolka(parsed);
      if (!resultat) {
        // Modellen finns och svarar. Att prova fler modeller slösar bara gratiskvot.
        console.error("Ofullständigt svar från", model, steg, text.slice(0, 300));
        throw new Error("OFULLSTANDIGT");
      }
      fungerandeModell = model;
      return NextResponse.json(resultat, { headers: { "x-gemini-model": model } });
    }
    senasteStatus = res.status;
    senasteFel = (await res.text()).slice(0, 300);
    console.error("Gemini-fel", model, steg, res.status, senasteFel);
    // 400 med ogiltig nyckel ska inte trigga nya försök
    if (res.status === 400 && /API key/i.test(senasteFel)) throw new Error("NYCKEL");
    // Modellen förstod inte tankeinställningen: prova samma modell en gång utan den
    if (res.status === 400 && medTanke && /think/i.test(senasteFel)) return prova(model, false, true);
    // Tillfälligt fel hos Google (5xx): modellen finns, så försök en gång till med samma modell
    // i stället för att gå igenom alla modeller. Ger det fel igen, ge upp.
    if (res.status >= 500) {
      if (!serverfelForsok.has(model)) {
        serverfelForsok.add(model);
        await new Promise((r) => setTimeout(r, 1500));
        return prova(model, medTanke, true);
      }
      throw new Error("SERVERFEL");
    }
    return null;
  }

  try {
    // 1. Senast fungerande modell, egen inställning och kända Flash-modeller
    const kandidater = [fungerandeModell, process.env.GEMINI_MODEL, ...KANDA_MODELLER].filter(
      (m): m is string => !!m
    );
    for (const m of kandidater) {
      const svar = await prova(m);
      if (svar) return svar;
    }

    // 2. Fråga Google vilka modeller som finns och prova de nyaste Flash-modellerna
    for (const m of await hamtaFlashModeller(key)) {
      const svar = await prova(m);
      if (svar) return svar;
    }

    if (senasteStatus === 429) {
      return fel("Geminis gratiskvot är slut för stunden. Vänta en minut och försök igen.", 429);
    }
    return fel(`Gemini svarade med fel (${senasteStatus}). Provade: ${[...provade].join(", ")}`, 502);
  } catch (e) {
    if (e instanceof Error && e.message === "TIDEN_SLUT") {
      return fel(
        "Domaren hann inte bli klar i tid. Försök igen. Hjälper det inte, prova med färre tricks eller en mindre bild.",
        504
      );
    }
    if (e instanceof Error && e.message === "SERVERFEL") {
      return fel("Gemini har tillfälliga problem just nu. Vänta en stund och försök igen.", 503);
    }
    if (e instanceof Error && e.message === "OFULLSTANDIGT") {
      return fel("Domaren gav ett ofullständigt svar. Försök igen.", 502);
    }
    if (e instanceof Error && e.message === "NYCKEL") {
      return fel("Gemini-nyckeln är ogiltig. Kontrollera GEMINI_API_KEY i Vercel.", 500);
    }
    console.error(e);
    return fel("Kunde inte nå Gemini. Försök igen.", 502);
  }
}

// Demoläge: samma flöde som på riktigt, med fördröjning så att stegen syns
async function demoSvar(steg: Steg) {
  const vanta = (ms: number) => new Promise((r) => setTimeout(r, ms));
  const hitta = (typ: RunVersion["typ"]) => DEMO_RESULT.versioner.find((v) => v.typ === typ)!;
  if (steg === "bas") {
    await vanta(1500);
    return NextResponse.json({ ...DEMO_RESULT, versioner: [hitta("Vinnarversion")] });
  }
  await vanta(steg === "saker" ? 2500 : 4000);
  return NextResponse.json(hitta(TYP_FOR_STEG[steg]));
}

function arGiltigVersion(v: unknown): boolean {
  if (!v || typeof v !== "object") return false;
  const r = v as Record<string, unknown>;
  return (
    typeof r.uppskattatBetyg === "number" &&
    Array.isArray(r.rader) &&
    r.rader.length > 0 &&
    r.rader.every((x) => x && typeof x.trick === "string" && typeof x.sektion === "string")
  );
}

// Kontrollerar att bas-svaret har allt sidan behöver för att visas
function arGiltigtSvar(d: unknown): boolean {
  if (!d || typeof d !== "object") return false;
  const r = d as Record<string, unknown>;
  const analys = r.analys as Record<string, unknown> | undefined;
  return (
    typeof r.betyg === "number" &&
    typeof r.sammanfattning === "string" &&
    !!analys &&
    typeof analys.totalTidSek === "number" &&
    Array.isArray(r.kriterier) &&
    Array.isArray(r.hojer) &&
    Array.isArray(r.sanker) &&
    Array.isArray(r.atgarder) &&
    Array.isArray(r.versioner) &&
    r.versioner.length > 0 &&
    r.versioner.every(arGiltigVersion)
  );
}

async function hamtaFlashModeller(key: string): Promise<string[]> {
  try {
    const res = await fetch(`${API}/models?pageSize=200`, { headers: { "x-goog-api-key": key } });
    if (!res.ok) return [];
    const data = await res.json();
    const namn: string[] = (data.models || [])
      .filter((m: { supportedGenerationMethods?: string[] }) =>
        m.supportedGenerationMethods?.includes("generateContent")
      )
      .map((m: { name: string }) => m.name.replace(/^models\//, ""))
      .filter((n: string) => /flash/i.test(n) && !/(image|tts|audio|live|embed|thinking|exp)/i.test(n));
    // Nyaste version först, stabila före preview, vanlig Flash före Lite
    const poang = (n: string) => {
      const v = parseFloat(n.match(/gemini-(\d+(?:\.\d+)?)/)?.[1] || "0");
      return v * 100 - (/preview/.test(n) ? 10 : 0) - (/lite/.test(n) ? 5 : 0);
    };
    return namn.sort((a, b) => poang(b) - poang(a)).slice(0, 6);
  } catch {
    return [];
  }
}
