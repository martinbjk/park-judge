import type { JudgeResult, RunRad } from "./types";

// Exempelsvar som visas när GEMINI_API_KEY=demo. Bra för att testa designen utan nyckel.
// Positionerna (x, y på skala 0–1000) passar exempelbilden med Platform quarter, Spine, Volcano m.fl.

const P = {
  platformQuarterV: { x: 365, y: 215 },
  bridge: { x: 190, y: 330 },
  bank: { x: 520, y: 285 },
  platformQuarterH: { x: 720, y: 325 },
  spine: { x: 335, y: 465 },
  extensionH: { x: 760, y: 500 },
  extensionV: { x: 130, y: 600 },
  hip: { x: 240, y: 640 },
  volcano: { x: 490, y: 590 },
  deepEnd: { x: 850, y: 690 },
  gapHip: { x: 650, y: 720 },
  platformDeck: { x: 760, y: 860 },
};

const rad = (
  tid: string,
  sektion: string,
  trick: string,
  motivering: string,
  kriterier: RunRad["kriterier"],
  p: { x: number; y: number }
): RunRad => {
  void p; // positionen kommer från hindrets ruta i hinderIParken
  return { tid, sektion, trick, motivering, kriterier };
};

// Ruta runt ett hinder i Geminis format [ymin, xmin, ymax, xmax]
const box = (namn: string, p: { x: number; y: number }, halvB: number, halvH: number) => ({
  namn,
  box_2d: [p.y - halvH, p.x - halvB, p.y + halvH, p.x + halvB],
});

