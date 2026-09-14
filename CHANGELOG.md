# PizzaScan Changelog

Dieses Changelog dokumentiert die öffentlich im Repository erhaltenen PizzaScan-Teststände. Die APKs unter `downloads/` sind technische Vorabversionen für Geräte-, Regressions- und Funktionsprüfungen; sie sind nicht mit dem späteren geschlossenen Google-Play-Test gleichzusetzen.

## 2.3.4 — geplant / noch nicht veröffentlicht

2.3.4 ist als konsolidierter Feature- und Stabilitäts-Overhaul vorgesehen. Geplant ist, die während der 2.3.3-Maintenance-Line entstandenen Such-, POI-, Filter-, Bewertungs-, Review-, Karten-, Offline-KI-, Mehrsprachigkeits- und Play-Store-Verbesserungen in einem sauber abgenommenen Release zusammenzuführen.

Bis diese Abnahme abgeschlossen ist, bleibt die sichtbare App-Version 2.3.3; technische Zwischenstände erhalten höhere Android-`versionCode`s.

## 2.3.3 — aktuelle Maintenance-Line · 14.09.2026

Aktueller Quellstand: `versionCode 20`, `versionName 2.3.3`.

### Suche, Karte und POIs

- Breitere OpenStreetMap-/Overpass-Discovery statt ausschließlich eng getaggter Pizzerien.
- Standardmäßig werden benannte gastronomische POIs unabhängig von ihrer Küche als Kandidaten berücksichtigt: `restaurant`, `fast_food`, `cafe`, `food_truck`, `takeaway`, `food_court`, `bar`, `pub` und `biergarten`.
- Pizza-/Italian-Evidenz bleibt als Klassifizierung und Filtermerkmal erhalten, ist im breiten Default aber keine Voraussetzung dafür, auf der Karte zu erscheinen.
- Zusätzliche Erkennung für Begriffe und Tags wie Pizza, Pizzeria, Ristorante, Trattoria, Osteria, Italian/Italiano/Italiana, Pasta und verwandte OSM-Metadaten.
- Mehrstufige Recovery für dünne POI-Antworten mit zusätzlichen Overpass-Instanzen und Photon als Ergänzung statt als bevorzugtem vollständigem POI-Ersatz.
- Einmalige Cache-Migrationen verhindern, dass alte unvollständige 1–2-Orte-Ergebnisse dauerhaft weiterverwendet werden.
- Kartenmarker, Vollbild, Re-Centering, Suchstatus und Wiederherstellung nach Netz-/App-Unterbrechungen wurden gehärtet.

### Filter und Bewertungen

- Broad-by-default: alle Place-Typen, kein standardmäßiges „nur geöffnet“, keine Mindestbewertung und keine standardmäßige Ausblendung besuchter Orte.
- Mindestbewertung 0,0–5,0 in 0,1-Schritten; ein bewusst gewählter Grenzwert reduziert anschließend die sichtbare Menge.
- Kostenlose offene Ratings über Mangrove/Open Reviews.
- Review-Evidence kann Pizza-Bezug aus verfügbaren offenen Rezensionen ableiten, ohne den vollständigen Rezensionstext als dauerhaftes lokales POI-Merkmal zu speichern.
- Externe Portal-Suchlinks für Google Maps, Tripadvisor und Yelp.
- Optionale Google-Places-Integration mit eigenem API-Key; PizzaScan bleibt ohne diesen Key nutzbar.

### Android, KI und UX

- Android 8+ / `minSdk 26`, Target SDK 36.
- Persistente lokale Modellablage für CLIP B/32, CLIP B/16 und SigLIP B/16, damit heruntergeladene Modelle normale App-Neustarts und Cache-Bereinigungen überstehen.
- Fotoanalyse mit 25 sichtbaren Kriterien auf einer 0,1–10,0-Skala und 100 simulierten Gewichtungsperspektiven.
- Review Builder für Restaurant-, Service-, Atmosphären- und weitere Besuchsaspekte.
- Oberfläche in Deutsch, Englisch, Italienisch, Spanisch und Französisch.
- Netzwerk-/WebView-Härtung: HTTPS-Allowlisting, kontrollierte Redirects, begrenzte Antwortgrößen, Timeouts und Failover.

### Build-20-Hinweis

Die technische Build-20-APK wurde vom APK-Job gebaut, verifiziert, aus der tatsächlich gepackten Weboberfläche getestet, im Android-16-Emulator geprüft und nach `downloads/PizzaScan-2.3.3-Test.apk` veröffentlicht. Der übergeordnete Workflow #195 ist dennoch nicht vollständig grün, weil der separate Web-Testjob fehlschlug. Build 20 ist deshalb ein technischer Teststand, kein finaler Play-Release.

## 2.3.2 — archivierter Teststand · 14.09.2026

- Erhaltener technischer Zwischenstand der 2.3-Linie.
- Dient insbesondere zum Vergleich von Karten-, Such-, Rating- und UI-Verhalten vor den späteren 2.3.3-POI-/Fallback-Umbauten.
- APK und SHA-256 bleiben reproduzierbar im Download-Archiv verlinkt.

[⬇️ PizzaScan 2.3.2 Test-APK](https://raw.githubusercontent.com/chekento/Pizzascan/main/downloads/PizzaScan-2.3.2-Test.apk)

## 2.3.1 — archivierter Teststand · 14.09.2026

- Früher Android-Zwischenstand der 2.3-Linie.
- Enthält die damalige Karten-/Such-/Rating-Integration und ist für Regressionstests gegenüber 2.3.2/2.3.3 erhalten.
- APK und SHA-256 bleiben im Download-Archiv verfügbar.

[⬇️ PizzaScan 2.3.1 Test-APK](https://raw.githubusercontent.com/chekento/Pizzascan/main/downloads/PizzaScan-2.3.1-Test.apk)

## 2.3.0 — archivierter 2.3-Basisstand · 13.09.2026

Der validierte 2.3-Basisstand führte insbesondere folgende Bereiche zusammen:

- kostenlose, schlüsselfreie offene Ratings und Mindestbewertungsfilter,
- stabilere Kartenmarker,
- fünfsprachige Oberfläche,
- externe Bewertungsportal-Links,
- aktualisierte README-/Store-Assets,
- technische 2.3.0-Test-APK.

[⬇️ PizzaScan 2.3.0 Test-APK](https://raw.githubusercontent.com/chekento/Pizzascan/main/downloads/PizzaScan-2.3.0-Test.apk)

## Download-Archiv und Prüfsummen

Alle erhaltenen APKs, Dateigrößen, SHA-256-Prüfsummen und Downgrade-Hinweise stehen unter [downloads/README.md](downloads/README.md).

> **Downgrade-Hinweis:** Android installiert normalerweise keinen niedrigeren `versionCode` über einen höheren. Für einen echten Rücktest kann eine Deinstallation erforderlich sein. Dadurch können lokal gespeicherte PizzaScan-Daten und Offline-Modelle gelöscht werden. Vorher Backup/Export verwenden.
