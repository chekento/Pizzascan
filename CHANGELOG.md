## 2.3.22 · Build 57

- Synchronisiert den persönlichen Score live zwischen Popup, „Mein Besuch“, Place-Detail und Rezensionsbaukasten.
- Übernimmt vorhandene Besuchsscores in den gemeinsamen lokalen Score-Speicher und hält das Besuchsarchiv bei Änderungen aktuell.
- Übersetzt spät erzeugte Karten-, Review-, Backup-, Besuchsarchiv-, Open-Reviews- und Coverage-Inhalte in Deutsch, Englisch, Italienisch, Spanisch und Französisch.
- Startet nach GPS-Zentrierung automatisch eine Suche im tatsächlich sichtbaren neuen Kartenausschnitt.
- Behält die Vollbildkarte als reine Kartenansicht mit POIs und Popups ohne nachgelagerte POI-Liste.

## 2.3.21 · Build 56

- Beschleunigt die Suche: die erste erfolgreiche POI-Antwort wird sofort gerendert, spätere OSM-Spiegel werden progressiv zusammengeführt und passende Antworten werden 15 Minuten zwischengespeichert.
- Die automatische Suche bleibt vollständig WebSim-kompatibel und deckt Pizza, Pizzeria, Trattoria, Ristorante, Osteria, italienische Cuisine sowie die übrigen relevanten OSM-Signale im sichtbaren Kartenausschnitt ab.
- Kartenbewegungen lösen die Suche schneller aus; die Lupe dreht sich nicht mehr, der Suchbutton zeigt den laufenden Abruf mit einer klaren Puls-/Busy-Animation.
- Die Suchleiste schlägt Adressen und Restaurants vor und unterstützt alle relevanten Gastro-Kategorien.
- Import und Export sind im Settings-Bereich sichtbar. Orte, Koordinaten, gemeinsame 0,1–10,0-Bewertungen, Besuche, Favoriten und Rezensionen werden zusammengeführt statt überschrieben; die Sammlung wurde mit 12.000 Orts-/Bewertungsdatensätzen geprüft. Große Android-Exporte werden auf dem Gerät gestreamt und bis 512 MB begrenzt.
- Place-Detail, eigene Bewertung und Rezension verwenden je Ort denselben synchronisierten Bewertungswert. Einklappbare Details und Einstellungen bleiben gespeichert.

## 2.3.20 · Build 55

- Repariert die zuletzt fehlenden WebSim-/OSM-Suchergebnisse: Die automatische Suche bleibt im sichtbaren Karten-BBOX und deckt neben Pizza auch Trattoria, Ristorante, Osteria, italienische Küche und die übrigen relevanten Gastro-Signale ab.
- Startet die erste Places-Suche nach der Standortfreigabe automatisch und sucht nach jeder Kartenbewegung im neuen Ausschnitt; das Suchsymbol zeigt jeden laufenden Abruf animiert an.
- Die Suchleiste liefert lokale Restaurant-/POI-Vorschläge und kann Adressen gezielt geocodieren, ohne die manuelle Suche von der Restaurant-Suche zu trennen.
- POI-Popups schließen nicht mehr unmittelbar nach dem Antippen; Detailbereiche lassen sich einklappen und die Zustände bleiben gespeichert.
- Import und Export speichern die vollständige Sammlung aus Orten, Koordinaten, eigenen 0,1–10,0-Bewertungen, Besuchen, Favoriten und Rezensionen. Der IndexedDB-/JSON-Pfad ist für mehr als 1.000 bewertete Orte ausgelegt; die Android-Brücke überträgt große Exporte in Chunks.
- Place-Details, Review Builder und Export/Import verwenden pro Ort denselben synchronisierten 0,1–10,0-Wert. Der Google-Abschnitt erscheint ausschließlich bei hinterlegtem Google-API-Schlüssel.

## 2.3.19 · Build 54

- Repariert die letzte Build-54-Smoke-Test-Regression und liefert die verifizierte APK jetzt nach erfolgreichem Android-16-Emulator-Test aus.
- Startet die Kartensuche nach der Standortfreigabe automatisch und verwendet weiterhin die vollständige WebSim-Suchabdeckung für Pizza, Pizzeria, Trattoria, Ristorante, Osteria, italienische Küche und verwandte Gastro-Signale.
- Stabilisiert POI-Popups und Detailseiten, merkt sich einklappbare Bereiche sowie Einstellungen und hält den gemeinsamen Bewertungswert von 0,1 bis 10,0 für Place und Rezension synchron.
- Ermöglicht den lokalen Import und Export kompletter Sammlungen aus Orten, eigenen Bewertungen und Rezensionen; der Google-Abschnitt erscheint nur mit hinterlegtem API-Schlüssel.

## 2.3.18 · Build 53

