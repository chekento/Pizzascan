<p align="center">
  <img src="store/graphics/PizzaScan-App-Icon-512.png" alt="PizzaScan" width="112" height="112">
</p>

<h1 align="center">PizzaScan 2.3.6 · Build 41</h1>
<p align="center"><strong>Weltweit gute Pizza finden · Suchradius sichtbar steuern · Besuche archivieren · Bewertungen einordnen · Fotos lokal analysieren</strong></p>
<p align="center">Deutsch · English · Italiano · Español · Français</p>

<p align="center">
  <img src="store/graphics/PizzaScan-Feature-EN-1024x500.png" alt="PizzaScan Feature Graphic" width="1024">
</p>

## 📱 Aktuelle APK direkt herunterladen

<p align="center">
  <a href="https://raw.githubusercontent.com/chekento/Pizzascan/main/downloads/PizzaScan-2.3.6.apk"><strong>⬇️ PizzaScan 2.3.6 · Build 41 APK herunterladen</strong></a>
</p>

<p align="center"><strong>Version 2.3.6 · Build 41 · Android 8+ · Paket cloud.kosch.pizzascan</strong></p>

Die Direkt-APK wird aus dem verifizierten CI-Build veröffentlicht. Build 41 baut auf der vollständigen Mehrquellen-/GPS-/Cache-Discovery aus Build 40 auf und ergänzt weltweite Unicode-Suche ohne Länder-Default, einen zusätzlichen OSM-Coverage-Audit über alle benannten Gastro-POIs im aktiven Suchgebiet, einen sichtbaren Suchmittelpunkt mit temporärem Radius, einen stufenlosen Suchradius, robustere Offline-/Recovery-Pfade, Datenvertrauen für offene Ratings, einen transparenten Signal-Mix, lokales Foto-Benchmarking, Pizza-Radar sowie Health Check und Privacy Dashboard.

> **Coverage-Grundsatz:** OpenStreetMap/Overpass ist der primäre, zusammenführbare PizzaScan-Ortsindex. PizzaScan fragt zusätzlich breit Restaurants, Fast Food, Cafés, Foodtrucks, Takeaways, Food Courts, Bars, Pubs, Biergärten und passende Food-Shops ab und prüft lokal sämtliche relevanten OSM-Tags auf Pizza-/Italien-Bezug. Google Maps und Microsoft Maps werden als externe Gegenprüfung verlinkt, ihre proprietären POI-Daten werden nicht in den OSM-Index kopiert. Keine öffentliche Kartendatenquelle kann garantieren, dass jeder reale Betrieb weltweit vollständig und aktuell erfasst ist.

<p align="center">
<a href="downloads/SHA256SUMS-2.3.6.txt"><strong>SHA-256</strong></a>
&nbsp; · &nbsp;
<a href="CHANGELOG.md"><strong>📝 Changelog</strong></a>
&nbsp; · &nbsp;
<a href="downloads/README.md"><strong>📦 APK-Archiv</strong></a>
&nbsp; · &nbsp;
<a href="https://raw.githack.com/chekento/Pizzascan/main/web/index.html"><strong>🌐 Browser-Version</strong></a>
</p>

## ✨ Alle Funktionen auf einen Blick

### 🌍 Weltweite Nutzung

- **Keine Länder- oder Stadtbindung:** PizzaScan ist für die weltweite Nutzung ausgelegt und verwendet OpenStreetMap-basierte Daten ohne Länder-Whitelist.
- Eine frische Installation ohne GPS startet in einer **neutralen Weltübersicht**, nicht an einem fest codierten deutschen oder US-amerikanischen Ort.
- GPS, Orts-/Adresssuche oder eine bewusst gewählte Kartenregion setzen anschließend das reale Suchzentrum.
- **Unicode-sichere Suche** erhält Restaurant-, Orts- und Adressnamen in Originalschrift, unter anderem Japanisch, Chinesisch, Arabisch und Kyrillisch.
- Die weltweite Testmatrix deckt Europa, Nordamerika, Südamerika, Afrika, Asien, Ozeanien und einen Dateline-Fall ab; die Teststädte sind Referenzpunkte, keine unterstützten-Länder-Liste.

### 🔎 Maximale Pizza-/Bar-Coverage

