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

export type JudgeInput = {
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
