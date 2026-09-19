<p align="center">
  <img src="store/graphics/PizzaScan-App-Icon-512.png" alt="PizzaScan" width="112" height="112">
</p>

<h1 align="center">PizzaScan 2.3.14 · Build 49</h1>
<p align="center"><strong>Weltweit Pizza und italienische Restaurants finden · schnell · relevant · transparent</strong></p>
<p align="center">Deutsch · English · Italiano · Español · Français</p>

<p align="center">
  <img src="store/graphics/PizzaScan-Feature-EN-1024x500.png" alt="PizzaScan Feature Graphic" width="1024">
</p>

## 📱 Aktuelle APK direkt herunterladen

<p align="center">
  <a href="https://raw.githubusercontent.com/chekento/Pizzascan/main/downloads/PizzaScan-2.3.14.apk"><strong>⬇️ PizzaScan 2.3.14 · Build 49 APK herunterladen</strong></a>
</p>

<p align="center"><strong>Version 2.3.14 · Build 49 · Android 8+ · Target SDK 36 · cloud.kosch.pizzascan</strong></p>

> **Build 49 übernimmt die Umgebungssuche aus der WebSim-Originalquelle:** gesucht wird im tatsächlich sichtbaren Karten-BBOX mit denselben Pizza-/Italien-Overpass-Familien aus `source-original/script.js`. Es gibt für die automatische Discovery weder einen erzwungenen 5-km-Kreis noch zusätzliche Photon-/Ristorante-/Trattoria-Heuristiken. Die manuelle Ort-/Adresssuche nutzt wie WebSim Nominatim. Die Kartensteuerung ist jetzt eine sehr schmale Ein-Zeilen-Leiste; Status und Trefferzahl stehen direkt darüber an der Karte. Auch die von WebSim gelieferten Resultate werden nicht nachträglich geometrisch erweitert oder durch zusätzliche Discovery-Quellen ergänzt.

<p align="center">
<a href="downloads/SHA256SUMS-2.3.14.txt"><strong>SHA-256</strong></a>
&nbsp; · &nbsp;
<a href="CHANGELOG.md"><strong>📝 Changelog</strong></a>
&nbsp; · &nbsp;
<a href="downloads/README.md"><strong>📦 APK-Archiv</strong></a>
&nbsp; · &nbsp;
<a href="https://raw.githack.com/chekento/Pizzascan/main/web/index.html"><strong>🌐 Browser-Version</strong></a>
</p>

## 🍕 Relevanz statt beliebiger Restaurant-Treffer

Build 49 verwendet die im Repository erhaltene WebSim-Originalsuche als maßgeblichen Discovery-Vertrag:

- **Kein allgemeiner Gastro-Vollscan mehr.** Normale Burger-, Döner-, asiatische oder sonstige Restaurants ohne Pizza-/Italien-Bezug werden nicht gelistet.
- **Pizza muss nicht im Namen stehen.** WebSim sucht u. a. über `cuisine=pizza`, Pizza-/Pizzeria-Cuisine, `speciality~pizza`, Pizza im Namen oder in der Beschreibung sowie Pizzaautomaten.
- **Italienische Restaurants bleiben sichtbar**, wenn die WebSim-Originalabfrage sie über `amenity=restaurant` + `cuisine=italian` oder die entsprechenden Pizza-/Italian-Cuisine-Familien erfasst.
- Italienisch bedeutet nicht automatisch Pizza: bestätigte Pizza-Orte und italienische Kandidaten werden getrennt gekennzeichnet.
- Alte Build-42-Cacheeinträge ohne Pizza-/Italien-Evidenz werden aus der sichtbaren Ergebnisliste entfernt.

## ⚡ WebSim-identische Umgebungssuche

- Die automatische Discovery verwendet den **aktuellen sichtbaren Leaflet-Kartenausschnitt (BBOX)** – genau das Grundprinzip von `fetchDataForCurrentView()` aus der WebSim-Originalquelle.
- Die Overpass-Auswahl übernimmt die dort hinterlegten Familien: Pizza-Cuisine, italienische Restaurants, Pizza/Pizzeria-Restaurants, Pizzaautomaten, passende Cafés, Fast Food, Foodtrucks, Spezialität Pizza, Bars/Pubs, Pizza im Namen, Pizza in der Beschreibung und Takeaway mit Pizza/Italian-Cuisine.
- Für die automatische Umgebungssuche werden **keine zusätzlichen Ristorante/Trattoria/Osteria-, Brand-, Operator-, Dish- oder Photon-Heuristiken** aufgeschlagen.
- Primäre Discovery-Quelle ist wie im Original **`overpass-api.de`**. Android transportiert dieselbe Query bei Bedarf über den nativen HTTPS-Kanal, damit WebView/CORS die Semantik nicht verändert.
- Nach Kartenbewegung wird der neue sichtbare Ausschnitt erneut gesucht; „↻ Suchen“ erzwingt denselben Ablauf.
- Die manuelle Ort-/Adresssuche verwendet **Nominatim** und übernimmt den ersten Treffer bei Zoom 15 – entsprechend dem WebSim-Verhalten.
- Der Suchradius steht für diese Standard-Discovery auf **„Kartenausschnitt“ / 0 km**.

## 🌍 Weltweit

