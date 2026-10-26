import { KRITERIER, type JudgeInput, type Steg } from "./types";

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

DE TRE VERSIONERNA (du bygger en eller flera, enligt uppdraget):
- "Säker version": bara tricks åkaren har angett, plus fyllnadsgrinds. Låg risk för fall.
- "Vinnarversion": bästa balans mellan risk och poäng. Får innehålla prioriterade tricks.
- "Max-risk version": högsta svårighet. Får innehålla prioriterade tricks som inte är helt säkra, men ska vara rimlig för åkarens nivå.
- I Vinnarversion och Max-risk version får du föreslå varianter och tydligt markera nya tricks med "(nytt)".

PARKBILD:
- Bilden kan innehålla text, marginaler eller annat runt parken. Bry dig bara om själva parken.
- Bygg en logisk väg genom parken utifrån hur hindren faktiskt ligger i förhållande till varandra, så att åkaren inte behöver tappa fart eller vända i onödan.
- Använd bara hinder som finns i bilden eller i parkbeskrivningen. Hitta inte på hinder. Skriv till exempel inte "Shallow end" om parken inte har någon shallow end.
- Fältet "sektion" i varje rad MÅSTE vara exakt samma text som namnet på ett av parkens hinder.
- Första raden i varje version ska vara starten (t.ex. "Roll in" eller "Drop in") från ett hinder där man rimligen startar, t.ex. ett platform deck eller en platform quarter.

FYLLNADSTRICKS:
- Mellan huvudtricken får du fylla ut med frontside- och backside-grinds (t.ex. frontside/backside 50-50, 5-0, smith, feeble, crooked, nosegrind) på coping, extensions, platforms, rails eller ledges för att hålla farten och fylla tiden.
- Markera sådana tricks med "(fyllnad)" i trick-namnet. Variera grindtyp och riktning så att de inte räknas som repetition.

ARBETSSÄTT:
- Varje version ska fylla run-längden med realistiska tidsstämplar i formatet "0:00–0:04".
- Koppla varje rad till de kriterier den främst påverkar.
- Ge feedback endast utifrån de sju kriterierna. Säg tydligt vad som höjer och vad som drar ner helhetsintrycket.
- Håll texterna korta så att svaret går snabbt: "motivering" högst 12 ord, varje kriteriums "kommentar" högst 25 ord, "beskrivning" högst 20 ord, "tankesatt" högst 80 ord.
- Om varken bild eller parkbeskrivning finns: anta en typisk OS-park (bowl med deep end, hips, extensions, spine, quarter pipes) och säg det.

ÄRLIGHET:
- Var rak och professionell. Smickra inte. Om runnen är svag, säg det och förklara varför.
- Om bilden är otydlig eller du är osäker på ett hinder, säg det.
- Betyget är en uppskattning från en AI, inte en officiell domarbedömning.

Svara alltid på svenska, i exakt det JSON-format som efterfrågas.`;

function akarensUppgifter(i: JudgeInput): string {
  return `ÅKARENS UPPGIFTER
Run-längd: ${i.runLangd} sekunder
Nivå: ${i.niva || "ej angiven"}

Tricks åkaren vill göra / landar säkert:
${i.sakraTricks || "ej angivet"}

Tricks åkaren vill prioritera:
${i.prioTricks || "inga angivna"}

Parken:
${i.bild ? "En bild på parken är bifogad." : ""}
${i.park ? `Beskrivning: ${i.park}` : i.bild ? "" : "okänd – anta en typisk OS-park"}`;
}

export function buildUserPrompt(i: JudgeInput, steg: Steg): string {
  const grund = akarensUppgifter(i);

  // Steg 2 och 3: bygg en av de andra versionerna utifrån redan hittade hinder
  if (steg !== "bas") {
    const typ = steg === "saker" ? "Säker version" : "Max-risk version";
    const hinder = (i.kontext?.hinder || []).map((h) => `- ${h.namn}`).join("\n");
    const vinnare = (i.kontext?.vinnare?.rader || [])
      .map((r, n) => `${n + 1}. ${r.trick} – ${r.sektion}`)
      .join("\n");
    return `${grund}

PARKENS HINDER (redan identifierade, använd exakt dessa namn i "sektion"):
${hinder || "- inga identifierade"}

VINNARVERSIONEN SOM REDAN ÄR BYGGD (för jämförelse):
${vinnare || "saknas"}

