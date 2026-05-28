# Product Requirement Document (PRD) - ScanMed (Light Version)

## 1. Vision & Core Objective

ScanMed è un'applicazione mobile cross-platform focalizzata sulla sostenibilità domestica e la salute. Obiettivo: eliminare lo spreco farmaceutico e migliorare l'aderenza terapeutica familiare tramite tracciamento intelligente delle scadenze e prevenzione del sovradosaggio.

## 2. Database Schema (Supabase / PostgreSQL)

Infrastruttura centralizzata. Tabella principale `farmaci` configurata con Row-Level Security (RLS). I codici AIC sono di tipo `TEXT` per preservare gli zeri iniziali.

### Table: `farmaci`

| Column Name        | Data Type | Constraints           | Description                           |
| :----------------- | :-------- | :-------------------- | :------------------------------------ |
| `codice_aic`       | TEXT      | PRIMARY KEY, NOT NULL | Codice ministeriale a 9 cifre         |
| `nome_commerciale` | TEXT      | NOT NULL              | Brand del farmaco (es. TACHIPIRINA)   |
| `principio_attivo` | TEXT      | NOT NULL              | Componente chimico (es. Paracetamolo) |
| `confezione`       | TEXT      | -                     | Specifiche, dosaggio e formato        |

---

## 3. Core Functional Modules

### 3.1 Scanner Modulo (Camera Input)

- **Lettura Ottica:** Acquisizione codici a barre lineari (EAN-13) e bidimensionali (GS1 DataMatrix).
- **Flusso Dati:** Estrazione automatica delle 9 cifre AIC -> Query a Supabase. Se l'AIC estratto ha meno di 9 cifre, applicare padding a sinistra con `0`.
- **Fallback:** Campo di input manuale per digitazione codice AIC in caso di barcode danneggiato.

### 3.2 Modulo Ricerca Farmaci (Text Input)

- **Autocomplete:** Attivazione query asincrona dopo l'inserimento del 3° carattere.
- **Query Multi-Campo:** Ricerca simultanea con operatore `ILIKE` (case-insensitive) su colonne `nome_commerciale` e `principio_attivo`.
- **Performance:** Implementazione Debouncing a 300ms sul client per ottimizzare le chiamate API.

### 3.3 Gestione Dispensa (Armadietto Digitale)

- **Onboarding Farmaco:** Precompilazione automatica dati da DB tramite AIC + inserimento manuale della data di scadenza (DatePicker).
- **Stato Scadenze (Color Coding Semantico):**
  - 🔴 **Rosso (Scaduto):** Blocco utilizzo, avviso di smaltimento sicuro.
  - 🟠 **Arancione (Imminente, <30 gg):** Notifica push settimanale, priorità nella home.
  - 🟢 **Verde (Sicuro):** Farmaco integro e utilizzabile.

### 3.4 Sicurezza Clinica (Controllo Principio Attivo)

- **Prevenzione Sovra-Assunzione:** Controllo incrociato automatico sui farmaci in uso o in programmazione. Se l'utente tenta di pianificare due farmaci diversi ma con lo stesso `principio_attivo` (es. Tachipirina e un generico a base di paracetamolo), il sistema deve mostrare un **alert bloccante** a schermo per rischio tossicità.

### 3.5 Ciclo Cure & Promemoria (Aderenza Terapeutica)

- **Configurazione Terapia:** Associazione farmaco (da dispensa), frequenza (es. ogni 8h), orari e durata del ciclo.
- **Smart Reminders:** Notifiche push locali con opzione di log diretto ("Assunto" / "Saltato").
- **Scarico Scorte:** Alla conferma di assunzione, decremento automatico dell'unità (es. -1 compressa) dalla Dispensa. Alert di riacquisto al raggiungimento della soglia minima (es. 3 dosi residue).
- **Audit Trail:** Storico permanente delle terapie concluse con calcolo della percentuale di aderenza, esportabile in PDF per il medico.

---

## 4. Non-Functional Requirements & Security

- **RLS Policies:** \* Tabella `farmaci`: Operazione `SELECT` pubblica (`TO anon, authenticated USING (true)`). Modifiche bloccate.
  - Tabella `dispensa/cure`: Accesso isolato per singolo utente tramite controllo `auth.uid() = user_id`.(da rivedere/aggiungere in un secondo momento)
- **Offline First:** Caching locale dei dati della dispensa e dei promemoria attivi per garantire il funzionamento dei cicli di cura anche in assenza di rete. Sincronizzazione automatica al ripristino della connessione.
