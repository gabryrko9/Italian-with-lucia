# Piano: far crescere le lezioni di Lucia fuori da Preply

Per Gabri e Lucia. Non è una consulenza legale: dove serve, ho indicato cosa far verificare.

## 0. In breve
1. **Il sito ora può gestire da solo tutto quello che oggi fa Preply**: orari di Lucia, prenotazione della prova gratuita senza account, studenti che prenotano e spostano le lezioni, crediti dei pacchetti, regola delle 24 ore, calendario, promemoria (opzionali).
2. **Però gli studenti che Lucia ha conosciuto su Preply non si possono semplicemente portare sul sito mentre lei è ancora su Preply.** Le condizioni di Preply lo vietano esplicitamente e le conseguenze sono pesanti (sotto). Non ti preparo uno script per "convertirli" di nascosto: rischierebbe l'account e i soldi fermi su Preply.
3. La strada sicura è a **due binari**: il sito porta studenti **nuovi** (che Lucia non ha conosciuto su Preply), Preply resta com'è per quelli di Preply. Quando il sito regge da solo, Lucia decide **se e come** uscire da Preply, dopo aver chiesto a Preply per iscritto cosa è permesso.

## 1. Cosa dice Preply (versione che ho letto: Terms of Service del 25 novembre 2025 e User Code of Conduct)
Rileggetele voi nella versione aggiornata: termsofuse.preply.com
- **Terms §3.4 (f)**, per i tutor: non fornire lezioni agli studenti fuori dalla piattaforma; non ricevere pagamenti direttamente dagli studenti; non incoraggiare né sollecitare pagamenti fuori dai canali Preply.
- **Terms §27**: il servizio non si può usare per promuovere altre attività, siti o servizi, né per contattare gli utenti a questo scopo.
- **Code of Conduct, punto 1**: vietato fornire o accettare lezioni da utenti Preply "bypassando la piattaforma".
- **Terms §14**: Preply può chiudere un tutor "immediatamente" per violazione, e può **trattenere i fondi rimasti sull'account come penale (liquidated damages)**. In caso di chiusura per violazione, gli studenti **non ricevono rimborso né compensazione** per le lezioni pagate e non svolte (sempre §14): perderebbero soldi anche loro.
- Nei testi che ho letto **non ho trovato** un periodo di blocco dopo la chiusura dell'account né una "tassa di uscita". Non vuol dire che non esistano: va chiesto (sezione 6).
- Commissione di Preply (help.preply.com): sulla **lezione di prova il 100%**; poi dal 33% (nuovi tutor) fino al 18% per chi ha molte ore.

## 2. Cosa NON fare finché Lucia è su Preply
- Non scrivere il sito, l'email o il numero di telefono nel profilo, nei messaggi o nelle lezioni con studenti di Preply.
- Non proporre lezioni, pacchetti o il corso di gruppo agli studenti di Preply.
- Non farsi pagare fuori da Preply da persone conosciute lì.
- Non usare i dati dei suoi studenti Preply (nomi, email) per inserirli nel pannello del sito.

## 3. Il piano a tre binari

### Binario A: crescere fuori da Preply (da subito, nessun rischio)
Tutti i nuovi studenti vengono da Google, Maps, passaparola, gruppi di expat, social, aziende, amici. Per loro il sito fa tutto:
1. Prova gratuita di 30 minuti prenotata da soli su `book.html`.
2. Dopo la prova Lucia aggiunge il pacchetto nel pannello (dopo il pagamento) e lo studente prenota le lezioni da solo.
3. Il corso di gruppo di gennaio si vende solo qui (pubblico esterno).
Obiettivi suggeriti, da confermare tra voi: **3 prove a settimana** dopo il primo mese; **conversione prova → pacchetto** almeno 50%.

### Binario B: Preply resta com'è (per chi arriva da Preply)
Lucia continua a insegnare e a farsi pagare tramite Preply a chi è lì. Preply resta una fonte di studenti e di recensioni. Va benissimo tenere alta la qualità e la disponibilità: la reputazione conta in entrambi i canali. Non serve cambiare niente.

### Binario C: uscita pianificata (decisione di Lucia, non urgente)
Si valuta solo quando il binario A porta abbastanza ore per rimpiazzare la parte di Preply che Lucia vuole lasciare. Ordine consigliato:
1. **Chiedere a Preply per iscritto** (testo in sezione 6) cosa succede dopo la chiusura e se può insegnare a studenti che la contattano di loro iniziativa dopo.
2. Parlare con il **commercialista** (P.IVA, fatture a studenti di vari paesi, IVA sui servizi online).
3. **Smettere di prendere nuovi studenti su Preply** (disponibilità ridotta), senza abbandonare nessuno: chi ha lezioni già pagate le finisce su Preply.
4. **Incassare il saldo** e chiudere l'account in modo ordinato, non per violazione, così non scatta la ritenzione dei fondi (verificare con la risposta di Preply).
5. Solo dopo, e secondo quello che Preply ha risposto, Lucia può dire agli ex studenti dove insegna.
Se Preply risponde che non è possibile insegnare a ex studenti, la decisione diventa economica: vale la pena lasciare quel gruppo per tutta la crescita del sito?

