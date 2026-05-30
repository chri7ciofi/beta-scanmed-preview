# Piano di Adeguamento Scanner: Ottimizzazione DataMatrix

Questo documento funge da prompt strutturato e set di istruzioni per un agente AI incaricato di modificare il codice di scansione nel file `index.html` (o moduli associati) per risolvere il problema del "codice non riconosciuto" e ottimizzare la lettura dei codici DataMatrix farmaceutici.

---

## Obiettivo Corrente

Configurare la fotocamera mobile e la logica di decodifica per leggere in modo estremamente affidabile e stabile i codici DataMatrix GS1 (molto piccoli e ad alta densità) stampati sulle confezioni dei farmaci, eliminando i falsi positivi o letture parziali causati da altri formati di codici a barre.

---

# Istruzioni Operative per l'Agente AI

## 1. Isolare e Configurare la Fotocamera (`startCamera` / `getUserMedia`)

Trova il punto nel codice in cui viene inizializzato lo stream video (`navigator.mediaDevices.getUserMedia`) e aggiorna i vincoli (`constraints`) hardware. I moduli millimetrici del DataMatrix richiedono un'alta densità di pixel e una messa a fuoco precisa.

### Requisiti

- **Risoluzione Video:**  
  Forza una risoluzione ideale Full HD (`1920x1080`) o almeno HD (`1280x720`).  
  Evita le risoluzioni standard a bassa banda (`640x480`).

- **Messa a Fuoco:**  
  Inserisci i parametri `advanced` per richiedere la messa a fuoco continua (`focusMode: "continuous"`).

- **Compatibilità Mobile:**  
  Assicurati che l'elemento `<video>` abbia l'attributo `playsinline` attivo per evitarne il blocco su iOS Safari.

### Esempio di Target di Configurazione

```javascript
const constraints = {
  video: {
    facingMode: { ideal: "environment" },
    width: { ideal: 1920 },
    height: { ideal: 1080 },
    advanced: [{ focusMode: "continuous" }, { whiteBalanceMode: "continuous" }],
  },
  audio: false,
};
```

---

## 2. Restringere il Supporto Formati a SOLO `data_matrix`

Trova la funzione di inizializzazione della libreria di scansione o dell'API nativa del browser (es. `BarcodeDetector`, `html5-qrcode`, o `ZXing`). Configurala per forzare la ricerca esclusiva del formato DataMatrix.

Questo riduce drasticamente il carico della CPU sul telefono e previene letture parziali errate.

### Configurazioni Richieste

#### Se usi `BarcodeDetector` (API Nativa)

Passa esplicitamente:

```javascript
formats: ["data_matrix"];
```

#### Se usi `html5-qrcode`

Configura:

```javascript
formatsToSupport: [Html5QrcodeSupportedFormats.DATA_MATRIX];
```

#### Se usi `ZXing`

- Imposta la mappa degli `hints` escludendo gli altri formati.
- Attiva `TRY_HARDER`.

---

## 3. Debug della Stringa Grezza e Parsing GS1 (Logica Software)

Spesso l'errore "codice non riconosciuto" non deriva dalla fotocamera, ma da una validazione troppo stringente del software che rigetta i codici GS1 DataMatrix completi.

### Aggiungere un Log di Ispezione

Prima di passare il risultato dello scanner alla funzione di validazione, inserisci un log esteso o un alert temporaneo:

```javascript
console.log("STRINGA DATA_MATRIX RILEVATA:", JSON.stringify(rawCode));
```

### Verifica dello Standard GS1

Ricorda che un DataMatrix farmaceutico:

- inizia spesso con identificatori di applicazione:
  - `01` → GTIN / AIC
  - `17` → data di scadenza
  - `10` → lotto
- contiene caratteri speciali invisibili come:
  - `<GS>` (`ASCII 29`) usati come separatori di gruppo

L'agente AI deve assicurarsi che la logica di parsing:

- estragga correttamente l'ID del farmaco
- gestisca i separatori GS1
- non scarti l'intera stringa durante la validazione

---

# Linee Guida UI/UX per il Posizionamento

Assicurarsi che nel CSS/HTML sia presente un overlay visivo:

- un mirino
- oppure una bounding box quadrata ben definita
- centrata sullo schermo

Il DataMatrix deve essere allineato sfruttando:

- il suo **L-Pattern**
  - i due lati pieni continui che formano una "L"
- il suo **Clocking Pattern**
  - i due lati opposti tratteggiati

L'interfaccia deve suggerire all'utente di:

- mantenere il codice fermo
- posizionarlo al centro
- attendere l'autofocus

---

# Azione Richiesta all'Agente

1. Ispeziona `index.html` per identificare la libreria di scansione utilizzata dopo `initScanner()`.

2. Applica le ottimizzazioni sui vincoli video della fotocamera.

3. Restringi il rilevamento al solo formato `DataMatrix`.

4. Implementa il log stringificato (`JSON.stringify`) sul codice catturato per facilitare il debug del parsing.
