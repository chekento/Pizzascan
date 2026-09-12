# 🍕 PizzaScan 2.2

Android-App für **Pizzeria- und Restaurantsuche, lokale Pizza-Fotoanalyse und eigene Restaurantrezensionen**.

[![APK direkt herunterladen](https://img.shields.io/badge/Android-APK%20direkt%20herunterladen-3DDC84?style=for-the-badge&logo=android&logoColor=white)](https://github.com/chekento/Pizzascan/releases/download/latest-test/PizzaScan-latest-test.apk)

[🔐 Datenschutzerklärung](PRIVACY.md) · [📦 Releases](https://github.com/chekento/Pizzascan/releases) · [🧪 GitHub Actions](https://github.com/chekento/Pizzascan/actions)

---

## Direkt installieren

**[⬇️ PizzaScan APK herunterladen](https://github.com/chekento/Pizzascan/releases/download/latest-test/PizzaScan-latest-test.apk)**

Die direkt verlinkte Datei ist der aktuell auf dem Gerät bestätigte **Testbuild**. Er ist bewusst separat installierbar:

- Test-Paket: `cloud.kosch.pizzascan.search1`
- Google-Play-Paket: `cloud.kosch.pizzascan`
- Android 8 oder neuer (`minSdk 26`)
- Target: Android 16 / API 36

Dadurch kann der Testbuild parallel zu anderen PizzaScan-Versionen installiert werden. Für Google Play wird später das finale Release-AAB mit `cloud.kosch.pizzascan` verwendet.

SHA-256 zum aktuellen Download: [PizzaScan-latest-test-SHA256.txt](https://github.com/chekento/Pizzascan/releases/download/latest-test/PizzaScan-latest-test-SHA256.txt)

## Funktionen

### 🗺️ Pizza- und Restaurantsuche

- OpenStreetMap-Karte mit GPS und manueller Ortssuche
- Restaurants, Pizzerien, Pizza-Orte, Cafés, Imbisse, Foodtrucks und Pizzaautomaten
- kompakte **🔍-Suche**, die ein- und wieder ausgeklappt werden kann
- Autovervollständigung für Restaurants, Pizzerien, Orte und Adressen
- eigener **Suchen**-Button
- Suchleiste minimiert sich nach Auswahl eines Treffers wieder
- Vollbildkarte mit Filtern und GPS
- stabile, touchfreundliche Restaurant-Popups
- Emoji-Marker für unterschiedliche Ortstypen
- Restaurantdetails mit vorhandenen OSM-Daten wie Adresse, Öffnungszeiten, Telefon, Website, Lieferung, Abholung oder Barrierefreiheit

Kartendaten und Suche verwenden OpenStreetMap, Overpass und Photon. Öffentliche Dienste können zeitweise ausfallen oder unvollständige Daten liefern.

### 📸 Lokale KI-Fotoanalyse

PizzaScan kann ein Pizza-Foto vollständig lokal auf dem Android-Gerät analysieren. Es wird kein KI-API-Schlüssel benötigt und das Foto wird nicht für die Inferenz an einen Cloud-KI-Dienst gesendet.

Verfügbare Modelle:

| Modell | Quelle / Konvertierung | Ausführung |
|---|---|---|
| CLIP ViT-B/32 | Xenova / OpenAI CLIP | ONNX / WASM / CPU |
| CLIP ViT-B/16 | Xenova / OpenAI CLIP | ONNX / WASM / CPU |
| SigLIP Base Patch16-224 | Xenova / Google SigLIP | ONNX / WASM / CPU |

Der erste Modelldownload umfasst je nach Modell ungefähr **160–210 MB**.

### 💾 Modelle dauerhaft lokal speichern

Nach dem ersten vollständigen Download wird das Modell im privaten persistenten Android-App-Speicher unter `filesDir/offline-models` gehalten.

Damit gilt:

- kein erneuter vollständiger Download bei jedem App-Start,
- normale Cache-Bereinigung soll das Modell nicht entfernen,
- erneuter Download nur nach ausdrücklichem Entfernen, vollständigem Löschen der App-Daten, Deinstallation oder Wechsel auf ein noch nicht installiertes Modell.

Die Modellgewichte selbst sind nicht Bestandteil der APK und werden erst nach Bestätigung geladen.

### ⭐ Eigene Bewertungen und Google-Rezensionsbaukasten

- eigene Bewertung auf einer 10-Punkte-Skala
- eigene Notizen und Besuchsinformationen
- adaptiver Baukasten für Restaurantrezensionen
- Vor-Ort-Besuch, Abholung und Lieferung
- Aspekte wie Pizza, Teig, Zutaten, Service, Geschwindigkeit, Ambiente, Sauberkeit, Preis-Leistung und weitere
- Text bleibt vor dem Kopieren vollständig bearbeitbar
- Öffnen von Google Maps nur nach Nutzeraktion
- **keine automatische Veröffentlichung** einer Rezension

Rezensionsentwürfe werden lokal gespeichert.

## Datenschutz

Die aktuelle verbindliche PizzaScan-Datenschutzerklärung liegt direkt im öffentlichen Repository und benötigt **kein GitHub Pages**:

**[➡️ Datenschutzerklärung öffnen](https://github.com/chekento/Pizzascan/blob/main/PRIVACY.md)**

Für die Google Play Console kann genau diese öffentliche HTTPS-Adresse verwendet werden:

`https://github.com/chekento/Pizzascan/blob/main/PRIVACY.md`

Wesentliche Punkte:

- kein PizzaScan-Benutzerkonto
- keine Community-Funktion
- keine Werbung
- kein eigenes Analytics- oder Tracking-SDK
- Standort nur optional und im Vordergrund
- Fotos werden lokal analysiert
- Offline-KI-Modelle werden nach Zustimmung von Hugging Face geladen und anschließend persistent lokal gespeichert
- Karten- und Suchanfragen können an OpenStreetMap-/Overpass-/Photon-Dienste gehen
- Google-Rezensionen werden nie automatisch veröffentlicht

## Technischer Stand

- `compileSdk 36`
- `targetSdk 36`
- `minSdk 26`
- Java 17
- Gradle 8.11.1
- AndroidX WebView
- Leaflet / OpenStreetMap
- Transformers.js / ONNX Runtime Web

Die App-Weboberfläche wird als lokale App-Assets gebündelt. Externe Links werden außerhalb der WebView geöffnet. Hintergrundstandort ist nicht erforderlich.

## Bauen

Voraussetzungen: JDK 17, Android SDK 36, Node 22 und Gradle 8.11.1.

```bash
npm ci --ignore-scripts --no-audit
npm run assets
npm test
gradle --no-daemon assembleDebug lintDebug assembleRelease bundleRelease lintRelease
```

Die CI prüft zusätzlich Web-Smoke-Tests, Karten-/Suchfunktionen, Android-Lint, Android-16-Emulatorläufe sowie reale Modellinferenztests für CLIP B/32, CLIP B/16 und SigLIP.

## Google Play

Das endgültige Play-Store-Paket bleibt:

`cloud.kosch.pizzascan`

Der öffentlich verlinkte Test-APK-Download verwendet absichtlich eine separate Debug-Paketkennung, damit er andere installierte PizzaScan-Versionen nicht überschreibt.

Store-Unterlagen befinden sich unter `store/`.

## Lizenzen und externe Komponenten

- [OpenStreetMap](https://www.openstreetmap.org/copyright) – ODbL
- [Leaflet](https://leafletjs.com/) – BSD-2-Clause
- [Transformers.js](https://huggingface.co/docs/transformers.js/) – Apache-2.0
- [ONNX Runtime](https://github.com/microsoft/onnxruntime) – MIT
- [OpenAI CLIP](https://github.com/openai/CLIP) – MIT
- [Google SigLIP](https://huggingface.co/google/siglip-base-patch16-224) – Apache-2.0

Weitere genaue Versionen und gebündelte Lizenztexte sind im Repository dokumentiert.
