# Google Business Profile: guida con testi pronti

Il sito e gia ottimizzato per la ricerca locale (dati strutturati "attivita con area di servizio" a Praga, FAQ locali, zona servita coerente). Qui sotto: cosa mettere nel profilo Google, da copiare.

**Regola d'oro:** nome, zona e email devono essere identici ovunque (sito, Google, social). L'indirizzo di casa (Vinohradska) **non va mai inserito come indirizzo visibile**.

## 1. Creazione del profilo
1. Vai su https://business.google.com con l'account Google di Lucia, "Aggiungi la tua attivita".
2. **Nome**: `Italian with Lucia` (solo il nome, senza parole aggiunte come "Praga" o "lezioni": Google puo sospendere i profili con nomi "stuffati").
3. **Categoria principale**: `Language teacher` (Insegnante di lingue). **Secondarie**: `Tutoring service` (Servizio di ripetizioni), `Language school` solo se Google la propone.
4. Quando chiede se hai un luogo dove ricevi clienti: **No**. Scegli "Servizio a domicilio / area di servizio" e imposta come area **Praga** (e se vuoi Praga 1, 2, 3).
5. Seleziona **Nascondi il mio indirizzo**. L'indirizzo serve solo alla verifica e non sara pubblico.
6. **Sito web**: `https://italianwithlucia.com/` (per misurare le visite da Google aggiungi `?utm_source=google&utm_medium=organic&utm_campaign=profilo`).
7. **Email e telefono**: usa l'email del sito. Il telefono e facoltativo; se lo metti, deve essere uno che Lucia vuole rendere pubblico.
8. **Verifica**: di solito con un breve video (mostra la zona/insegna di lavoro, il materiale didattico, un documento che collega l'attivita, es. P.IVA). Non serve mostrare i vicini.

## 2. Descrizione (max 750 caratteri, gia pronta)
> Italian with Lucia offers private Italian lessons and small group courses for English speakers, online worldwide and in person in Prague 1, 2 and 3. Lucia holds a Master's degree in teaching Italian and has more than 1,000 hours of teaching experience. Lessons are built around your level and goals: clear grammar, natural conversation and precise pronunciation. Start with a free 30-minute trial lesson, then choose a package of 5, 10 or 20 lessons. Group courses (3 to 5 students, beginner, intermediate and advanced) start in January. Write to lucia.scollo2000@gmail.com to book your free trial.

## 3. Servizi (sezione "Servizi", con prezzi)
| Servizio | Prezzo | Descrizione |
|---|---|---|
| Free trial lesson | Gratis | 30 minutes to meet Lucia, set your goals and try a lesson. Online or in Prague. |
| Private lessons, 5-lesson package | 150 EUR | Five 60-minute one-to-one lessons (30 EUR each). Online or in Prague. |
| Private lessons, 10-lesson package | 270 EUR | Ten 60-minute lessons (27 EUR each), built around your level and goals. |
| Private lessons, 20-lesson package | 500 EUR | Twenty 60-minute lessons (25 EUR each), best value for steady progress. |
| Group course (from January) | 216 EUR | 12 weekly online lessons, 3 to 5 students, 18 EUR per person per lesson. |

## 4. Orari
Metti gli orari in cui Lucia **risponde e insegna davvero** (anche solo fasce). Se varia molto, scegli "Su appuntamento".

## 5. Attributi
"Online appointments" / "Appuntamenti online" attivo; "Lingue parlate": English, Italian (e le altre che Lucia parla).

## 6. Immagini (cartella `immagini-google-business`)
- `1-logo-720x720.png` > **Logo**
- `2-copertina-1080x608.jpg` > **Foto di copertina**
- `3-foto-lucia-1080x1080.jpg` > **Foto del team / "Identita"** (la foto reale piace molto a Google)
- `4`, `5`, `6`, `7` > **Post** (uno a settimana, vedi sotto)
Aggiungi nel tempo 5-10 foto **vere**: Lucia che insegna online (schermata con consenso degli studenti), il libro di testo, materiali, un caffe dove incontra gli studenti. Le foto vere valgono piu di quelle grafiche.

## 7. Domande e risposte (puoi scriverle tu stessa e rispondere)
- **Do you teach online?** Yes. Most lessons are online, from anywhere in the world. In-person lessons are in Prague 1, 2 and 3.
- **How do I book the free trial?** Send an email to lucia.scollo2000@gmail.com with your level and goals. Lucia replies within 24 hours.
- **Can I cancel a lesson?** Yes, up to 24 hours before it starts. After that the lesson counts as taken.
- **Do I need a coursebook?** Lessons follow the Nuovo Espresso series. Wait for the free trial, Lucia tells you which level to buy.

## 8. Post settimanali (testi pronti, abbina l'immagine)
1. Immagine 4: *"Try a free 30-minute Italian lesson with Lucia. Tell her your goals and hear how a lesson works. Write to lucia.scollo2000@gmail.com."* (pulsante: Prenota/Learn more)
2. Immagine 6: *"Private Italian lessons, one to one, online or in Prague. Packages of 5, 10 or 20 lessons."* (Learn more)
3. Immagine 5: *"Our January group course is open for bookings: 12 weekly online lessons, groups of 3 to 5, beginner, intermediate and advanced. Reserve your place."* (Learn more)
4. Immagine 7: *"Thank you to all our students. 'Genuinely the best tutor you'll ever find!!!' (Anna)."* (Learn more)
Poi ricomincia, con consigli brevi (es. "3 errori comuni in italiano") per restare attivi.

## 9. Recensioni (la cosa che pesa di piu)
- Nel profilo: **Ottieni piu recensioni** > copia il link breve e mandalo agli studenti dopo una lezione, con questo testo:
  > Hi [name], I'm so happy you're learning Italian with me! If you have 1 minute, a Google review helps other students find me: [link]. Grazie mille!
- Incolla lo stesso link in `config.js` (campo `google.review`): compare un pulsante "Leave a Google review" sul sito.
- Rispondi a **ogni** recensione entro pochi giorni. **Mai** comprare o scrivere recensioni false: Google le rimuove e puo sospendere il profilo.
- Le recensioni di altre piattaforme non si possono importare su Google: devono scriverle gli studenti sul profilo Google.

## 10. Dopo l'attivazione
1. Apri il profilo su Google Maps, premi **Condividi > Copia link** e incollalo in `config.js` (`google.profile`). Poi ricarica `config.js` su GitHub.
2. In Search Console il sito e gia verificato. Controlla "Rendimento" dopo qualche settimana.
3. Se in futuro prendete un dominio (es. italianwithlucia.com), aggiorna il sito nel profilo e dimmelo: cambio gli indirizzi in tutto il sito.
