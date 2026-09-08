# PizzaScan für Android

Installierbare Android-App auf Grundlage der bereitgestellten PizzaScan-Dateien. Paketname: `cloud.kosch.pizzascan`, Version **1.0.0**, Android **8.0 oder neuer**. Das ursprüngliche orange Design und die Hauptbereiche wurden übernommen; die JavaScript-Laufzeit wurde für den eigenständigen Betrieb ersetzt. Die unbearbeiteten Eingaben liegen unter `source-original/`.

## APK herunterladen

Unter **Actions → Build and verify PizzaScan APK → letzter erfolgreicher Lauf → PizzaScan-APK** das Artefakt herunterladen und entpacken. `PizzaScan-1.0.0.apk` ist mit einem Android-Entwicklungszertifikat signiert und direkt installierbar. Android kann beim Öffnen einmalig die Erlaubnis „Unbekannte Apps installieren“ für den verwendeten Browser oder Dateimanager verlangen.

Dies ist ein Testbuild zum Installieren außerhalb des Play Store. Es wurde kein privater Produktionsschlüssel erstellt oder ins Repository geschrieben. Der Workflow bewahrt den Entwicklungsschlüssel im GitHub-Actions-Cache auf. Falls dieser Cache später gelöscht wird, entsteht ein neuer Schlüssel; dann vor einer Neuinstallation die lokalen Daten als JSON exportieren. Eine Play-Store-Veröffentlichung gehört nicht zu diesem Build.

## Funktionen

- OpenStreetMap-Karte, Orts-/Adresssuche und echte Pizza-Einträge aus Overpass; Gebäude und Relationen werden über ihre Mittelpunkte erfasst.
- Optionale Android-Standortfreigabe einschließlich ungefährem Standort; kein Standortabruf vor der ersten Zustimmung oder einem bewussten Tippen auf „Location“.
- Merklisten, besuchte Orte, persönliche Bewertungen, Profil und Erfolge lokal auf dem Gerät.
- Gewichtete Bewertung auf einer Skala bis 10; „First bite“ wird getrennt gespeichert. Kein erfundener Community-Durchschnitt.
- JSON-Import und Export über die Android-Dateiauswahl sowie vollständige Sicherung und Wiederherstellung. Listenimporte ergänzen vorhandene Einträge; eine vollständige Wiederherstellung fragt vor dem Ersetzen nach.
- Pizza-Crawls mit zwei oder drei echten Orten, gespeicherter Reihenfolge und Export. Gestrichelte Linien zeigen die Reihenfolge und Luftlinie; Google Maps/eine passende externe App übernimmt Straßenführung und Fahrtzeiten.
- Fuß-, Rad-, Auto- und ÖPNV-Modus für einzelne Ziele. Mehrere ÖPNV-Zwischenstopps werden ausdrücklich abgelehnt, weil der verwendete Navigationslink sie nicht unterstützt.
- Android-Teilen, Website-/Telefonaufruf, Fotoauswahl oder Fotoaufnahme mit der installierten Kamera-App.
- Helles/dunkles Design, einklappbare Filter, mobile Navigation und Android-Zurück-Verhalten.

## Klar abgegrenzte Funktionen

Die Vorlage enthielt WebSim-Aufrufe, Zufallsbewertungen, simulierte Fotoanalyse, fiktive Ranglisten und teilweise unverdrahtete Schaltflächen. Die Android-Version benötigt keinen WebSim-Account und zeigt keine generierten Orte, Quellen oder Match-Prozente als Tatsachen an.

Empfehlungen werden anhand der Luftlinienentfernung sortiert. Fotoanalyse durch KI und eine Online-Community sind **nicht angebunden**. Die Fotoansicht weist darauf hin. Die Gebietsübersicht zählt reale geladene Einträge; sie behauptet keine Live-Markttrends. Öffnungszeiten werden unverändert aus der Datenquelle angezeigt; komplexe Kalenderregeln werden nicht als sichere Live-Öffnungsprognose interpretiert.

Die Oberfläche und alle Programmbibliotheken sind in der APK enthalten. Neue Kartenausschnitte, Adresssuche und aktuelle Lokale benötigen Internet. Bereits gespeicherte Orte und Bewertungen sowie der letzte begrenzte Suchcache bleiben lokal verfügbar; die App ist keine vollständige Offline-Kartenlösung. Öffentliche OSM-Dienste können langsam sein oder Anfragen begrenzen.

## Lokal bauen

Benötigt: JDK 17, Android SDK 35, Gradle 8.11.1 und Node.js 22.

```sh
npm install --ignore-scripts
npm run assets
npm test
gradle assembleDebug lintDebug
```

APK: `app/build/outputs/apk/debug/app-debug.apk`.

```sh
npx playwright install chromium
npm run smoke
gradle connectedDebugAndroidTest
```

Der GitHub-Workflow führt Tests für Koordinaten, Datenimport, HTML-Escaping, Bewertung und Navigation aus. Browser-Smoke-Tests verwenden klar benannte Fixture-Orte und prüfen Speichern, Besuchen, Bewerten, Neustart, Crawl, Fotoauswahl, JSON, Fehlerzustände und Layout. Ein Android-15-Emulatortest prüft den Start der gebündelten App, den nativen Nachrichtenkanal, die Bedienung ohne GPS und Datenpersistenz über die Activity-Neuerstellung. Echte GPS-Hardware, Kamera-Apps und herstellerspezifische Dateiauswahl müssen zusätzlich auf dem Zielgerät geprüft werden.

## Daten und Dienste

Keine Analytics, Werbe-SDKs, API-Schlüssel oder automatische Foto-Uploads. Lokale Daten werden nicht automatisch in ein Cloud-Konto gesichert. Kartendienste erhalten IP-Adresse und Kartenanfragen; Overpass die sichtbaren Kartengrenzen, Nominatim nur ausdrücklich abgesendete Suchtexte. Navigation/Teilen übergeben die gewählten Ziele an die ausgewählte externe Anwendung.

- [OpenStreetMap-Daten und Lizenz](https://www.openstreetmap.org/copyright)
- [OSM Foundation: Datenschutz](https://osmfoundation.org/wiki/Privacy_Policy)
- [OpenStreetMap-Kachelrichtlinie](https://operations.osmfoundation.org/policies/tiles/)
- [Nominatim-Nutzungsrichtlinie](https://operations.osmfoundation.org/policies/nominatim/)
- [Android: lokale Inhalte mit WebViewAssetLoader](https://developer.android.com/develop/ui/views/layout/webapps/load-local-content)

JavaScript läuft ausschließlich aus den gebündelten App-Dateien. Der native Nachrichtenkanal ist auf `https://appassets.androidplatform.net` und den Hauptframe begrenzt. Externe Websites öffnen außerhalb der WebView; unsichere Dateizugriffe und Mixed Content sind deaktiviert.

## Fremdbibliotheken

Leaflet **1.9.4** (BSD-2-Clause) und Font Awesome Free **6.4.0** (siehe die mitgelieferte Lizenz für Fonts/CSS/Icons). Die jeweiligen Lizenzdateien werden zusammen mit den Assets in die APK kopiert. AndroidX Core **1.15.0**, AndroidX WebKit **1.12.1** (Apache-2.0).