- Primärer Index: **OpenStreetMap über mehrere Overpass-Endpunkte**; Treffer werden nach OSM-Identität zusammengeführt.
- Zusätzlich zur gezielten Pizza-Suche läuft ein **breiter Coverage-Audit** über alle benannten Gastro-POIs im aktiven Suchgebiet.
- Kandidaten umfassen `restaurant`, `fast_food`, `cafe`, `food_truck`, `takeaway`, `food_court`, `bar`, `pub`, `biergarten` sowie passende Food-Shops und Pizzaautomaten.
- Pizza-Evidenz wird nicht nur aus Name oder `cuisine` gelesen, sondern auch aus Brand/Operator, Spezialität, Produkten, Menüfeldern, Beschreibungen und Notizen einschließlich lokalisierter `description:*`, `note:*`, `name:*` und `menu:*`-Tags.
- Pizza-Erkennung berücksichtigt neben lateinischen Begriffen auch häufige Schreibweisen in Japanisch, Chinesisch, Arabisch und Kyrillisch.
- **Pizza-Bars und Pizza-Pubs** werden damit auch dann erkannt, wenn der Name keine Variante von „Pizzeria“ enthält, sofern OSM einen Pizza-Hinweis enthält.
- Keine künstliche numerische Ergebnisgrenze im Coverage-Audit.
- Gefundene OSM-Orte werden lokal persistent gehalten und bei späteren Starts wiederverwendet; bestätigte Löschungen in OSM können aus dem Cache entfernt werden.
- In der Detailansicht gibt es einen **Coverage Cross-Check** zu Google Maps und Microsoft Maps. Diese Dienste werden extern geöffnet; proprietäre POI-Daten werden nicht unzulässig in die OSM-/Leaflet-Datenbank gemischt.
- Grenze: Ist ein realer Betrieb in keiner erlaubten Quelle erfasst oder enthält OSM keinerlei Pizza-Hinweis, kann PizzaScan dessen Existenz nicht zuverlässig ableiten. „Maximale Abdeckung“ bedeutet deshalb vollständige Auswertung der verfügbaren erlaubten Daten – keine erfundene 100-%-Garantie.

### 🗺️ Karte, GPS & Suche

- Vollbildfähige **OpenStreetMap-/Leaflet-Karte** mit GPS-Standort und eigenem Standortmarker.
- Automatische Umgebungssuche sowie manuelle Suche nach **Restaurant, Pizzeria, Café, Imbiss, Bar, Ort oder Adresse**.
- Suchvorschläge, präziser POI-Abgleich nach Name, Adresse, Kategorie, Entfernung und OSM-Identität sowie Deduplizierung identischer Orte.
- Mehrquellen-Discovery über mehrere Overpass-Endpunkte, Photon für Orts-/Adresssuche und kontrollierter Nominatim-Fallback.
- Keine künstliche 20-/50-/100-Treffergrenze: eindeutige OSM-Treffer werden quellenübergreifend zusammengeführt.
- Unterstützte POIs: 🍕 Pizzeria, ☕ Café, 🍔 Imbiss/Takeaway, 🚚 Foodtruck, 🤖 Pizzaautomat, 🍽️ weitere Restaurants/Bars/passende Orte.
- Italienische Restaurants können als Kandidaten erscheinen, ohne automatisch als bestätigte Pizzeria ausgegeben zu werden.
- **Temporärer Mini-Marker für das aktive Suchzentrum** und bei festem Radius zusätzlicher Radiuskreis.
- „Hier suchen“, ein ausgewählter Suchtreffer und eine automatisch ausgelöste Kartensuche aktualisieren das aktive Suchzentrum.
- Beim Schließen der Suche bzw. beim Wechsel zurück zu GPS wird die temporäre Suchzentrum-Markierung entfernt.
- **Suchradius-Slider 0–10 km in 0,5-km-Schritten**; `0 km` nutzt den aktuellen Kartenausschnitt.
- Radius und Kartenausschnitt werden auch von Recovery-/Fallback-Suchen respektiert.
- Zoomabhängige Marker-Priorisierung reduziert optische Überlagerung, ohne Treffer zu löschen.
- **Pizza-Radar** sortiert interessante Orte im aktuellen Bereich nach Nähe, Öffnungsstatus, Pizza-Evidence und belastbareren verfügbaren Ratings.

### 🕒 Öffnungszeiten, Filter & Sortierung

