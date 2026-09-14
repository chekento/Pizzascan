# PizzaScan Changelog

## 2.3.4 — aktuelle Direktversion · 14.09.2026

Aktueller Stand: `versionCode 25`, `versionName 2.3.4`, Android-Paket `cloud.kosch.pizzascan`.

2.3.4 konsolidiert die POI-/Suchstabilisierung und wird als direkt installierbare **PizzaScan-2.3.4.apk** veröffentlicht. Der aktuelle App- und Dateiname enthält keinen zusätzlichen Test-Namenszusatz.

### Präzise Suche und POIs

- Discovery und Filterung sind strikt getrennt: gastronomische POIs werden zuerst geladen und normalisiert, optionale Filter greifen erst danach.
- Standardmäßig: 10 km, alle Place-Typen, keine Mindestbewertung, kein „nur geöffnet“, keine automatische Ausblendung besuchter Orte.
- Benannte `restaurant`, `fast_food`, `cafe`, `food_truck`, `takeaway`, `food_court`, `bar`, `pub` und `biergarten` werden unabhängig von der Küche als Kandidaten berücksichtigt.
- Eine ausdrücklich abgesendete Restaurant-/POI-Suche wird zusätzlich direkt gegen OpenStreetMap/Overpass abgeglichen.
- Der neue POI-Abgleich bewertet Name, Adresse, Ortsbezug, OSM-Identität und Entfernung; identische OSM-Objekte werden dedupliziert und exakte Namens-/Ortskombinationen werden priorisiert.
- Suchvarianten wie `Pizza Max Ahrensburg` werden in sichere, regex-escaped Namensvarianten zerlegt, ohne rohe Benutzereingaben als Overpass-RegEx zu übernehmen.
- Die direkte POI-Suche ist auf den gewählten Suchradius bzw. maximal 10 km um den Kartenmittelpunkt begrenzt.
- Photon bleibt für Vorschläge und Orts-/Adresssuche aktiv; bei ausdrücklich abgesendeten Suchanfragen kann kontrolliert Nominatim als Fallback dienen.
- Zusätzliche Overpass-Recovery-Provider bleiben für dünne oder ausgefallene POI-Antworten aktiv.
- Android nutzt für Overpass den nativen HTTPS-Transport mit fester Allowlist.

### APK und Packaging

- Neuer `direct`-Build: nicht debuggable, gleicher Paketname wie die App (`cloud.kosch.pizzascan`), installierbar signiert und ohne `.lang1`-/`-lang1`-Namenszusatz.
- Veröffentlichter Dateiname: `downloads/PizzaScan-2.3.4.apk`.
- CI prüft Signatur, Package-ID und App-Label der tatsächlich veröffentlichten APK.
- Die Playwright-Abnahme läuft gegen die aus genau dieser APK extrahierten Web-Assets.
- Android-16-CI installiert und startet zusätzlich die Direkt-APK selbst.
- Parallel wird weiterhin ein validiertes Release-AAB für die Google-Play-Vorbereitung erzeugt.

### Filter und Bewertungen

- Mindestbewertung 0,0–5,0 in 0,1-Schritten.
- Mangrove/Open Reviews als kostenlose offene Bewertungsquelle.
- Review-Evidence kann Pizza-Bezug aus offenen Rezensionen ableiten, ohne vollständige Rezensionstexte als POI-Merkmal dauerhaft zu speichern.
- Externe Links zu Google Maps, Tripadvisor und Yelp.
- Optionale Google-Places-Integration mit eigenem API-Key bleibt freiwillig.

### Android, lokale KI und UX

- Android 8+ / `minSdk 26`, Target SDK 36.
- CLIP B/32, CLIP B/16 und SigLIP B/16 als lokale ONNX/WASM-Modelle mit persistenter Modellablage.
- Fotoanalyse mit 25 sichtbaren Kriterien und 100 simulierten Gewichtungsperspektiven.
- Review Builder und Oberfläche in DE / EN / IT / ES / FR.
- Datenschutzerklärung und In-App-Versionsanzeige sind auf 2.3.4 synchronisiert.

## 2.3.3 — archivierte Maintenance-Line · 14.09.2026

2.3.3 war die intensive Maintenance- und Experimentierlinie für Ratings, Reviews, Filter, Search-Fallbacks, POI-Recovery, Offline-KI, Mehrsprachigkeit und Play-Store-Vorbereitung. Spätere Zwischenstände zeigten eine Regression der POI-Vollständigkeit; 2.3.4 trennt deshalb Discovery und Filterung wieder strikt.

Die zuletzt veröffentlichte 2.3.3-APK bleibt für Regression im Archiv erhalten.

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
