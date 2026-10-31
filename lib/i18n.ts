// Alla texter i appen på svenska och engelska.
// Lägg till eller rätta en översättning här, så slår det igenom överallt.
import type { Kriterium, VersionsTyp } from "./types";

export type Sprak = "sv" | "en";
export const SPRAK: Sprak[] = ["sv", "en"];

const sv = {
  // Sidhuvud och inledning
  undertitel: "AI-domare · park-skateboarding",
  kriterierEtikett: "World Skate-kriterier",
  rubrikFore: "Bygg runnen som ",
  rubrikMarkerad: "domarna",
  rubrikEfter: " vill se",
  ingress:
    "Ange dina tricks och ladda upp en bild på parken. Du får en färdig run anpassad efter hindren, eller en bedömning av din egen run, utifrån de sju kriterier som används i OS.",

  // 1 · Åkaren
  steg1: "1 · Åkaren och tricken",
  runLangd: "Run-längd (sekunder)",
  niva: "Nivå",
  valjNiva: "Välj nivå",
  nivaer: ["Nybörjare tävling", "Regional", "Nationell", "Nationell elit", "Internationell / World Skate Tour", "OS-nivå"],
  tricksDuVillGora: "Tricks du vill göra",
  tricksPlaceholder: "t.ex. frontside air, backside 540, kickflip indy, frontside smith grind…",
  tricksHint: "Frontside- och backside-grinds läggs till automatiskt för att fylla ut runnen.",
  prioTricks: "Tricks att prioritera (valfritt)",
  prioPlaceholder: "Tricks du vill få med, även om de inte sitter 100 %",

  // 2 · Parken
  steg2: "2 · Parken",
  sparadeParker: "Sparade parker:",
  hinderAntal: (n: number) => `${n} hinder`,
  taBortPark: (namn: string) => `Ta bort ${namn}`,
  taBortSparadPark: "Ta bort sparad park",
  parkVald: (namn: string, n: number) => `${namn} är vald, med ${n} utmärkta hinder.`,
  parkSparad: (namn: string, n: number) =>
    `${namn} är sparad med ${n} hinder. Nästa gång väljer du den i listan ovanför.`,
  parkEjSparad: (n: number) => `${n} hinder utmärkta. Ge parken ett namn om du vill spara den till nästa gång.`,
  parkKundeInteSparas:
    "Parken kunde inte sparas i webbläsaren, troligen är minnet fullt. Ta bort en gammal park och försök igen. Hindren gäller ändå för den här bedömningen.",
  uppladdadBild: "Uppladdad bild på parken",
  hinderUtmarkta: (park: string, n: number) =>
    `${park ? park + ": " : ""}${n} hinder utmärkta. Domaren använder dem och numren hamnar exakt där.`,
  markUtTips: "Märk ut hindren, så vet domaren exakt var de ligger och slipper gissa.",
  andraHinder: "Ändra hinder",
  markUtHinder: "Märk ut hinder",
  beskar: "Beskär",
  bytBild: "Byt bild",
  taBort: "Ta bort",
  laserBild: "Läser in bilden…",
  laddaUppBild: "Ladda upp en bild på parken",
  laddaUppHint: "Klicka, dra hit en bild eller klistra in med Ctrl+V. Gärna en bild med hindren utmärkta.",
  parkBeskrivning: "Beskrivning av parken (valfritt)",
  parkPlaceholder: "Komplettera bilden: deep end, spine, volcano, gap hip… Lämna tomt om bilden räcker.",
  filInteBild: "Filen måste vara en bild (JPG, PNG eller WebP).",
  kundeInteLasaBild: "Kunde inte läsa bilden.",

  // Beskär
  beskarInfo: "Dra i hörnen så att rutan bara omsluter parken. Ta bort text, marginaler och annat runt omkring.",
  beskarAlt: "Beskär parkbilden",
  beskarFore: "Bilden beskärs innan den skickas till domaren.",
  avbryt: "Avbryt",
  beskarPagar: "Beskär…",
  anvandBeskarning: "Använd beskärning",

  // Märk ut hinder
  markeraSteg1: "Tryck på bilden där ett hinder finns.",
  markeraSteg2: "Skriv namnet eller välj ett förslag.",
  markeraSteg3: "Upprepa för alla hinder. Tryck på ett namn för att ta bort det.",
  markeraAlt: "Peka ut hindren i parken",
  tryckForAttTaBort: "Tryck för att ta bort",
  vadArDet: "Vad är det här? T.ex. Volcano",
  laggTill: "Lägg till",
  ingaHinderAn: "Inga hinder utmärkta än. Tryck på bilden för att börja.",
  hinderUtmarktaFler: (n: number) => `${n} hinder utmärkta. Tryck på bilden för att lägga till fler.`,
  parkNamnPlaceholder: "Parkens namn, t.ex. Melker-parken",
  klar: "Klar",
  klarOchSpara: "Klar och spara parken",

  // 3 · Uppdrag
  steg3: "3 · Vad vill du ha hjälp med?",
  foreslaRun: "Föreslå en run",
  foreslaRunText: "Domaren bygger den bästa runnen utifrån dina tricks och parken.",
  bedomMinRun: "Bedöm min run",
  bedomMinRunText: "Du skriver in en run och får betyg och förbättringar.",
  vilkaVersioner: "Vilka versioner vill du ha?",
  versionerAria: "Versioner",
  enVersionSnabbast: "En version går snabbast.",
  extraVersionTar: "Varje extra version gör att det tar längre tid.",
  dinRun: "Din run",
  dinRunHint: "Ett trick per rad, i ordning. Skriv gärna på vilket hinder det görs.",
  dinRunPlaceholder: "1. Frontside air på deep end\n2. Backside smith grind på spinen\n3. …",
  domarnaArbetar: "Domarna arbetar…",
  bedomRunnen: "Bedöm runnen",
  fyllExempel: "Fyll i exempel",
  rensa: "Rensa",
  integritet:
    "Text och bild skickas till Google Gemini. På gratisnivån kan Google använda innehållet för att förbättra sina tjänster. Skicka inte personuppgifter.",

  // Väntan
  vantarForesla: "Domaren läser av parken och bygger runnen. Det tar vanligtvis 30 sekunder till 3 minuter.",
  vantarBedom: "Domarpanelen analyserar runnen. Det tar vanligtvis 30 sekunder till 3 minuter.",
  koInfo:
    "Lång väntan beror oftast på kö hos Google. Appen använder Googles gratisnivå, och då hamnar anropen sist i kön när många använder tjänsten. Själva bedömningen tar bara runt en halv minut.",

  // Fel i webbläsaren
  felTid: "Domaren hann inte bli klar i tid. Försök igen.",
  felForStor: "Bilden är för stor. Beskär den eller välj en mindre bild.",
  felOvantat: (kod: number) => `Oväntat svar från servern (felkod ${kod}).`,
  felNagot: "Något gick fel.",

  // Resultat
  foreslagenRun: (version: string) => `Föreslagen run · ${version}`,
  helhetsintryck: "Domarnas helhetsintryck",
  av10: "av 10 · Overall",
  uppskattadTid: "Uppskattad tid",
  antalTricks: "Antal tricks",
  realistisk: "Realistisk",
  ja: "Ja",
  nej: "Nej",
  hinderHittade: "Hinder domaren hittade",
  hinderBildAlt: "Parken med hindren markerade",
  hinderRutorHint:
    "Rutorna visar var domaren tror att hindren ligger. Numren i runnen placeras utifrån dem. Ligger rutorna fel, prova att beskära bilden eller märk ut hindren själv.",
  sjuKriterier: "De sju kriterierna",
  hojer: "Höjer poängen",
  sanker: "Drar ner poängen",
  tranaPa: "Träna på detta för att höja runnen",
  forandringar: "Förändringar med störst effekt",
  foreslagnaRuns: "Föreslagna runs",
  forbattradeRuns: "Förbättrade runs",
  uppskattat: (b: string) => `Uppskattat ${b} / 10`,
  detaljerPerTrick: "Detaljer per trick",
  kolTid: "Tid",
  kolHinder: "Hinder",
  kolTrick: "Trick",
  kolMotivering: "Motivering",
  fyllnad: "Fyllnad",
  nytt: "Nytt",
  resonemang: "Så resonerade domaren",
  matning: (m: { modell: string; geminiSek: number; totalSek: number; forsok: number; svar: string; tanke: string; in: string }) =>
    `Modell: ${m.modell} · Gemini svarade på ${m.geminiSek} s${
      m.forsok > 1 ? ` (totalt ${m.totalSek} s, ${m.forsok} modeller provade)` : ""
    } · Svar: ${m.svar} tokens (varav tänkande ${m.tanke}) · Bild + text in: ${m.in} tokens`,
  skrivUt: "Skriv ut / spara som PDF",
  fotnot: "Betyget är en AI-uppskattning baserad på World Skates kriterier, inte en officiell domarbedömning.",

  // Karta
  kartaAlt: "Parken med numrerade tricks",
  draForAttFlytta: "dra för att flytta",
  kartaGissade:
    "Några tricks kunde inte kopplas till ett hinder och ligger uppe till vänster. Dra dem till rätt plats.",
  kartaDra: "Dra en siffra om den hamnat fel.",
  aterstall: "Återställ",
  skaparBild: "Skapar bild…",
  laddaNer: "Ladda ner bild",
  bildUndertext: (b: string) => `Uppskattat ${b} / 10 · Park Judge`,

  // Ord som kommer från domaren
  versioner: { "Säker version": "Säker version", Vinnarversion: "Vinnarversion", "Max-risk version": "Max-risk version" } as Record<VersionsTyp, string>,
  versionKort: { "Säker version": "Säker", Vinnarversion: "Vinnare", "Max-risk version": "Max-risk" } as Record<VersionsTyp, string>,
  omdome: { Stark: "Stark", Godkänd: "Godkänd", Svag: "Svag" } as Record<string, string>,
  kriterier: {
    Difficulty: "Svårighetsgrad",
    Variety: "Variation",
    "Quality of execution": "Utförande & landning",
    "Use of the course": "Användning av parken",
    Consistency: "Jämnhet",
    Flow: "Flow",
    Repetition: "Repetition",
  } as Record<Kriterium, string>,
  utlatande: (b: number): string =>
    b >= 9
      ? "Medaljrun"
      : b >= 8
        ? "Finalklass"
        : b >= 7
          ? "Stark semifinal"
          : b >= 5.5
            ? "Godkänd tävlingsrun"
            : b >= 4
              ? "Under finalnivå"
              : "Långt från final",
};

