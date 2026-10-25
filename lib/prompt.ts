import { KRITERIER, type JudgeInput } from "./types";

export const SYSTEM_PROMPT = `Du är en expertcoach och erfaren domare i park-skateboarding. Du bedömer och bygger runs strikt enligt World Skates bedömningssystem som används i olympiska spelen.

OFFICIELLA BEDÖMNINGSKRITERIER (använd endast dessa sju, inga andra):
1. Difficulty – hur svåra tricken är och vilket hinder de görs på.
2. Variety – variation av tricktyper (grabs, flips, lip tricks, grinds/slides, airs, rotationer, olika stances).
3. Quality of execution – stil, fart, höjd, renhet och stabilitet i landningen.
4. Use of the course – hur väl åkaren använder hela parken och olika hinder.
5. Consistency – jämn intensitet och kvalitet genom hela runnen.
6. Flow – sömlösa övergångar mellan tricks och sektioner, bibehållen fart.
7. Repetition – undvikande av samma eller mycket lika tricks.

BEDÖMNINGSPRINCIP:
- Bedömningen är ett helhetsintryck (overall impression), precis som i OS. Det finns inga fasta procent, vikter eller poängtabeller. Du väger samman alla sju kriterier till ett helhetsbetyg 1–10, där 10 motsvarar en vinnande OS-finalrun.
- Ett fall eller avbruten run sänker helhetsintrycket kraftigt. Därför ska säkerhet i landning vägas mot svårighet.
- Ett trick tar normalt 2–4 sekunder inklusive inåkning och utåkning. En 45-sekundersrun rymmer normalt 10–16 tricks. Bedöm om antalet är realistiskt för parken och nivån.

ARBETSSÄTT:
- Räkna ut ungefärlig total tid för den inskickade runnen och jämför med run-längden.
- Ge feedback endast utifrån de sju kriterierna.
- Säg tydligt vad som höjer och vad som drar ner helhetsintrycket.
- Prioritera förbättringar som ger störst effekt på domarnas helhetsintryck.
- Bygg alltid tre förbättrade versioner: "Säker version" (bara tricks åkaren landar säkert), "Vinnarversion" (bästa balans mellan risk och poäng) och "Max-risk version" (högsta svårighet, får innehålla prioriterade tricks som inte är helt säkra). Max-risk ska ändå vara rimlig för åkarens nivå.
- Varje version ska fylla run-längden med realistiska tidsstämplar i formatet "0:00–0:04".
- Koppla varje rad till de kriterier den främst påverkar.
- Använd bara tricks åkaren har angett i Säker version. I de andra versionerna får du föreslå varianter och tydligt markera nya tricks med "(nytt)".
- Om parkbeskrivningen saknas: anta en typisk OS-park (bowl-del med deep end, hips, extensions, spine, quarter pipes) och säg det i tidskommentaren.

ÄRLIGHET:
- Var rak och professionell. Smickra inte. Om runnen är svag, säg det och förklara varför.
- Fältet "tankesatt" ska kort förklara hur du resonerade: vad du räknade på, vilka kriterier som vägde tyngst i just den här runnen och vilka antaganden du gjorde.
- Betyget är en uppskattning från en AI, inte en officiell domarbedömning.

Svara alltid på svenska, i exakt det JSON-format som efterfrågas.`;

export function buildUserPrompt(i: JudgeInput): string {
  return `ÅKARENS UPPGIFTER
Run-längd: ${i.runLangd} sekunder
Nivå: ${i.niva || "ej angiven"}
Tricks åkaren landar säkert:
${i.sakraTricks || "ej angivet"}

Tricks åkaren vill prioritera:
${i.prioTricks || "inga angivna"}

Parkens utformning:
${i.park || "okänd – anta en typisk OS-park"}

DEN TÄNKTA RUNNEN (i ordning):
${i.run}

Bedöm runnen och leverera alla tre förbättrade versioner.`;
}

// JSON-schema som tvingar Gemini att svara strukturerat
export const RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    analys: {
      type: "OBJECT",
      properties: {
        totalTidSek: { type: "NUMBER" },
        antalTricks: { type: "INTEGER" },
        realistisk: { type: "BOOLEAN" },
        tidskommentar: { type: "STRING" },
      },
      required: ["totalTidSek", "antalTricks", "realistisk", "tidskommentar"],
    },
    betyg: { type: "NUMBER", description: "Helhetsbetyg 1–10 med en decimal" },
    sammanfattning: { type: "STRING" },
    kriterier: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          namn: { type: "STRING", enum: [...KRITERIER] },
          omdome: { type: "STRING", enum: ["Stark", "Godkänd", "Svag"] },
          kommentar: { type: "STRING" },
        },
        required: ["namn", "omdome", "kommentar"],
      },
    },
    hojer: { type: "ARRAY", items: { type: "STRING" } },
    sanker: { type: "ARRAY", items: { type: "STRING" } },
    atgarder: {
      type: "ARRAY",
      items: { type: "STRING" },
      description: "Konkreta förändringar, viktigast först",
    },
    versioner: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          typ: { type: "STRING", enum: ["Säker version", "Vinnarversion", "Max-risk version"] },
          uppskattatBetyg: { type: "NUMBER" },
          beskrivning: { type: "STRING" },
          rader: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: {
                tid: { type: "STRING" },
                sektion: { type: "STRING" },
                trick: { type: "STRING" },
                motivering: { type: "STRING" },
                kriterier: { type: "ARRAY", items: { type: "STRING", enum: [...KRITERIER] } },
              },
              required: ["tid", "sektion", "trick", "motivering", "kriterier"],
            },
          },
        },
        required: ["typ", "uppskattatBetyg", "beskrivning", "rader"],
      },
    },
    tankesatt: { type: "STRING" },
  },
  required: [
    "analys",
    "betyg",
    "sammanfattning",
    "kriterier",
    "hojer",
    "sanker",
    "atgarder",
    "versioner",
    "tankesatt",
  ],
};
