# PizzaScan Changelog

Dieses Changelog dokumentiert die öffentlich im Repository erhaltenen PizzaScan-Teststände. Die APKs unter `downloads/` sind technische Vorabversionen für Geräte-, Regressions- und Funktionsprüfungen; sie sind nicht mit dem späteren geschlossenen Google-Play-Test gleichzusetzen.

## 2.3.4 — aktueller Release-Kandidat · 14.09.2026

Aktueller Quellstand: `versionCode 24`, `versionName 2.3.4`.

2.3.4 konsolidiert die 2.3.3-Maintenance-Line und markiert den Stand, mit dem die Suche/POI-Erfassung vor dem Google-Play-Test wieder stabilisiert und anschließend eingefroren werden soll.

### Suche, Karte und POIs

- Die settings-aware Discovery-Schicht wurde aus der Runtime entfernt, damit Filter nicht mehr beeinflussen, welche Restaurants überhaupt erst geladen werden.
- Neue Reihenfolge: POIs vollständig laden → normalisieren → zusätzliche Pizza-/Review-Evidenz ergänzen → erst danach optional filtern.
- Android nutzt für Overpass einen nativen HTTPS-Transport mit fester Allowlist, damit die primäre POI-Erfassung nicht von WebView-CORS abhängt.
- Standardmäßig werden benannte gastronomische POIs aller Küchen als Kandidaten berücksichtigt: `restaurant`, `fast_food`, `cafe`, `food_truck`, `takeaway`, `food_court`, `bar`, `pub` und `biergarten`.
- Pizzeria-, Ristorante-, Trattoria-, Osteria-, Italian-/Italiano-/Italiana-, Pasta- und Pizza-Signale bleiben zur Klassifizierung und späteren Filterung erhalten.
- Photon bleibt Ergänzung/Fallback und ersetzt nicht die primäre Overpass-POI-Liste.
- Neue Regressionstests stellen sicher, dass gewöhnliche Restaurants/Cafés/Pubs im breiten Default nicht durch Pizza-/Rating-/Reviewfilter aus der Basismenge verschwinden.
- Neue Default-/Cache-Migration verwirft restriktive Suchzustände aus den problematischen Zwischenbuilds einmalig.

### Filter und Bewertungen

- Default: alle Place-Typen, 10 km, kein „nur geöffnet“, keine Mindestbewertung, keine Ausblendung besuchter Orte.
- Mindestbewertung 0,0–5,0 in 0,1-Schritten bleibt als bewusst gesetzter Anzeige-Filter erhalten.
- Mangrove/Open Reviews bleibt die kostenlose offene Bewertungsquelle.
- Review-Evidence kann Pizza-Bezug aus offenen Rezensionen ableiten, ohne den vollständigen Rezensionstext dauerhaft als POI-Merkmal zu speichern.
- Externe Portal-Suchlinks für Google Maps, Tripadvisor und Yelp bleiben erhalten.
- Optionale Google-Places-Integration mit eigenem API-Key bleibt vollständig optional.

### Android, KI und UX

- Android 8+ / `minSdk 26`, Target SDK 36.
- Persistente lokale Modellablage für CLIP B/32, CLIP B/16 und SigLIP B/16.
- Fotoanalyse mit 25 sichtbaren Kriterien und 100 simulierten Gewichtungsperspektiven.
- Review Builder, fünfsprachige Oberfläche (DE/EN/IT/ES/FR), gehärtete Netzwerk-/WebView-Pfade und Android-16-Smoke-Test in CI.
- Build 24 erzeugt neben den technischen APKs bereits ein validiertes Release-AAB-Artefakt; der endgültige Google-Play-Upload erfolgt erst nach erfolgreicher Geräteabnahme der POI-Suche.

## 2.3.3 — archivierte Maintenance-Line · 14.09.2026

2.3.3 war die intensive Maintenance- und Experimentierlinie für Ratings, Reviews, Filter, Search-Fallbacks, POI-Recovery, Offline-KI, Mehrsprachigkeit und Play-Store-Vorbereitung. Die späteren Builds zeigten eine Regression der POI-Vollständigkeit; 2.3.4 trennt deshalb Discovery und Filterung wieder strikt.

Die zuletzt veröffentlichte 2.3.3-Test-APK bleibt für Regressionstests im Archiv erhalten.

[⬇️ PizzaScan 2.3.3 Test-APK](https://raw.githubusercontent.com/chekento/Pizzascan/main/downloads/PizzaScan-2.3.3-Test.apk)

## 2.3.2 — archivierter Teststand · 14.09.2026

- Erhaltener technischer Zwischenstand der 2.3-Linie.
- Dient insbesondere zum Vergleich von Karten-, Such-, Rating- und UI-Verhalten vor den späteren POI-/Fallback-Umbauten.

[⬇️ PizzaScan 2.3.2 Test-APK](https://raw.githubusercontent.com/chekento/Pizzascan/main/downloads/PizzaScan-2.3.2-Test.apk)

## 2.3.1 — archivierter Teststand · 14.09.2026

- Früher Android-Zwischenstand der 2.3-Linie für Regressionstests.

[⬇️ PizzaScan 2.3.1 Test-APK](https://raw.githubusercontent.com/chekento/Pizzascan/main/downloads/PizzaScan-2.3.1-Test.apk)

## 2.3.0 — archivierter 2.3-Basisstand · 13.09.2026

Der validierte 2.3-Basisstand führte insbesondere kostenlose offene Ratings, Mindestbewertungsfilter, stabilere Kartenmarker, fünfsprachige Oberfläche, externe Bewertungsportal-Links und aktualisierte Store-Assets zusammen.

[⬇️ PizzaScan 2.3.0 Test-APK](https://raw.githubusercontent.com/chekento/Pizzascan/main/downloads/PizzaScan-2.3.0-Test.apk)

## Download-Archiv und Prüfsummen

Alle erhaltenen APKs, Dateigrößen, SHA-256-Prüfsummen und Downgrade-Hinweise stehen unter [downloads/README.md](downloads/README.md).

> **Downgrade-Hinweis:** Android installiert normalerweise keinen niedrigeren `versionCode` über einen höheren. Für einen echten Rücktest kann eine Deinstallation erforderlich sein. Dadurch können lokal gespeicherte PizzaScan-Daten und Offline-Modelle gelöscht werden. Vorher Backup/Export verwenden.
