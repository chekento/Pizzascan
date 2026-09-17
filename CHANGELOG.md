# PizzaScan Changelog

## 2.3.6 — aktuelle Direktversion · 17.09.2026

Aktueller Stand: `versionCode 41`, `versionName 2.3.6`, Android-Paket `cloud.kosch.pizzascan`.

### Build 41 — Suchzentrum, Radiussteuerung und Production-Hardening

- Aktive Suchen erhalten einen kleinen **Suchzentrum-Marker**. Ein ausgewählter Ort wird als Zentrum übernommen; „Hier suchen“ verwendet die Kartenmitte. Bei einem festen Radius erscheint zusätzlich ein dezenter temporärer Radiuskreis.
- Der Suchbereich ist in den Einstellungen jetzt als **Schieberegler von 0 bis 10 km in 0,5-km-Schritten** konfigurierbar. `0 km` bedeutet weiterhin aktueller Kartenausschnitt.
- Offline-/Fehlerfälle sind robuster: bekannte Places bleiben aus dem Cache sichtbar; ein fehlgeschlagener Live-Abruf löscht vorhandene Ergebnisse nicht. Temporäre Karten-/Such-/Rating-Caches können gezielt repariert werden, ohne Favoriten, eigene Bewertungen, Einstellungen oder Offline-Modelle zu entfernen.
- Offene Ratings zeigen optional ein **Datenvertrauen** aus Stichprobengröße und Aktualität. Dieser Wert ist ausdrücklich keine Wahrheitswahrscheinlichkeit.
- Neuer transparenter **Signal-Mix** auf 0–10: Mangrove/Open Reviews, eigene bestätigte Besuche, experimentelle Foto-KI und Google-Maps-Daten nur dann, wenn sie in der aktuellen Sitzung ausdrücklich geladen wurden. Externe Bewertungsportale werden nicht gescraped.
- Große Markermengen bleiben vollständig erhalten; bei weitem Zoom werden niedriger priorisierte Marker lediglich visuell zurückgenommen statt aus der Datenmenge entfernt.
- Fotoanalysen können lokal gegen andere gespeicherte Analysen desselben Modells als Perzentil eingeordnet werden. Das ist ein lokaler Vergleich und keine globale Rangliste.
- Neuer **Pizza-Radar** für Discovery im aktuellen Suchbereich, gewichtet nach Entfernung, Öffnungsstatus, Pizza-Evidence und – falls vorhanden – besser gestützten Ratings.
- Neuer **Health Check** für Runtime, Karte/Cache, Netzwerk, GPS, Speicher, Datenquellen, Radius, offene Ratings, Offline-KI und Recovery-Log.
- Neues **Privacy Dashboard** erläutert kompakt, was lokal bleibt und wann Karten-, Bewertungs- oder Modelldienste angesprochen werden.
- Runtime-Fehler werden lokal in einem begrenzten Recovery-Log erfasst; URLs werden dabei redigiert.
- Build 41 sitzt auf der vollständigen Mehrquellen-/GPS-/Cache-Logik aus Build 40. Die Provider-Union, persistente Place-Historie und Existenz-Revalidation bleiben erhalten.
- CI enthält zusätzliche Tests für Radiusnormalisierung, Datenvertrauen, Signal-Fusion, Radar-Ranking und lokalen Fotovergleich.

