# Guida: area studenti, pacchetti e pagamento con carta

Questa cartella **non viene pubblicata sul sito** (GitHub Pages salta le cartelle che iniziano con `_`).

Tempo totale: circa 1 ora, una volta sola. Costi fissi: 0 €. Stripe trattiene una piccola commissione su ogni pagamento (in UE circa 1,5% + 0,25 €; controlla le tariffe aggiornate su stripe.com/cz/pricing).

## Come funziona, in breve

- **Nuovo studente.** Prenota la prova gratuita su `book.html`. Il sito gli crea l'account in automatico.
- **Pacchetto.** Lo studente entra nell'area studenti (`portal.html`) con la sua email, senza password, e in **Buy lessons** sceglie 5, 10 o 20 lezioni. Paga con carta, Apple Pay o Google Pay su Stripe. Il pacchetto compare da solo nel suo account dopo pochi secondi.
- **Una lezione si scala dal pacchetto nel momento in cui viene fissata**, sia che la fissi lo studente sia che la fissi Lucia.
- **Chi fissa la lezione dipende dalla fascia oraria.** In **My hours** ogni fascia ha un'icona:
  - 👥 lo studente può prenotare da solo;
  - 🔒 solo Lucia: lo studente non la vede, Lucia ci fissa le lezioni dalla scheda dello studente.

  Toccando l'icona si cambia. Il pacchetto viene scelto da solo (il più vecchio con lezioni rimaste) e si può cambiare a mano.
- **Spostare o cancellare** si può fino a 24 ore prima. Una lezione cancellata in tempo torna disponibile nel pacchetto. Dopo le 24 ore conta come fatta.
- **Pagamenti senza carta** (Revolut, bonifico): funzionano come prima. Lucia aggiunge il pacchetto a mano dalla scheda dello studente.

---

## Parte 1 · Supabase (il database)

### 1. Crea il progetto
1. Vai su https://supabase.com, clicca "Start your project" e registrati (puoi usare l'account Google di Lucia).
2. "New project". Nome: `italian-with-lucia`. Scegli una password per il database e salvala. **Region: Frankfurt** (UE, per la privacy).
3. Aspetta 1–2 minuti che il progetto sia pronto.

### 2. Crea tabelle e regole
Vai in **SQL Editor > New query** ed esegui, **in quest'ordine**, il contenuto di questi file (copia tutto, incolla, **Run**: deve dire "Success"):
1. `1-setup.sql` (studenti, lezioni, pacchetti, orari, prova gratuita)
2. `2-pacchetti-e-pagamenti.sql` (fasce "solo Lucia", pacchetti in vendita, pagamenti Stripe)

Ogni file si esegue **una volta sola**.

Prezzi in vendita: 5 lezioni 150 €, 10 lezioni 270 €, 20 lezioni 500 €. Per cambiarli: **Table Editor > package_plans**, modifica `price_eur`. Per nascondere un pacchetto: `active` = false.

### 3. Accesso con link via email
**Authentication > URL Configuration**
- Site URL: `https://italianwithlucia.com/portal.html`
- Redirect URLs, aggiungi: `https://italianwithlucia.com/portal.html` e `https://italianwithlucia.com/admin.html`

**Authentication > Emails > SMTP Settings**: collega un servizio di invio (Resend o Brevo, gratis). Senza, Supabase manda pochissime email e gli studenti potrebbero non ricevere il link per entrare.

### 4. Collega il sito
1. **Project Settings > API**: copia **Project URL** e la chiave **anon public**. È pubblica per natura: la sicurezza sta nelle regole del database. **Mai** usare la chiave `service_role` nel sito.
2. Mandami i due valori: li metto io in `config.js`. Oppure modificalo tu su GitHub:
   ```js
   url: "https://xxxx.supabase.co",
   key: "eyJ...",
   ```
Da quel momento i bottoni "Free trial" aprono la prenotazione online e l'area studenti si attiva.

