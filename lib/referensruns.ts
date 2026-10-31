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
      "Nosegrind",
      "Wall ride",
      "Kickflip lien air",
      "Frontside slide and roll",
      "Frontside ollie till nosegrind",
      "Frontside 360 air över platform",
      "McTwist tail grab på vert",
      "Hög kickflip to fakie",
    ],
    kommentar:
      "14 tricks på 45 sekunder utan stopp. Svårighet: två McTwist-varianter, flera kickflip-varianter och frontside 360 air. Variation: airs, flips, alley-oops, grinds, slide, wall ride och fakie-landning, åt både frontside- och backside-hållet. Användning av parken: volcano, platform, vert, vägg och transfer mellan ramper. Upprepade grundtrick görs i ny variant (annan grab, annat hinder) och räknas därför inte som repetition.",
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