- Öffnungsstatus aus vorhandenen OSM-Wochen-/Feiertagsregeln und lokaler Zeit.
- Filter **„Nur jetzt geöffnet“** sowie Option für Orte mit unbekannten Öffnungszeiten.
- Filter nach Ortstypen, bereits besuchten/selbst bewerteten Orten und Mindestbewertung.
- Mindestbewertung als Dezimal-Slider, z. B. **≥ 4,6**.
- Sortierung nach Entfernung oder Öffnungsstatus plus Entfernung.
- Automatische Suche nach Kartenbewegung kann in den Einstellungen aktiviert/deaktiviert werden.

### ⭐ Favoriten, Besuche & persönliche Historie

- Orte lokal als **„Gemerkt“** speichern.
- Eigene Restaurantbewertungen und besuchte Orte dauerhaft unabhängig von späteren Provider-Antworten erhalten.
- Persönliche Besuchshistorie bleibt auch bei temporären Karten-/Netzwerkausfällen verfügbar.
- Filter für besuchte bzw. selbst bewertete Orte.
- Besuchsarchiv als **Markdown exportieren und wieder importieren**; Import wird validiert und nach OSM-Identität dedupliziert.

### ★ Bewertungen & offene Daten

- Eigene PizzaScan-Restaurantbewertung auf **0,1–10,0**.
- Lesen offener Bewertungsdaten über **Mangrove / Open Reviews**.
- Optionales, ausdrücklich ausgelöstes Veröffentlichen eigener Bewertungen in Mangrove/Open Reviews; lokale Bewertung bleibt davon unabhängig.
- Open-Review-Edits und wiederholte Bewertungen werden nachvollziehbar behandelt; pro öffentlichem Reviewer zählt die neueste passende Opinion.
- Veraltete oder fehlerbehaftete Rating-Caches werden nicht als frische Null-Ergebnisse ausgegeben.
- **Datenvertrauen/Confidence** aus Bewertungsmenge und Aktualität; ausdrücklich keine Wahrheitswahrscheinlichkeit.
- Links zu **Google Maps, Tripadvisor, Yelp und Mangrove**.
- Optionale Google-Places-/Google-Maps-Datenintegration; Google-Daten gehen nur dann in Build-41-Auswertungen ein, wenn sie in der aktuellen Sitzung ausdrücklich geladen wurden.
- **Transparenter Signal-Mix auf 0–10** aus verfügbaren Mangrove-Ratings, eigenen bestätigten Besuchen, experimenteller Foto-KI und ausdrücklich geladenen Google-Daten; Quellen und Abdeckung bleiben sichtbar.

### ✍️ Review Builder

- Unabhängiger Restaurant-Review-Builder für **Dine-in, Takeaway und Delivery**.
- Adaptive positive und negative Textbausteine für Geschmack, Teig, Belag, Temperatur, Service, Wartezeit, Preis-Leistung, Ambiente, Lautstärke, Sauberkeit, Auswahl, Barrierefreiheit, Lieferung und Verpackung.
- Eigener Freitext bleibt erhalten und kann mit ausgewählten Beobachtungen kombiniert werden.
- Nutzerbewertungen bleiben Nutzerangaben; Foto-KI wird nicht als persönliche Restaurant-Erfahrung ausgegeben.
- Rezensionsentwürfe lokal speichern, wieder öffnen, löschen und als JSON sichern/wiederherstellen.
- Google-kompatible Sterne können aus der eigenen Bewertung abgeleitet werden; veröffentlicht wird ausschließlich durch den Nutzer.

### 📍 Restaurantdetails & Navigation

- Detailansicht mit Adresse, Öffnungszeiten, Kontakt, Website, Speisekarte und vorhandenen Ausstattungs-/Ernährungs-/Barrierefreiheitsdaten.
- Fehlende Angaben werden nicht erfunden; externe Quellen bleiben als solche erkennbar.
- Routenstart mit Reisearten **zu Fuß, Fahrrad, Auto und ÖPNV** sowie Unterstützung für mehrere Wegpunkte.

### 📷 Lokale Foto-KI