### 5. Prova
1. Apri `admin.html`, entra con `lucia.scollo2000@gmail.com` e controlla **My hours**.
2. In una finestra anonima prenota una prova su `book.html` con una tua email.
3. Aggiungi a mano un pacchetto a te stesso, entra da `portal.html` e prova a prenotare, spostare e cancellare.
4. Cancella lo studente di prova.

---

## Parte 2 · Stripe (pagamento con carta)

### 6. Crea l'account Stripe
1. Vai su https://stripe.com e registrati con i dati di Lucia: persona fisica / OSVČ in Repubblica Ceca, IČO, conto bancario (lo stesso della fattura).
2. Completa la verifica dell'identità richiesta da Stripe.
3. In **Settings > Business > Public details** metti "Italian with Lucia" e il sito. Questo nome compare sull'estratto conto dello studente.
4. In **Settings > Emails** attiva **Successful payments**: lo studente riceve la ricevuta da Stripe.

Fai prima tutto in **modalità test** (interruttore "Test mode" in alto). Si passa al reale solo alla fine, al punto 10.

### 7. Carica le due funzioni server su Supabase
In Supabase, **Edge Functions > Deploy a new function > Via Editor**:
1. Nome `create-checkout`: incolla il contenuto di `functions/create-checkout/index.ts` e premi **Deploy**. Lascia attivo **Verify JWT**.
2. Nome `stripe-webhook`: incolla `functions/stripe-webhook/index.ts` e premi **Deploy**. Poi, nelle impostazioni della funzione, **disattiva Verify JWT**: Stripe non ha un login Supabase.

### 8. Collega Stripe a Supabase
1. In Stripe: **Developers > API keys** e copia la **Secret key** (inizia con `sk_test_…` in test).
2. In Stripe: **Developers > Webhooks > Add endpoint**.
   - URL: `https://xxxx.supabase.co/functions/v1/stripe-webhook` (con il tuo Project URL al posto di xxxx)
   - Eventi: `checkout.session.completed` e `checkout.session.async_payment_succeeded`
   - Dopo averlo creato copia il **Signing secret** (inizia con `whsec_…`).
3. In Supabase: **Edge Functions > Secrets**, aggiungi:
   - `STRIPE_SECRET_KEY` = la chiave `sk_…`
   - `STRIPE_WEBHOOK_SECRET` = il `whsec_…`

Le chiavi restano solo in Supabase e Stripe: **non vanno mai sul sito né mandate in chat.**

### 9. Accendi i pagamenti sul sito
In `config.js` metti `payments: true` (o chiedimelo). Nell'area studenti compare **Buy lessons**.

### 10. Prova e passa al reale
1. Entra in `portal.html` come studente di prova, scegli un pacchetto e paga con la carta di test `4242 4242 4242 4242` (qualsiasi data futura e CVC).
2. Tornato sul sito, dopo pochi secondi il pacchetto compare. In `admin.html` risulta **Paid online**.
3. Se funziona, in Stripe disattiva il Test mode. Rifai i punti 8.1–8.3 con la chiave **live** (`sk_live_…`) e un **nuovo** webhook live, poi aggiorna i due secrets in Supabase.

---

## Domande frequenti

**Lo studente ha pagato ma il pacchetto non compare.**
In Stripe vai in **Developers > Webhooks > il tuo endpoint** e guarda l'ultimo evento. Se è in errore, Stripe ritenta da solo per 3 giorni. Il pacchetto non viene mai creato due volte. Nel frattempo Lucia può aggiungerlo a mano.

**Fattura.**
Stripe manda la ricevuta. Se serve la fattura ceca, Lucia la emette da Fakturoid come oggi; più avanti si può collegare in automatico.

**Studenti Preply.**
Restano su Preply: questo sistema è solo per gli studenti diretti di Lucia.

**Rimborsi.**
Da Stripe: **Payments > il pagamento > Refund**. Poi Lucia cancella o riduce il pacchetto dalla scheda dello studente.

**Piano gratuito Supabase.**
Il progetto va in pausa dopo 7 giorni senza visite. Con il sito attivo non succede; se capita, si riattiva con un clic dalla dashboard.
