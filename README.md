# Italian with Lucia

Sito statico per GitHub Pages: nessuna build, nessuna cartella. Carica TUTTI i file insieme nella radice del repository (Add file > Upload files > Commit changes). I file con lo stesso nome vengono sovrascritti.

## Come si prenota
Chi vuole la prova gratuita scrive a Lucia: tutti i pulsanti aprono una email precompilata a lucia.scollo2000@gmail.com. Chi non ha un programma di posta puo copiare l'indirizzo o scrivere da Gmail (in fondo alla pagina). Nessuna configurazione necessaria.

## Prenotare le lezioni con Google Calendar (da fare una volta)
La prova gratuita resta via email. Per le lezioni successive gli studenti scelgono l'orario nel calendario di Lucia:
1. Lucia apre Google Calendar dal computer (non dall'app) > Crea > Programma di appuntamenti.
2. Durata 60 minuti, disponibilita settimanali, e nelle impostazioni attiva conferme e promemoria per gli ospiti. Nel modulo di prenotazione aggiungi la domanda "Livello" e, se vuoi, la verifica email.
3. Salva, poi Condividi e copia il link della pagina di prenotazione.
4. Apri `config.js` su GitHub (matita) e incolla il link tra le virgolette di `booking: ""`. Commit changes.
Finche il link e vuoto, il pulsante "Already taking lessons?" apre una email a Lucia.
Chi prenota riceve email di conferma e promemoria; Lucia vede tutte le prenotazioni nel suo calendario. Google Calendar non permette di far rispettare la regola delle 24 ore: la cancellazione si chiede a Lucia per email.

## Regola di cancellazione
Le lezioni si cancellano scrivendo a Lucia fino a 24 ore prima dell'inizio; dopo, non si cancellano e contano come svolte. Il testo e in `index.html`: cerca "24 hours" (riquadro sotto i pacchetti, nota nel corso di gruppo, passi, domande frequenti, piede della pagina e dati strutturati).

## Dove si modificano le cose
- Prezzi: in `index.html` cerca `data-eur="..."` (numero in EUR; CZK e USD si calcolano da soli). Cambia anche i prezzi nel blocco JSON-LD in cima, per la SEO.
  Ora: 5 lezioni a 30 EUR, 10 a 27 EUR, 20 a 25 EUR; corso di gruppo 16 EUR a lezione (192 EUR).
- Cambio EUR/CZK/USD: in `script.js`, oggetto `CURRENCIES`.
- Date del corso di gruppo: ora c'e scritto "January". Quando decidi data e orario, cerca "January" in `index.html` e in `script.js`.
- Foto: `lucia-bubble.jpg` (hero), `lucia-portrait.jpg` (sezione About), `og.jpg` (anteprima social). Le vecchie `lucia-hero.jpg` e `lucia-square.jpg` non servono piu: puoi cancellarle dal repository.

## SEO
Gia fatto: titolo e descrizione, Open Graph, dati strutturati (attivita, corso, FAQ), sitemap, robots, canonical. `google60ce34d48c6ffaa9.html` e il file di verifica di Search Console: non cancellarlo.

## Area studenti e pannello di Lucia (opzionale)
Segui `GUIDA-AREA-STUDENTI.md`. Finche in `config.js` `url` e `key` sono vuoti, il sito pubblico nasconde tutto e funziona come prima.
File nuovi da caricare nella root del repo: `config.js`, `common.js`, `app.css`, `portal.html`, `portal.js`, `admin.html`, `admin.js` (oltre a `index.html`, `script.js`, `style.css` aggiornati).