[⬇️ PizzaScan 2.3.6 APK](https://raw.githubusercontent.com/chekento/Pizzascan/main/downloads/PizzaScan-2.3.6.apk)

## 2.3.5 — archivierte Direktversion · 16.09.2026

Der 2.3.5-Zweig stabilisierte die vollständige Discovery, dauerhafte Orts-/Besuchshistorie und den Mehrquellen-/GPS-/Cache-Pfad, der in Build 41 weiterverwendet wird.

### Build 40 — GPS-first, vollständige Mehrquellen-Union und Cache-Revalidation

- Startsuche wartet auf die angeforderte GPS-Position, statt parallel mit einem veralteten Standardzentrum zu starten.
- Alle freigegebenen Overpass-Quellen werden parallel abgefragt und erfolgreiche Ergebnisse nach OSM-Identität vollständig vereinigt.
- Bekannte Orte werden persistent gehalten und bei Start wiederhergestellt.
- Cache-Revalidation prüft gespeicherte OSM-Identitäten auf Existenz, ohne dünne Providerantworten als vollständigen Ersatzbestand zu behandeln.
- Manueller vollständiger Refresh und schnelle Ortssuche wurden als Werkzeuge ergänzt.

### Build 38 — vollständige Discovery + dauerhafte Orts- und Besuchshistorie

- Behebt die Build-37-Regression mit zu wenigen Treffern: Die vier freigegebenen Overpass-Kartenquellen werden parallel abgefragt und **alle erfolgreichen Antworten vollständig zusammengeführt**, statt nach dem ersten Treffer bzw. einem kurzen 3,5-Sekunden-Fenster zurückzukehren.
- Die Zusammenführung ist nach OSM-Identität dedupliziert und besitzt **keine künstliche Trefferzahl-Obergrenze**. Bereits lokal bekannte passende Orte im aktuellen Suchgebiet werden zusätzlich in die Ergebnismenge aufgenommen, sodass eine dünne Einzelantwort die Karte nicht mehr verkleinert.
- Der reguläre Startbereich bleibt bei **5 km**. Ein Start-Race, das eine absichtlich abgebrochene Erstanfrage fälschlich als Nulltreffer behandelte und den Radius auf 10 km hochsetzte, wurde entfernt. Auch die einmalige 5-km-Migration wartet jetzt korrekt, bis die App-Einstellungen verfügbar sind.
- Die ursprünglichen WebSim-Pizza-/Italienisch-Familien bleiben Basis der Umgebungssuche und werden um belastbare Varianten ergänzt: mehrteilige Cuisine-Tags, Ristorante/Trattoria/Osteria-Namen, Pizza-Spezialität/Produkte sowie Pizza-Hinweise in Menü-, Beschreibungs- und Notiz-Metadaten. Offensichtlich fachfremde Gastro-POIs bleiben ausgeschlossen.
- Gefundene Orte werden vollständig in **IndexedDB** gespeichert. Beim nächsten Start wird nach Initialisierung der Karte der komplette lokale Ortsbestand wieder eingespielt, bevor neue Ergebnisse ihn verdrängen können. Der kleine LocalStorage-Cache bleibt nur schneller Boot-Fallback.
- Besuchte und selbst bewertete Orte werden separat dauerhaft gespeichert. Spätere Kartensuchen können diese Historie nicht löschen.
- Neuer Filter: **nur bereits besuchte und selbst bewertete Orte** anzeigen. Er ist mit dem vorhandenen „Besuchte ausblenden“-Filter gegenseitig konsistent.
- Besuchs- und Bewertungshistorie kann als menschenlesbares **Markdown-Archiv** gesichert und wieder geladen werden.
- Eigene Bewertungen können optional zu **Open Reviews / Mangrove** beigetragen werden. Veröffentlichung erfolgt ausschließlich nach ausdrücklichem manuellen Antippen; es gibt keinen automatischen Upload und keine Community-Funktion.
- Die bisherige 100-Karten-Anzeigegrenze wird für die lokale Ergebnisliste aufgehoben; große Ergebnismengen werden intern in 100er-Blöcken gerendert, ohne Treffer abzuschneiden.
- CI deckt jetzt u. a. vollständige Provider-Union, 5-km-Startbaseline, Cache-/Visit-Restoration, keine Result-Caps, Markdown-Roundtrip, optionale Open-Reviews-Publikation, Android-Lint/Build, gepackte UI und Android-16-Smoke ab.

### Build 37 — Persistenz- und Open-Reviews-Zwischenstand

Build 37 führte die dauerhafte Orts-/Besuchshistorie, Markdown-Sicherung und die optionale Open-Reviews-Publikation ein. Die Discovery konnte jedoch durch einen zu frühen Multi-Provider-Return und einen Startup-Race weniger Treffer als frühere Builds zeigen. Build 38 ersetzt diesen Stand.

### Build 36 — Dense-City-Discovery

- Erweiterte die WebSim-Familien um mehrteilige Cuisine-Tags und italienische Namenssignale für dichter besiedelte Gebiete.
- Führte zusätzliche Overpass-Spiegel in die Discovery ein.

### Build 35 — wiederhergestellte WebSim-Suche

- Rückkehr zur bewährten ursprünglichen WebSim-/ZIP-Logik für die automatische Umgebungssuche.
- Aktueller Kartenausschnitt bzw. 5-km-Basis statt heuristischer generischer Restaurant-Inferenz.
- Nutzerseitig auf Android als deutlich besser funktionierender Treffermengen-Stand bestätigt.

### Build 28 — WebSim-Basis + Pizza-Evidence statt generischer Gastro-Treffer

- Die automatische Umgebungskarte übernimmt wieder gezielt die Pizza-/Italienisch-Gruppen der ursprünglichen WebSim-App statt pauschal jedes benannte Restaurant, Café, Fast-Food-Lokal, jede Bar oder jeden Pub als Pizza-Kandidaten zu behandeln.
- Die WebSim-Basis bleibt erhalten: Pizza-Küche, italienische Restaurants, entsprechende Cafés/Imbisse/Foodtrucks/Takeaways/Bars/Pubs, Pizza-Spezialität, Pizza im Namen oder in der Beschreibung sowie Pizzaautomaten.
- Zusätzliche Gastro-POIs benötigen nun ein ausdrückliches Pizza-Signal in strukturierten Daten, Beschreibung/Notiz, Produktdaten oder Speisekarten-Metadaten.
- Die Recovery nutzt mehrere Overpass-Endpunkte, erweitert bei dünnen Antworten aber nicht mehr auf generische Restaurants, nur um eine Zielanzahl an Treffern zu erreichen.
- Ein neuer Cache-Marker verwirft einmalig alte breite Karten-/Photon-Recovery-Caches aus 2.3.4. Gemerkte Orte und persönliche Daten bleiben erhalten.
- Die bewusste manuelle Restaurant-/POI-Suche bleibt breit: Ein Nutzer kann weiterhin ein konkretes Restaurant suchen und prüfen, auch wenn dessen OSM-Daten noch keinen Pizza-Nachweis enthalten.
- Optional geladene Google-Maps-Rezensionen werden ausschließlich in der laufenden Sitzung auf ein tatsächliches Pizza-Schlüsselwort geprüft; ein positiver Treffer kann den bereits geöffneten Ort als Pizza-belegt markieren. Rezensionstexte werden nicht dauerhaft gespeichert und Google wird nicht massenhaft automatisch abgefragt.
- POI-Typisierung und Kartenlegende sind synchronisiert: 🍕 Pizzeria, ☕ Café, 🍔 Imbiss/Takeaway, 🚚 Foodtruck, 🤖 Pizzaautomat und 🍽️ Restaurant/Bar/weiterer Pizza-Ort.
- Ein italienisches Restaurant aus der WebSim-Basis wird ohne zusätzliches Pizza-Signal nicht mehr fälschlich als 🍕 Pizzeria umetikettiert.

## 2.3.4 — archivierte Direktversion · 14.09.2026

2.3.4 konsolidierte die POI-/Suchstabilisierung und wurde als direkt installierbare **PizzaScan-2.3.4.apk** veröffentlicht. Die breite Recovery konnte in dünn besiedelten Suchgebieten jedoch zusätzliche generische Gastro-POIs in die Discovery einbeziehen. 2.3.5 zieht deshalb die automatische Umgebungssuche wieder auf die ursprüngliche WebSim-Auswahl plus nachweisbare Pizza-Evidence zusammen.

### Build 26 — vollständige POI-Kategorien und Suchreparatur

- Die sichtbaren Kategorien waren vollständig Teil von Discovery und manueller Suche: 🍕 Pizzeria, ☕ Café, 🍔 Imbiss, 🚚 Foodtruck, 🤖 Pizzaautomat und 🍽️ Weitere Orte.
- Kategorien wurden semantisch über OSM-Tags gesucht.
- Pizzaautomaten wurden ausdrücklich über `vending=pizza`, `vending:pizza=yes` und entsprechende Vending-Merkmale abgefragt.
- ⭐ Gemerkt, ✓ Besucht und 📍 Dein Standort wurden lokale Suchzustände.
- Die direkte POI-Suche bewertete Kategorie, Name, Adresse, Ortsbezug, OSM-Identität und Entfernung.
- Android nutzte für Overpass den nativen HTTPS-Transport mit fester Allowlist.

### APK und Packaging

- `direct`-Build: nicht debuggable, gleicher Paketname wie die App (`cloud.kosch.pizzascan`), installierbar signiert und ohne `.lang1`-/`-lang1`-Namenszusatz.
- CI prüft Signatur, Package-ID und App-Label der tatsächlich veröffentlichten APK.
- Parallel wird ein validiertes Release-AAB für die Google-Play-Vorbereitung erzeugt.

### Filter und Bewertungen

- Mindestbewertung 0,0–5,0 in 0,1-Schritten.
- Mangrove/Open Reviews als kostenlose offene Bewertungsquelle.
- Externe Links zu Google Maps, Tripadvisor und Yelp.
- Optionale Google-Places-Integration mit eigenem API-Key.

### Android, lokale KI und UX

- Android 8+ / `minSdk 26`, Target SDK 36.
- CLIP B/32, CLIP B/16 und SigLIP B/16 als lokale ONNX/WASM-Modelle mit persistenter Modellablage.
- Fotoanalyse mit 25 sichtbaren Kriterien und 100 simulierten Gewichtungsperspektiven.
- Review Builder und Oberfläche in DE / EN / IT / ES / FR.

## 2.3.3 — archivierte Maintenance-Line · 14.09.2026

2.3.3 war die intensive Maintenance- und Experimentierlinie für Ratings, Reviews, Filter, Search-Fallbacks, POI-Recovery, Offline-KI, Mehrsprachigkeit und Play-Store-Vorbereitung.

[⬇️ PizzaScan 2.3.3 Archiv-APK](https://raw.githubusercontent.com/chekento/Pizzascan/main/downloads/PizzaScan-2.3.3-Test.apk)

## 2.3.2 — archivierter Vergleichsstand · 14.09.2026

- Erhaltener Zwischenstand der 2.3-Linie zum Vergleich von Karten-, Such-, Rating- und UI-Verhalten.

[⬇️ PizzaScan 2.3.2 Archiv-APK](https://raw.githubusercontent.com/chekento/Pizzascan/main/downloads/PizzaScan-2.3.2-Test.apk)

## 2.3.1 — archivierter Vergleichsstand · 14.09.2026

- Früher Android-Zwischenstand der 2.3-Linie.

[⬇️ PizzaScan 2.3.1 Archiv-APK](https://raw.githubusercontent.com/chekento/Pizzascan/main/downloads/PizzaScan-2.3.1-Test.apk)

## 2.3.0 — archivierter 2.3-Basisstand · 13.09.2026

Der validierte 2.3-Basisstand führte insbesondere kostenlose offene Ratings, Mindestbewertungsfilter, stabilere Kartenmarker, fünfsprachige Oberfläche, externe Bewertungsportal-Links und aktualisierte Store-Assets zusammen.

[⬇️ PizzaScan 2.3.0 Archiv-APK](https://raw.githubusercontent.com/chekento/Pizzascan/main/downloads/PizzaScan-2.3.0-Test.apk)

## Download-Archiv und Prüfsummen

Alle erhaltenen APKs und Prüfsummen stehen unter [downloads/README.md](downloads/README.md).