# Prüfung der PizzaScan-Testfassung 2.3.0

Stand: 13. September 2026. Ergebnisse beziehen sich auf die Test-APK mit offenen Bewertungen, Mindestwertfilter und korrigierter verzögerter Suche.

## Automatisiert geprüft

| Prüfung | Ergebnis |
|---|---|
| `npm test` | 42 Tests bestanden, davon 12 für Bewertungsdaten, Zuordnung, Lizenzen, Cache und Fehlerfälle |
| `npm run ratings-smoke` | Oberfläche und Filter in DE, EN, IT, ES, FR bestanden; mobile Breite, Dunkelmodus, Speicherung, Karte/Liste, gemerkte Orte, Opt-out und Ausfälle geprüft |
| `npm run marker-i18n` | Geografische Markerpositionen beim Ziehen, Zoomen und Größenwechsel sowie Sprachwechsel bestanden |
| `npm run i18n-content` | Übersetzungen für Baukasten, Modellhinweise und Datenschutz bestanden |
| `npm run map-smoke` | Karten-/Suchabläufe bestanden, einschließlich verzögertem Suchvorschlag nach Absenden |
| Echte Mangrove-API | Öffentlicher HTTPS-Abruf und CORS-Antwort geprüft; offene Datensätze vorhanden, Abdeckung lückenhaft |
| `npm run runtime-assets` | Echte ONNX-WASM-Inferenz mit kleinem Identity-Modell bestanden; lokale Loader ohne fehlende Dateien |
| APK | ZIP-Integrität, Asset-Abgleich, Android-Paketdaten, 16-KB-ZIP-Ausrichtung und Signatur v2/v3 geprüft |
| Store-Grafiken | Freigegebene PNGs unverändert; Icon 512 × 512, Feature DE/EN 1024 × 500 und jeweils kleiner als 15 MB |

Die UI-Tests verwenden gekennzeichnete Testdaten. In der ausgelieferten App sind keine Beispielbewertungen für echte Orte eingebaut.

## APK und nachvollziehbarer Quellstand

Datei: `downloads/PizzaScan-2.3.0-Test.apk`, 12.141.121 Bytes. SHA-256:

```text
d2576f346d9b3ec3a0970c73eb64a7fea30e7718e0b8ec8cb5c4c5ff4815b4a8
```

Paket: `cloud.kosch.pizzascan.lang1`, Version `2.3.0-lang1`, VersionCode `6`, minSdk `26`, targetSdk `36`. Signierer-Zertifikat SHA-256:

```text
9f41cb2eed26f827a9da5593481c4ca0061dbadb9f08276ae2bf287e5487c73c
```

Diese APK baut auf der bereits nativ gebauten und signierten 2.3-Testfassung auf (vorheriger Quellcommit `dbc0c82d53fef8b061addf7e0a5d6947acb9eaa4`). Für den Bewertungsfilter wurden zehn Web-Assets ersetzt oder ergänzt. Zusätzlich wurden 15 nicht verwendete, eigenständige JavaScript-Distributionen von ONNX Runtime weggelassen: Die API ist bereits im KI-Worker gebündelt. Beide WASM-Varianten mit ihren Loadern sowie sämtliche Lizenzen bleiben enthalten. Dies reduziert den Download um etwa 3,9 MB; `scripts/prepare-assets.cjs` verwendet dieselbe Auswahl. Danach wurden ZIP-Ausrichtung und Signierung erneuert. Alle verbleibenden übrigen Nutzdaten einschließlich KI-Worker, WASM, DEX, Manifest und App-Symbol sind bytegleich zur vorherigen APK. Die geänderten Assets wurden vollständig mit dem aktuellen Quellcode verglichen. Der private Signierschlüssel ist nicht im Repository enthalten.

Der vorherige native Build lief mit 126 Gradle-Aufgaben erfolgreich durch; Android-Lint meldete damals keine Fehler und zehn Warnungen. Für diese Aktualisierung wurde kein neuer vollständiger Gradle- oder Emulatorlauf durchgeführt. Der Workflow ist um die neuen Bewertungstests ergänzt; ein erfolgreicher neuer Actions-Lauf wird nicht vorausgesetzt.

## Noch am Gerät und in Play zu prüfen

Die aktuelle APK wurde in diesem Durchlauf nicht auf einem echten Android-Gerät installiert. Update mit Erhalt lokaler Daten und Modelle, native Kamera-/Standortdialoge, Offline-KI und die tatsächliche Android-WebView sind die nächsten Prüfschritte. Siehe [Testplan](../store/TESTPLAN.md).

Ein aktuelles Release-AAB für Play wird nach diesen Geräteprüfungen und dem Abgleich von Produktions-/Uploadschlüssel und unbenutztem Versionscode erstellt. Der APK-Test ersetzt weder den Play-Pre-Launch-Bericht noch einen gegebenenfalls erforderlichen geschlossenen Test.
