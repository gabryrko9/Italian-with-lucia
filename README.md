# Italian with Lucia

Sito statico per GitHub Pages: nessuna build, nessuna cartella. Carica TUTTI i file insieme nella radice del repository (Add file > Upload files > Commit changes). I file con lo stesso nome vengono sovrascritti.

## Come si prenota
- **Senza Supabase** (`config.js` con `url` e `key` vuoti): tutti i pulsanti "Free trial" aprono una email precompilata a Lucia. Nessuna configurazione.
- **Con Supabase** (vedi `GUIDA-AREA-STUDENTI.md`): i pulsanti aprono `book.html`, dove chiunque sceglie un orario libero e prenota la prova gratuita; gli studenti prenotano, spostano e cancellano le lezioni dall'area studenti.
- La vecchia opzione "Google Calendar" (`booking` in `config.js`) funziona solo se Supabase non è attivo.

## Regola di cancellazione
Le lezioni si spostano o cancellano fino a 24 ore prima dell'inizio (dall'area studenti, oppure scrivendo a Lucia); dopo, contano come svolte. Il testo e in `index.html`: cerca "24 hours" (riquadro sotto i pacchetti, nota nel corso di gruppo, passi, domande frequenti, piede della pagina e dati strutturati).

## Dove si modificano le cose
- Prezzi: in `index.html` cerca `data-eur="..."` (numero in EUR; CZK e USD si calcolano da soli). Cambia anche i prezzi nel blocco JSON-LD in cima, per la SEO.
  Ora: 5 lezioni a 30 EUR, 10 a 27 EUR, 20 a 25 EUR; corso di gruppo 18 EUR a persona a lezione (216 EUR per 12 lezioni).
- Cambio EUR/CZK/USD: in `script.js`, oggetto `CURRENCIES`.
- Date del corso di gruppo: ora c'e scritto "January". Quando decidi data e orario, cerca "January" in `index.html` e in `script.js`.
- Foto: `lucia-bubble.jpg` (hero), `lucia-portrait.jpg` (sezione About), `og.jpg` (anteprima social). Le vecchie `lucia-hero.jpg` e `lucia-square.jpg` non servono piu: puoi cancellarle dal repository.

## SEO
Gia fatto: titolo e descrizione, Open Graph, dati strutturati (attivita, corso, FAQ), sitemap, robots, canonical. `google60ce34d48c6ffaa9.html` e il file di verifica di Search Console: non cancellarlo.

## Area studenti e pannello di Lucia (opzionale)
Segui `GUIDA-AREA-STUDENTI.md`. Finche in `config.js` `url` e `key` sono vuoti, il sito pubblico nasconde tutto e funziona come prima.
Carica sempre **tutti** i file dello zip nella radice del repository.

## Altre guide
- `DOMINIO-GUIDA.md`: comprare e collegare un dominio tuo.
- `PIANO-TRANSIZIONE.md`: far crescere le lezioni fuori da Preply nel rispetto delle sue regole.
- `SEO-GUIDA.md`: farsi trovare, anche cercando "italian with lucia".
- `supabase-emails.sql`: email di avviso e promemoria (facoltativo).

## Google Business Profile
Guida e testi pronti: `GOOGLE-BUSINESS.md`. Immagini pronte nella cartella `immagini-google-business`.
Quando il profilo e attivo, incolla i link in `config.js` (`google: { profile: "...", review: "..." }`): compare il blocco "Find us on Google" nella sezione In Prague or online.
