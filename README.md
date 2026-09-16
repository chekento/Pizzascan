<p align="center">
  <img src="store/graphics/PizzaScan-App-Icon-512.png" alt="PizzaScan" width="112" height="112">
</p>

<h1 align="center">PizzaScan 2.3.5 · Build 39</h1>
<p align="center"><strong>Gute Pizza finden · vollständige Karten-Discovery · Besuche archivieren · Bewertungen teilen · Fotos lokal analysieren</strong></p>
<p align="center">Deutsch · English · Italiano · Español · Français</p>

<p align="center">
  <img src="store/graphics/PizzaScan-Feature-EN-1024x500.png" alt="PizzaScan Feature Graphic" width="1024">
</p>

## 📱 Aktuelle APK direkt herunterladen

<p align="center">
  <a href="https://raw.githubusercontent.com/chekento/Pizzascan/main/downloads/PizzaScan-2.3.5.apk"><strong>⬇️ PizzaScan 2.3.5 · Build 39 APK herunterladen</strong></a>
</p>

<p align="center"><strong>Version 2.3.5 · Build 39 · Android 8+ · Paket cloud.kosch.pizzascan</strong></p>

Die Direkt-APK ist der aktuelle verifizierte CI-Build. Sie enthält die Karten-/Pizza-Discovery, Restaurant- und POI-Suche, persistente Place-Historie, Besuchsfilter, Markdown-Sicherung bereits besuchter Orte, den Review Builder, optionale Mangrove/Open-Reviews-Veröffentlichung, fünf Sprachen und lokale Fotoanalyse.

<p align="center">
<a href="downloads/SHA256SUMS-2.3.5.txt"><strong>SHA-256</strong></a>
&nbsp; · &nbsp;
<a href="CHANGELOG.md"><strong>📝 Changelog</strong></a>
&nbsp; · &nbsp;
<a href="downloads/README.md"><strong>📦 APK-Archiv</strong></a>
&nbsp; · &nbsp;
<a href="https://raw.githack.com/chekento/Pizzascan/main/web/index.html"><strong>🌐 Browser-Version</strong></a>
</p>

## 🍕 Suche ohne künstliche Trefferobergrenze

PizzaScan verwendet die ursprüngliche WebSim-/OSM-Idee als Basis und erweitert sie für dichte Städte und unvollständige Quelldaten. Die Suche arbeitet im aktuellen Kartenausschnitt und führt passende OSM-Treffer mehrerer Overpass-Quellen zusammen, statt die Anzeige auf eine feste Anzahl wie 20, 50 oder 100 Orte zu begrenzen.

Unterstützt werden unter anderem:

- `cuisine=pizza` und Pizza-/Pizzeria-Küchenangaben
- italienische Restaurants sowie typische Namen wie Ristorante, Trattoria und Osteria
- Cafés, Imbisse, Foodtrucks, Takeaways sowie Bars/Pubs mit Pizza-/Italienisch-Bezug
- Pizza-Spezialität, Pizza im Namen, in Beschreibung, Notizen, Produkten oder Speisekarten-Metadaten
- Pizzaautomaten (`vending=pizza` / `vending:pizza=yes`)
- `node`, `way` und `relation` aus OpenStreetMap

Treffer verschiedener Quellen werden nach OSM-Identität dedupliziert. Bereits gefundene Places können lokal persistent gehalten und beim nächsten Start wieder geladen werden, damit ein temporär schwächerer Kartenprovider bekannte Orte nicht einfach verschwinden lässt.

Photon bleibt für Orts-/Adresssuche und kontrollierte Fallbacks erhalten; die reguläre Karten-Discovery wird nicht von einer kleinen Photon-Ergebniszahl bestimmt.

## 🗺️ POI-Symbole

- 🍕 **Pizzeria** – bestätigter Pizza-Bezug
- ☕ **Café**
- 🍔 **Imbiss / Takeaway**
- 🚚 **Foodtruck**
- 🤖 **Pizzaautomat**
- 🍽️ **Restaurant / Bar / weiterer passender Ort**
- ⭐ **Gemerkt**
- ✓ **Besucht / selbst bewertet**
- 📍 **Dein Standort**

## ✓ Besuchte Orte dauerhaft erhalten

Eigene Bewertungen und besuchte Orte werden unabhängig von einer späteren Kartenabfrage aufbewahrt. Dadurch bleiben bereits besuchte Restaurants verfügbar, selbst wenn ein externer Kartenprovider sie bei einer späteren Sitzung vorübergehend nicht zurückliefert.

In den Filtern kann auf **nur bereits besuchte / selbst bewertete Orte** eingeschränkt werden. Das Besuchsarchiv lässt sich außerdem als Markdown-Datei exportieren und wieder importieren. Damit kann die persönliche Restaurant-Historie gesichert und später erneut geladen werden.

