# Istruzioni di Sviluppo: Strategia Unificata di Estrazione AIC per Scanner (EAN-13 / DataMatrix)

Questo documento funge da specifica tecnica e prompt strutturato per l'agente AI (es. Cursor, Antigravity, Claude Code) per riprogettare e semplificare la logica di scansione nel file `index.html`.

---

# 🎯 Filosofia del Sistema & Obiettivo Centrale

L'applicazione deve cambiare approccio: **l'unico dato critico e obbligatorio da estrarre da qualsiasi tipo di scansione è il codice AIC (codice di targatura ministeriale a 9 cifre)**.

Lo scanner deve essere in grado di leggere correttamente:

- i nuovi bollini europei **GS1 DataMatrix**
- i vecchi bollini farmaceutici italiani
- i codici lineari EAN-13 presenti sulle confezioni

Il sistema deve quindi supportare contemporaneamente:

1. **Nuovo standard GS1 DataMatrix**
   - estrazione AIC
   - estrazione lotto
   - estrazione scadenza

2. **Vecchio bollino farmaceutico italiano (IPZS)**
   - estrazione esclusiva del codice AIC
   - ignorare l’assenza di lotto/scadenza
   - evitare il rigetto del codice come “non riconosciuto”

3. **Codici lineari EAN-13**
   - isolamento automatico delle 9 cifre AIC
   - gestione del codice più lungo o più affidabile presente sulla confezione

---

# ⚠️ Problema Attuale da Risolvere

## Vecchi Bollini Farmaceutici

I vecchi bollini farmaceutici italiani stampati o applicati a matrice di punti:

- non seguono il nuovo standard europeo GS1 FMD
- contengono principalmente:
  - codice AIC
  - numero seriale
- non includono necessariamente:
  - lotto
  - data di scadenza

L’attuale parsing troppo rigido basato su GS1 provoca errori come:

- “codice non riconosciuto”
- scarto del DataMatrix
- mancata identificazione del farmaco

Il sistema deve invece accettare questi codici ed estrarre almeno l’AIC.

---

## Codici EAN-13 / Lineari

Sulle confezioni italiane possono comparire più codici a barre lineari:

- un codice commerciale standard
- un codice ministeriale associato all’AIC

Lo scanner deve:

- leggere i codici lineari supportati
- discriminare automaticamente il codice corretto
- isolare le 9 cifre valide dell’AIC
- privilegiare il codice più completo, lungo o stabile

---

# 🛠️ Strategia Operativa Richiesta

## 1. Unificazione del Flusso di Scansione

Qualsiasi formato venga letto dalla fotocamera:

- DataMatrix GS1
- vecchio bollino DataMatrix(contenente solo AIC e numero seriale)
- EAN-13

il sistema deve convergere verso un unico obiettivo:

> estrarre un codice AIC valido.

I campi accessori:

- lotto
- scadenza

devono essere considerati opzionali.

Se non presenti:

- non bloccare il flusso
- non invalidare la scansione
- lasciare i campi vuoti

---

## 2. Gestione Differenziata dei Formati

### Nuovi Bollini GS1 DataMatrix

Se il codice è compatibile con lo standard GS1:

- eseguire il parsing completo
- estrarre:
  - AIC
  - lotto
  - scadenza

---

### Vecchi Bollini Italiani

Se il DataMatrix non rispetta il formato GS1:

- non rigettare il codice
- trattarlo come vecchio bollino IPZS
- estrarre esclusivamente il codice AIC
- ignorare il numero seriale residuo

Il sistema deve:

- isolare le cifre numeriche
- identificare le 9 cifre AIC
- evitare errori di validazione troppo aggressivi

---

### Codici Lineari (EAN-13 / UPC / Code128)

Per i codici lineari:

- isolare solo la parte numerica
- identificare automaticamente le 9 cifre compatibili con AIC
- preferire il codice:
  - più lungo
  - più stabile
  - meno rumoroso

---

# 🔍 Normalizzazione Finale del Codice AIC

Prima del fetch verso Supabase o verso il database farmaci, il sistema deve:

- rimuovere caratteri spuri
- rimuovere eventuali spazi
- correggere eventuali prefissi errati
- normalizzare il codice per garantire una corrispondenza esatta

Il sistema deve inoltre tollerare:

- letture OCR sporche
- caratteri residui
- eventuali prefissi alfabetici accidentali

---

# 🧪 Logging & Debug Richiesti

Lo scanner deve produrre log completi per facilitare il debug.

È necessario registrare:

- formato rilevato
- stringa grezza letta dalla fotocamera
- strategia di parsing scelta
- AIC finale estratto

L’obiettivo è facilitare l’analisi di:

- codici non riconosciuti
- vecchi bollini IPZS
- incompatibilità GS1
- errori di autofocus o decodifica

---

# ✅ Comportamento Finale Atteso

Il comportamento corretto dello scanner deve essere:

- scansione stabile e veloce
- compatibilità sia con bollini nuovi che vecchi
- nessun blocco per assenza di lotto/scadenza
- estrazione affidabile del solo AIC
- riduzione drastica degli errori “codice non riconosciuto”
- compatibilità con confezioni farmaceutiche italiane reali
