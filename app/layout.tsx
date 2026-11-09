import type { Metadata, Viewport } from "next";
import "./globals.css";

// Den fasta adressen behövs för att delningsbilden ska få en fullständig länk.
// Vercel sätter VERCEL_PROJECT_PRODUCTION_URL automatiskt.
const adress = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : "http://localhost:3000";

const titel = "Park Judge – AI-domare för park-skateboarding";
const beskrivning =
  "Bygg runnen som domarna vill se. Bedömd enligt OS-kriterierna, med kreativa trickförslag och utmärkta hinder i din park.";

export const metadata: Metadata = {
  metadataBase: new URL(adress),
  title: titel,
  description: beskrivning,
  openGraph: {
    title: titel,
    description: beskrivning,
    siteName: "Park Judge",
    type: "website",
    locale: "sv_SE",
    alternateLocale: ["en_US"],
  },
  twitter: {
    card: "summary_large_image",
    title: titel,
    description: beskrivning,
  },
};

export const viewport: Viewport = {
  themeColor: "#07090d",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sv">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;600;700;800&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
