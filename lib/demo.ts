import type { JudgeResult } from "./types";

// Exempelsvar som visas när GEMINI_API_KEY=demo. Bra för att testa designen utan nyckel.
export const DEMO_RESULT: JudgeResult = {
  hinderIParken: [
    "Platform quarter",
    "Bank",
    "Bridge",
    "Spine",
    "Volcano",
    "Extension (vänster)",
    "Hip",
    "Extension (höger)",
    "Gap hip",
    "Deep end",
    "Platform deck",
  ],
  analys: {
    totalTidSek: 34,
    antalTricks: 10,
    realistisk: true,
    tidskommentar:
      "Tio tricks à cirka 3–4 sekunder ger ungefär 34 sekunder. Det lämnar cirka 11 sekunder oanvänd tid av 45, vilket i praktiken blir pumpning utan poäng.",
  },
  betyg: 6.4,
  sammanfattning:
    "En ren och säker run med bra grundfart, men den saknar en riktig toppsvårighet och upprepar frontside air tre gånger. Streetdelen används inte alls.",
  kriterier: [
    { namn: "Difficulty", omdome: "Godkänd", kommentar: "Frontside 360 air och kickflip indy är runnens toppar. Det räcker till semifinal men inte till medalj." },
    { namn: "Variety", omdome: "Godkänd", kommentar: "Bra blandning av airs och grinds, men inga slides på rail och inga switch- eller fakie-tricks." },
    { namn: "Quality of execution", omdome: "Stark", kommentar: "Alla tricks är säkra, vilket ger rena landningar och god höjd." },
    { namn: "Use of the course", omdome: "Svag", kommentar: "Allt sker i bowlen. Handrail och ledge på streetdelen lämnas orörda." },
    { namn: "Consistency", omdome: "Godkänd", kommentar: "Jämn nivå, men slutet tappar intensitet med en frontside rock som sista trick." },
    { namn: "Flow", omdome: "Stark", kommentar: "Logisk väg mellan deep end och shallow end utan stopp." },
    { namn: "Repetition", omdome: "Svag", kommentar: "Frontside air på deep end görs tre gånger. Domarna ser det som utfyllnad." },
  ],
  hojer: ["Säkra landningar genom hela runnen", "Bra fart och flow i bowlen", "Kickflip indy på hipen ger variation"],
  sanker: ["Tre frontside airs på samma vägg", "Streetdelen används inte", "Svagt avslut", "Oanvänd tid i slutet"],
  atgarder: [
    "Byt två av frontside airs mot backside 540 och en kickflip frontside 360 i Vinnarversionen.",
    "Lägg in frontside boardslide på handrailen för att använda hela parken.",
    "Avsluta med runnens svåraste säkra trick i stället för frontside rock.",
    "Fyll de sista 10 sekunderna med två snabba lip tricks.",
  ],
  versioner: [
    {
      typ: "Säker version",
      uppskattatBetyg: 7.0,
      beskrivning: "Bara tricks du landar säkert, men utan upprepningar och med hela parken.",
      rader: [
        { tid: "0:00–0:04", sektion: "Deep end", trick: "Frontside air", motivering: "Lugn start som bygger fart.", kriterier: ["Flow", "Quality of execution"] },
        { tid: "0:04–0:08", sektion: "Shallow end", trick: "Frontside smith grind", motivering: "Tidig grind visar kontroll.", kriterier: ["Variety"] },
        { tid: "0:08–0:12", sektion: "Spine", trick: "Backside air över spinen", motivering: "Nytt hinder tidigt.", kriterier: ["Use of the course"] },
        { tid: "0:12–0:17", sektion: "Street", trick: "Frontside boardslide på handrail", motivering: "Använder streetdelen.", kriterier: ["Use of the course", "Variety"] },
        { tid: "0:17–0:21", sektion: "Hip", trick: "Kickflip indy", motivering: "Flip-trick i mitten håller intensiteten.", kriterier: ["Difficulty", "Consistency"] },
        { tid: "0:21–0:25", sektion: "Extension", trick: "Nosegrind", motivering: "Svårare hinder ger mer svårighet.", kriterier: ["Difficulty"] },
        { tid: "0:25–0:29", sektion: "Shallow end", trick: "Backside lipslide", motivering: "Ny riktning på slide.", kriterier: ["Variety"] },
        { tid: "0:29–0:33", sektion: "Deep end", trick: "Layback grind", motivering: "Stiltrick som domare gillar.", kriterier: ["Quality of execution"] },
        { tid: "0:33–0:37", sektion: "Volcano", trick: "Backside 5-0 (fyllnad)", motivering: "Håller farten in mot deep end.", kriterier: ["Flow"] },
        { tid: "0:37–0:42", sektion: "Deep end", trick: "Frontside 360 air", motivering: "Svåraste säkra trick sist.", kriterier: ["Difficulty", "Consistency"] },
      ],
    },
    {
      typ: "Vinnarversion",
      uppskattatBetyg: 7.9,
      beskrivning: "Ett prioriterat trick in, placerat där fallrisken kostar minst.",
      rader: [
        { tid: "0:00–0:04", sektion: "Deep end", trick: "Frontside air", motivering: "Fart och säker start.", kriterier: ["Flow"] },
        { tid: "0:04–0:09", sektion: "Deep end", trick: "Backside 540 (nytt)", motivering: "Toppsvårighet tidigt, medan benen är fräscha.", kriterier: ["Difficulty"] },
        { tid: "0:09–0:13", sektion: "Shallow end", trick: "Frontside smith grind", motivering: "Lugnt trick efter risk.", kriterier: ["Consistency"] },
        { tid: "0:13–0:18", sektion: "Street", trick: "Frontside boardslide på handrail", motivering: "Hela parken används.", kriterier: ["Use of the course"] },
        { tid: "0:18–0:22", sektion: "Hip", trick: "Kickflip indy", motivering: "Variation.", kriterier: ["Variety"] },
        { tid: "0:22–0:26", sektion: "Extension", trick: "Nosegrind", motivering: "Svårare hinder.", kriterier: ["Difficulty"] },
        { tid: "0:26–0:30", sektion: "Spine", trick: "Backside air", motivering: "Nytt hinder.", kriterier: ["Use of the course"] },
        { tid: "0:30–0:34", sektion: "Shallow end", trick: "Backside lipslide", motivering: "Ny slide-riktning.", kriterier: ["Variety"] },
        { tid: "0:34–0:38", sektion: "Deep end", trick: "Layback grind", motivering: "Stil.", kriterier: ["Quality of execution"] },
        { tid: "0:38–0:43", sektion: "Deep end", trick: "Frontside 360 air", motivering: "Starkt avslut.", kriterier: ["Consistency", "Difficulty"] },
      ],
    },
    {
      typ: "Max-risk version",
      uppskattatBetyg: 8.6,
      beskrivning: "Båda prioriterade tricks. Hög poäng om allt landar, men stor risk för fall.",
      rader: [
        { tid: "0:00–0:04", sektion: "Deep end", trick: "Frontside air", motivering: "Fart.", kriterier: ["Flow"] },
        { tid: "0:04–0:09", sektion: "Deep end", trick: "Backside 540", motivering: "Toppsvårighet.", kriterier: ["Difficulty"] },
        { tid: "0:09–0:14", sektion: "Street", trick: "Frontside boardslide på handrail", motivering: "Hela parken.", kriterier: ["Use of the course"] },
        { tid: "0:14–0:18", sektion: "Hip", trick: "Kickflip indy", motivering: "Variation.", kriterier: ["Variety"] },
        { tid: "0:18–0:22", sektion: "Extension", trick: "Nosegrind", motivering: "Svårt hinder.", kriterier: ["Difficulty"] },
        { tid: "0:22–0:26", sektion: "Shallow end", trick: "Frontside smith grind", motivering: "Andning.", kriterier: ["Consistency"] },
        { tid: "0:26–0:30", sektion: "Spine", trick: "Backside air", motivering: "Nytt hinder.", kriterier: ["Use of the course"] },
        { tid: "0:30–0:34", sektion: "Shallow end", trick: "Backside lipslide", motivering: "Variation.", kriterier: ["Variety"] },
        { tid: "0:34–0:39", sektion: "Deep end", trick: "Kickflip frontside 360", motivering: "Ny toppsvårighet sist.", kriterier: ["Difficulty", "Consistency"] },
      ],
    },
  ],
  tankesatt:
    "Jag räknade cirka 3–4 sekunder per trick och jämförde med 45 sekunder. Sedan kollade jag upprepningar och vilka hinder som användes. Repetition och Use of the course vägde tyngst nedåt, eftersom de är lättast för domarna att se. Jag antog att parkbeskrivningen stämmer.",
};
