<p align="center">
  <img src="store/graphics/PizzaScan-App-Icon-512.png" alt="PizzaScan" width="112" height="112">
</p>

<h1 align="center">PizzaScan 2.3.5</h1>
<p align="center"><strong>Gute Pizza finden · intelligente Pizza-Evidence · Bewertungen filtern · Fotos lokal analysieren</strong></p>
<p align="center">Deutsch · English · Italiano · Español · Français</p>

<p align="center">
  <img src="store/graphics/PizzaScan-Feature-EN-1024x500.png" alt="PizzaScan Feature Graphic" width="1024">
</p>

## 📱 PizzaScan direkt installieren

<p align="center">
  <a href="https://raw.githubusercontent.com/chekento/Pizzascan/main/downloads/PizzaScan-2.3.5.apk"><strong>⬇️ PizzaScan 2.3.5 APK herunterladen</strong></a>
</p>

<p align="center"><strong>Version 2.3.5 · Build 28 · Android 8+ · Paket cloud.kosch.pizzascan</strong></p>

Die aktuelle Direkt-APK trägt in App, Dateiname und Android-Paket nur den Namen **PizzaScan**. Sie enthält die Karten-/Pizza-Discovery, manuelle Restaurant-/POI-Suche, Ratingfilter, Restaurantdetails, Review Builder, fünf Sprachen und die lokale Fotoanalyse. Die veröffentlichte APK wird in CI signaturgeprüft, aus der tatsächlich gebauten APK heraus UI-getestet und zusätzlich auf Android 16 installiert und gestartet.

<p align="center">
<a href="downloads/SHA256SUMS-2.3.5.txt"><strong>SHA-256</strong></a>
&nbsp; · &nbsp;
<a href="CHANGELOG.md"><strong>📝 Changelog</strong></a>
&nbsp; · &nbsp;
<a href="downloads/README.md"><strong>📦 APK-Archiv</strong></a>
&nbsp; · &nbsp;
<a href="https://raw.githack.com/chekento/Pizzascan/main/web/index.html"><strong>🌐 Browser-Version</strong></a>
</p>

## 🍕 2.3.5: intelligentere Pizza-Discovery

Die automatische Umgebungskarte ist jetzt bewusst **pizza-spezifischer**. Sie übernimmt die POI-Gruppen, die bereits die ursprüngliche WebSim-App vorgesehen hatte, statt pauschal jedes Restaurant im Umkreis als Kandidaten zu behandeln. Darüber hinaus wird ein Ort nur ergänzt, wenn ein nachvollziehbares Pizza-Signal vorhanden ist.

**WebSim-Basis bleibt erhalten:**

- `cuisine=pizza` bzw. Pizza-/Pizzeria-Küchenangaben
- italienische Restaurants aus der ursprünglichen WebSim-Auswahl
- Cafés, Imbisse, Foodtrucks, Takeaways sowie Bars/Pubs mit Pizza-/Italienisch-Küchenangabe
- Pizza-Spezialität, Pizza im Namen oder in der Beschreibung
- Pizzaautomaten (`vending=pizza` / `vending:pizza=yes`)

**Zusätzliche Orte benötigen Pizza-Evidence.** PizzaScan berücksichtigt dafür Pizza-Hinweise in strukturierten OSM-Daten, Beschreibungen/Notizen, Produktangaben und Speisekarten-Metadaten. Ein beliebiges deutsches Restaurant, Café, Döner-Imbiss oder eine Bar ohne solchen Bezug wird nicht mehr allein wegen der Kategorie in die automatische Pizza-Karte aufgenommen.

Die optionale Google-Maps-Integration bleibt freiwillig und wird nur mit eigenem Places-API-Key sowie auf ausdrückliches Laden verwendet. Enthält eine geladene Google-Rezension tatsächlich das Wort **Pizza**, kann PizzaScan diesen Ort für die laufende Sitzung als Pizza-belegt markieren. Google-Rezensionstexte werden weiterhin nicht dauerhaft gespeichert. Ein automatisches massenhaftes Abfragen von Google-Orten findet nicht statt.

## 🗺️ POI-Symbole und Legende

Marker und Legende verwenden dieselben Kategorien:

- 🍕 **Pizzeria** – Restaurant mit bestätigtem Pizza-Signal
- ☕ **Café** – Café aus der Pizza-/WebSim-Auswahl
- 🍔 **Imbiss / Takeaway** – Fast Food oder Takeaway
- 🚚 **Foodtruck** – mobile Gastronomie / Foodtruck
- 🤖 **Pizzaautomat** – Pizza-Vending
- 🍽️ **Restaurant / Bar / weiterer Pizza-Ort** – z. B. italienische WebSim-Basis, Bar/Pub oder sonstiger belegter Pizza-Ort, der nicht als Pizzeria umetikettiert werden soll
- ⭐ **Gemerkt**, ✓ **Besucht**, 📍 **Dein Standort** – lokale Zustände

Dadurch ist das Symbol auf der Karte direkt aus derselben Typisierung abgeleitet, die auch in Kartenliste und Details verwendet wird. Ein italienisches Restaurant ohne direktes Pizza-Signal bleibt beispielsweise 🍽️ statt fälschlich 🍕 zu werden.

## 🔎 Manuelle Restaurant- und Ortssuche