## 4. Cosa fa il sito al posto di Preply
| Preply | Sito di Lucia | Stato |
|---|---|---|
| Calendario e orari | "My hours" nel pannello: finestre settimanali, giorni di ferie, pausa tra lezioni, preavviso minimo, fino a quanti giorni in avanti | Pronto (serve Supabase) |
| Prova gratuita | `book.html`: scelta di giorno e ora, nessun account, conferma subito, file calendario | Pronto |
| Prenotare/spostare lezioni | Area studenti: "Book a lesson", "Move", "Cancel" fino a 24 ore prima | Pronto |
| Pacchetti e crediti | Pacchetti, crediti rimasti, pallini di avanzamento | Pronto |
| Orario nel fuso dello studente | Gli orari si mostrano nel fuso del dispositivo | Pronto |
| Promemoria e conferme email | `supabase-emails.sql` (Resend): avviso a Lucia subito, promemoria 24 ore prima agli studenti dopo aver verificato il dominio | Opzionale, pronto |
| Videolezione | Link Google Meet o Zoom di Lucia, mandato per email | Da decidere |
| Pagamenti | Revolut o bonifico, come ora sul sito | Pronto. Pagamento con carta online: possibile in un secondo momento |
| Recensioni | Recensioni Google (link già nel sito) | Da raccogliere |
| Fatture | Lucia, come per le altre attività | Commercialista |
| Messaggi | Email | Pronto |

## 5. Calendario dei primi 90 giorni
**Settimana 1: mettere in piedi**
- Comprare il dominio (guida `DOMINIO-GUIDA.md`), collegarlo, caricare il sito.
- Creare Supabase, incollare url e key in `config.js`, eseguire `supabase-setup.sql` (guida `GUIDA-AREA-STUDENTI.md`).
- Impostare gli orari in "My hours", fare una prova di prenotazione come se fossi un cliente.
- Verificare il profilo Google Business e aggiornare il sito web con il nuovo dominio.
**Settimane 2-4: farsi trovare**
- Link nei profili social, gruppi di expat a Praga, firma email, amici e conoscenti non di Preply.
- Chiedere le prime 5 recensioni Google a persone che Lucia ha conosciuto **fuori da Preply**.
- Controllare Search Console dopo 2 settimane.
**Mesi 2-3: misurare e decidere**
- Contare ogni settimana: prove prenotate, prove fatte, pacchetti venduti, ore a settimana dal sito.
- Preparare il corso di gruppo di gennaio con le iscrizioni dal sito.
- A fine mese 3: guardare i numeri e decidere se preparare il binario C (sezione 3).

## 6. Domanda da mandare a Preply (in inglese, dal supporto tutor)
> Hello, I am a tutor on Preply and I am also building my own independent teaching business for new students I meet outside Preply. I want to follow your rules exactly, so I have two questions.
> 1) If I close my tutor account in good standing, am I allowed to teach, and be paid directly by, students I previously met on Preply who contact me on their own initiative afterwards? Is there any waiting period, fee or restriction?
> 2) Until I close my account, is there anything in my own independent marketing (a personal website, social media) that I must avoid because I am a Preply tutor?
> Please answer in writing so I can keep your reply. Thank you.

Conservate la risposta. Se è ambigua, fate valere il testo più restrittivo.

## 7. Altre cose da sistemare
- **Le 29 recensioni sul sito** sono state scritte dagli studenti su Preply. Riusarle altrove può avere regole di Preply sui contenuti; controlla nei termini di Preply cosa dicono sui contenuti degli utenti e, se hai dubbi, includi la domanda nel messaggio della sezione 6. Nel tempo sostituiscile con recensioni Google e testimonianze nuove, con il consenso di chi le scrive (anche solo una email).
- **Privacy**: c'è la pagina `privacy.html`. Rivederla con un consulente prima del lancio. Il database Supabase va creato in una regione UE.
- **Prezzi**: sul sito Lucia incassa tutto; su Preply paga la commissione. Con la stessa tariffa oraria, la differenza va a lei. Per decidere se abbassare il prezzo sul sito, usa questa formula: *guadagno netto Preply = prezzo × (1 − commissione)*. Il sito costa circa 10-12 € l'anno (dominio) più eventuali piani a pagamento di Supabase o Resend, se un giorno servissero.