UPPDRAG: BYGG "${typ.toUpperCase()}"
Bygg endast ${typ}. ${
      steg === "saker"
        ? "Den ska vara säkrare än Vinnarversionen: bara tricks åkaren har angett, plus fyllnadsgrinds."
        : "Den ska vara svårare än Vinnarversionen och ta med de prioriterade tricken."
    } Använd gärna samma väg genom parken som Vinnarversionen när den fungerar, men byt tricks efter versionens syfte. Sätt "typ" till "${typ}" och ett uppskattat betyg 1–10.`;
  }

  const hinderInstruktion = i.bild
    ? `HINDER: Hitta alla hinder i bilden och lista dem i "hinderIParken". Använd de namn som står utskrivna i bilden om sådana finns (t.ex. "Platform quarter", "Spine", "Volcano", "Gap hip", "Deep end"). Finns två hinder med samma namn, skilj dem åt, t.ex. "Extension (vänster)" och "Extension (höger)". Ge varje hinder en "box_2d": [ymin, xmin, ymax, xmax] normaliserad till 0–1000 i förhållande till HELA bilden. Rutan ska omsluta själva hindret (rampen, kanten, copingen), inte bara den utskrivna etiketten.`
    : `HINDER: Lista parkens hinder i "hinderIParken" utan "box_2d".`;

  if (i.lage === "foresla") {
    return `${grund}

${hinderInstruktion}

UPPDRAG: FÖRESLÅ EN RUN – BYGG VINNARVERSIONEN
Åkaren har ingen färdig run. Bygg den bästa möjliga Vinnarversionen från grunden utifrån åkarens tricks och parken. Fyll ut med frontside- och backside-grinds där det behövs. Säker version och Max-risk version byggs separat senare, bygg inte dem nu.

Så här fyller du fälten:
- "vinnarversion" är runnen.
- "analys", "betyg", "sammanfattning", "kriterier", "hojer" och "sanker" gäller Vinnarversionen.
- "atgarder" är vad åkaren ska träna på för att höja runnen ytterligare.
- "tankesatt" förklarar kort hur du valde vägen genom parken och vilka kriterier som vägde tyngst.`;
  }

  return `${grund}

${hinderInstruktion}

UPPDRAG: BEDÖM ÅKARENS RUN – OCH BYGG EN FÖRBÄTTRAD VINNARVERSION
Den tänkta runnen (i ordning):
${i.run}

Så här fyller du fälten:
- "analys", "betyg", "sammanfattning", "kriterier", "hojer", "sanker" och "atgarder" gäller ÅKARENS run ovan.
- "vinnarversion" är din förbättrade version av runnen. Säker version och Max-risk version byggs separat senare, bygg inte dem nu.
- "tankesatt" förklarar kort hur du räknade och vilka kriterier som vägde tyngst.`;
}

const RAD_SCHEMA = {
  type: "OBJECT",
  properties: {
    tid: { type: "STRING" },
    sektion: { type: "STRING" },
    trick: { type: "STRING" },
    motivering: { type: "STRING" },
    kriterier: { type: "ARRAY", items: { type: "STRING", enum: [...KRITERIER] } },
  },
  required: ["tid", "sektion", "trick", "motivering", "kriterier"],
};

export const VERSION_SCHEMA = {
  type: "OBJECT",
  properties: {
    typ: { type: "STRING", enum: ["Säker version", "Vinnarversion", "Max-risk version"] },
    uppskattatBetyg: { type: "NUMBER" },
    beskrivning: { type: "STRING" },
    rader: { type: "ARRAY", items: RAD_SCHEMA },
  },
  required: ["typ", "uppskattatBetyg", "beskrivning", "rader"],
};

// Steg 1: hinder, bedömning och Vinnarversionen
export const BAS_SCHEMA = {
  type: "OBJECT",
  properties: {
    hinderIParken: {
      type: "ARRAY",
      description: "Hinder som syns i parkbilden eller nämns i beskrivningen",
      items: {
        type: "OBJECT",
        properties: {
          namn: { type: "STRING" },
          box_2d: {
            type: "ARRAY",
            items: { type: "INTEGER" },
            description: "[ymin, xmin, ymax, xmax] 0–1000 i förhållande till hela bilden",
          },
        },
        required: ["namn"],
      },
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
    vinnarversion: VERSION_SCHEMA,
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
    "vinnarversion",
    "tankesatt",
  ],
};
