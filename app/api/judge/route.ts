import { NextResponse } from "next/server";
import { SYSTEM_PROMPT, buildUserPrompt, RESPONSE_SCHEMA } from "@/lib/prompt";
import type { JudgeInput } from "@/lib/types";
import { DEMO_RESULT } from "@/lib/demo";

export const runtime = "nodejs";
export const maxDuration = 60;

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

export async function POST(req: Request) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY saknas. Lägg in den i Vercel under Settings → Environment Variables." },
      { status: 500 }
    );
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "okänd";
  if (forMangaForfragningar(ip)) {
    return NextResponse.json(
      { error: "Du har nått gränsen för bedömningar den här timmen. Försök igen senare." },
      { status: 429 }
    );
  }

  let input: JudgeInput;
  try {
    input = await req.json();
  } catch {
    return NextResponse.json({ error: "Ogiltig förfrågan." }, { status: 400 });
  }

  if (!input.run || input.run.trim().length < 5) {
    return NextResponse.json({ error: "Skriv in runnen du vill få bedömd." }, { status: 400 });
  }
  if (JSON.stringify(input).length > 8000) {
    return NextResponse.json({ error: "Texten är för lång. Korta ner beskrivningen." }, { status: 400 });
  }

  if (key === "demo") {
    await new Promise((r) => setTimeout(r, 800));
    return NextResponse.json(DEMO_RESULT);
  }

  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [{ role: "user", parts: [{ text: buildUserPrompt(input) }] }],
        generationConfig: {
          temperature: 0.4,
          responseMimeType: "application/json",
          responseSchema: RESPONSE_SCHEMA,
        },
      }),
    });

    if (res.status === 429) {
      return NextResponse.json(
        { error: "Geminis gratiskvot är slut för stunden. Vänta en minut och försök igen." },
        { status: 429 }
      );
    }
    if (!res.ok) {
      const text = await res.text();
      console.error("Gemini-fel", res.status, text);
      return NextResponse.json({ error: `Gemini svarade med fel (${res.status}).` }, { status: 502 });
    }

    const data = await res.json();
    const text: string | undefined = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      return NextResponse.json({ error: "Gemini gav inget svar. Försök igen." }, { status: 502 });
    }
    return NextResponse.json(JSON.parse(text));
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Kunde inte nå Gemini. Försök igen." }, { status: 502 });
  }
}
