# Soluzione “Startup / MVP” per Recupero Schede Tecniche Farmaci tramite AIC

Questa architettura descrive una soluzione minimale ed efficiente per integrare fogli illustrativi (FI) e schede tecniche (RCP) dei medicinali all’interno di un’applicazione, utilizzando il codice AIC come identificativo principale.

L’obiettivo è evitare la gestione di un database farmaceutico complesso e mantenere l’infrastruttura semplice, leggera e facilmente scalabile.

---

# Obiettivi della soluzione

La soluzione MVP consente di:

- acquisire il codice AIC tramite scansione del bollino farmaceutico o Data Matrix;
- interrogare dinamicamente fonti ufficiali esterne;
- recuperare fogli illustrativi e RCP aggiornati;
- ridurre al minimo i dati memorizzati localmente;
- evitare la manutenzione di un database farmaceutico completo.

---

# Architettura generale

```text
Utente scansiona confezione
             │
             ▼
      Estrazione codice AIC
             │
             ▼
      Query verso AIFA
             │
             ▼
 Recupero metadati farmaco
             │
             ├── Foglio Illustrativo (FI)
             ├── RCP
             └── Dati confezione
             │
             ▼
      Caching locale 24h
             │
             ▼
 Visualizzazione nell'app
```

---

# 1. Scansione del codice AIC

L’app utilizza:

- scanner Code39 per i vecchi bollini italiani;
- Data Matrix GS1 per le confezioni europee di nuova generazione.

Dalla scansione viene estratto il codice AIC:

```json
{
  "aic": "034811013"
}
```

Il codice AIC rappresenta la chiave primaria per tutte le operazioni successive.

---

# 2. Query live verso AIFA

Una volta ottenuto l’AIC, il backend esegue una richiesta verso la banca dati ufficiale AIFA.

Fonte ufficiale:

- [AIFA Medicinali – Banca Dati Farmaci](https://medicinali.aifa.gov.it/?utm_source=chatgpt.com)

La banca dati AIFA consente la ricerca tramite:

- AIC,
- nome farmaco,
- principio attivo,
- azienda farmaceutica.

---

# 3. Recupero delle informazioni

Dalla risposta vengono estratti:

- azienda titolare AIC;
- stato commercializzazione;
- PDF Foglio Illustrativo;
- PDF RCP.

Esempio di payload normalizzato:

```json
{
  "aic": "034811013",
  "drug_name": "Tachipirina 1000 mg",
  "active_ingredient": "Paracetamolo",
  "leaflet_url": "https://...",
  "rcp_url": "https://..."
}
```

---

# 4. Caching locale 20h

Per evitare richieste ripetute verso AIFA, il sistema salva localmente una cache temporanea.

## Dati memorizzati

```json
{
  "aic": "034811013",
  "cached_at": "2026-06-02T12:00:00Z",
  "expires_at": "2026-06-03T12:00:00Z"
}
```

## Durata cache consigliata

- 20 ore

Questo approccio:

- riduce latenza;
- diminuisce traffico di rete;
- limita il carico verso servizi esterni;
- mantiene dati sufficientemente aggiornati.

---

# 5. Metadata minimi salvati

La soluzione MVP evita di memorizzare:

- PDF completi;
- fogli illustrativi integrali;
- RCP completi;
- archivi documentali.

Nel database locale vengono salvati soltanto:

| Campo            | Descrizione                 |
| ---------------- | --------------------------- |
| AIC              | Identificativo farmaco      |
| Nome farmaco     | Nome commerciale            |
| Principio attivo | Sostanza attiva             |
| Timestamp cache  | Data ultimo aggiornamento   |
| URL documenti    | Link ai documenti ufficiali |

---

# Vantaggi della soluzione MVP

## Infrastruttura semplice

Non è necessario mantenere:

- database farmaceutici complessi;
- sistemi di aggiornamento massivi;
- sincronizzazioni giornaliere.

---

## Dati sempre aggiornati

I documenti vengono recuperati dinamicamente dalla fonte ufficiale AIFA.

---

## Riduzione spazio storage

L’applicazione non salva PDF o documentazione completa.

---

## Scalabilità immediata

La soluzione è adatta a:

- MVP;
- startup;
- prototipi;
- applicazioni mobile leggere.

---

# Limiti della soluzione

## Dipendenza da servizi esterni

L’app dipende dalla disponibilità:

- del portale AIFA;
- delle URL dei documenti;
- della struttura delle pagine.

---

## Assenza API REST ufficiali pubbliche

AIFA non espone attualmente API REST pubbliche documentate per l’accesso diretto ai dati farmaceutici.

Per questo motivo spesso è necessario:

- utilizzare scraping controllato;
- effettuare reverse engineering delle richieste web;
- oppure integrare provider commerciali.

---

# Evoluzione futura consigliata

Quando il progetto cresce, è consigliabile migrare verso:

- sincronizzazione database locale;
- provider professionali (Farmadati, Codifa);
- indicizzazione interna dei PDF;
- supporto completo Data Matrix GS1;
- gestione lotto e scadenza.

---

# Fonti ufficiali

- [AIFA Medicinali](https://medicinali.aifa.gov.it/?utm_source=chatgpt.com)
- [AIFA – RCP e Foglio Illustrativo](https://www.aifa.gov.it/riassunto-caratteristiche-e-foglio-illustrativo?utm_source=chatgpt.com)

Le fonti AIFA confermano che:

- FI e RCP sono documenti ufficiali e dinamici;
- tutti i medicinali autorizzati in Italia sono consultabili tramite la banca dati pubblica AIFA.
