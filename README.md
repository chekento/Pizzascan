# PizzaScan 2.0 — Android APK

Eine deutsche Android-App für **Pizzakarte mit GPS** und **lokale Fotobewertung**. Drei kostenlose Bildmodelle stehen in den Einstellungen zur Auswahl. Es wird kein KI-API-Schlüssel benötigt, kein Inferenzdienst aufgerufen und kein Foto für die Analyse hochgeladen.

## Installation

Die installierbare Datei heißt `PizzaScan-2.0.0.apk`. Sie wird als Download im Chat bereitgestellt Der [GitHub-Actions-Lauf](https://github.com/chekento/Pizzascan/actions) stellt im Artifact `PizzaScan-Build` die unsignierte Release-APK für die abschließende private Signierung bereit. Die im Chat ausgelieferte Datei ist bereits signiert und installierbar.

Android 8 oder neuer; auf dem Gerät die Installation aus der verwendeten Download-App erlauben. Die APK ist ein Release-Build mit ausgeschaltetem WebView-Debugging und einem separat gesicherten privaten Signierschlüssel. App-ID: `cloud.kosch.pizzascan`. Die App ist kein Play-Store-Release.

**Wechsel von Version 1:** Der damalige kurzlebige CI-Debug-Schlüssel wurde nicht dauerhaft gesichert. Deshalb kann Android Version 2 nicht über die alte Version installieren. Vor Deinstallation der alten App vorhandene Daten exportieren; eine Deinstallation entfernt deren lokalen Speicher. Ab der hier gelieferten Version 2 muss für Updates der neue gesicherte private Signierschlüssel verwendet werden.

## Bedienung

1. Eine Stadt auf der Karte suchen oder mit dem GPS-Knopf den eigenen Standort verwenden. Pizzerien stammen aus OpenStreetMap. Orte lassen sich merken und einer Fotoanalyse zuordnen.
2. Unter **Einstellungen** CLIP B/32, CLIP B/16 oder SigLIP B/16 wählen. „Modell herunterladen“ bereitet die spätere Offline-Nutzung vor. Der erste Download umfasst grob 160–210 MB je Modell; WLAN und mindestens einige hundert MB freier Speicher sind sinnvoll. Ladezeit und Analysegeschwindigkeit hängen vom Gerät ab.
3. Unter **Fotobewertung** ein Foto aufnehmen oder auswählen. Die App verkleinert es auf maximal 1200 Pixel und entfernt durch erneutes JPEG-Kodieren Metadaten. Analyse im Web Worker mit ONNX/WASM auf der CPU; weder Cloud-Inferenz noch API-Schlüssel.
4. Die Detailseite zeigt 25 Kriterien mit Werten von 0,1 bis 10,0 und alle 100 simulierten Bewertungsprofile mit Einzelwerten und Gewichten. Eigene Bewertung auf der Zehn-Punkte-Skala, Besuchsbestätigung und Erlebnistext separat speichern.
5. **Google-Maps-Entwurf** erzeugt einen bearbeitbaren Rezensionstext. „Text kopieren & Google Maps öffnen“ übergibt die ausgewählte Pizzeria an die Ortssuche. Dort richtigen Ort prüfen, Rezension öffnen, Text einfügen, Sterne und Foto selbst hinzufügen und veröffentlichen. Ein zweiter Knopf teilt Foto und Text über Androids Freigabedialog. Ziel-Apps entscheiden, welche Anhänge sie übernehmen.
6. Community optional über die Karte öffnen. „Laden“ liest öffentliche Beiträge; erst eine Vorschau mit ausdrücklicher Bestätigung veröffentlicht einen Beitrag. Kommentare und das lokale Ausblenden von Autoren sind möglich.

## Was die Fotozahlen bedeuten

Die App verwendet echte Bild-Sprach-Modelle, aber **keine wissenschaftlich validierte Pizza-Bewertung**. Je Kriterium werden vier sichtbare Ausprägungen als englische Bildbeschreibungen verglichen. Die gruppenweise Softmax-Normierung der Modell-Logits liefert einen gewichteten Index zwischen 0,1 und 10,0. Eine Nachkommastelle bedeutet keine entsprechende Messgenauigkeit. Der angezeigte Textvergleich bezeichnet lediglich die relative Trennung der vier Referenzen, keine kalibrierte Wahrscheinlichkeit für gute Pizza.

Die 25 Kriterien betreffen Rand, Backbild, Belag, Komposition und Fotoqualität. Käse- oder saucenfreie Pizzen, atypische Stile, schlechte Sicht und Beleuchtung können unpassende Ergebnisse verursachen. Die App kann weder Geschmack, Geruch, Temperatur, Lebensmittelsicherheit noch nicht sichtbare Details bestimmen. Ein vorgeschalteter Pizza/Text-Vergleich lehnt uneindeutige Bilder ab; auch diese Erkennung kann Fehler machen.

**100 Profile sind 100 simulierte Perspektiven auf dieselben 25 Modellwerte, keine 100 Menschen und keine 100 unabhängigen KI-Gutachten.** Zehn Fachperspektiven werden mit zehn Gewichtungsvarianten kombiniert. Strenge bzw. großzügige Profile verschieben Werte transparent um −0,6 bzw. +0,4 und begrenzen sie auf die Skala. Der KI-Fotoindex ist das Mittel ihrer 100 gewichteten Gesamtergebnisse. Vollständige Berechnung: `web/analysis.js`; die Oberfläche legt Werte, Gewichte und Grenzen offen.

Der Rezensionsentwurf erfindet keine Geschmackserfahrungen. Er verwendet die eigene Bewertung, den eigenen Erlebnistext und höchstens zwei sichtbare positive Kriterien mit ausreichend getrennter Textreferenz. Nutzer sollen den Text prüfen. Google Maps arbeitet mit 1–5 ganzen Sternen; die App schlägt `max(1, min(5, round(eigeneWertung / 2)))` vor und veröffentlicht nichts automatisch.

## Lokale KI-Modelle

| Einstellung | ONNX-Modell | Ausführung |
|---|---|---|
| CLIP B/32 | [Xenova/clip-vit-base-patch32](https://huggingface.co/Xenova/clip-vit-base-patch32) | q8 / WASM / CPU |
| CLIP B/16 | [Xenova/clip-vit-base-patch16](https://huggingface.co/Xenova/clip-vit-base-patch16) | q8 / WASM / CPU |
| SigLIP B/16 | [Xenova/siglip-base-patch16-224](https://huggingface.co/Xenova/siglip-base-patch16-224) | q8 / WASM / CPU |

Die Modellgewichte werden beim ersten Einsatz von Hugging Face heruntergeladen; kein Account und kein API-Schlüssel erforderlich. Das Foto bleibt lokal. Die Laufzeit ist in der APK enthalten. Transformers.js speichert Gewichte im Web-Cache. Android kann diesen Cache bei Speicherdruck löschen; dann ist ein neuer Download nötig. Die Modellgewichte sind separate Downloads und nicht in der APK enthalten. Kein Cloud-Ersatz bei Fehlern, keine eingebauten Zugangsdaten, keine inoffiziellen Login- oder Web-Scraping-Umgehungen.

## Community ohne eigenen Server

Die App verwendet öffentliche, unabhängige Nostr-Relays `wss://relay.damus.io` und `wss://nos.lol` mit einem spezifischen `pizzascan`-Tag. Das ist ein echtes dezentrales Austauschformat, keine simulierte Nutzerliste. Relays sind nicht Teil dieses Projekts; Erreichbarkeit, Annahme großer Events und Aufbewahrung sind nicht garantiert. Das UI unterscheidet Fehler von leerem Feed und wartet beim Senden auf mindestens eine Relay-Bestätigung.

- NIP-78 / Kind 30078 für Foto-Rezensionen, NIP-01-signierte Events; Kind 1 für Kommentare, NIP-09/Kind 5 für Löschanfragen.
- Öffentlich: Anzeigename, kleiner JPEG-Vorschaubild-Anhang (maximal 240 Pixel), bewusst gewählte Pizzeria, Ereigniszeitpunkt, eigener Text/Score, Modell und 25 KI-Werte. Kein Live-GPS-Standort.
- Identität ohne Serverkonto: Nostr-Schlüssel auf dem Gerät erzeugt; in Android mit AES/GCM und Android Keystore verschlüsselt gespeichert. Keine Schlüssel im Quellcode oder Backup. Beim Deinstallieren geht die Identität verloren. Der Browser-Testmodus verwendet nur eine sitzungsgebundene Identität.
- Empfangene Events werden kryptografisch sowie nach Schema, Größe, Koordinaten und Scorebereich geprüft. Fremder Text wird escaped; Vorschaubilder sind ausschließlich begrenzte JPEG-data-URLs.
- Keine automatisch veröffentlichten Inhalte. Nutzer sehen und bestätigen die Vorschau. Kommentare benötigen eine ausdrückliche Sendeaktion. Ausblenden blockiert einen Autor lokal. Eine dezentrale Löschanfrage kann bereits verteilte Kopien nicht entfernen.
- Öffentliche Tests schreiben keine Events: der Browsertest ersetzt die Relay-Verbindungen durch isolierte Test-Relays.

## Speicher und Android

Fotoanalysen liegen in IndexedDB, Einstellungen und gemerkte Orte lokal. Einzelfotos können mit allen Kriterien und Profilen als JSON exportiert werden. Frühere Daten von Version 1 bleiben erhalten; gemerkte Orte werden übernommen. Frühere manuelle Ratings und Crawls bleiben im vorhandenen lokalen Datensatz, haben aber keine eigene Ansicht im auf Karte und Foto konzentrierten V2-UI. Normale, mit demselben Release-Schlüssel signierte Updates behalten lokale Daten. Für den Schlüsselwechsel von Version 1 gelten die Hinweise oben.

Die WebView lädt ausschließlich gepackte App-Dateien über `WebViewAssetLoader` auf einer HTTPS-Origin. Nativer Message-Kanal nur für diese Origin und das Hauptfenster; kein allgemeines JavaScript-Interface. Dateizugriff aus der WebView ist deaktiviert, Dateiauswahl über Android. Externe Links öffnen sich außerhalb der WebView. Kamera über Androids Aufnahme-Intent und `FileProvider`, GPS erst nach Nutzeraktion. Mixed Content und Drittanbieter-Cookies sind deaktiviert. CSP erlaubt WASM, jedoch kein JavaScript-`unsafe-eval`.

## Bauen und prüfen

JDK 17, Android SDK 35, Gradle 8.11.1, Node 22:

```sh
npm ci --ignore-scripts --no-audit
npm run assets
npm test
npx playwright install --with-deps chromium
npm run smoke
node scripts/download-test-photo.cjs
gradle --no-daemon assembleDebug assembleDebugAndroidTest lintDebug assembleRelease lintRelease
```

Echte Modelle separat prüfen, etwa `MODEL=clip32 npm run models`. Der Actions-Workflow prüft alle drei Modelle mit einem realen Pizzafoto, 25 Bildwerten, Offline-Cache mit frischem Worker und einem Negativbild. Zusätzlich: UI, Speicherung nach Neustart, 100 Profile, eigene Wertung, Rezensionskopie, signierte Community-Ereignisse gegen isolierte Test-Relays, Bestätigungsfluss, Kommentare und Android-15-Emulator-Smoke-Test inklusive echter CLIP-Fotoanalyse in der gepackten WebView und verschlüsselter Identität nach Neustart. Die CI prüft die Test-APK-Signatur mit `apksigner` und erzeugt die Release-APK ohne privaten Schlüssel. Abschließend wird diese lokal mit dem gesicherten Release-Schlüssel signiert und ihre Signatur sowie SHA-256-Prüfsumme geprüft. Private Schlüssel dürfen weder in Git noch in öffentlichen Actions-Artifacts liegen. Bei Fehlern gibt es Screenshots und Logs als Artifacts.

Die ursprünglichen Uploads sind unverändert in `source-original/` archiviert.

## Komponenten, Referenzen und Lizenzen

- [Transformers.js 3.8.1](https://huggingface.co/docs/transformers.js/v3.8.1/en/index) — Apache-2.0; [ONNX Runtime](https://github.com/microsoft/onnxruntime) — MIT.
- [OpenAI CLIP](https://github.com/openai/CLIP) — MIT; [Google SigLIP](https://huggingface.co/google/siglip-base-patch16-224) — Apache-2.0. Die verlinkten Xenova-Modellkarten dokumentieren die ONNX-Konvertierungen.
- [Leaflet 1.9.4](https://leafletjs.com/) — BSD-2-Clause. [OpenStreetMap-Daten](https://www.openstreetmap.org/copyright) — ODbL, Attribution in der Karte.
- [nostr-tools](https://github.com/nbd-wtf/nostr-tools) — Unlicense; [Nostr-Protokoll](https://github.com/nostr-protocol/nips).
- [Google Maps URLs](https://developers.google.com/maps/documentation/urls/get-started) für Ortssuche und Navigation, keine automatische Veröffentlichung von Rezensionen.
- Testfoto: Valerio Capello, Farbrevision Rainer Zenz, [Pizza Margherita, Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Eq_it-na_pizza-margherita_sep2005_sml.jpg), [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/). Ausschließlich CI-Test, Vorschau verkleinert/neu kodiert; keine Community-Veröffentlichung. Nicht in der APK gebündelt.

Kopien der Lizenzen gepackter Abhängigkeiten liegen nach `npm run assets` in `web/vendor`. Die Nutzungsbedingungen externer Kartenanbieter und Community-Relays gelten für deren Dienste.
