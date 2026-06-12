# Italian with Lucia — Sito web

Sito statico, pronto per GitHub Pages. Nessun framework, nessuna build: solo HTML, CSS e JavaScript.

## 📁 Contenuto

| File | Cosa fa |
|---|---|
| `index.html` | La pagina (testi, SEO, dati strutturati) |
| `style.css` | Tutto lo stile |
| `script.js` | Selettore valuta, menu mobile, animazioni |
| `lucia-hero.jpg`, `lucia-square.jpg` | Le foto di Lucia (già ottimizzate) |
| `robots.txt`, `sitemap.xml` | File per i motori di ricerca |

---

## ✅ Da fare prima di pubblicare (checklist)

### 1. Foto di Lucia — ✅ GIÀ FATTO
Le foto (`lucia-hero.jpg` e `lucia-square.jpg`) sono direttamente nella cartella principale, accanto a `index.html`: **niente sottocartelle**. Quando carichi su GitHub, seleziona TUTTI i file insieme e trascinali — devono finire tutti allo stesso livello.

### 2. Video di presentazione — ✅ GIÀ FATTO
Il video YouTube (`Bb2mI4j_BoE`) è già incorporato nella sezione "Meet Lucia".

### 3. Link di prenotazione (Google Calendar)
1. Lucia apre https://calendar.google.com → in alto a sinistra **Crea → Programma di appuntamenti**
2. Crea un programma chiamato **"Free trial lesson — 30 min"**, durata 30 minuti, e imposta le sue disponibilità settimanali
3. Salva → clicca **Condividi** → copia il **link alla pagina di prenotazione** (tipo `https://calendar.app.google/xxxxx`)
4. In `index.html` cerca `REPLACE-WITH-LUCIA-BOOKING-LINK` (compare **3 volte**) e sostituisci ogni occorrenza con il link
5. (Consigliato) Nel programma, attiva la verifica email e aggiungi una domanda tipo "What is your current Italian level?"

### 4. URL del sito
In `index.html` cerca `REPLACE-WITH-YOUR-URL` (compare 3 volte nei meta tag) e in `sitemap.xml` / `robots.txt`, e sostituisci con l'URL reale del sito (vedi sotto).

---

## 🚀 Pubblicare su GitHub Pages

1. Crea un account su https://github.com (se non ce l'hai)
2. Crea un nuovo repository **pubblico**, chiamalo ad esempio `italian-with-lucia`
3. Carica tutti i file di questa cartella (puoi trascinarli nella pagina del repo → "uploading an existing file")
4. Vai su **Settings → Pages** → in "Source" scegli **Deploy from a branch** → branch `main`, cartella `/ (root)` → Save
5. Dopo 1-2 minuti il sito sarà online su `https://TUO-USERNAME.github.io/italian-with-lucia/`

### 💡 Dominio personalizzato (fortemente consigliato per la SEO)
Un dominio tipo `italianwithlucia.com` costa ~10 €/anno (Namecheap, Cloudflare) e migliora molto credibilità e posizionamento su Google. Si collega a GitHub Pages da **Settings → Pages → Custom domain**.

---

## 💶 Modificare prezzi, tassi di cambio e testi

- **Prezzi**: in `index.html` cerca `data-eur="..."` — il numero è il prezzo in EUR. CZK e USD si calcolano da soli.
- **Tassi di cambio**: in `script.js`, in cima al file, modifica i numeri in `RATES` (es. `CZK: { rate: 25, ... }`).
- **Corso di gruppo**: 192 € totali (16 €/lezione), early bird 169 €. Per cambiarli cerca `data-eur="192"` e `data-eur="169"` in `index.html`.
- **Giorni/orari dei corsi**: quando Lucia decide gli orari (es. "Martedì 18:00 CET"), aggiungili nelle card dei corsi nella lista `course-meta`.

---

## 🔍 SEO — cosa è già fatto e cosa fare dopo

Già incluso: meta tag completi, Open Graph, dati strutturati Schema.org (attività, offerte, FAQ — possono comparire direttamente nei risultati Google), HTML semantico, sito velocissimo, mobile-first, sitemap e robots.txt.

Dopo la pubblicazione:
1. Registra il sito su **Google Search Console** (https://search.google.com/search-console) e invia la sitemap
2. Crea un **Profilo dell'attività su Google** (Google Business Profile) per "Italian with Lucia — Prague": è la cosa singola più efficace per le ricerche locali tipo "italian lessons prague"
3. Chiedi agli studenti attuali una recensione Google
4. Condividi il sito nei gruppi Facebook di expat a Praga (es. "Expats in Prague")
