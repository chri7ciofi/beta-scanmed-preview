# Technical Specification: Medical Scanner Core Logic (`SCANNER.md`)

## 1. Objective

Implement the core logical controller for scanning pharmaceutical barcodes (`ean13`) and GS1 DataMatrix (`datamatrix`). Handle data normalization (AIC padding), GS1 string parsing (Expiry and Batch), and Supabase querying.

## 2. Dependencies & Hardware Config

- **Library:** `expo-camera` (`CameraView`).
- **Hardware optimization:** Restrict scanning to `barcodeTypes: ['ean13', 'datamatrix']` to minimize CPU usage.
- **Database:** `@supabase/supabase-js`.

## 3. Data Processing Rules

### 3.1 AIC Left-Padding (Data Normalization)

All Italian AIC codes must be exactly 9 characters long (stored as `TEXT` in the DB). If the raw scanned string is shorter than 9 digits, pad it with leading zeros:
$$\text{finalAIC} = \text{rawAIC}.\text{padStart}(9, \text{'0'})$$

### 3.2 GS1 DataMatrix Parsing

When `type === 'datamatrix'`, parse the raw text using GS1 Application Identifiers (AI):

- **AI `17` (Expiry):** 6 characters in `YYMMDD` format. If `DD === '00'`, fallback to day `28`.
- **AI `10` (Batch/Lotto):** Alphanumeric string following the prefix.

---

## 4. Core Core Code Blueprint

```typescript
import React, { useState } from 'react';
import { CameraView } from 'expo-camera';
import { supabase } from '../lib/supabase';

export default function TechnicalScanner({ navigation }) {
  const [processing, setProcessing] = useState(false);

  const parseDataMatrix = (rawText: string) => {
    let aic = ''; let expiry: Date | null = null; let lotto = '';
    const cleanText = rawText.replace(/[\(\)]/g, '').trim();

    // Parse Expiry (AI 17 -> YYMMDD)
    const expIdx = cleanText.indexOf('17');
    if (expIdx !== -1 && cleanText.length >= expIdx + 8) {
      const y = `20${cleanText.substring(expIdx + 2, expIdx + 4)}`;
      const m = cleanText.substring(expIdx + 4, expIdx + 6);
      const d = cleanText.substring(expIdx + 6, expIdx + 8) === '00' ? '28' : cleanText.substring(expIdx + 6, expIdx + 8);
      expiry = new Date(`${y}-${m}-${d}`);
    }

    // Parse Batch/Lotto (AI 10)
    const batchIdx = cleanText.indexOf('10');
    if (batchIdx !== -1) lotto = cleanText.substring(batchIdx + 2);

    return { aic, expiry, lotto };
  };

  const handleBarCodeScanned = async ({ type, data }: { type: string; data: string }) => {
    if (processing) return;
    setProcessing(true);

    let finalAIC = '';
    let extractedExpiry = null;
    let extractedLotto = '';

    if (type === 'datamatrix') {
      const parsed = parseDataMatrix(data);
      finalAIC = parsed.aic;
      extractedExpiry = parsed.expiry;
      extractedLotto = parsed.lotto;
    } else {
      finalAIC = data.trim().padStart(9, '0');
    }

    try {
      // Query central DB (Handled by Supabase public RLS Policy)
      const { data: farmaco, error } = await supabase
        .from('farmaci')
        .select('*')
        .eq('codice_aic', finalAIC)
        .single();

      if (error || !farmaco) {
        navigation.navigate('AddManual', { aic: finalAIC });
        return;
      }

      // Route to user pantry workflow with parsed meta-data
      navigation.navigate('AddToDispensa', {
        farmaco,
        scadenzaPrecompilata: extractedExpiry,
        lottoPrecompilato: extractedLotto
      });
    } catch (err) {
      console.error(err);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <CameraView 'datamatrix'] 1 : ? ['ean13', barcodeScannerSettings="{{" barcodeTypes: flex: handleBarCodeScanned} onBarcodeScanned="{processing" style="{{" undefined }}/>
  );
}
```
