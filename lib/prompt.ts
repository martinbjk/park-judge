import { KRITERIER, VERSIONSTYPER, UTFORANDE_DELAR, huvudversion, type JudgeInput, type VersionsTyp } from "./types";
import { referensText } from "./referensruns";

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

${referensText()}

PARKBILD:
- Om en bild på parken bifogas: hitta alla hinder i bilden och lista dem i "hinderIParken". Bilden kan innehålla text, marginaler eller annat runt parken. Bry dig bara om själva parken.
- Använd de namn som står utskrivna i bilden om sådana finns (t.ex. "Platform quarter", "Spine", "Volcano", "Gap hip", "Deep end"). Finns två hinder med samma namn, skilj dem åt, t.ex. "Extension (vänster)" och "Extension (höger)".
- Ge varje hinder en "box_2d": [ymin, xmin, ymax, xmax] normaliserad till 0–1000 i förhållande till HELA bilden. Rutan ska omsluta själva hindret (rampen, kanten, copingen), inte bara den utskrivna etiketten.
- Utan bild: lista hindren från parkbeskrivningen utan "box_2d".
- Använd bara hinder som finns i bilden eller i parkbeskrivningen. Hitta inte på hinder. Skriv till exempel inte "Shallow end" om parken inte har någon shallow end.
- Fältet "sektion" i varje rad MÅSTE vara exakt samma text som "namn" på ett av hindren i "hinderIParken".
- Bygg en logisk väg genom parken utifrån hur hindren faktiskt ligger i förhållande till varandra, så att åkaren inte behöver tappa fart eller vända i onödan.
- Första raden i varje version ska vara starten (t.ex. "Roll in" eller "Drop in") från ett hinder där man rimligen startar, t.ex. ett platform deck eller en platform quarter.

FYLLNADSTRICKS:
- Mellan huvudtricken får du fylla ut med frontside- och backside-grinds (t.ex. frontside/backside 50-50, 5-0, smith, feeble, crooked, nosegrind) på coping, extensions, platforms, rails eller ledges för att hålla farten och fylla tiden.
- Markera sådana tricks med "(fyllnad)" i trick-namnet. Variera grindtyp och riktning så att de inte räknas som repetition.

ARBETSSÄTT:
- Räkna ut ungefärlig total tid och jämför med run-längden.
- Ge feedback endast utifrån de sju kriterierna.
- Säg tydligt vad som höjer och vad som drar ner helhetsintrycket.
- Prioritera förbättringar som ger störst effekt på domarnas helhetsintryck.
- Det finns tre typer av versioner: "Säker version" (bara tricks åkaren landar säkert, plus fyllnadsgrinds), "Vinnarversion" (bästa balans mellan risk och poäng) och "Max-risk version" (högsta svårighet, får innehålla prioriterade tricks som inte är helt säkra). Max-risk ska ändå vara rimlig för åkarens nivå.
- Bygg exakt de versioner som uppdraget anger, inga andra.
- Varje version ska fylla run-längden med realistiska tidsstämplar i formatet "0:00–0:04".
- Fältet "sektion" ska vara hindrets namn i parken.
- Koppla varje rad till de kriterier den främst påverkar.
- Håll texterna korta så att svaret går snabbt: "motivering" högst 12 ord, varje kriteriums "kommentar" högst 25 ord, "beskrivning" högst 20 ord, "tankesatt" högst 80 ord.
- I Säker version: använd bara tricks åkaren har angett, plus fyllnadsgrinds. I de andra versionerna får du föreslå varianter och tydligt markera nya tricks med "(nytt)".

SWITCH – DET ULTIMATA DRAGET JUST NU:
- Stance: "regular" åker med vänster fot fram, "goofy" med höger fot fram. Varje åkare har en naturlig stance sedan många år, och hela kroppen är inställd på den: balans, pop, vridning och landning.
- SWITCH = åkaren står med den ANDRA foten fram, motsatt sin naturliga stance, och rullar framåt i den riktningen. Det känns som att åka baklänges och som att skriva med fel hand. Därför kan väldigt få göra svåra tricks switch, och därför belönas det tungt.
- FAKIE = åkaren står i sin VANLIGA stance men rullar baklänges. Det är mycket lättare än switch. Blanda aldrig ihop fakie och switch.
- NOLLIE = popp från noskanten i den vanliga stancen. Inte heller samma sak som switch.
- Bedömning: ett trick gjort switch ska värderas klart högre än samma trick i vanlig stance inom Difficulty. Ett relativt enkelt trick switch kan vara värt mer än ett svårare trick i vanlig stance. Flera olika switch-tricks i samma run lyfter också Variety tydligt.
- Om åkaren har angett switch-tricks: lyft fram dem i runnen och placera dem där de syns och bygger intensitet.
- Om åkaren inte har angett några switch-tricks: anta inte att åkaren kan åka switch. Föreslå i stället switch-varianter av åkarens säkraste tricks i "kreativaForslag", med risk minst "Medel".

