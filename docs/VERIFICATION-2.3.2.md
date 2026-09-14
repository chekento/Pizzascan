# PizzaScan 2.3.2 – Verifikation

Stand: 14. September 2026

## Finaler geprüfter Build

- VersionName: `2.3.2`
- VersionCode: `8`
- technisches Testpaket: `cloud.kosch.pizzascan.lang1`
- Play-/Release-Paket: `cloud.kosch.pizzascan`
- GitHub-Actions-Run: `#109`
- Run-ID: `34829591488`
- geprüfter Quell-Commit: `4665d738e441b0e58edd1f0f2e5c2a30a5ce04e3`
- Workflow-Ergebnis: **success**
- CI-Artefakt: `PizzaScan-Build`, Artifact-ID `10341781720`

## Erfolgreiche Prüfschichten

1. Node-Modultests für Kernlogik, Orte, Bewertungen und Review Builder.
2. Browser-/Playwright-Smoke-Tests für App-Oberfläche, Karte, Suche, Navigation, Marker, Ratings, Offline-Modellhinweise und lokale Daten.
3. Suchfallback-Test: ausdrücklich abgesendete Suche fällt bei Photon-Fehler **und bei leerem Photon-Ergebnis** kontrolliert auf Nominatim zurück.
4. Release-Hardening-Test: einmalige Start-Erkennung erhält spätere Nutzerfilter; Karte erholt sich nach wiederhergestellter Verbindung.
5. Datenschutztest in **DE / EN / IT / ES / FR**: Version 2.3.2, Nominatim-Fallback und Ausschluss von Nominatim-Autocomplete sind in der App sichtbar; Deutsch weist zusätzlich aus, dass PizzaScan der Nominatim-Fallback-Anfrage keine Standortkoordinaten hinzufügt.
6. Gepackte APK-Webassets wurden aus der tatsächlich gebauten Debug-APK extrahiert und erneut getestet.
7. Android Lint für Debug und Release erfolgreich.
8. Release-APK und Release-AAB erfolgreich erzeugt; AAB mit Bundletool validiert. Das Release-AAB bleibt für die spätere private Play-Uploadsignierung **unsigned**.
9. Lokale Modellintegration erfolgreich für CLIP ViT-B/32, CLIP ViT-B/16 und SigLIP.
10. Android-16-Emulator-Smoke-Test erfolgreich; alle drei Instrumentierungstests bestanden.
11. Erst nach erfolgreichem Android-16-Test wurde die technische Test-APK nach `downloads/` veröffentlicht.

## Veröffentlichtes technisches APK

Datei:

`downloads/PizzaScan-2.3.2-Test.apk`

SHA-256:

`aecbd7e912375bde9caa33a16642c2fd9b05a2a0081c12b3b1e693d3f2b730a5`

Die SHA-256-Summe wurde sowohl aus `downloads/SHA256SUMS-2.3.2.txt` als auch aus dem heruntergeladenen CI-Artefakt geprüft und stimmt überein.

## Wichtige Abgrenzung

Die Datei `PizzaScan-2.3.2-Test.apk` ist eine technische Vorab-APK mit dem Paket `cloud.kosch.pizzascan.lang1`. Sie ist **nicht** die spätere offizielle Google-Play-Testausgabe und zählt nicht als Teilnahme am geschlossenen Play-Test.

Das im CI erzeugte `PizzaScan-2.3.2-unsigned.aab` ist technisch validiert, aber noch nicht mit dem vorgesehenen privaten Google-Play-Uploadschlüssel signiert. Der nächste Release-Schritt ist deshalb die echte Geräteabnahme und anschließend die private Signierung / der AAB-Upload in den vorgesehenen Google-Play-Testtrack.
