import { NextResponse } from "next/server";
import { SYSTEM_PROMPT, buildUserPrompt, RESPONSE_SCHEMA } from "@/lib/prompt";
import type { JudgeInput } from "@/lib/types";
import { DEMO_RESULT } from "@/lib/demo";

export const runtime = "nodejs";
export const maxDuration = 60;

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
const traffar = new Map<string, number[]>();

function forMangaForfragningar(ip: string): boolean {
  const grans = Number(process.env.RATE_LIMIT_PER_HOUR || 10);
  const nu = Date.now();
  const lista = (traffar.get(ip) || []).filter((t) => nu - t < 3_600_000);
  if (lista.length >= grans) {
    traffar.set(ip, lista);
    return true;
  }
  lista.push(nu);
  traffar.set(ip, lista);
  return false;
}

function fel(meddelande: string, status: number) {
  return NextResponse.json({ error: meddelande }, { status });
}

export async function POST(req: Request) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    return fel("GEMINI_API_KEY saknas. Lägg in den i Vercel under Settings → Environment Variables.", 500);
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "okänd";
  if (forMangaForfragningar(ip)) {
    return fel("Du har nått gränsen för bedömningar den här timmen. Försök igen senare.", 429);
  }

  let input: JudgeInput;
  try {
    input = await req.json();
  } catch {
    return fel("Ogiltig förfrågan. Bilden kan vara för stor, prova en mindre.", 400);
  }

  const lage = input.lage === "bedom" ? "bedom" : "foresla";
  input.lage = lage;

  if (lage === "bedom" && (!input.run || input.run.trim().length < 5)) {
    return fel("Skriv in runnen du vill få bedömd, eller välj Föreslå en run.", 400);
  }
  if (lage === "foresla" && (!input.sakraTricks || input.sakraTricks.trim().length < 3)) {
    return fel("Skriv in vilka tricks åkaren vill göra, så kan en run föreslås.", 400);
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
  if (JSON.stringify(textdel).length > 8000) {
    return fel("Texten är för lång. Korta ner beskrivningen.", 400);
  }

  if (key === "demo") {
    await new Promise((r) => setTimeout(r, 800));
    return NextResponse.json(DEMO_RESULT);
  }

  const parts: object[] = [];
  if (bild) parts.push({ inlineData: { mimeType: bild.mimeType, data: bild.data } });
  parts.push({ text: buildUserPrompt(input) });

  const body = JSON.stringify({
    systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
    contents: [{ role: "user", parts }],
    generationConfig: {
      temperature: 0.4,
      responseMimeType: "application/json",
      responseSchema: RESPONSE_SCHEMA,
    },
  });

  const provade = new Set<string>();
  let senasteStatus = 0;
  let senasteFel = "";

  async function prova(model: string): Promise<Response | null> {
    if (provade.has(model)) return null;
    provade.add(model);
    const res = await fetch(`${API}/models/${model}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": key! },
      body,
    });
    if (res.ok) {
      const data = await res.json();
      const text: string | undefined = data?.candidates?.[0]?.content?.parts?.[0]?.text;
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
      if (!arGiltigtSvar(parsed)) {
        // Modellen finns och svarar. Att prova fler modeller slösar bara gratiskvot.
        console.error("Ofullständigt svar från", model, text.slice(0, 300));
        throw new Error("OFULLSTANDIGT");
      }
      fungerandeModell = model;
      return NextResponse.json(parsed, { headers: { "x-gemini-model": model } });
    }
    senasteStatus = res.status;
    senasteFel = (await res.text()).slice(0, 300);
    console.error("Gemini-fel", model, res.status, senasteFel);
    // 400 med ogiltig nyckel ska inte trigga nya försök
    if (res.status === 400 && /API key/i.test(senasteFel)) throw new Error("NYCKEL");
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

// Kontrollerar att svaret har allt sidan behöver för att visas
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
    r.versioner.every(
      (v) => v && typeof v.uppskattatBetyg === "number" && Array.isArray(v.rader)
    )
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
