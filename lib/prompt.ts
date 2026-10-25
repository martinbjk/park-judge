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

PARKBILD:
- Om en bild på parken bifogas: läs av alla hinder i bilden. Använd de namn som står utskrivna i bilden om sådana finns (t.ex. "Platform quarter", "Spine", "Volcano", "Gap hip", "Deep end"). Lista dem i fältet "hinderIParken".
- Bygg en logisk väg genom parken utifrån hur hindren faktiskt ligger i förhållande till varandra, så att åkaren inte behöver tappa fart eller vända i onödan.
- Använd bara hinder som finns i bilden eller i parkbeskrivningen. Hitta inte på hinder.

FYLLNADSTRICKS:
- Mellan huvudtricken får du fylla ut med frontside- och backside-grinds (t.ex. frontside/backside 50-50, 5-0, smith, feeble, crooked, nosegrind) på coping, extensions, platforms, rails eller ledges för att hålla farten och fylla tiden.
- Markera sådana tricks med "(fyllnad)" i trick-namnet. Variera grindtyp och riktning så att de inte räknas som repetition.

ARBETSSÄTT:
- Räkna ut ungefärlig total tid och jämför med run-längden.
- Ge feedback endast utifrån de sju kriterierna.
- Säg tydligt vad som höjer och vad som drar ner helhetsintrycket.
- Prioritera förbättringar som ger störst effekt på domarnas helhetsintryck.
- Bygg alltid tre versioner: "Säker version" (bara tricks åkaren landar säkert, plus fyllnadsgrinds), "Vinnarversion" (bästa balans mellan risk och poäng) och "Max-risk version" (högsta svårighet, får innehålla prioriterade tricks som inte är helt säkra). Max-risk ska ändå vara rimlig för åkarens nivå.
- Varje version ska fylla run-längden med realistiska tidsstämplar i formatet "0:00–0:04".
- Fältet "sektion" ska vara hindrets namn i parken.
- Koppla varje rad till de kriterier den främst påverkar.
- I Säker version: använd bara tricks åkaren har angett, plus fyllnadsgrinds. I de andra versionerna får du föreslå varianter och tydligt markera nya tricks med "(nytt)".
- Om varken bild eller parkbeskrivning finns: anta en typisk OS-park (bowl med deep end, hips, extensions, spine, quarter pipes) och säg det i tidskommentaren.

ÄRLIGHET:
- Var rak och professionell. Smickra inte. Om runnen är svag, säg det och förklara varför.
- Fältet "tankesatt" ska kort förklara hur du resonerade: vad du räknade på, hur du valde vägen genom parken, vilka kriterier som vägde tyngst och vilka antaganden du gjorde.
- Om bilden är otydlig eller du är osäker på ett hinder, säg det i "tankesatt".
- Betyget är en uppskattning från en AI, inte en officiell domarbedömning.

Svara alltid på svenska, i exakt det JSON-format som efterfrågas.`;

export function buildUserPrompt(i: JudgeInput): string {
  const gemensamt = `ÅKARENS UPPGIFTER
Run-längd: ${i.runLangd} sekunder
Nivå: ${i.niva || "ej angiven"}

Tricks åkaren vill göra / landar säkert:
${i.sakraTricks || "ej angivet"}

Tricks åkaren vill prioritera:
${i.prioTricks || "inga angivna"}

Parken:
${i.bild ? "En bild på parken är bifogad. Läs av hindren i bilden." : ""}
${i.park ? `Beskrivning: ${i.park}` : i.bild ? "" : "okänd – anta en typisk OS-park"}`;

  if (i.lage === "foresla") {
    return `${gemensamt}

UPPDRAG: FÖRESLÅ EN RUN
Åkaren har ingen färdig run. Bygg den bästa möjliga runnen från grunden utifrån åkarens tricks och parken. Fyll ut med frontside- och backside-grinds där det behövs.

Så här fyller du fälten:
- "analys", "betyg", "sammanfattning", "kriterier", "hojer" och "sanker" gäller din Vinnarversion.
- "atgarder" är vad åkaren ska träna på för att höja runnen ytterligare.
- Leverera alla tre versionerna.`;
  }

  return `${gemensamt}

UPPDRAG: BEDÖM ÅKARENS RUN
Den tänkta runnen (i ordning):
${i.run}

Bedöm runnen och leverera alla tre förbättrade versioner.`;
}

// JSON-schema som tvingar Gemini att svara strukturerat
export const RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    hinderIParken: {
      type: "ARRAY",
      items: { type: "STRING" },
      description: "Hinder som syns i parkbilden eller nämns i beskrivningen",
    },
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
    "hinderIParken",
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