PizzaScan hat keine Länder-Whitelist. Eine frische Installation startet ohne GPS neutral in der Weltübersicht. GPS, Orts-/Adresssuche oder die bewusst gewählte Kartenregion setzen anschließend das Suchzentrum.

Unicode-sichere Suche erhält Orts- und Restaurantnamen in Originalschrift. Die Testmatrix enthält Regionen in Europa, Nord- und Südamerika, Afrika, Asien und Ozeanien sowie einen Dateline-Fall.

## 🗺️ Karte & Bedienung

- OpenStreetMap-/Leaflet-Karte mit GPS und Vollbildmodus.
- Suchradius **0–10 km in 0,5-km-Schritten** mit sichtbarem Suchzentrum und Radiuskreis.
- Filter „Jetzt geöffnet“, Mindestbewertung, Ortstypen, Besuche und persönliche Bewertungen.
- Pizza-Radar für relevante Orte im aktuellen Gebiet.
- Build 49 reduziert Offen/Rating/Filter/Radar auf eine **einzeilige, ca. 27 px hohe Toolbar**. Suchstatus, Trefferzahl und „↻ Suchen“ sitzen in einer zweiten, nur ca. 24 px hohen Zeile direkt oberhalb der Karte.
- Bottom-Navigation für Karte und Fotobewertung, Portrait/Landscape und Dark Mode.

## ⭐ Bewertungen & persönliche Historie

- Eigene Restaurantbewertung von **0,1–10,0**.
- Favoriten, Besuche und persönliche Historie bleiben lokal gespeichert.
- Mangrove / Open Reviews als offene Bewertungsquelle.
- Bewertungsfilter mit Dezimalwerten, z. B. **≥ 4,6**.
- Links zu Google Maps, Tripadvisor, Yelp und Mangrove zur externen Gegenprüfung.
- Google-/Microsoft-proprietäre POI-Daten werden nicht rechtswidrig in den OSM-Index kopiert.

## ✍️ Review Builder

- Dine-in, Takeaway und Delivery.
- Adaptive positive/negative Bausteine für Geschmack, Teig, Belag, Temperatur, Service, Wartezeit, Preis-Leistung, Ambiente, Sauberkeit, Lieferung und Verpackung.
- Eigener Freitext, lokale Entwürfe, JSON-Export/-Import und Google-kompatible Sternableitung aus der eigenen Bewertung.
- Foto-KI wird nicht als persönliche Restaurant-Erfahrung ausgegeben.

## 📷 Lokale Foto-KI

- Foto aufnehmen oder auswählen.
- Lokale Analyse mit **CLIP ViT-B/32**, **CLIP ViT-B/16** oder **SigLIP Base Patch16-224** über ONNX/WASM.
- Modell wird erst nach Bestätigung heruntergeladen und bleibt danach im privaten App-Speicher verfügbar.
- **25 sichtbare Kriterien** und **100 simulierte Gewichtungsperspektiven**; keine Behauptung von 100 realen Experten.
- Fotoanalyse bleibt getrennt von Restaurantbewertung und Review Builder.
- Fotos werden für die Analyse nicht an einen PizzaScan-Server hochgeladen.

## 🛡️ Stabilität, Datenschutz & Recovery

- Offline-/Cache-first-Verhalten.
- Mehrere OSM-Provider mit Failover und progressiver Zusammenführung.
- Abgebrochene alte Anfragen dürfen neuere Resultate nicht überschreiben.
- Health Check, Privacy Dashboard und begrenztes lokales Runtime-Recovery-Log.
- Cache-Reparatur entfernt nur temporäre Karten-/Suchdaten; Favoriten, eigene Bewertungen, Einstellungen und Offline-Modelle bleiben erhalten.
- In-App-Datenschutzerklärung und Modell-Download-Disclaimer.

## 🔎 Datenquellen und Grenzen

OpenStreetMap ist der frei zusammenführbare Hauptindex. Google Maps und Microsoft/Bing/Azure können zur externen Gegenprüfung geöffnet werden, deren proprietäre POI-Daten werden jedoch nicht unzulässig mit OSM/Leaflet vermischt.

Keine öffentliche Quelle kann garantieren, dass jeder reale Betrieb weltweit vollständig und aktuell erfasst ist. PizzaScan versucht deshalb, **alle verfügbaren relevanten OSM-Signale vollständig auszuwerten**, statt fachfremde Restaurants als vermeintliche Pizza-Treffer anzuzeigen.

## ✅ Release-Gate

Der veröffentlichte Android-Build wird vor dem Main-Publish geprüft auf:

- Unit-/Regressionstests
- Browser-/Playwright-Smokes
- Build-43-Relevanztest: generisches Restaurant raus, Pizza-Bar ohne „Pizza“ im Namen rein, italienische Trattoria rein
- Web-UI direkt aus der gebauten APK
- Android-Lint, Paket und Signatur
- Android-16-Installation/Start
- reale CLIP-B/32-, CLIP-B/16- und SigLIP-Inferenz

---

<p align="center"><strong>By KoSch · <a href="https://kosch.cloud">kosch.cloud</a></strong><br>
Based on <a href="https://pizzascan.on.websim.com">pizzascan.on.websim.com</a> ❣️</p>