- Behebt den letzten Android-Transportfehler: Der native Overpass-Failover wird jetzt auch auf der tatsächlich verwendeten `placeService`-Instanz installiert, obwohl die Karten-Härtung deren `json`-Methode überschreibt.
- Dadurch bleibt die vollständige WebSim-Abfrage mit Trattoria, Ristorante, Osteria, Pizza-/Italien-Signalen und weiteren relevanten OSM-POIs auch bei einem Ausfall des Primärservers verfügbar.

## 2.3.17 · Build 52

- Repariert den Android-Kartenabruf mit nativer Overpass-Mirror-Kette: dieselbe WebSim-Abfrage wird bei einem Ausfall von `overpass-api.de` automatisch über freigegebene OSM-Endpunkte wiederholt.
- Aktiviert die POI-Recovery erst nach dem Erzeugen des Ort-Services, damit zusätzliche Treffer wie Trattoria, Ristorante, Osteria und weitere passende OSM-Gastro-Orte zuverlässig berücksichtigt werden.
- Behält die vollständige WebSim-Suchabdeckung ohne künstliches Ergebnislimit und die moderne Kartenoberfläche bei.

## 2.3.16 · Build 51

- Modernizes the map UI for 2026: larger map surface, glass controls, clearer live status, responsive cards, floating navigation and refined dark mode.
- Restores complete WebSim-oriented discovery coverage for Pizza, Pizzeria, Trattoria, Ristorante, Osteria, Tavola, Taverna, Italian cuisine, pizza vending and related gastro signals.
- Searches cuisine, cuisine:it, restaurant:type, name, brand, official/alternative name, operator, description, speciality and product signals; generic named food venues remain visible and are not mislabeled as pizza.
- Uses the Overpass body-center output so OSM ways and relations keep their stable map position instead of disappearing for missing node coordinates.
- Adds explicit Trattoria/Ristorante/Osteria categories and keeps all place types, unrated places, closed places and visited places visible by default; every option remains configurable.
- Updates the app to version 2.3.16, Build 51 and prepares the direct APK download on the repository front page.

## 2.3.15 · Build 50

- Fixes the Android device failure where the map showed **“Kartendaten konnten nicht aktualisiert werden / Failed to fetch”** and returned zero Pizza/Italian POIs.
- Keeps the Build 49/WebSim discovery contract unchanged: current visible map BBOX, the same Pizza/Italian selector families, the same Overpass query text, automatic search after map movement, and Nominatim for explicit place/address search.
- Removes an unnecessary dependency on the generic JavaScript bridge when detecting the Android native Overpass channel.
- Sends the WebSim query through the native Android HTTPS channel first. If the primary `overpass-api.de` transport fails, the **identical query** is retried on the existing trusted Overpass mirrors before any WebView/CORS rescue path is attempted.
- Extends the Android native Overpass read budget to match the WebSim `[timeout:60]` query, uses a bounded 15-second connect timeout, and raises the guarded response limit for larger visible-map responses.
- Preserves the ultra-compact map toolbar from Build 49.
- Adds regression coverage proving mirror failover does not mutate the WebSim query and does not fall back to WebView when a native mirror succeeds.

## 2.3.14 · Build 49

- Restores the automatic map discovery to the PizzaScan WebSim source contract preserved in `source-original/script.js`: the visible Leaflet BBOX is queried directly instead of forcing a 5 km circle.
- Uses the same WebSim Pizza/Italian Overpass selector families for cuisine, Italian restaurants, pizzeria cuisine, pizza vending, matching cafés/fast-food/food-trucks, speciality, bars/pubs, pizza names/descriptions and takeaway.
- Removes Build 47/48 discovery expansion from the active path: no extra Ristorante/Trattoria/Osteria, brand/operator/dish/alt-name or Photon POI supplementation is added to automatic map discovery.
- Uses `overpass-api.de` as the WebSim discovery endpoint while retaining the Android native HTTPS bridge for transport reliability. Returned elements are passed through with the same WebSim result semantics; Build 49 does not synthesize extra centers or add result objects that the original response did not expose.
- Restores explicit place/address search to Nominatim semantics: first result, map zoom 15, then refresh the visible map area.
- Migrates Build 48's 5 km default back to WebSim viewport mode (`0 km = Kartenausschnitt`) and clears only transient map caches.
- Reworks the map controls into an ultra-compact single-row toolbar (Offen / Rating / Filter / Radar) at about 27 px height, with an approximately 24 px status + result-count + “↻ Suchen” row above the map.
- Adds regression coverage for the exact WebSim selector families, viewport-only discovery, no automatic Photon expansion, Nominatim search, toolbar height and Android runtime flags.

## 2.3.13 · Build 48

