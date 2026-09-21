<p align="center">
  <img src="store/graphics/PizzaScan-App-Icon-512.png" alt="PizzaScan" width="112" height="112">
</p>

<h1 align="center">PizzaScan 2.3.22 · Build 57</h1>
<p align="center"><strong>Weltweit Pizza und italienische Restaurants finden · schnell · relevant · transparent</strong></p>
<p align="center">Deutsch · English · Italiano · Español · Français</p>

<p align="center">
  <img src="store/graphics/PizzaScan-Feature-EN-1024x500.png" alt="PizzaScan Feature Graphic" width="1024">
</p>

## 📱 Aktuelle APK direkt herunterladen

<p align="center">
  <a href="https://raw.githubusercontent.com/chekento/Pizzascan/main/downloads/PizzaScan-2.3.22.apk"><strong>⬇️ PizzaScan 2.3.22 · Build 57 APK herunterladen</strong></a>
</p>

<p align="center"><strong>Version 2.3.22 · Build 57 · Android 8+ · Target SDK 36 · cloud.kosch.pizzascan</strong></p>

> **Build 57 synchronisiert Scores live über Popup, „Mein Besuch“ und Rezensionsbaukasten, lokalisiert auch spät erzeugte Inhalte in fünf Sprachen und scannt nach GPS-Zentrierung automatisch den neuen Kartenausschnitt:** Die vollständige WebSim-Suchfamilie bleibt erhalten; Pizza, Trattoria, Ristorante, Osteria und verwandte italienische Gastro-Orte werden im sichtbaren BBOX gefunden. Ways und Relationen werden mit ihrem stabilen Kartenmittelpunkt übernommen.

**Neu in 2.3.22:** Die erste erfolgreiche POI-Antwort wird sofort angezeigt und weitere OSM-Spiegel werden danach zusammengeführt; GPS-Zentrierung startet den Scan erst nach der Kartenbewegung im aktuellen Ausschnitt. Popup, Place-Detail, „Mein Besuch“ und Rezensionsbaukasten verwenden pro Ort denselben live synchronisierten Wert von 0,1 bis 10,0. Spät erzeugte Karten-, Archiv- und Review-Inhalte werden in Deutsch, Englisch, Italienisch, Spanisch und Französisch nachgezogen. Die Vollbildkarte bleibt auf Karte, POIs und Popups beschränkt.

<p align="center">
<a href="downloads/SHA256SUMS-2.3.22.txt"><strong>SHA-256</strong></a>
&nbsp; · &nbsp;
<a href="CHANGELOG.md"><strong>📝 Changelog</strong></a>
&nbsp; · &nbsp;
<a href="downloads/README.md"><strong>📦 APK-Archiv</strong></a>
&nbsp; · &nbsp;
<a href="https://groups.google.com/g/pizzascan-beta-testers"><strong>👥 Beta-Testgruppe</strong></a>
&nbsp; · &nbsp;
<a href="https://raw.githack.com/chekento/Pizzascan/main/web/index.html"><strong>🌐 Browser-Version</strong></a>
</p>

## 🍕 Relevanz statt beliebiger Restaurant-Treffer

Build 57 behandelt die frühere WebSim-Ausgabe als Suchvertrag: alle benannten Gastro-Orte im Kartenausschnitt bleiben als neutrale Orte sichtbar; Pizza-/Italien-Signale werden zusätzlich präzise markiert.

- **Nicht nur „Italiener“:** Pizza, Pizzeria, Pizzaria, Trattoria, Ristorante, Osteria, Tavola, Taverna, Enoteca und italienische Küche werden erkannt.
- **Mehr als der Name:** Cuisine- und cuisine:it-Tags, restaurant:type, Name, Brand, offizieller/alternativer Name, Betreiber, Beschreibung, Spezialität, Produkt und Pizzaautomaten werden ausgewertet.
- **Keine falsche Etikettierung:** Burger-, Döner-, asiatische oder sonstige Restaurants ohne relevantes Signal bleiben auffindbar, werden aber nicht künstlich als Pizza-Orte ausgegeben.
- Pizza- und italienische Evidenz werden getrennt gekennzeichnet; fehlende Pizza-Bestätigung wird transparent angezeigt.
- Ways und Relationen werden nicht mehr wegen fehlender lat/lon verworfen: out body center hält ihren stabilen Marker am selben OSM-Objekt.


