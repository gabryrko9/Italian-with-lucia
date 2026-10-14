# Guida: comprare e collegare il dominio

Obiettivo: passare da `gabryrko9.github.io/Italian-with-lucia` a un indirizzo tuo, ad esempio **italianwithlucia.com**.

## 1. Perché serve
- Un indirizzo con il nome del marchio è il segnale più forte per Google quando qualcuno cerca "italian with lucia".
- Ispira più fiducia a chi lo vede su Google, sui social e nelle email.
- Il sito e il profilo Google Business restano coerenti. Cambiarlo dopo mesi fa perdere posizioni, quindi conviene farlo **subito**.
- Il vecchio indirizzo non si perde: GitHub lo reindirizza da solo al nuovo.

## 2. Dove comprarlo e quanto costa
Prezzi di un `.com`, in dollari, da un confronto verificato a marzo 2026 (domaindetails.com):
| Registrar | Primo anno | Rinnovo | Privacy dei dati |
|---|---|---|---|
| **Cloudflare Registrar** | $10.46 | $10.46 | gratis |
| Porkbun | $7.00 | $11.08 | gratis |
| Namecheap | $10.18 | $18.68 | gratis |
| GoDaddy | da $0.01 a $11.99 | $18.99-$25.00 | a pagamento ($9.99-$14.99 l'anno) |

**Consiglio: Cloudflare** (prezzo al costo, senza sorprese al rinnovo). Porkbun è la seconda scelta. Evita GoDaddy: il prezzo di rinnovo e la privacy a pagamento costano di più.
- **Gratis non esiste in modo serio.** Le estensioni o sottodomini gratuiti danno un indirizzo poco affidabile e spesso spariscono. Meglio spendere circa 10 € l'anno.
- `.it` costa in media circa 15 € l'anno (secondo domaindetails.com) e si può registrare solo se si è cittadini o residenti UE: Gabri può farlo come cittadino italiano. Per Praga e l'inglese un `.com` è più adatto; se vuoi, prendi anche il `.it` o il `.cz` e fai puntare tutto al `.com`. Non ho verificato il prezzo del `.cz`: controllalo sul sito del registrar.
- **Non ho potuto controllare se i nomi sono liberi** (dal mio ambiente non raggiungo i servizi di verifica). Cercali sul sito del registrar.
Nomi in ordine di preferenza: `italianwithlucia.com`, `italianwithlucia.cz`, `italianwithlucia.eu`, `italianlessonsprague.com` (parole chiave utili per Google), `luciaitaliano.com`.

## 3. Comprarlo (esempio con Cloudflare, 10 minuti)
1. Crea un account su cloudflare.com (con una email che userai a lungo, meglio quella di Gabri o una condivisa).
2. Menu **Domain Registration > Register Domains**, cerca il nome, **Purchase**. Paga con carta.
3. **Verifica che la privacy WHOIS sia attiva** (di solito lo è e gratis). Serve a non mostrare pubblicamente nome e indirizzo di casa di chi registra. Non scrivere mai l'indirizzo di Lucia nei dati pubblici.

## 4. Collegarlo a GitHub Pages
Valori ufficiali di GitHub (docs.github.com):
1. In Cloudflare, dominio > **DNS > Records**. Aggiungi:
   - 4 record **A** con nome `@` e questi indirizzi: `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
   - 1 record **CNAME** con nome `www` e valore `gabryrko9.github.io` (senza il nome del repository)
   - (facoltativo, IPv6) 4 record **AAAA** con nome `@`: `2606:50c0:8000::153`, `2606:50c0:8001::153`, `2606:50c0:8002::153`, `2606:50c0:8003::153`
   - Per ognuno imposta il proxy su **"DNS only"** (nuvola grigia), almeno finché GitHub non ha attivato HTTPS.
   Con Porkbun o Namecheap sono gli stessi record, nel loro pannello DNS.
2. GitHub, repository > **Settings > Pages > Custom domain**: scrivi il dominio (es. `italianwithlucia.com`) e **Save**. GitHub controlla il DNS (anche qualche ora).
3. Quando compare la casella **Enforce HTTPS**, spuntala (può servire fino a 24 ore).

## 5. Dimmi il dominio: aggiorno io tutto il sito
Appena hai il nome, scrivimelo. Io cambio indirizzo in tutte le pagine (canonical, anteprime social, dati strutturati, sitemap, robots, guide) e creo il file `CNAME`. Poi tu carichi lo zip nuovo su GitHub, come sempre.

## 6. Dopo il collegamento (checklist)
- [ ] **Search Console**: aggiungi la nuova proprietà (con Cloudflare la verifica via DNS è automatica), invia `sitemap.xml`, richiedi l'indicizzazione della home.
- [ ] **Google Business Profile**: cambia il sito web nel profilo con il nuovo indirizzo.
- [ ] **Supabase > Authentication > URL Configuration**: *Site URL* `https://TUODOMINIO/portal.html` e aggiungi i *Redirect URLs* `https://TUODOMINIO/portal.html` e `https://TUODOMINIO/admin.html`. **Senza questo, i link di accesso degli studenti non funzionano.**
- [ ] Se hai attivato le email (`supabase-emails.sql`): in Supabase, SQL Editor: `update public.email_config set site_url = 'https://TUODOMINIO/';`
- [ ] Profili social, firma email, biglietti: usa solo il nuovo indirizzo.
- [ ] Il vecchio indirizzo GitHub reindirizza da solo: non serve altro.

## 7. Email con il tuo dominio (facoltativo)
Con Cloudflare, **Email Routing** (gratuito) inoltra `lucia@TUODOMINIO` alla casella Gmail di Lucia. Per **scrivere** da quell'indirizzo con Gmail serve la funzione "Invia messaggio come", con un po' di configurazione: te la preparo se vuoi. Per le email automatiche del sito agli studenti (conferme e promemoria) il dominio va verificato in Resend: Resend ti dà i record DNS da aggiungere in Cloudflare; poi in Supabase: `update public.email_config set from_email = 'Italian with Lucia <hello@TUODOMINIO>', send_to_students = true;`