Die strengere automatische Umgebungskarte schränkt die **bewusste manuelle Suche** nicht unnötig ein. Wer nach einem konkreten Restaurant, Café, Imbiss, einer Bar, einem Ort oder einer Adresse sucht, kann weiterhin breite Suchtreffer erhalten. Damit kann ein Restaurant auch dann gefunden und geprüft werden, wenn seine OSM-Daten noch keinen Pizza-Hinweis enthalten.

Bei abgesendeten Suchanfragen gleicht PizzaScan Kategorie, Name, Adresse, OSM-Identität und Entfernung ab, dedupliziert identische POIs und priorisiert exakte Namens-/Ortskombinationen. Photon bleibt für Orts-/Adresssuche und Vorschläge erhalten; Nominatim kann kontrolliert als Such-Fallback einspringen.

## 🧭 Datenquellen und Ausfallsicherheit

Für die automatische Pizza-Karte wird die pizza-spezifische Overpass-Abfrage nacheinander über mehrere Quellen versucht. Recovery erweitert dabei **nicht mehr** stillschweigend auf generische Restaurants, nur um eine Zielanzahl an POIs zu erreichen. Das verhindert insbesondere in kleineren Städten, dass fachfremde Gastro-POIs als vermeintliche Pizza-Orte auftauchen.

Ein neuer Discovery-Cache-Marker löscht bei einem Upgrade einmalig alte Karten-/Photon-Recovery-Caches, damit bereits zwischengespeicherte breite Treffer aus 2.3.4 nicht weiter auf der Karte stehen. Gemerkte Orte und persönliche Daten werden dadurch nicht gelöscht.

## ⭐ Bewertungen und Restaurantdetails

- Mindestbewertung 0,0–5,0 in 0,1-Schritten
- offene Bewertungen über Mangrove / Open Reviews
- externe Links zu Google Maps, Tripadvisor und Yelp
- optionale Google Places API mit eigenem Key für Google-Ratingdaten und bis zu fünf Rezensionen
- Adresse, Telefon, Website, Speisekarte, Öffnungszeiten, Ausstattung und OSM-Quelle soweit in den Quelldaten vorhanden
- eigene Rezensionen bleiben im lokalen Review Builder

## 📷 Lokale Fotoanalyse

Die Bildanalyse läuft lokal auf dem Gerät. Zur Auswahl stehen **CLIP ViT-B/32**, **CLIP ViT-B/16** und **SigLIP Base Patch16-224** via ONNX/WASM. Das ausgewählte Modell wird erst nach Bestätigung heruntergeladen und anschließend im privaten persistenten App-Speicher gehalten.

Die Fotoanalyse verwendet 25 sichtbare Kriterien und 100 simulierte Gewichtungsperspektiven. Diese Perspektiven sind keine 100 realen Experten und keine unabhängigen Gutachten. Fotos werden für die Analyse nicht an einen PizzaScan-Server hochgeladen.

## 📦 Versionen

| Version | Status | Download |
|---|---|---|
| **2.3.5 · Build 28** | aktuelle Direktversion | [⬇️ PizzaScan-2.3.5.apk](https://raw.githubusercontent.com/chekento/Pizzascan/main/downloads/PizzaScan-2.3.5.apk) |
| 2.3.4 | Archiv / breite POI-Regression | [Archiv öffnen](downloads/README.md) |
| 2.3.3 | Archiv / Regression | [Archiv öffnen](downloads/README.md) |
| 2.3.2 | Archiv / Regression | [Archiv öffnen](downloads/README.md) |
| 2.3.1 | Archiv / Regression | [Archiv öffnen](downloads/README.md) |
| 2.3.0 | Archiv / Basisstand | [Archiv öffnen](downloads/README.md) |

> **Signaturhinweis:** Die direkt von GitHub installierbare APK wird für die Direktinstallation signiert. Die spätere Google-Play-Ausgabe kann mit einer anderen Release-Signatur ausgeliefert werden. Ein Wechsel kann deshalb eine Neuinstallation erfordern. Persönliche lokale Daten vorher exportieren/sichern.

## Google Play

Das Repository erzeugt zusätzlich ein validiertes Release-AAB für die Google-Play-Vorbereitung. Die Google Group **PizzaScan Beta Testers** ist vorbereitet; der geschlossene Play-Track wird erst freigegeben, wenn die aktuelle Direktversion auf realen Geräten insbesondere bei POI-Genauigkeit, Suche, Standort, Ratings und Offline-KI abgenommen ist.

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
- WebView-App mit gepackten lokalen Web-Assets
- OpenStreetMap / Overpass, Photon, kontrollierter Nominatim-Fallback, Leaflet
- Mangrove / Open Reviews; Google Places optional mit eigenem Key
- CLIP / SigLIP lokal via ONNX/WASM
- CI: Unit-/Regression-/Playwright-Smokes, APK-Inhaltsprüfung, Signatur-/Package-Prüfung, Android-16-Installations- und Startprüfung

Die Quellen liegen unter `web/` und `app/`. Play-Store-Vorbereitung und Store-Assets befinden sich unter `store/`.

---

<p align="center"><strong>By KoSch of <a href="https://kosch.cloud">kosch.cloud</a> based on <a href="https://pizzascan.on.websim.com">pizzascan.on.websim.com</a> ❣️</strong></p>