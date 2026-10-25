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

export type JudgeResult = {
  hinderIParken?: string[];
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
};