## ⚡ WebSim-identische Umgebungssuche

- Gesucht wird automatisch im **aktuell sichtbaren Leaflet-Kartenausschnitt (BBOX)**; Kartenbewegungen lösen eine neue Suche aus.
- Die Query deckt die WebSim-Familien plus die wiederhergestellten Gastro-Namen ab: Pizza-Cuisine, italienische Küche, Trattoria/Ristorante/Osteria, Pizza-/Italian-Cuisine in Restaurants, Cafés, Fast Food, Foodtrucks, Takeaway, Bars/Pubs, Spezialität, Name, Brand, Betreiber, Beschreibung, Shops und Pizzaautomaten.
- Die Resultate werden über stabile node/way/relation-IDs dedupliziert und mit Mittelpunktkoordinaten gemappt. Abgebrochene alte Requests dürfen keine neueren Treffer überschreiben.
- overpass-api.de bleibt primär; drei freigegebene OSM-Spiegel übernehmen bei Fehlern dieselbe Query. Android nutzt dafür den nativen HTTPS-Kanal, danach ist ein kontrollierter WebView-Fallback möglich.
- Die manuelle Ort-/Adresssuche verwendet Nominatim. „↻ Suchen“ erzwingt die Suche für den aktuellen Kartenausschnitt.
- Der Standardmodus bleibt „Kartenausschnitt“ / 0 km; es gibt keine versteckte 5-km-Begrenzung.


## 🌍 Weltweit

PizzaScan hat keine Länder-Whitelist. Eine frische Installation startet ohne GPS neutral in der Weltübersicht. GPS, Orts-/Adresssuche oder die bewusst gewählte Kartenregion setzen anschließend das Suchzentrum.

Unicode-sichere Suche erhält Orts- und Restaurantnamen in Originalschrift. Die Testmatrix enthält Regionen in Europa, Nord- und Südamerika, Afrika, Asien und Ozeanien sowie einen Dateline-Fall.

## 🗺️ Karte & Bedienung

- OpenStreetMap-/Leaflet-Karte mit moderner 2026-Kartenfläche, Glasflächen, klaren Statuschips, Vollbildmodus, GPS und stabilen Markern.
- Die Bedienung ist auf zwei Ebenen gegliedert: Suche bei Bedarf öffnen, dann Kartenausschnitt, Status und Trefferzahl direkt am Kartenrand.
- Standardmäßig bleiben **alle relevanten Ortstypen, alle Bewertungsstände inklusive unbekannt/unbewertet, geschlossene Orte und bereits besuchte Orte** sichtbar. Die Settings können jeden dieser Filter bewusst einschränken.
- Filter für Offenstatus, Mindestbewertung, Ortstypen, Besuchshistorie, Routenmodus, GPS-Start und dunkles Design.
- Die Sprache kann in Deutsch, Englisch, Italienisch, Spanisch und Französisch gewechselt werden.
- Bottom-Navigation für Karte und Fotobewertung sowie responsive Portrait-/Landscape-Darstellung.


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

- Unit-/Regressionstests und Browser-/Playwright-Smokes
- Build-51-Relevanztest: generisches Restaurant raus, Pizza-Ort ohne „Pizza“ im Namen rein, Trattoria/Ristorante/Osteria rein
- Way-/Relation-Center, stabile Marker-IDs, Deduplizierung und Request-Abbruch
- Web-UI direkt aus der gebauten APK
- Android-Lint, Paket und Signatur
- Android-16-Installation/Start
- reale CLIP-B/32-, CLIP-B/16- und SigLIP-Inferenz

---

<p align="center"><strong>By KoSch · <a href="https://kosch.cloud">kosch.cloud</a></strong><br>
Based on <a href="https://pizzascan.on.websim.com">pizzascan.on.websim.com</a> ❣️</p>