- Pizza fotografieren oder vorhandenes Foto auswählen.
- Lokale Analyse auf dem Gerät mit **CLIP ViT-B/32**, **CLIP ViT-B/16** oder **SigLIP Base Patch16-224** via ONNX/WASM.
- Modell wird erst nach ausdrücklicher Bestätigung heruntergeladen und anschließend im privaten persistenten App-Speicher gehalten.
- Bereits heruntergeladene Modelle müssen nicht bei jedem App-Start erneut geladen werden und können in den Einstellungen wieder entfernt werden.
- **25 sichtbare Fotokriterien** und **100 simulierte Gewichtungsperspektiven**; diese sind keine 100 realen Experten.
- Fotoanalyse bleibt getrennt von der eigenen Restaurantbewertung.
- **Lokaler Perzentil-Vergleich** mit anderen auf demselben Gerät gespeicherten Analysen desselben Modells; keine globale Rangliste.
- Fotos werden für die KI-Analyse nicht an einen PizzaScan-Server hochgeladen.

### 🛡️ Stabilität, Offline & Recovery

- **Cache-first/Offline-first:** bekannte Orte bleiben sichtbar, wenn ein Live-Abruf oder das Netzwerk ausfällt.
- Mehrstufige Provider-/Such-Fallbacks verhindern falsche Nullzustände bei vorübergehenden Providerproblemen.
- Abgebrochene oder überholte Suchanfragen dürfen neuere Ergebnisse nicht überschreiben.
- Persistente Place-/Besuchshistorie ist vom Erfolg einer einzelnen Netzabfrage getrennt.
- Lokales **Runtime-Recovery-Log** für begrenzte Diagnoseinformationen.
- **Cache-Reparatur** baut nur temporäre Such-, Karten- und Rating-Caches neu auf; Favoriten, Fotos, eigene Bewertungen, Einstellungen und Offline-Modelle bleiben erhalten.
- **Health Check** prüft Runtime, Karte/Cache, Netzwerk, GPS, Speicher, Datenquellen, Suchradius, offene Ratings, Offline-KI und Recovery-Status.

### 🔐 Datenschutz & Transparenz

- **Privacy Dashboard** zeigt kompakt, welche Daten lokal bleiben und wann Karten-, Rating- oder Modelldienste angesprochen werden.
- Fotoanalysen und Review-Entwürfe bleiben lokal.
- Kartenanbieter erhalten nur den für die Live-Suche benötigten Suchbereich.
- Mangrove wird nur bei aktivierter Funktion genutzt; Google-Review-Daten nur nach ausdrücklicher Nutzeraktion.
- Offline-Modelle werden extern bezogen, die eigentliche Bildanalyse bleibt auf dem Gerät.
- In-App-Datenschutzerklärung und Modell-Download-Disclaimer.

### 🌍 UX, Sprache & Android

- Oberfläche in **Deutsch, English, Italiano, Español und Français** mit automatischer Gerätespracherkennung und manueller Sprachwahl.
- Dark Mode, kompakte Bottom-Navigation, Portrait-/Landscape-Unterstützung und Vollbildkarte.
- Android 8+ (`minSdk 26`), Target SDK 36.
- Offizielles **PizzaScan-App-Icon** aus `PizzaScan-App-Icon-512.png` ist als Android Adaptive Launcher Icon verdrahtet, einschließlich Round-Icon-Pfad.
- Paketname: `cloud.kosch.pizzascan`.
- CI prüft Unit-/Regressionstests, Browser-/Playwright-Smokes, gepackte APK-Web-UI, Signatur/Package, lokale KI-Modelle und Android-16-Installation/Start.

## 🎯 Suchzentrum & einstellbarer Radius

Bei einer aktiven Suche markiert PizzaScan das Zentrum der letzten Suche als kleinen Kartenmarker. Bei einem festen Radius wird zusätzlich ein dezenter Kreis eingeblendet. So bleibt sichtbar, worauf sich die aktuellen Treffer beziehen – auch wenn die Karte danach bewegt oder gezoomt wird.

In den Einstellungen lässt sich der Suchradius über einen Schieberegler von **0 bis 10 km in 0,5-km-Schritten** einstellen:

- `0 km` = aktueller Kartenausschnitt
- `0,5–10 km` = fester Radius um das aktive Suchzentrum
- ein ausgewählter Ort wird als Suchzentrum übernommen
- „Hier suchen“ setzt die aktuelle Kartenmitte als neues Suchzentrum
- bei automatischer Suche folgt das Suchzentrum der letzten tatsächlich ausgelösten Kartensuche
- beim Beenden der Suche bzw. Wechsel zurück zu GPS wird die temporäre Suchmarkierung entfernt

## 🛡️ Build-41-Hardening

