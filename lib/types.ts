export const KRITERIER = [
  "Difficulty",
  "Variety",
  "Quality of execution",
  "Use of the course",
  "Consistency",
  "Flow",
  "Repetition",
] as const;

export const KRITERIER_SV: Record<(typeof KRITERIER)[number], string> = {
  Difficulty: "Svårighetsgrad",
  Variety: "Variation",
  "Quality of execution": "Utförande & landning",
  "Use of the course": "Användning av parken",
  Consistency: "Jämnhet",
  Flow: "Flow",
  Repetition: "Repetition",
};

export type Kriterium = (typeof KRITERIER)[number];

export type Lage = "foresla" | "bedom";

export type ParkBild = {
  mimeType: string;
  data: string; // base64 utan "data:"-prefix
};

export const VERSIONSTYPER = ["Säker version", "Vinnarversion", "Max-risk version"] as const;
export type VersionsTyp = (typeof VERSIONSTYPER)[number];

// Den version som bedömningen gäller: Vinnarversionen om den är vald, annars den första valda
export function huvudversion(valda: VersionsTyp[]): VersionsTyp {
  return valda.includes("Vinnarversion") ? "Vinnarversion" : valda[0] ?? "Vinnarversion";
}

// Ett hinder som tränaren själv har pekat ut på parkbilden. x och y på skala 0–1000.
export type ParkMarkering = { namn: string; x: number; y: number };

export type JudgeInput = {
  // Språk för domarens svar och felmeddelanden
  sprak?: "sv" | "en";
  // Hinder som tränaren märkt ut. Finns de behöver Gemini inte gissa var hindren ligger.
  markeringar?: ParkMarkering[];
  // Vilka versioner som ska byggas. Färre versioner = snabbare svar.
  versioner?: VersionsTyp[];
  // Coachens bild av hur åkaren åker. Saknas en del = okänt.
  utforande?: Utforande;
  lage: Lage;
  runLangd: number;
  niva: string;
  sakraTricks: string;
  prioTricks: string;
  park: string;
  run: string;
  bild?: ParkBild | null;
};

export type RunRad = {
  tid: string;
  sektion: string;
  trick: string;
  motivering: string;
  kriterier: Kriterium[];
  // Position på parkbilden, 0–1000 (x från vänster, y uppifrån). Saknas utan bild.
  x?: number;
  y?: number;
};

export type RunVersion = {
  typ: "Säker version" | "Vinnarversion" | "Max-risk version";
  uppskattatBetyg: number;
  beskrivning: string;
  rader: RunRad[];
};

// Ett hinder i parkbilden. box_2d = [ymin, xmin, ymax, xmax] på skala 0–1000 (Geminis eget format).
export type Hinder = { namn: string; box_2d?: number[] };

export type JudgeResult = {
  // Äldre svar kan ha bara namn som text
  hinderIParken?: (string | Hinder)[];
  analys: {
    totalTidSek: number;
    antalTricks: number;
    realistisk: boolean;
    tidskommentar: string;
  };
  betyg: number;
  sammanfattning: string;
  kriterier: { namn: Kriterium; omdome: "Stark" | "Godkänd" | "Svag"; kommentar: string }[];
  hojer: string[];
  sanker: string[];
  atgarder: string[];
  versioner: RunVersion[];
  tankesatt: string;
  // Ovanliga trick eller kombinationer som få kan, byggda på åkarens tricks
  kreativaForslag?: KreativtForslag[];
  matning?: Matning;
};

// Mätning av ett anrop, för att se var tiden går och räkna kostnad
export type Matning = {
  modell: string;
  geminiSek: number; // tid för det lyckade anropet till Gemini
  totalSek: number; // tid i servern totalt, inklusive misslyckade modellförsök
  inTokens: number; // bild + text in
  svarTokens: number; // själva svaret
  tankeTokens: number; // tänkande innan svaret
  forsok: number; // antal modeller som provades
};

export type KreativtForslag = {
  trick: string;
  hinder: string;
  varforSallsynt: string; // varför få gör det och varför domarna belönar det
  byggerPa: string; // vilka av åkarens tricks det bygger på
  risk: "Låg" | "Medel" | "Hög";
};

// Utförande som AI:n inte kan se i en tricklista: coachen fyller i det han ser
export const UTFORANDE_DELAR = ["fart", "hojd", "stil", "landningar"] as const;
export type UtforandeDel = (typeof UTFORANDE_DELAR)[number];
export type UtforandeNiva = "lag" | "medel" | "hog";
export type Utforande = Partial<Record<UtforandeDel, UtforandeNiva>>;
