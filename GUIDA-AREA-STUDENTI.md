# Guida: attivare prenotazioni, area studenti e pannello di Lucia

Tempo: circa 40 minuti, una sola volta. Costo: 0 EUR (piano gratuito Supabase). Le email automatiche sono facoltative (sezione 6).

## Come funziona
- **Chi non è ancora studente** va su `book.html`, sceglie un orario libero della prova gratuita (30 minuti), scrive nome, email e livello: la prova è confermata subito. Non serve account.
- **Studenti**: vanno su `portal.html`, scrivono la loro email, ricevono un link e entrano (niente password). Vedono lezioni, pacchetto e compiti. Possono **prenotare** una lezione (se hanno crediti), **spostarla** o **cancellarla** fino a 24 ore prima. Le regole sono controllate dal database, non solo dalla pagina.
- **Lucia**: va su `admin.html`, entra con `lucia.scollo2000@gmail.com`. Vede tutte le prenotazioni (le nuove dal sito in evidenza), gestisce studenti, pacchetti e lezioni, e imposta i suoi orari in **My hours**.
- Percorso di un nuovo studente: prova gratuita prenotata sul sito → dopo la prova e il pagamento Lucia aggiunge un pacchetto nel pannello → lo studente entra con la stessa email e prenota le lezioni da solo.

## 1. Crea il progetto
1. Vai su https://supabase.com, "Start your project", registrati.
2. "New project". Nome: `italian-with-lucia`. Password del database (salvala). **Region: una regione UE** (Frankfurt o Ireland), per la privacy.
3. Attendi 1-2 minuti.

## 2. Crea le tabelle e le regole
1. **SQL Editor** > New query.
2. Apri `supabase-setup.sql`, copia tutto, incolla, **Run**. Deve dire "Success". Contiene anche le prenotazioni (orari, ferie, regole, prova gratuita).
3. Lucia è già amministratrice. Per aggiungere un'altra persona: `insert into public.admins (email) values ('nome@example.com');`
Se avevi già eseguito la versione precedente del file, **non rieseguirlo**: dimmelo e ti do solo la parte nuova.

## 3. Impostazioni di accesso
**Authentication > URL Configuration**
- Site URL: `https://italianwithlucia.com/portal.html`
- Redirect URLs, aggiungi: `https://italianwithlucia.com/portal.html` e `https://italianwithlucia.com/admin.html`. **Senza questo i link di accesso non funzionano.**

**Authentication > Providers > Email**: lascia attivo "Email" (link magico). Non disattivare "Allow new users to sign up".

**Email di accesso**: il servizio di prova di Supabase manda pochissime email. Configura un SMTP tuo in **Authentication > Emails > SMTP Settings** (Brevo o Resend, entrambi con piano gratuito). Senza SMTP gli studenti potrebbero non ricevere il link.

## 4. Collega il sito
1. **Project Settings > API**: copia **Project URL** e la chiave **anon public** (pubblica per natura; la sicurezza sta nelle regole del database. MAI la chiave `service_role`).
2. In `config.js`:
   ```js
   window.PORTAL = { url: "https://xxxx.supabase.co", key: "eyJ...", booking: "", google: {...} };
   ```
3. Carica nella radice del repository GitHub **tutti** i file dello zip.
Appena `url` e `key` sono compilati, **tutti i pulsanti "Free trial" del sito aprono `book.html`** (prenotazione online) invece della email, e "Choose your next lesson" porta all'area studenti. Con `url` e `key` vuoti il sito funziona come prima, con le email.

## 5. Imposta i tuoi orari e prova tutto
1. `admin.html` > **My hours**. Ci sono già: lunedì-giovedì 9-12 e 14-19, venerdì 9-12 (ora di Praga). Cambiali come vuoi: finestre per giorno, solo online o solo Praga, giorni di ferie, preavviso minimo (12 ore), quanti giorni in avanti (42), pausa tra lezioni (15 minuti), durata lezione (60) e prova (30).
2. Apri `book.html` in una finestra privata e prenota una prova con una tua email. Controlla che compaia in **Overview > Booked online**.
3. Aggiungi tu stesso un pacchetto (Students > il tuo nome > Add a package), poi entra da `portal.html` con la stessa email: prova **Book a lesson**, **Move**, **Cancel**.
4. Cancella lo studente di prova (Details > Delete student).
5. Se qualcosa non va, scrivimi l'errore.

## 6. Email automatiche (facoltative, consigliate)
Senza email Lucia vede le nuove prenotazioni solo aprendo il pannello. Con `supabase-emails.sql`:
- **Lucia riceve subito una email** per ogni prova o lezione prenotata sul sito (con nome, email, livello, obiettivo, fuso orario).
- Dopo aver verificato il dominio, gli **studenti ricevono conferma e promemoria 24 ore prima**.
Passi: crea un account gratuito su resend.com > **API Keys** > crea una chiave. Apri `supabase-emails.sql`, sostituisci `PASTE_YOUR_RESEND_KEY_HERE` con la chiave, esegui il file nell'SQL Editor. Se vuoi i promemoria, in Supabase attiva **Database > Extensions > pg_cron** e riesegui l'ultimo blocco del file. Subito Resend consegna solo all'email con cui hai aperto l'account: per ora basta per gli avvisi a Lucia. Per le email agli studenti verifica il dominio (vedi `DOMINIO-GUIDA.md`, punto 7).
Se l'invio fallisce, le prenotazioni funzionano comunque.

## Uso quotidiano per Lucia
- **Overview**: nuove prenotazioni dal sito, lezioni dei prossimi 30 giorni, "To close" (lezioni avvenute da segnare **Done**, **Missed** o **Cancelled**), avvisi su crediti e pagamenti.
- **Nuova lezione a mano**: nello studente > Add lessons (con ripetizione settimanale).
- **Compiti**: nel campo Notes della lezione, lo studente li legge.
- **Link della videolezione**: va mandato per email prima della lezione (o scrivilo in Notes).
- Le lezioni che aggiungi a mano bloccano da sole quell'orario per le prenotazioni online. Per un impegno personale usa **My hours > Days off** (giorni interi) oppure togli la finestra di quel giorno.
- Gli orari si mostrano nel fuso del dispositivo di chi guarda; "My hours" è sempre ora di Praga.

## Regole che il database fa rispettare
- Una lezione si prenota solo in un orario libero dentro i tuoi orari, con il preavviso minimo, e mai sopra un'altra lezione (pausa inclusa).
- Si prenota solo con crediti: la lezione consuma il primo pacchetto con crediti.
- Spostare o cancellare: fino a 24 ore prima. Dopo, si scrive a Lucia.
- Un indirizzo email può prenotare una sola prova (una prova cancellata non conta).
- Limite anti-spam: massimo 6 prove prenotate ogni ora (cambiabile in My hours).

## Privacy (GDPR)
- Si salvano: nome, email, livello, obiettivo, fuso orario, lezioni, pacchetti, note. Informativa pronta in `privacy.html`: fatela rivedere da un consulente.
- Cancellare uno studente (Details > Delete student) elimina anche pacchetti e lezioni.
- Non è consulenza legale.

## Limiti del piano gratuito
- Il progetto gratuito viene **messo in pausa dopo 7 giorni senza attività**: le prenotazioni dal sito smetterebbero di funzionare. Le visite e le prenotazioni normali contano come attività, ma se il sito è fermo apri il pannello una volta a settimana, o riattiva da dashboard con un clic. Se diventa un'attività vera, il piano a pagamento di Supabase toglie il problema.
- 500 MB di dati: più che sufficienti.
- Backup ogni tanto: Supabase > Table Editor > Export CSV.