INNOVATION – DET SOM FÅ KAN:
- För att vinna räcker det inte att åka bra. Det som skiljer vinnaren är ofta något nytt eller något som väldigt få kan. Domarna belönar det inom Difficulty och Variety. Just nu är switch stance ett sådant vinnande drag eftersom få behärskar det.
- Ge alltid exakt 3 "kreativaForslag": ovanliga trick eller kombinationer som åkaren realistiskt kan lära sig utifrån tricks den redan kan.
- Tänk brett: switch- eller fakie-varianter av kända tricks, ett känt trick på ett ovanligt hinder, kombinationer (t.ex. grind in med flip ut, transfer med grab), ovanliga grabs, rotationsriktningar eller varials, och trick i en ovanlig ordning som ger överraskning.
- Varje förslag ska vara fysiskt möjligt och rimligt för åkarens nivå. Föreslå inte något som bara världens bästa klarar till en regional åkare.
- Ange vilka av åkarens tricks förslaget bygger på, och risk "Låg", "Medel" eller "Hög".
- I Vinnarversion och Max-risk version: ta gärna med ett av förslagen som signaturtrick, markerat "(nytt)", om det är realistiskt.
- Om varken bild eller parkbeskrivning finns: anta en typisk OS-park (bowl med deep end, hips, extensions, spine, quarter pipes) och säg det i tidskommentaren.

ÄRLIGHET:
- Var rak och professionell. Smickra inte. Om runnen är svag, säg det och förklara varför.
- Fältet "tankesatt" ska kort förklara hur du resonerade: vad du räknade på, hur du valde vägen genom parken, vilka kriterier som vägde tyngst och vilka antaganden du gjorde.
- Om bilden är otydlig eller du är osäker på ett hinder, säg det i "tankesatt".
- Betyget är en uppskattning från en AI, inte en officiell domarbedömning.

Svara på svenska om inte uppdraget anger ett annat språk, och alltid i exakt det JSON-format som efterfrågas.`;

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
${i.park ? `Beskrivning: ${i.park}` : i.bild ? "" : "okänd – anta en typisk OS-park"}${utforandeText(i)}`;

  const markeringar = i.markeringar || [];
  const hinderAvTranaren = markeringar.length
    ? `

PARKENS HINDER ÄR UTMÄRKTA AV TRÄNAREN
Tränaren har själv pekat ut och namngett hindren. Namnen står utskrivna i bilden (vit text på svart) med en gul prick vid hindret. Lita på dem i stället för att gissa.
Hinder och ungefärligt läge i bilden (x och y 0–1000, x från vänster, y uppifrån):
${markeringar.map((m) => `- ${m.namn} (x ${Math.round(m.x)}, y ${Math.round(m.y)})`).join("\n")}
- Fältet "sektion" MÅSTE vara exakt ett av namnen ovan.
- "hinderIParken" ska vara exakt dessa namn, utan "box_2d".
- Använd lägena för att bygga en logisk väg: hinder som ligger nära varandra kan åkas i följd.`
    : "";
  const valda = valdaVersioner(i);
  const lista = valda.map((v) => `"${v}"`).join(", ");
  const antal = valda.length === 1 ? `Bygg ENDAST en version: ${lista}.` : `Bygg dessa versioner: ${lista}.`;

  if (i.lage === "foresla") {
    return `${gemensamt}${hinderAvTranaren}

UPPDRAG: FÖRESLÅ EN RUN
Åkaren har ingen färdig run. Bygg den bästa möjliga runnen från grunden utifrån åkarens tricks och parken. Fyll ut med frontside- och backside-grinds där det behövs.
${antal}

Så här fyller du fälten:
- "analys", "betyg", "sammanfattning", "kriterier", "hojer" och "sanker" gäller din "${huvudversion(valda)}".
- "atgarder" är vad åkaren ska träna på för att höja runnen ytterligare.${sprakInstruktion(i)}`;
  }

  return `${gemensamt}${hinderAvTranaren}

UPPDRAG: BEDÖM ÅKARENS RUN
Den tänkta runnen (i ordning):
${i.run}

Bedöm runnen. Bygg sedan förbättrade versioner av den. ${antal}${sprakInstruktion(i)}`;
}

