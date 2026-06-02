# Piano di Implementazione: Configurazione Scanner Code39 per Estrazione AIC

Questo documento descrive la configurazione tecnica di uno scanner per codici a barre finalizzata all’estrazione esclusiva e diretta del codice AIC dal bollino farmaceutico italiano, evitando l’utilizzo di modelli AI per la decodifica e ignorando il codice seriale.

---

# 1. Architettura del Sistema (Hardware / SDK)

il sistema utilizza l’SDK della fotocamera ottimizzato per la lettura di codici a barre lineari (1D).

## Vantaggi di questo approccio

- **Consumo di risorse minimo**  
  La decodifica del formato Code39 è computazionalmente immediata e richiede risorse trascurabili.

- **Isolamento nativo del seriale**  
  Il codice _Interleaved 2 of 5_ (contenente il seriale del bollino) viene ignorato a livello di firmware o SDK e non viene considerato durante il processo di scansione.

---

# 2. Configurazione del Lettore / SDK (Regole di Scansione)

Per garantire che lo scanner acquisisca esclusivamente il codice AIC presente nell’Area 1 del bollino farmaceutico, l’SDK di scansione (ad esempio Zebra, Honeywell, Scandit oppure librerie open-source come ZXing o BarKoder) deve essere configurato con parametri restrittivi.

## A. Selezione delle Simbologie (Symbology Whitelisting)

| Simbologia                 | Stato    | Descrizione                                         |
| -------------------------- | -------- | --------------------------------------------------- |
| Code39                     | ENABLED  | Attiva la lettura del codice AIC                    |
| Interleaved 2 of 5 (I2of5) | DISABLED | Impedisce la lettura del numero seriale nell’Area 6 |
| DataMatrix                 | DISABLED | Evita letture ridondanti o multiple nell’Area 8     |

---

## B. Vincoli di Lunghezza (Length Constraints)

Il codice AIC italiano codificato in Code39 utilizza normalmente una lunghezza fissa composta da:

- prefisso alfabetico `A`
- 9 cifre numeriche

### Parametri consigliati

| Parametro  | Valore       |
| ---------- | ------------ |
| Min Length | 10 caratteri |
| Max Length | 10 caratteri |

> Nota: qualsiasi altro codice Code39 che non rispetti esattamente questa lunghezza verrà automaticamente scartato dal lettore.

---

# 3. Pipeline di Elaborazione della Stringa (Parsing)

Una volta rilevato il codice a barre nell’Area 1, lo scanner restituisce una stringa grezza (_raw data_).  
Il software applica quindi una semplice procedura di normalizzazione prima di trasmettere il dato all’applicazione.

## Flusso di elaborazione

```text
[Fotocamera / Scanner Laser]
             │
             ▼
   (Rileva solo Code39)

[Stringa grezza: "A034811013"]
             │
             ▼
 (Rimozione prefisso "A")

[Codice AIC: "034811013"]
             │
             ▼

      [Output finale]
```
