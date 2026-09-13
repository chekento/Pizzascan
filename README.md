<p align="center">
  <img src="store/graphics/PizzaScan-App-Icon-512.png" alt="PizzaScan App-Symbol" width="112" height="112">
</p>

<h1 align="center">PizzaScan</h1>
<p align="center"><strong>Gute Pizza finden. Dein Foto lokal analysieren. Deinen Besuch bewerten.</strong></p>
<p align="center">Deutsch · English · Italiano · Español · Français</p>

<p align="center">
  <img src="store/graphics/PizzaScan-Feature-EN-1024x500.png" alt="PizzaScan – Pizzerien entdecken und Pizza auf dem eigenen Gerät analysieren" width="1024">
</p>

## Direkt starten

<table>
<tr>
<td width="50%" align="center">
<a href="https://raw.githubusercontent.com/chekento/Pizzascan/main/downloads/PizzaScan-2.3.0-Test.apk">
<img src="store/graphics/Download-Android-APK.svg" alt="PizzaScan Android APK herunterladen" width="100%">
</a>
</td>
<td width="50%" align="center">
<a href="https://chekento.github.io/Pizzascan/">
<img src="store/graphics/Open-Mini-Live.svg" alt="PizzaScan Mini Live im Browser öffnen" width="100%">
</a>
</td>
</tr>
</table>

<p align="center">
<strong><a href="https://raw.githubusercontent.com/chekento/Pizzascan/main/downloads/PizzaScan-2.3.0-Test.apk">⬇ PizzaScan-2.3.0-Test.apk direkt herunterladen</a></strong>
&nbsp; · &nbsp;
<strong><a href="https://chekento.github.io/Pizzascan/">🌐 Mini Live öffnen</a></strong>
</p>

<p align="center">
<a href="downloads/SHA256SUMS.txt">SHA-256</a> ·
<a href="docs/VERIFICATION-2.3.0.md">Verifikation</a> ·
<a href="docs/Datenschutz.md">Datenschutz</a> ·
<a href="store/TESTPLAN.md">Testplan</a> ·
<a href="store/PLAY-CONSOLE.md">Google Play Vorbereitung</a>
</p>

> **Android-Testversion:** Android 8 oder neuer. Die signierte APK ist kostenlos. Karten, Suche und offene Ortsbewertungen benötigen Internet. Die zusätzlichen Offline-Bildmodelle werden erst nach ausdrücklicher Bestätigung heruntergeladen. Kein KI-Abo und kein API-Key nötig.

## Mini Live – direkt im Browser

Die neue **PizzaScan Mini Live**-Seite ist eine bewusst schlanke Browser-Vorschau. Sie nutzt OpenStreetMap/Overpass für echte Pizza-Orte und Photon für Stadt- und Adresssuche. GPS ist optional. Die Seite enthält direkt einen APK-Download und funktioniert ohne API-Schlüssel.

**Live:** https://chekento.github.io/Pizzascan/

Falls GitHub Pages gerade neu deployt wird, liegt der Quellstand unter [`docs/index.html`](docs/index.html). Die Mini-Version enthält absichtlich **keine großen Offline-KI-Modelle** und keine Fotoanalyse; diese Funktionen bleiben der Android-App vorbehalten.

## Was PizzaScan kann

| Funktion | Vollständige Android-App |
|---|---|
| 🍕 Pizzakarte | OpenStreetMap, GPS, stabile Emoji-Marker, Vollbild, Restaurantsuche |
| ⭐ Bewertungsfilter | kostenlose offene Mangrove/Open-Reviews-Daten, Mindestwert in 0,1-Schritten |
| 🕒 Auswahl | Öffnungszeiten, Ortstypen, Suchradius, gemerkte/besuchte Orte |
| 📍 Restaurantdetails | Adresse, Kontakt, Speisekarte, Öffnungszeiten, offene Bewertungen |
| 📷 Fotoanalyse | 25 Fotokriterien, 100 simulierte Perspektiven, Skala 0,1–10,0 |
| 🤖 Lokale KI | CLIP B/32, CLIP B/16 oder SigLIP B/16; ONNX/WASM auf dem Gerät |
| ✍️ Rezensionsbaukasten | eigene Erfahrung zu Essen, Service, Atmosphäre und mehr; private Entwürfe |
| 🌍 Sprachen | Deutsch, Englisch, Italienisch, Spanisch und Französisch |

## Offene Bewertungen und Mindestbewertung

Unter **Einstellungen → Offene Ortsbewertungen → Mindestbewertung** lässt sich z. B. **ab 4,6 / 5** wählen. Der Regler arbeitet in 0,1er-Schritten und filtert Karte und Liste gemeinsam. Bei 0 ist der Bewertungsfilter aus. Orte ohne bekannte offene Bewertung können bei aktivem Filter separat einbezogen werden.

Die offenen Bewertungen stammen kostenlos aus **Mangrove / Open Reviews**. Die Abdeckung ist naturgemäß lückenhaft. Google Maps, Tripadvisor und Yelp sind zusätzlich als externe Suchlinks erreichbar; deren Sterne werden nicht kopiert und fließen nicht in den PizzaScan-Filter ein.

→ [Datenquelle, Lizenz und Berechnung](docs/Offene-Bewertungen.md)

## Fotoanalyse und Offline-KI

PizzaScan verwendet echte Bild-Sprach-Modelle, aber die Fotoanalyse ist **keine wissenschaftlich validierte Geschmacksbewertung**. Die App vergleicht sichtbare Merkmale des Fotos mit Referenzbeschreibungen und erzeugt daraus einen experimentellen Index.