## ⭐ Bewertungen und Open Reviews

PizzaScan unterstützt eigene Restaurantbewertungen und offene Bewertungsdaten über **Mangrove / Open Reviews**.

Die Veröffentlichung eigener Ratings ist freiwillig und standardmäßig nicht erforderlich. Wenn Open-Reviews-Publishing in den Einstellungen aktiviert wird, kann eine eigene Bewertung gezielt an Mangrove/Open Reviews übertragen und damit zum offenen Rating-Netzwerk beigetragen werden. Die lokale Bewertung bleibt unabhängig davon in PizzaScan erhalten.

Zusätzlich stehen Links zu Google Maps, Tripadvisor und Yelp bereit. Eine optionale Google-Places-Integration kann mit einem eigenen API-Key verwendet werden; sie ist für die Grundfunktion von PizzaScan nicht erforderlich.

## 🔎 Manuelle Suche

Neben der automatischen Umgebungskarte kann gezielt nach Restaurant, Café, Imbiss, Bar, Ort oder Adresse gesucht werden. PizzaScan gleicht dabei Name, Adresse, Kategorie, OSM-Identität und Entfernung ab und dedupliziert identische POIs.

## 📷 Lokale Fotoanalyse

Die Bildanalyse läuft lokal auf dem Gerät. Zur Auswahl stehen **CLIP ViT-B/32**, **CLIP ViT-B/16** und **SigLIP Base Patch16-224** via ONNX/WASM. Das ausgewählte Modell wird erst nach Bestätigung heruntergeladen und anschließend im privaten persistenten App-Speicher gehalten.

Die Fotoanalyse verwendet 25 sichtbare Kriterien und 100 simulierte Gewichtungsperspektiven. Diese Perspektiven sind keine 100 realen Experten. Fotos werden für die Analyse nicht an einen PizzaScan-Server hochgeladen.

## 📦 Versionen

| Version | Status | Download |
|---|---|---|
| **2.3.5 · Build 39** | **aktuelle Direktversion** | [⬇️ PizzaScan-2.3.5.apk](https://raw.githubusercontent.com/chekento/Pizzascan/main/downloads/PizzaScan-2.3.5.apk) |
| 2.3.4 | Archiv | [Archiv öffnen](downloads/README.md) |
| 2.3.3 | Archiv | [Archiv öffnen](downloads/README.md) |
| 2.3.2 | Archiv | [Archiv öffnen](downloads/README.md) |
| 2.3.1 | Archiv | [Archiv öffnen](downloads/README.md) |
| 2.3.0 | Archiv / Basisstand | [Archiv öffnen](downloads/README.md) |

> **Signaturhinweis:** Die GitHub-Direkt-APK ist für Direktinstallation signiert. Google Play verwendet Play App Signing. Vor einer Neuinstallation persönliche PizzaScan-Daten am besten über die vorhandenen Exportfunktionen sichern.

## Google Play

Das Repository erzeugt zusätzlich ein validiertes Release-AAB für Google Play. Ein vorhandener geschlossener Testtrack und die Testergruppe können für neuere Builds weiterverwendet werden; für ein Update wird lediglich ein neues AAB mit höherem `versionCode` in denselben Track veröffentlicht.

<p align="center">
<a href="https://groups.google.com/g/pizzascan-beta-testers"><strong>PizzaScan Beta Testers</strong></a>
&nbsp; · &nbsp;
<a href="store/PLAY-CONSOLE.md"><strong>Play-Console-Checkliste</strong></a>
&nbsp; · &nbsp;
<a href="docs/Datenschutz.md"><strong>Datenschutz</strong></a>
</p>

## Technik

- Android 8+ (`minSdk 26`), Target SDK 36
- Paket: `cloud.kosch.pizzascan`
- Version 2.3.5, `versionCode 39`
- WebView-App mit gepackten lokalen Web-Assets
- OpenStreetMap / Overpass, Photon, kontrollierter Nominatim-Fallback, Leaflet
- persistente lokale Place-/Besuchshistorie
- Mangrove / Open Reviews; Google Places optional mit eigenem Key
- CLIP / SigLIP lokal via ONNX/WASM
- CI: Unit-/Regression-/Playwright-Smokes, APK-Inhaltsprüfung, Signatur-/Package-Prüfung, Android-16-Installations- und Startprüfung

Die Quellen liegen unter `web/` und `app/`. Play-Store-Vorbereitung und Store-Assets befinden sich unter `store/`.

---

<p align="center"><strong>By KoSch of <a href="https://kosch.cloud">kosch.cloud</a> based on <a href="https://pizzascan.on.websim.com">pizzascan.on.websim.com</a> ❣️</strong></p>