export const DEMO_RESULT: JudgeResult = {
  hinderIParken: [
    box("Platform quarter (vänster)", P.platformQuarterV, 70, 45),
    box("Bridge", P.bridge, 55, 45),
    box("Bank", P.bank, 60, 45),
    box("Platform quarter (höger)", P.platformQuarterH, 70, 45),
    box("Spine", P.spine, 45, 70),
    box("Extension (höger)", P.extensionH, 60, 45),
    box("Extension (vänster)", P.extensionV, 60, 45),
    box("Hip", P.hip, 40, 60),
    box("Volcano", P.volcano, 70, 60),
    box("Deep end", P.deepEnd, 80, 80),
    box("Gap hip", P.gapHip, 50, 45),
    box("Platform deck", P.platformDeck, 70, 40),
  ],
  analys: {
    totalTidSek: 44,
    antalTricks: 12,
    realistisk: true,
    tidskommentar:
      "Roll in plus elva tricks à cirka 3–4 sekunder ger ungefär 44 sekunder. Det fyller run-längden utan att stressa övergångarna.",
  },
  betyg: 7.9,
  sammanfattning:
    "Vinnarversionen använder hela parken, från platform quarter via spine och volcano till deep end och gap hip. Backside 540 tidigt ger runnen en tydlig topp medan benen är fräscha.",
  kriterier: [
    { namn: "Difficulty", omdome: "Stark", kommentar: "Backside 540 i deep end och kickflip indy över gap hip lyfter svårigheten till finalnivå." },
    { namn: "Variety", omdome: "Stark", kommentar: "Airs, flips, grinds, slides och en lip trick. Både frontside och backside används." },
    { namn: "Quality of execution", omdome: "Godkänd", kommentar: "Säkert överlag, men backside 540 landar inte alltid. Ett fall där kostar mycket." },
    { namn: "Use of the course", omdome: "Stark", kommentar: "Nästan alla hinder används, inklusive bridge och platform deck." },
    { namn: "Consistency", omdome: "Godkänd", kommentar: "Jämn nivå. Mitten med två fyllnadsgrinds är något lugnare." },
    { namn: "Flow", omdome: "Stark", kommentar: "Vägen följer parkens naturliga linje medurs utan onödiga vändningar." },
    { namn: "Repetition", omdome: "Stark", kommentar: "Inga tricks upprepas. Fyllnadsgrindsen har olika typ och riktning." },
  ],
  hojer: [
    "Backside 540 tidigt i runnen",
    "Hela parken används, även bridge och platform deck",
    "Starkt avslut med frontside 360 air i deep end",
  ],
  sanker: ["Backside 540 är inte helt säker", "Två fyllnadsgrinds i rad i mitten sänker intensiteten något"],
  atgarder: [
    "Träna backside 540 i deep end tills den landar minst 8 av 10 gånger.",
    "Byt en av fyllnadsgrindsen mot en lipslide på bank för mer variation.",
    "Öva övergången från volcano till gap hip så att farten räcker till kickflip indy.",
  ],
  versioner: [
    {
      typ: "Säker version",
      uppskattatBetyg: 7.1,
      beskrivning: "Bara tricks du landar säkert, plus fyllnadsgrinds. Hela parken används.",
      rader: [
        rad("0:00–0:03", "Platform quarter", "Roll in", "Start med fart mot spinen.", ["Flow"], P.platformQuarterV),
        rad("0:03–0:07", "Spine", "Frontside air", "Tidigt nytt hinder.", ["Use of the course"], P.spine),
        rad("0:07–0:11", "Bridge", "Frontside smith grind", "Grind på ovanligt hinder.", ["Variety", "Use of the course"], P.bridge),
        rad("0:11–0:15", "Extension (vänster)", "Nosegrind", "Svårare hinder ger svårighet.", ["Difficulty"], P.extensionV),
        rad("0:15–0:19", "Hip", "Kickflip indy", "Flip-trick i mitten håller intensiteten.", ["Difficulty", "Consistency"], P.hip),
        rad("0:19–0:22", "Volcano", "Backside 50-50 (fyllnad)", "Håller farten mot högra sidan.", ["Flow"], P.volcano),
        rad("0:22–0:26", "Bank", "Backside lipslide", "Slide i ny riktning.", ["Variety"], P.bank),
        rad("0:26–0:30", "Platform quarter (höger)", "Backside air", "Höjd på nytt hinder.", ["Quality of execution"], P.platformQuarterH),
        rad("0:30–0:33", "Extension (höger)", "Frontside 5-0 (fyllnad)", "Kort grind innan deep end.", ["Flow"], P.extensionH),
        rad("0:33–0:37", "Gap hip", "Frontside rock", "Lip trick för variation.", ["Variety"], P.gapHip),
        rad("0:37–0:41", "Deep end", "Layback grind", "Stiltrick som domare gillar.", ["Quality of execution"], P.deepEnd),
        rad("0:41–0:45", "Deep end", "Frontside 360 air", "Svåraste säkra trick sist.", ["Difficulty", "Consistency"], P.deepEnd),
      ],
    },
    {
      typ: "Vinnarversion",
      uppskattatBetyg: 7.9,
      beskrivning: "Ett prioriterat trick in, placerat tidigt där fallrisken kostar minst.",
      rader: [
        rad("0:00–0:03", "Platform deck", "Roll in", "Start med full fart mot deep end.", ["Flow"], P.platformDeck),
        rad("0:03–0:07", "Deep end", "Frontside air", "Bygger höjd inför 540.", ["Quality of execution"], P.deepEnd),
        rad("0:07–0:12", "Deep end", "Backside 540 (nytt)", "Toppsvårighet medan benen är fräscha.", ["Difficulty"], P.deepEnd),
        rad("0:12–0:16", "Gap hip", "Kickflip indy", "Flip över gap ger svårighet och variation.", ["Difficulty", "Variety"], P.gapHip),
        rad("0:16–0:19", "Volcano", "Frontside 50-50 (fyllnad)", "Lugn grind efter risk.", ["Consistency", "Flow"], P.volcano),
        rad("0:19–0:23", "Spine", "Backside air", "Nytt hinder.", ["Use of the course"], P.spine),
        rad("0:23–0:27", "Bridge", "Frontside smith grind", "Ovanligt hinder.", ["Use of the course"], P.bridge),
        rad("0:27–0:31", "Platform quarter", "Layback grind", "Stil.", ["Quality of execution"], P.platformQuarterV),
        rad("0:31–0:35", "Bank", "Backside lipslide", "Ny slide-riktning.", ["Variety"], P.bank),
        rad("0:35–0:38", "Platform quarter (höger)", "Backside 5-0 (fyllnad)", "Håller farten.", ["Flow"], P.platformQuarterH),
        rad("0:38–0:41", "Extension (höger)", "Nosegrind", "Svårt hinder.", ["Difficulty"], P.extensionH),
        rad("0:41–0:45", "Deep end", "Frontside 360 air", "Starkt avslut.", ["Consistency", "Difficulty"], { x: 880, y: 640 }),
      ],
    },
    {
      typ: "Max-risk version",
      uppskattatBetyg: 8.6,
      beskrivning: "Båda prioriterade tricks. Hög poäng om allt landar, men stor risk för fall.",
      rader: [
        rad("0:00–0:03", "Platform deck", "Roll in", "Fart.", ["Flow"], P.platformDeck),
        rad("0:03–0:08", "Deep end", "Backside 540 (nytt)", "Toppsvårighet direkt.", ["Difficulty"], P.deepEnd),
        rad("0:08–0:12", "Gap hip", "Kickflip indy", "Variation.", ["Variety"], P.gapHip),
        rad("0:12–0:15", "Volcano", "Frontside 50-50 (fyllnad)", "Andning.", ["Consistency"], P.volcano),
        rad("0:15–0:19", "Spine", "Frontside 360 air", "Rotation på nytt hinder.", ["Difficulty", "Use of the course"], P.spine),
        rad("0:19–0:23", "Bridge", "Frontside smith grind", "Ovanligt hinder.", ["Use of the course"], P.bridge),
        rad("0:23–0:27", "Hip", "Backside air", "Höjd.", ["Quality of execution"], P.hip),
        rad("0:27–0:31", "Bank", "Backside lipslide", "Variation.", ["Variety"], P.bank),
        rad("0:31–0:35", "Extension (höger)", "Nosegrind", "Svårt hinder.", ["Difficulty"], P.extensionH),
        rad("0:35–0:40", "Deep end", "Kickflip frontside 360 (nytt)", "Ny toppsvårighet sist.", ["Difficulty", "Consistency"], P.deepEnd),
      ],
    },
  ],
  tankesatt:
    "Jag läste av tolv hinder i bilden och valde en väg medurs från platform deck, eftersom deep end då kommer direkt och ger fart till backside 540. Use of the course och Difficulty vägde tyngst. Positionerna är uppskattade från bilden och kan behöva flyttas.",
};
