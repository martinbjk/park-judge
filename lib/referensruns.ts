// Referensruns som domaren jämför mot. Lägg till fler här, t.ex. kaptenens egna runs med hans betyg.
// Varje run hjälper modellen att förstå vad en viss poängnivå betyder i verkligheten.

export type Referensrun = {
  titel: string;
  poang: string; // officiell poäng eller kaptenens betyg
  betygPaVarSkala: number; // motsvarande betyg 1–10 i appen
  kalla: string;
  tricks: string[];
  kommentar: string; // vad runnen visar enligt de sju kriterierna
};

export const REFERENSRUNS: Referensrun[] = [
  {
    titel: "OS-guld herrar park, Paris 2024 – Keegan Palmer (Australien), åk 1 i finalen",
    poang: "93,11 av 100 (bästa av tre åk räknas)",
    betygPaVarSkala: 9.3,
    kalla: "Poäng: olympics.com. Tricklistan är nedskriven av en användare från videon.",
    tricks: [
      "Alley-oop indy",
      "Transfer från låg till hög ramp med landning i backside smith grind",
      "McTwist",
      "Kickflip över volcano",
      "Indy grab",
      "Alley-oop frontside air",
      "Nosegrind på vertikal transition",
      "Kickflip lien air",
      "Frontside slide and roll",
      "Frontside ollie till nosegrind",
      "Frontside 360 air över platform",
      "McTwist tail grab på vert",
      "Hög kickflip to fakie",
    ],
    kommentar:
      "13 tricks på 45 sekunder utan stopp. Svårighet: två McTwist-varianter, flera kickflip-varianter och frontside 360 air. Variation: airs, flips, alley-oops, grinds, slide och fakie-landning, åt både frontside- och backside-hållet. Användning av parken: volcano, platform, vert, vertikal transition och transfer mellan ramper. Upprepade grundtrick görs i ny variant (annan grab, annat hinder) och räknas därför inte som repetition.",
  },
  {
    titel: "VM-guld herrar park, São Paulo 8 mars 2026 – Egoitz Bijueska (Spanien, 15 år), sista åket i finalen",
    poang: "95,83 av 100 (bästa av tre åk räknas)",
    betygPaVarSkala: 9.6,
    kalla: "Poäng: urbanworldseries.com. Tricklistan är nedskriven av en användare från videon.",
    tricks: [
      "Melon 540",
      "Backside smith grind",
      "Backside smith grind upp på extension",
      "Tail grab 540",
      "Backside tailslide i hörnet",
      "Frontside nosegrind på extension",
      "Frontside smith grind",
      "Kickflip body varial över hörnet",
      "Feeble grind på vert",
      "Crooked grind på rail på platform deck",
      "Frontside blunt",
      "Frontside slide and roll",
      "450 to fakie",
      "Switch McTwist (540)",
    ],
    kommentar:
      "14 tricks med mycket hög svårighet i både rotationer och grinds. Svårighet: två 540:or med olika grab, 450 to fakie och en switch McTwist som avslutning. Variation: airs, flips, lip tricks, slides och många olika grinds (smith, nosegrind, feeble, crooked, blunt), åt både frontside- och backside-hållet och i switch. Användning av parken: extensions, hörn, vert, rail och platform deck. Backside smith grind görs två gånger men på olika hinder (andra gången upp på extension), vilket visar kontroll snarare än repetition. Avslutningen med switch McTwist håller intensiteten ända till slutet.",
  },
];

// Text som läggs in i domarprompten
export function referensText(): string {
  if (REFERENSRUNS.length === 0) return "";
  const delar = REFERENSRUNS.map(
    (r) => `${r.titel}
Poäng: ${r.poang} – motsvarar ${r.betygPaVarSkala.toFixed(1)} på appens skala 1–10.
Källa: ${r.kalla}
Tricks i ordning:
${r.tricks.map((t, i) => `${i + 1}. ${t}`).join("\n")}
Vad runnen visar: ${r.kommentar}`
  );
  return `REFERENSRUNS (verkliga runs att kalibrera betyget mot):
${delar.join("\n\n")}

Så använder du referenserna:
- Använd dem som måttstock. En run ska bara få samma betyg som en referens om den håller samma nivå på de sju kriterierna.
- En OS-poäng på 0–100 motsvarar ungefär poängen delad med 10 på appens skala.
- Kopiera inte referensrunnen. Bygg alltid utifrån åkarens egna tricks och den aktuella parken.`;
}