// Coachens bild av fart, höjd, stil och landningar – det AI:n inte kan se i en tricklista
function utforandeText(i: JudgeInput): string {
  const NAMN = { fart: "Fart", hojd: "Höjd", stil: "Stil", landningar: "Landningar" } as const;
  const NIVA = { lag: "låg", medel: "medel", hog: "hög" } as const;
  const u = i.utforande || {};
  const ifyllda = UTFORANDE_DELAR.filter((d) => u[d] && NIVA[u[d]!]);
  if (!ifyllda.length) {
    return `

UTFÖRANDE: inte angivet av coachen. Anta ett godkänt utförande för nivån, och säg i kommentaren till "Quality of execution" att höjd, fart, stil och landningar inte kunnat bedömas från en tricklista.`;
  }
  return `

UTFÖRANDE ENLIGT COACHEN (det coachen ser när åkaren åker – lita på det):
${ifyllda.map((d) => `- ${NAMN[d]}: ${NIVA[u[d]!]}`).join("\n")}
${UTFORANDE_DELAR.filter((d) => !ifyllda.includes(d)).map((d) => `- ${NAMN[d]}: okänt`).join("\n")}
Så väger du in det:
- Det påverkar framför allt "Quality of execution", men också helhetsbetyget. Samma tricklista ska få klart olika betyg beroende på utförandet.
- Låg höjd, låg fart eller dålig stil sänker tydligt, även med svåra tricks. En run med svåra tricks men lågt och osäkert utförande når inte finalnivå.
- Hög höjd, fart och stil höjer tydligt. Stora, snabba och stilrena airs och grinds kan väga upp något lägre svårighet.
- Osäkra landningar sänker också "Consistency" och ökar risken för fall. Välj då säkrare tricks i versionerna.
- Ge minst en konkret åtgärd i "atgarder" för den svagaste delen av utförandet.`;
}

// Engelska: all fritext på engelska, men JSON-nycklar, fasta värden och markeringar oförändrade
function sprakInstruktion(i: JudgeInput): string {
  if (i.sprak !== "en") return "";
  return `

LANGUAGE: ENGLISH
Write ALL free text in English: "sammanfattning", "tidskommentar", every "kommentar", "hojer", "sanker", "atgarder", "beskrivning", "motivering", "tankesatt", "varforSallsynt", "byggerPa" and trick names.
Keep these exactly as specified, in Swedish: all JSON keys, the "typ" values ("Säker version", "Vinnarversion", "Max-risk version"), the "omdome" values ("Stark", "Godkänd", "Svag"), the "risk" values ("Låg", "Medel", "Hög") and the criterion names.
Keep the trick markers "(fyllnad)" and "(nytt)" exactly as written. Keep obstacle names exactly as given by the coach or as written in the picture.`;
}

// Valda versioner i fast ordning. Saknas valet byggs alla tre (som tidigare).
export function valdaVersioner(i: JudgeInput): VersionsTyp[] {
  const giltiga = (i.versioner || []).filter((v): v is VersionsTyp => VERSIONSTYPER.includes(v));
  return giltiga.length ? VERSIONSTYPER.filter((v) => giltiga.includes(v)) : [...VERSIONSTYPER];
}

// Schemat begränsas till de valda versionerna, så att Gemini inte skriver fler än nödvändigt
export function schemaFor(valda: VersionsTyp[]) {
  const versioner = RESPONSE_SCHEMA.properties.versioner;
  return {
    ...RESPONSE_SCHEMA,
    properties: {
      ...RESPONSE_SCHEMA.properties,
      versioner: {
        ...versioner,
        minItems: valda.length,
        maxItems: valda.length,
        items: {
          ...versioner.items,
          properties: {
            ...versioner.items.properties,
            typ: { type: "STRING", enum: [...valda] },
          },
        },
      },
    },
  };
}

// JSON-schema som tvingar Gemini att svara strukturerat
export const RESPONSE_SCHEMA = {
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
    kreativaForslag: {
      type: "ARRAY",
      minItems: 3,
      maxItems: 3,
      description: "Tre ovanliga trick eller kombinationer som få kan, byggda på åkarens tricks",
      items: {
        type: "OBJECT",
        properties: {
          trick: { type: "STRING" },
          hinder: { type: "STRING" },
          varforSallsynt: { type: "STRING", description: "Högst 25 ord" },
          byggerPa: { type: "STRING", description: "Vilka av åkarens tricks det bygger på, högst 12 ord" },
          risk: { type: "STRING", enum: ["Låg", "Medel", "Hög"] },
        },
        required: ["trick", "hinder", "varforSallsynt", "byggerPa", "risk"],
      },
    },
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
    "kreativaForslag",
  ],
};