- **25 sichtbare Kriterien** rund um Rand, Backbild, Belag, Komposition und Fotoqualität.
- **100 simulierte Bewertungsprofile** kombinieren unterschiedliche Gewichtungen derselben 25 Modellwerte; sie sind keine 100 realen Menschen und keine 100 unabhängigen Gutachten.
- **Eigene Bewertung** und Besuchsbestätigung bleiben davon getrennt.
- Geschmack, Geruch, Temperatur, Lebensmittelsicherheit und unsichtbare Eigenschaften lassen sich aus einem Foto nicht zuverlässig bestimmen.

### Lokale Modelle

| Einstellung | ONNX-Modell | Ausführung |
|---|---|---|
| CLIP B/32 | [Xenova/clip-vit-base-patch32](https://huggingface.co/Xenova/clip-vit-base-patch32) | q8 / WASM / CPU |
| CLIP B/16 | [Xenova/clip-vit-base-patch16](https://huggingface.co/Xenova/clip-vit-base-patch16) | q8 / WASM / CPU |
| SigLIP B/16 | [Xenova/siglip-base-patch16-224](https://huggingface.co/Xenova/siglip-base-patch16-224) | q8 / WASM / CPU |

Die Modellgewichte werden erst nach Bestätigung beim ersten Einsatz von Hugging Face geladen. Kein Konto und kein API-Key erforderlich. In Android werden sie im privaten App-Speicher abgelegt und bei normalen Cache-Bereinigungen nicht entfernt. App-Daten löschen, Deinstallieren oder das gezielte Entfernen eines Modells löscht sie.

## Datenschutz in Kurzform

- Fotos und Fotoanalyse bleiben bei der lokalen KI auf dem Gerät.
- Einstellungen, Rezensionsentwürfe und gemerkte Orte werden lokal gespeichert.
- Karten-/Suchdienste erhalten die jeweils abgefragten Bereiche bzw. Suchbegriffe.
- Offene Bewertungen sind optional; bei Aktivierung wird Mangrove/Open Reviews abgefragt.
- Externe Bewertungsportale werden erst nach Antippen geöffnet.

→ [Vollständige Datenschutzerklärung](docs/Datenschutz.md)

<details>
<summary><strong>Technik, Tests und Build</strong></summary>

### Android

- `minSdk 26` / Android 8+
- `targetSdk 36`
- WebView-App mit gepackten Web-Assets
- sichere HTTPS-Origin über `WebViewAssetLoader`
- Mixed Content und Drittanbieter-Cookies deaktiviert
- Fotoauswahl/Kamera über Android, GPS nach Nutzeraktion bzw. gespeicherter Zustimmung
- persistente Offline-Modellablage im privaten App-Speicher

### Karten- und Suchtechnik

- Leaflet 1.9.4
- OpenStreetMap / Overpass für Orte
- Photon für Stadt-, Adress- und Restaurantsuche
- mehrere Overpass-Endpunkte mit Timeout/Fallback
- räumlicher Cache und Abbruch veralteter Anfragen
- stabile Emoji-Marker ohne Positionssprünge beim Panning

### Tests

Der CI-Workflow prüft unter anderem:

- Unit-Tests
- Karten-/Such-Smoke-Tests
- Ratings-UI und Bewertungsfilter
- Navigation und Mehrsprachigkeit
- Runtime-Assets
- Marker-Stabilität
- Android-16-Emulator-Smoke-Test
- echte lokale ONNX/WASM-Modellinferenz
- APK-Inhalt, Signaturprüfung und Prüfsummen

Grundkommandos:

```sh
npm ci --ignore-scripts --no-audit
npm run assets
npm test
npx playwright install --with-deps chromium
npm run smoke
npm run map-smoke
npm run ratings-smoke
npm run navigation-smoke
npm run runtime-assets
npm run marker-i18n
npm run i18n-content
npm run live-map
gradle --no-daemon assembleDebug assembleDebugAndroidTest lintDebug assembleRelease bundleRelease lintRelease
```

Die öffentliche Test-APK wurde separat signiert. Private Signierschlüssel liegen weder im Repository noch in öffentlichen Actions-Artefakten.

### Relevante Dateien

- `web/` – App-Oberfläche und Browserlogik
- `web/analysis.js` – 25 Kriterien / 100 Profile
- `web/ratings.js` + `web/ratings-ui.js` – offene Bewertungen und Filter
- `web/review-builder.js` – Rezensionsbaukasten
- `app/` – Android-Wrapper
- `docs/index.html` – Mini-Liveversion
- `store/` – Play-Store-Texte, Testplan und Assets
- `downloads/` – öffentliche Test-APK und Prüfsumme

</details>

## Quellen und Lizenzen

- [Leaflet](https://leafletjs.com/) – BSD-2-Clause
- [OpenStreetMap](https://www.openstreetmap.org/copyright) – ODbL
- [Mangrove / Open Reviews](https://open-reviews.net/technology/) – offene Bewertungsdaten; Lizenzhinweise in der App und Dokumentation
- [Transformers.js](https://huggingface.co/docs/transformers.js/) / ONNX Runtime – lokale Modelllaufzeit
- [OpenAI CLIP](https://github.com/openai/CLIP) – MIT
- [Google SigLIP](https://huggingface.co/google/siglip-base-patch16-224) – Apache-2.0

Weitere Lizenzdateien gepackter Abhängigkeiten liegen nach dem Asset-Build unter `web/vendor`.

---

<p align="center"><strong>By KoSch of <a href="https://kosch.cloud">kosch.cloud</a> based on <a href="https://pizzascan.on.websim.com">pizzascan.on.websim.com</a> ❣️</strong></p>