- **Offline-first:** bekannte Places bleiben aus dem lokalen Cache nutzbar, auch wenn der Live-Abruf ausfällt.
- **Fallback statt Nullzustand:** scheitert ein Live-Provider, bleibt ein vorhandener Cache sichtbar; Build 40 behält zusätzlich seine Mehrquellen-/Provider-Union.
- **Datenvertrauen:** offene Ratings zeigen eine heuristische Confidence aus Bewertungsmenge und Aktualität. Sie ist ausdrücklich keine Wahrheitswahrscheinlichkeit.
- **Signal-Mix:** verfügbare Signale können transparent auf eine 0–10-Skala zusammengeführt werden – offene Mangrove-Ratings, eigene bestätigte Besuche, experimentelle Foto-KI und Google-Maps-Daten nur dann, wenn diese in der aktuellen Sitzung ausdrücklich geladen wurden.
- **Marker-Priorisierung:** bei großen Treffermengen bleiben alle Treffer erhalten, weniger relevante Marker werden bei weitem Zoom lediglich visuell zurückgenommen statt gelöscht.
- **Lokaler Fotovergleich:** vorhandene Fotoanalysen können gegen andere lokal gespeicherte Analysen mit demselben Modell eingeordnet werden; keine globale Rangliste.
- **Pizza-Radar:** Discovery-Sortierung für interessante Orte im aktuellen Bereich nach Nähe, Öffnungsstatus, Pizza-Evidence und – sofern vorhanden – besser gestützten Ratings.
- **Recovery:** lokales Runtime-Fehlerprotokoll und Reparatur temporärer Such-/Karten-/Rating-Caches ohne Favoriten, persönliche Bewertungen, Einstellungen oder Offline-Modelle zu löschen.
- **Privacy Dashboard:** kompakte Übersicht, welche Daten lokal bleiben und wann externe Karten-/Rating-/Modelldienste angesprochen werden.
- **Health Check:** Status von Runtime, Karte/Cache, Netzwerk, GPS, Speicher, Datenquellen, Suchradius, offenen Ratings, Offline-KI und Recovery-Log.

## 🍕 Suche ohne künstliche Trefferobergrenze

PizzaScan verwendet die ursprüngliche WebSim-/OSM-Idee als Basis und erweitert sie für dichte Städte und unvollständige Quelldaten. Die Suche arbeitet im aktuellen Kartenausschnitt oder im gewählten Radius und führt passende OSM-Treffer mehrerer Overpass-Quellen zusammen, statt die Anzeige auf eine feste Anzahl wie 20, 50 oder 100 Orte zu begrenzen.

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

| Symbol | Kategorie |
|---|---|
| 🍕 | Pizzeria / bestätigter Pizza-Ort |
| ☕ | Café |
| 🍔 | Imbiss / Fast Food / Takeaway |
| 🚚 | Foodtruck |
| 🤖 | Pizzaautomat |
| 🍝 | italienischer bzw. sonstiger pizza-relevanter Kandidat |

## 🔐 Datenschutz & Datenquellen

PizzaScan ist local-first. Eigene Fotos, Fotoanalysen, persönliche Bewertungen und Review-Entwürfe werden nicht als zentraler PizzaScan-Datensatz hochgeladen. Live-Kartensuche nutzt OpenStreetMap-/Overpass-/Photon-Dienste; optionale offene Bewertungen nutzen Mangrove/Open Reviews. Google und Microsoft werden für Coverage-Cross-Checks nur als externe Zielseiten geöffnet, sofern ihre Daten nicht über eine separat lizenzierte, providerkonforme Integration genutzt werden.

Externe Dienste können eigene Datenschutz- und Nutzungsbedingungen haben. Die App versucht deshalb nicht, proprietäre POI-Datenbanken in den OpenStreetMap-Index zu spiegeln oder dauerhaft zu kopieren.

## 🧪 Release-Qualität

Build 41 wird nur veröffentlicht, wenn die automatisierten Unit-/Regressionstests, Web-/Playwright-Smokes, gepackte APK-Web-UI, Android-Lint/Instrumentierung, Android-16-Starttest sowie reale lokale CLIP-/SigLIP-Modelltests erfolgreich durchlaufen. Die Coverage-Tests prüfen zusätzlich Bars/Pubs und Pizza-Hinweise in mehreren Schriftsystemen.

---

<p align="center"><strong>By KoSch · <a href="https://kosch.cloud">kosch.cloud</a></strong><br>
Based on <a href="https://pizzascan.on.websim.com">pizzascan.on.websim.com</a> ❣️</p>
