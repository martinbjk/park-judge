# Park Judge 🛹

AI-domare och coach för park-skateboarding. Bedömer en tänkt run som ett **helhetsintryck** utifrån World Skates sju kriterier, de som används i OS:

| Kriterium | Vad domarna tittar på |
|---|---|
| Difficulty | Hur svåra tricken är och på vilket hinder |
| Variety | Variation av tricktyper |
| Quality of execution | Stil, fart, höjd, renhet, landning |
| Use of the course | Hur väl hela parken används |
| Consistency | Jämn intensitet genom hela runnen |
| Flow | Sömlösa övergångar, bibehållen fart |
| Repetition | Undvikande av samma eller liknande tricks |

## Två lägen

1. **Föreslå en run:** ange tricks du vill göra, run-längd och ladda upp en bild på parken. Domaren läser av hindren i bilden och bygger runnen. Frontside- och backside-grinds läggs till automatiskt för att fylla ut (markeras "Fyllnad").
2. **Bedöm min run:** skriv in din egen run och få betyg och förbättringar.

Med en parkbild visas varje version som en **numrerad tricklista** med samma nummer utsatta på bilden, där tricken ska göras. Numren kan dras om de hamnat fel, och allt kan laddas ner som en bild (lista + park) att skicka till åkaren.

Parkbilden kan laddas upp, dras in eller klistras in med Ctrl+V. Den komprimeras i webbläsaren innan den skickas. Bäst resultat blir det med en bild där hindren har namn utskrivna.

Appen ger:

- Hinder som domaren hittade i parken
- Helhetsbetyg 1–10 (10 = vinnande OS-finalrun)
- Tidsberäkning och om antalet tricks är realistiskt
- Omdöme per kriterium, vad som höjer och sänker
- Konkreta förändringar, viktigast först
- **Säker version**, **Vinnarversion** och **Max-risk version** i tabeller med tid, sektion, trick och motivering
- Utskrift / spara som PDF

AI-motor: Google Gemini via gratisnivån i Google AI Studio.

> Betyget är en AI-uppskattning, inte en officiell domarbedömning.

---

## Kom igång

### 1. Skaffa en gratis Gemini-nyckel
1. Gå till https://aistudio.google.com/apikey
2. Logga in med ditt Google-konto.
3. Klicka **Create API key** och kopiera nyckeln.

### 2. Lägg upp koden på GitHub
1. Skapa ett nytt repo på https://github.com/new med namnet `park-judge` (Private går bra).
2. Ladda upp alla filer i den här mappen, eller kör i terminalen:
   ```
   git init
   git add .
   git commit -m "Park Judge"
   git branch -M main
   git remote add origin https://github.com/DITT-NAMN/park-judge.git
   git push -u origin main
   ```

### 3. Publicera på Vercel
1. Gå till https://vercel.com/new och välj repot `park-judge`.
2. Öppna **Environment Variables** och lägg till:
   - `GEMINI_API_KEY` = din nyckel
3. Klicka **Deploy**.

### Testa designen utan nyckel
Sätt `GEMINI_API_KEY=demo`. Då visas ett färdigt exempelsvar.

### Köra lokalt
```
npm install
cp .env.example .env.local   # lägg in din nyckel
npm run dev
```
Öppna http://localhost:3000

---

## Inställningar

| Variabel | Standard | Beskrivning |
|---|---|---|
| `GEMINI_API_KEY` | – | Krävs. `demo` ger exempelsvar. |
| `GEMINI_MODEL` | automatiskt | Tvinga en viss modell. Utan värde provar appen kända Flash-modeller och frågar sedan Google vilka som finns. |
| `RATE_LIMIT_PER_HOUR` | `10` | Max bedömningar per besökare och timme. |

## Bra att veta om gratisnivån
- Gratisnivån har gränser för hur många anrop som får göras per minut och per dag. När de är slut visar appen ett meddelande.
- Google kan använda det som skickas på gratisnivån för att förbättra sina produkter. Skriv inte in personuppgifter.
- Spärren per besökare ligger i serverns minne och nollställs när Vercel startar om funktionen. Den skyddar mot vanligt missbruk men inte mot allt.

## Struktur
```
app/page.tsx            Formulär och resultat
app/globals.css         Mörk tävlingsdesign
app/api/judge/route.ts  Anropar Gemini
lib/prompt.ts           Domarprompten och JSON-schemat
lib/types.ts            Typer och kriterier
lib/demo.ts             Exempelsvar för demoläget
```

Vill du ändra hur domaren tänker? Redigera `SYSTEM_PROMPT` i `lib/prompt.ts`.