export type Texter = typeof sv;

const en: Texter = {
  undertitel: "AI judge · park skateboarding",
  kriterierEtikett: "World Skate criteria",
  rubrikFore: "Build the run the ",
  rubrikMarkerad: "judges",
  rubrikEfter: " want to see",
  ingress:
    "Enter your tricks and upload a picture of the park. You get a complete run fitted to the obstacles, or a judgement of your own run, based on the seven criteria used at the Olympics.",

  steg1: "1 · Skater and tricks",
  runLangd: "Run length (seconds)",
  niva: "Level",
  valjNiva: "Choose level",
  nivaer: ["Beginner contest", "Regional", "National", "National elite", "International / World Skate Tour", "Olympic level"],
  tricksDuVillGora: "Tricks you want to do",
  tricksPlaceholder: "e.g. frontside air, backside 540, kickflip indy, frontside smith grind…",
  tricksHint: "Frontside and backside grinds are added automatically to fill out the run.",
  prioTricks: "Tricks to prioritise (optional)",
  prioPlaceholder: "Tricks you want included, even if they are not 100 % yet",

  steg2: "2 · The park",
  sparadeParker: "Saved parks:",
  hinderAntal: (n) => `${n} obstacles`,
  taBortPark: (namn) => `Remove ${namn}`,
  taBortSparadPark: "Remove saved park",
  parkVald: (namn, n) => `${namn} is selected, with ${n} marked obstacles.`,
  parkSparad: (namn, n) => `${namn} is saved with ${n} obstacles. Next time, just pick it in the list above.`,
  parkEjSparad: (n) => `${n} obstacles marked. Give the park a name if you want to save it for next time.`,
  parkKundeInteSparas:
    "The park could not be saved in the browser, probably because storage is full. Remove an old park and try again. The obstacles still apply to this judgement.",
  uppladdadBild: "Uploaded picture of the park",
  hinderUtmarkta: (park, n) =>
    `${park ? park + ": " : ""}${n} obstacles marked. The judge uses them and the numbers land exactly there.`,
  markUtTips: "Mark the obstacles so the judge knows exactly where they are and does not have to guess.",
  andraHinder: "Edit obstacles",
  markUtHinder: "Mark obstacles",
  beskar: "Crop",
  bytBild: "Change picture",
  taBort: "Remove",
  laserBild: "Loading picture…",
  laddaUppBild: "Upload a picture of the park",
  laddaUppHint: "Click, drag a picture here or paste with Ctrl+V. Ideally a picture with the obstacles labelled.",
  parkBeskrivning: "Park description (optional)",
  parkPlaceholder: "Add to the picture: deep end, spine, volcano, gap hip… Leave empty if the picture is enough.",
  filInteBild: "The file must be a picture (JPG, PNG or WebP).",
  kundeInteLasaBild: "Could not read the picture.",

  beskarInfo: "Drag the corners so the box only covers the park. Remove text, margins and anything around it.",
  beskarAlt: "Crop the park picture",
  beskarFore: "The picture is cropped before it is sent to the judge.",
  avbryt: "Cancel",
  beskarPagar: "Cropping…",
  anvandBeskarning: "Use crop",

  markeraSteg1: "Tap the picture where an obstacle is.",
  markeraSteg2: "Type the name or pick a suggestion.",
  markeraSteg3: "Repeat for every obstacle. Tap a name to remove it.",
  markeraAlt: "Point out the obstacles in the park",
  tryckForAttTaBort: "Tap to remove",
  vadArDet: "What is this? E.g. Volcano",
  laggTill: "Add",
  ingaHinderAn: "No obstacles marked yet. Tap the picture to start.",
  hinderUtmarktaFler: (n) => `${n} obstacles marked. Tap the picture to add more.`,
  parkNamnPlaceholder: "Park name, e.g. Melker park",
  klar: "Done",
  klarOchSpara: "Done and save park",

  steg3: "3 · What do you need help with?",
  foreslaRun: "Suggest a run",
  foreslaRunText: "The judge builds the best run from your tricks and the park.",
  bedomMinRun: "Judge my run",
  bedomMinRunText: "You enter a run and get a score and improvements.",
  vilkaVersioner: "Which versions do you want?",
  versionerAria: "Versions",
  enVersionSnabbast: "One version is the fastest.",
  extraVersionTar: "Each extra version makes it take longer.",
  dinRun: "Your run",
  dinRunHint: "One trick per line, in order. Feel free to say which obstacle it is done on.",
  dinRunPlaceholder: "1. Frontside air on the deep end\n2. Backside smith grind on the spine\n3. …",
  domarnaArbetar: "The judges are working…",
  bedomRunnen: "Judge the run",
  fyllExempel: "Fill in example",
  rensa: "Clear",
  integritet:
    "Text and picture are sent to Google Gemini. On the free tier, Google may use the content to improve its services. Do not send personal data.",

  vantarForesla: "The judge is reading the park and building the run. It usually takes 30 seconds to 3 minutes.",
  vantarBedom: "The judging panel is analysing the run. It usually takes 30 seconds to 3 minutes.",
  koInfo:
    "Long waits are usually caused by a queue at Google. The app uses Google's free tier, so requests go to the back of the queue when many people use the service. The judging itself only takes about half a minute.",

  felTid: "The judge did not finish in time. Please try again.",
  felForStor: "The picture is too large. Crop it or choose a smaller picture.",
  felOvantat: (kod) => `Unexpected response from the server (error code ${kod}).`,
  felNagot: "Something went wrong.",

  foreslagenRun: (version) => `Suggested run · ${version}`,
  helhetsintryck: "The judges' overall impression",
  av10: "out of 10 · Overall",
  uppskattadTid: "Estimated time",
  antalTricks: "Number of tricks",
  realistisk: "Realistic",
  ja: "Yes",
  nej: "No",
  hinderHittade: "Obstacles the judge found",
  hinderBildAlt: "The park with the obstacles marked",
  hinderRutorHint:
    "The boxes show where the judge thinks the obstacles are. The numbers in the run are placed from them. If the boxes are wrong, try cropping the picture or mark the obstacles yourself.",
  sjuKriterier: "The seven criteria",
  hojer: "Raises the score",
  sanker: "Lowers the score",
  tranaPa: "Practise this to raise the run",
  forandringar: "Changes with the biggest effect",
  foreslagnaRuns: "Suggested runs",
  forbattradeRuns: "Improved runs",
  uppskattat: (b) => `Estimated ${b} / 10`,
  detaljerPerTrick: "Details per trick",
  kolTid: "Time",
  kolHinder: "Obstacle",
  kolTrick: "Trick",
  kolMotivering: "Reason",
  fyllnad: "Filler",
  nytt: "New",
  resonemang: "How the judge reasoned",
  matning: (m) =>
    `Model: ${m.modell} · Gemini answered in ${m.geminiSek} s${
      m.forsok > 1 ? ` (total ${m.totalSek} s, ${m.forsok} models tried)` : ""
    } · Answer: ${m.svar} tokens (of which thinking ${m.tanke}) · Picture + text in: ${m.in} tokens`,
  skrivUt: "Print / save as PDF",
  fotnot: "The score is an AI estimate based on World Skate's criteria, not an official judging.",

  kartaAlt: "The park with numbered tricks",
  draForAttFlytta: "drag to move",
  kartaGissade: "Some tricks could not be linked to an obstacle and are in the top left. Drag them to the right place.",
  kartaDra: "Drag a number if it landed in the wrong place.",
  aterstall: "Reset",
  skaparBild: "Creating picture…",
  laddaNer: "Download picture",
  bildUndertext: (b) => `Estimated ${b} / 10 · Park Judge`,

  versioner: { "Säker version": "Safe run", Vinnarversion: "Winning run", "Max-risk version": "Max-risk run" },
  versionKort: { "Säker version": "Safe", Vinnarversion: "Winning", "Max-risk version": "Max-risk" },
  omdome: { Stark: "Strong", Godkänd: "Pass", Svag: "Weak" },
  kriterier: {
    Difficulty: "Difficulty",
    Variety: "Variety",
    "Quality of execution": "Execution & landing",
    "Use of the course": "Use of the course",
    Consistency: "Consistency",
    Flow: "Flow",
    Repetition: "Repetition",
  },
  utlatande: (b) =>
    b >= 9
      ? "Medal run"
      : b >= 8
        ? "Final level"
        : b >= 7
          ? "Strong semi-final"
          : b >= 5.5
            ? "Solid contest run"
            : b >= 4
              ? "Below final level"
              : "Far from a final",
};

export const TEXTER: Record<Sprak, Texter> = { sv, en };

// Första gången: välj språk efter webbläsaren. Sedan: det användaren valde.
const NYCKEL = "parkjudge.sprak";
export function lasSprak(): Sprak {
  try {
    const sparat = localStorage.getItem(NYCKEL);
    if (sparat === "sv" || sparat === "en") return sparat;
  } catch {}
  try {
    return navigator.language?.toLowerCase().startsWith("sv") ? "sv" : "en";
  } catch {
    return "sv";
  }
}
export function sparaSprak(s: Sprak) {
  try {
    localStorage.setItem(NYCKEL, s);
  } catch {}
}
