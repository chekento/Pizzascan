# PizzaScan 2.1 — Android APK

Eine deutsche Android-App für **Pizzakarte mit GPS** und **lokale Fotobewertung**. Drei kostenlose Bildmodelle stehen in den Einstellungen zur Auswahl. Es wird kein KI-API-Schlüssel benötigt, kein Inferenzdienst aufgerufen und kein Foto für die Analyse hochgeladen.

## Installation

Die installierbare Datei heißt `PizzaScan-2.1.1.apk`. Sie wird als Download im Chat bereitgestellt. Der [GitHub-Actions-Lauf](https://github.com/chekento/Pizzascan/actions) stellt im Artifact `PizzaScan-Build` die unsignierte Release-APK für die abschließende private Signierung bereit. Die im Chat ausgelieferte Datei ist bereits signiert und installierbar.

Android 8 oder neuer; auf dem Gerät die Installation aus der verwendeten Download-App erlauben. Die APK ist ein Release-Build mit ausgeschaltetem WebView-Debugging und einem separat gesicherten privaten Signierschlüssel. App-ID: `cloud.kosch.pizzascan`. Die App ist kein Play-Store-Release.

**Wechsel von Version 1:** Der damalige kurzlebige CI-Debug-Schlüssel wurde nicht dauerhaft gesichert. Deshalb kann Android Version 2 nicht über die alte Version installieren. Vor Deinstallation der alten App vorhandene Daten exportieren; eine Deinstallation entfernt deren lokalen Speicher. Ab der hier gelieferten Version 2 muss für Updates der neue gesicherte private Signierschlüssel verwendet werden.

**Update von 2.0:** Version 2.1 verwendet denselben gesicherten Release-Schlüssel und eine höhere Versionsnummer. Über die vorhandene 2.0 installieren; App-ID und lokale Daten bleiben erhalten.

## Karte und Suche in 2.1

- Vollbildkarte mit Zurückknopf, einblendbarer Restaurantsuche, GPS, Filtern und „Hier suchen“. Android-Zurück schließt zuerst eine geöffnete Detailseite und danach den Vollbildmodus.

- Sichtbare Emoji-Marker für Pizzerien 🍕, Cafés ☕, Imbisse 🍔, Foodtrucks 🚚, Pizzaautomaten 🤖 und weitere Orte 🍽️; Markierung für gemerkte/besuchte Orte.
- GPS beim ersten Start wählbar, später auf Wunsch automatisch; Suchposition bleibt gespeichert. Name, Stadt und Adresse suchen. Vorschläge während der Eingabe kommen lokal aus geladenen Restaurants; abgesendete Suchbegriffe liefern auswählbare Photon-Treffer mit Adresse und Entfernung. Keine Online-Autovervollständigung.
- Wie im ursprünglichen HTML berücksichtigt die Karte auch italienische Gastronomie. Wenn Pizza nicht ausdrücklich in OSM hinterlegt ist, wird das transparent gekennzeichnet und lässt sich ausschließen. Keine erfundenen Restaurants oder Google-Bewertungen.
- Zwei Overpass-Anbieter mit begrenzten Abfragen, Timeout, Ausweichdienst, Abbruch veralteter Anfragen und räumlichem Cache. „Hier suchen“ lädt auch ohne Kartenbewegung neu. Speicherfehler werden nicht als Netzwerkfehler ausgegeben.
- Einstellungen: 1/3/5/10 km oder Kartenausschnitt, alle sechs Ortstypen, nur geöffnet, unbekannte Zeiten gesondert einschließen, automatische Kartensuche, Sortierung, besuchte Orte ausblenden und Routenmodus. Filter wirken auf Karte und Liste und bleiben gespeichert.
- Detailseite mit abgeglichener Adresse, Telefon, Website, Speisekarte, Öffnungsstatus samt nächstem Wechsel und Sieben-Tage-Übersicht sowie vorhandenen Informationen zu Lieferung, Mitnehmen, Ernährung, Rollstuhl, Sitzplätzen und Bezahlung. Ergänzung aus Overpass und Photon ausschließlich über dieselbe OSM-Identität; gleichnamige Filialen werden nicht vermischt. Originalquelle und Koordinaten sind einsehbar.
- Öffnungsstatus mit `opening_hours` und Ortszeitzone. Fehlende, nicht auswertbare oder ohne Region nicht prüfbare Feiertagsregeln gelten als unbekannt, niemals als geöffnet. Sonnenzeit-Regeln werden als unbekannt behandelt. Kurzfristige Abweichungen lassen sich aus diesen Daten nicht erkennen. Öffnungszeiten, Fotos und Bewertungen werden nicht von Google kopiert.
- Community ohne Eingabe oder Veröffentlichung eines Community-Namens. Bereits vorhandene Beiträge bleiben lesbar.

Die Kartendaten werden mit [Overpass Private.coffee](https://overpass.private.coffee/) bzw. [overpass-api.de](https://overpass-api.de/) geladen. [Photon](https://github.com/komoot/photon) übernimmt abgesendete Ortssuchen und den Adressabgleich geöffneter Details. Keine Zugangsdaten nötig; öffentliche Dienste können ausfallen und Datensätze können unvollständig sein.

## Bedienung

1. Eine Stadt auf der Karte suchen oder mit dem GPS-Knopf den eigenen Standort verwenden. Pizzerien stammen aus OpenStreetMap. Orte lassen sich merken und einer Fotoanalyse zuordnen.
2. Unter **Einstellungen** CLIP B/32, CLIP B/16 oder SigLIP B/16 wählen. „Gewähltes Modell vorbereiten …“ zeigt zuerst Modellname, Anbieter, Größe, Zweck und Disclaimer. Erst „Bestätigen & starten“ erlaubt den Download und bereitet die spätere Offline-Nutzung vor. Die erste Fotoanalyse zeigt denselben Hinweis, bevor ein KI-Worker gestartet wird. Die Freigabe gilt pro Modell und schließt das spätere Nachladen fehlender Cache-Dateien ein; beim Entfernen der Modelle wird sie zurückgesetzt. Der erste Download umfasst grob 160–210 MB je Modell; WLAN und mindestens einige hundert MB freier Speicher sind sinnvoll. Ladezeit und Analysegeschwindigkeit hängen vom Gerät ab.
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

Vor der ersten Nutzung jedes Modells wird die ausführliche Erklärung mit Disclaimer und Downloadbestätigung angezeigt. Sie bleibt außerdem im Willkommen-Dialog, auf der Fotoseite und in den KI-Einstellungen erreichbar (`web/model-info.js`). Standard ist **CLIP ViT-B/32 von OpenAI**, alternativ CLIP ViT-B/16 von OpenAI oder SigLIP Base Patch16-224 von Google, jeweils in der q8-ONNX-Konvertierung von Xenova. Der Hinweis erklärt zusätzlichen Speicher- und Datenbedarf, mögliche Mobilfunkkosten, Cache-Bereinigung, lokale Fotoverarbeitung, die Verbindung zum Downloadanbieter und die Grenzen des experimentellen Index.

Die Modellgewichte werden nach Bestätigung beim ersten Einsatz von Hugging Face heruntergeladen; kein Account und kein API-Schlüssel erforderlich. Das Foto bleibt lokal. Die Laufzeit ist in der APK enthalten. Transformers.js speichert Gewichte im Web-Cache. Android kann diesen Cache bei Speicherdruck löschen; dann ist ein neuer Download nötig. Die Modellgewichte sind separate Downloads und nicht in der APK enthalten. Kein Cloud-Ersatz bei Fehlern, keine eingebauten Zugangsdaten, keine inoffiziellen Login- oder Web-Scraping-Umgehungen.

## Community ohne eigenen Server

Die App verwendet öffentliche, unabhängige Nostr-Relays `wss://relay.damus.io` und `wss://nos.lol` mit einem spezifischen `pizzascan`-Tag. Das ist ein echtes dezentrales Austauschformat, keine simulierte Nutzerliste. Relays sind nicht Teil dieses Projekts; Erreichbarkeit, Annahme großer Events und Aufbewahrung sind nicht garantiert. Das UI unterscheidet Fehler von leerem Feed und wartet beim Senden auf mindestens eine Relay-Bestätigung.

- NIP-78 / Kind 30078 für Foto-Rezensionen, NIP-01-signierte Events; Kind 1 für Kommentare, NIP-09/Kind 5 für Löschanfragen.
- Öffentlich: kleiner JPEG-Vorschaubild-Anhang (maximal 240 Pixel), bewusst gewählte Pizzeria, Ereigniszeitpunkt, eigener Text/Score, Modell und 25 KI-Werte. Kein Live-GPS-Standort.
- Identität ohne Serverkonto: Nostr-Schlüssel auf dem Gerät erzeugt; in Android mit AES/GCM und Android Keystore verschlüsselt gespeichert. Keine Schlüssel im Quellcode oder Backup. Beim Deinstallieren geht die Identität verloren. Der Browser-Testmodus verwendet nur eine sitzungsgebundene Identität.
- Empfangene Events werden kryptografisch sowie nach Schema, Größe, Koordinaten und Scorebereich geprüft. Fremder Text wird escaped; Vorschaubilder sind ausschließlich begrenzte JPEG-data-URLs.
- Keine automatisch veröffentlichten Inhalte. Nutzer sehen und bestätigen die Vorschau. Kommentare benötigen eine ausdrückliche Sendeaktion. Ausblenden blockiert einen Autor lokal. Eine dezentrale Löschanfrage kann bereits verteilte Kopien nicht entfernen.
- Öffentliche Tests schreiben keine Events: der Browsertest ersetzt die Relay-Verbindungen durch isolierte Test-Relays.

## Speicher und Android

Fotoanalysen liegen in IndexedDB, Einstellungen und gemerkte Orte lokal. Einzelfotos können mit allen Kriterien und Profilen als JSON exportiert werden. Frühere Daten von Version 1 bleiben erhalten; gemerkte Orte werden übernommen. Frühere manuelle Ratings und Crawls bleiben im vorhandenen lokalen Datensatz, haben aber keine eigene Ansicht im auf Karte und Foto konzentrierten V2-UI. Normale, mit demselben Release-Schlüssel signierte Updates behalten lokale Daten. Für den Schlüsselwechsel von Version 1 gelten die Hinweise oben.

Die WebView lädt ausschließlich gepackte App-Dateien über `WebViewAssetLoader` auf einer HTTPS-Origin. Nativer Message-Kanal nur für diese Origin und das Hauptfenster; kein allgemeines JavaScript-Interface. Dateizugriff aus der WebView ist deaktiviert, Dateiauswahl über Android. Externe Links öffnen sich außerhalb der WebView. Kamera über Androids Aufnahme-Intent und `FileProvider`, GPS nach Nutzeraktion oder bei zuvor aktiviertem Standortstart. Mixed Content und Drittanbieter-Cookies sind deaktiviert. CSP erlaubt WASM, jedoch kein JavaScript-`unsafe-eval`.

## Bauen und prüfen

JDK 17, Android SDK 35, Gradle 8.11.1, Node 22:

```sh
npm ci --ignore-scripts --no-audit
npm run assets
npm test
npx playwright install --with-deps chromium
npm run smoke
npm run map-smoke
npm run live-map
node scripts/download-test-photo.cjs
gradle --no-daemon assembleDebug assembleDebugAndroidTest lintDebug assembleRelease lintRelease
```

Echte Modelle separat prüfen, etwa `MODEL=clip32 npm run models`. Der Actions-Workflow prüft alle drei Modelle mit einem realen Pizzafoto, 25 Bildwerten, Offline-Cache mit frischem Worker und einem Negativbild. Zusätzlich: UI, Speicherung nach Neustart, 100 Profile, eigene Wertung, Rezensionskopie, signierte Community-Ereignisse gegen isolierte Test-Relays, Bestätigungsfluss, Kommentare und Android-15-Emulator-Smoke-Test inklusive echter CLIP-Fotoanalyse in der gepackten WebView und verschlüsselter Identität nach Neustart. Die CI prüft die Test-APK-Signatur mit `apksigner` und erzeugt die Release-APK ohne privaten Schlüssel. Abschließend wird diese lokal mit dem gesicherten Release-Schlüssel signiert und ihre Signatur sowie SHA-256-Prüfsumme geprüft. Private Schlüssel dürfen weder in Git noch in öffentlichen Actions-Artifacts liegen. Bei Fehlern gibt es Screenshots und Logs als Artifacts.

Die ursprünglichen Uploads sind unverändert in `source-original/` archiviert.

## Komponenten, Referenzen und Lizenzen

- [Transformers.js 3.8.1](https://huggingface.co/docs/transformers.js/v3.8.1/en/index) — Apache-2.0; [ONNX Runtime](https://github.com/microsoft/onnxruntime) — MIT.
- [OpenAI CLIP](https://github.com/openai/CLIP) — MIT; [Google SigLIP](https://huggingface.co/google/siglip-base-patch16-224) — Apache-2.0. Die verlinkten Xenova-Modellkarten dokumentieren die ONNX-Konvertierungen.
- [Leaflet 1.9.4](https://leafletjs.com/) — BSD-2-Clause. [OpenStreetMap-Daten](https://www.openstreetmap.org/copyright) — ODbL, Attribution in der Karte.
- [opening_hours](https://github.com/opening-hours/opening_hours.js) — LGPL-3.0, unverändert gebündelt; [tz-lookup](https://github.com/darkskyapp/tz-lookup) — CC0. Quellpakete und exakte Versionen stehen in package-lock.json.
- [nostr-tools](https://github.com/nbd-wtf/nostr-tools) — Unlicense; [Nostr-Protokoll](https://github.com/nostr-protocol/nips).
- [Google Maps URLs](https://developers.google.com/maps/documentation/urls/get-started) für Ortssuche und Navigation, keine automatische Veröffentlichung von Rezensionen.
- Testfoto: Valerio Capello, Farbrevision Rainer Zenz, [Pizza Margherita, Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Eq_it-na_pizza-margherita_sep2005_sml.jpg), [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/). Ausschließlich CI-Test, Vorschau verkleinert/neu kodiert; keine Community-Veröffentlichung. Nicht in der APK gebündelt.

Kopien der Lizenzen gepackter Abhängigkeiten liegen nach `npm run assets` in `web/vendor`. Die Nutzungsbedingungen externer Kartenanbieter und Community-Relays gelten für deren Dienste.