- Fixes the Android null-result regression seen with Build 47's viewport-first default by migrating that default once to a practical 5 km nearby radius.
- Keeps the targeted Pizza/Italian Overpass contract; unrelated generic restaurants remain excluded.
- Adds a bounded Photon name fallback only when every targeted Overpass response is empty, using explicit Pizza/Pizzeria/Ristorante/Trattoria/Osteria/Italian-name signals.
- Clears only transient map caches during the migration; favorites, personal ratings, visit history, drafts and downloaded AI models remain untouched.
- Redesigns the map control area into a compact responsive panel for open-now, ratings, filters and Pizza Radar.
- Moves the live search/update status from below the map to a dedicated status strip above the map, with “Hier suchen” attached to that strip.
- Keeps GPS, manual place/address search, map movement search and progressive OSM provider merging active.

## 2.3.12 · Build 47

- Complete WebSim search parity: targeted Pizza/Italian Overpass results are authoritative.
- Compact app map uses a WebSim-sized discovery envelope in viewport mode.
- Safe background OSM/Photon name supplements for pizza, pizzeria, ristorante, trattoria, osteria and Italian restaurant.
- Search bar keeps local loaded-place suggestions plus global place/address search; selecting a result immediately re-runs pizza discovery.
- GPS and map movement trigger immediate pizza discovery; map-move debounce reduced to ~180 ms.
- Generic restaurants without Pizza/Italian relevance remain excluded.

## 2.3.11 · Build 46

- Finalizes the restored WebSim-targeted Pizza/Italian discovery path.
- First successful Overpass provider renders immediately; late mirrors merge progressively.
- If every provider returns no relevant hits, the search now completes immediately instead of falling back into older layered provider chains.
- Visible-map viewport remains the default search area; fixed radius remains optional.
- Generic restaurants without Pizza/Italian evidence remain excluded.
- Personal ratings, favorites, history, drafts and downloaded AI models remain untouched.

## 2.3.10 · Build 45

- Restores the original WebSim targeted Pizza/Italian Overpass query as the authoritative discovery contract.
- Query hits are no longer discarded by a stricter second-stage evidence filter.
- One-time search migration resets legacy hidden filters: viewport search, all relevant place types, Italian enabled, open-only off, rating minimum 0.
- Default search area returns to the visible map viewport; fixed 0–10 km radius remains optional.
- First successful Overpass provider still renders immediately and later providers merge progressively.
- Auto-search after map movement is reduced to about 250 ms instead of the older ~1.1 s delay.
- Personal ratings, favorites, visit history, drafts and downloaded AI models are not reset.

## 2.3.9 · Build 44

- Restores the original WebSim Pizza/Italian discovery families as the minimum search baseline.
- Removes the legacy runtime transport that could wait for the complete provider union before returning results.
- First successful Overpass response renders immediately; additional mirrors merge progressively in the background.
- Italian restaurants stay in the original pizza filter family while remaining visually marked as unconfirmed pizza candidates.
- Generic restaurants without pizza/Italian evidence remain excluded.
- Replaces oversized search/refresh controls with a compact map toolbar and shorter cache status.

# PizzaScan Changelog

## 2.3.6 — aktuelle Direktversion · 17.09.2026

Aktueller Stand: `versionCode 41`, `versionName 2.3.6`, Android-Paket `cloud.kosch.pizzascan`.

### Build 41 — Suchzentrum, Radiussteuerung, weltweite Suche und Production-Hardening

- **Weltweite Suche ohne Länder-Default:** eine frische Installation ohne GPS startet neutral in der Weltübersicht statt an einem fest codierten deutschen oder US-amerikanischen Ort. Erst GPS, Orts-/Adresssuche oder eine bewusst gewählte Kartenregion setzt das aktive Suchgebiet.
- **Unicode-sichere Suche:** Restaurant-, Orts- und Adressnamen in nichtlateinischen Schriftsystemen bleiben erhalten und durchsuchbar, z. B. Japanisch, Chinesisch, Arabisch und Kyrillisch. Lateinische Akzente werden suchfreundlich gefaltet, ohne andere Schriftsysteme zu beschädigen.
- **Globale Geocoding-Logik:** Photon wird vor Auswahl eines Standorts ohne künstlichen Mittelpunkt abgefragt. Nach Auswahl eines Gebiets darf dessen Mittelpunkt die Suche sinnvoll priorisieren. Die Sprache wird nicht mehr fest auf Deutsch erzwungen.
- **Globale Release-Matrix:** deterministische Tests decken Europa, Nordamerika, Südamerika, Afrika, Asien, Ozeanien und einen Dateline-Fall ab. Live-Probes verwenden mehrere Weltregionen, ohne einen einzelnen öffentlichen Provider-Ausfall als App-Defekt zu behandeln.
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
- CI enthält zusätzliche Tests für Radiusnormalisierung, Datenvertrauen, Signal-Fusion, Radar-Ranking, lokalen Fotovergleich und weltweite Suche.

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
