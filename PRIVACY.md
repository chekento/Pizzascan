# PizzaScan – Datenschutzerklärung

**Stand:** 12. September 2026  
**App:** PizzaScan  
**Android-Paket für Google Play:** `cloud.kosch.pizzascan`

Diese Datenschutzerklärung beschreibt die Datenverarbeitung der Android-App **PizzaScan**. Sie gilt für den von KoSch veröffentlichten offiziellen App-Stand. PizzaScan ist so konzipiert, dass persönliche Bewertungen, Fotos, Entwürfe und KI-Auswertungen möglichst lokal auf dem Android-Gerät verarbeitet werden.

## 1. Verantwortlicher und Kontakt

Verantwortlich für PizzaScan ist:

**Kolja Werner Schumann (KoSch)**  
Deutschland  
Website und Kontakt: <https://kosch.cloud/>  
Projekt und technischer Kontakt: <https://github.com/chekento/Pizzascan>

Für Datenschutzanfragen kann über die Website oder das öffentliche GitHub-Repository Kontakt aufgenommen werden. Weitere veröffentlichte Entwickler-Kontaktdaten ergeben sich aus dem Google-Play-Entwicklerprofil.

## 2. Kurzfassung

PizzaScan benötigt **kein Benutzerkonto** und betreibt keinen eigenen Server für Benutzerprofile, Fotos oder Restaurantbewertungen.

- Fotos für die KI-Analyse werden **lokal auf dem Gerät** verarbeitet.
- Heruntergeladene Offline-KI-Modelle werden nach dem ersten Download im **privaten persistenten App-Speicher** gespeichert und bei späteren Analysen wiederverwendet.
- Standortzugriff ist **optional** und erfolgt nur im Vordergrund für standortbezogene Karten- und Suchfunktionen.
- Restaurant-, Karten- und Suchdaten werden über externe OpenStreetMap-basierte Dienste geladen.
- Eigene Bewertungen, Notizen, gemerkte Orte und Rezensionsentwürfe werden lokal gespeichert.
- PizzaScan veröffentlicht **keine Google-Rezension automatisch**.
- Die aktuelle App enthält **keine Werbung, kein eigenes Analytics-SDK und kein eigenes Nutzertracking**.
- PizzaScan verkauft keine personenbezogenen Daten.

## 3. Lokal gespeicherte App-Daten

Abhängig von der Nutzung speichert PizzaScan lokal auf dem Gerät insbesondere:

- Einstellungen und Darstellungsoptionen,
- den zuletzt verwendeten Kartenausschnitt und Suchparameter,
- gemerkte oder besuchte Restaurants und Pizza-Orte,
- eigene Restaurantbewertungen und Notizen,
- Rezensionsentwürfe und ausgewählte Bewertungsbausteine,
- Ergebnisse lokaler Fotoanalysen,
- ausgewählte bzw. temporär verarbeitete Fotos,
- heruntergeladene Offline-KI-Modelldateien.

Diese Daten werden nicht automatisch an einen PizzaScan-Server übertragen, weil ein solcher Benutzerdaten-Server nicht betrieben wird.

## 4. Persistente Offline-KI-Modelle

PizzaScan kann lokale Bild-Sprach-Modelle verwenden, darunter:

- CLIP ViT-B/32,
- CLIP ViT-B/16,
- SigLIP Base Patch16-224,

jeweils in einer für die lokale Ausführung geeigneten ONNX-/Web-Ausführung.

Vor dem ersten Einsatz eines ausgewählten Modells informiert PizzaScan über Zweck, ungefähre Downloadgröße und lokale Verarbeitung. Erst nach Bestätigung wird das Modell heruntergeladen.

### Speicherung

Nach erfolgreichem Download werden die Modelldateien im privaten Android-App-Speicher unter einem persistenten Modellbereich (`filesDir/offline-models`) gespeichert. Sie liegen damit **nicht nur im gewöhnlichen Cache**.

Das bedeutet:

- ein normaler App-Neustart löst keinen erneuten vollständigen Modelldownload aus,
- eine normale Cache-Bereinigung soll die persistenten Modelldateien nicht entfernen,
- ein erneuter Download kann erforderlich werden, wenn Modelle in PizzaScan ausdrücklich gelöscht werden, die App-Daten vollständig gelöscht werden, die App deinstalliert wird oder ein anderes noch nicht installiertes Modell ausgewählt wird.

### Downloadquelle

Die Modelldateien werden bei Bedarf von **Hugging Face** bzw. dessen Download-Infrastruktur geladen. Dabei erhält der Anbieter technisch notwendige Verbindungsdaten, insbesondere IP-Adresse, Zeitpunkt, angeforderte Modelldatei und technische Client-Informationen.

Datenschutzinformationen: <https://huggingface.co/privacy>

## 5. Fotoauswahl, Kamera und lokale KI-Analyse

Ein Foto kann über Androids System-Dateiauswahl oder über eine Kamera-App bereitgestellt werden. PizzaScan benötigt dafür keinen pauschalen dauerhaften Zugriff auf die gesamte Fotobibliothek.

Für die KI-Auswertung wird das ausgewählte Bild lokal verarbeitet. PizzaScan sendet das Foto **nicht zur KI-Inferenz an Hugging Face, OpenAI, Google oder einen anderen Cloud-KI-Dienst**.

Die lokale Fotoanalyse ist experimentell und dient nur als visuelle Einschätzung. Sie kann insbesondere Geschmack, Geruch, Temperatur, Hygiene, Allergene oder Lebensmittelsicherheit nicht zuverlässig bestimmen.

## 6. Standortdaten

PizzaScan kann nach ausdrücklicher Android-Berechtigung den Standort des Geräts verwenden, um Restaurants und Pizza-Orte in der Umgebung anzuzeigen.

- Standortzugriff ist optional.
- Es gibt keine Hintergrund-Ortung durch PizzaScan.
- Es wird kein Bewegungsprofil durch PizzaScan erstellt.
- Die Berechtigung kann jederzeit in den Android-Einstellungen entzogen werden.
- Die App kann auch ohne Standortfreigabe über die manuelle Restaurant-, Pizzeria-, Orts- und Adresssuche verwendet werden.

Wird eine standortbezogene Suche ausgeführt, können Koordinaten oder ein Kartenausschnitt Bestandteil von Anfragen an externe Karten- und Suchdienste sein.

## 7. Karten-, Restaurant- und Pizzeria-Suche

PizzaScan verwendet öffentlich zugängliche Dienste aus dem OpenStreetMap-Ökosystem. Je nach Funktion können insbesondere folgende Anbieter angesprochen werden:

### OpenStreetMap

Kartenkacheln und Kartengrundlage können von OpenStreetMap geladen werden.

Datenschutz: <https://osmfoundation.org/wiki/Privacy_Policy>

### Overpass API

Restaurant-, Pizzeria- und POI-Daten werden über Overpass-Dienste abgefragt, insbesondere:

- `overpass-api.de`
- `overpass.private.coffee`

Datenschutz Private.coffee: <https://private.coffee/privacy.html>

### Photon

Für Restaurant-, Pizzeria-, Orts- und Adresssuche sowie Autovervollständigung können Suchtexte an Photon gesendet werden. Dadurch kann bereits während einer aktiven Suche eine Netzwerkanfrage ausgelöst werden.

Photon-Projekt: <https://github.com/komoot/photon>  
komoot Datenschutz: <https://www.komoot.com/privacy>

### Welche Daten erhalten diese Dienste?

Bei einer Netzwerkanfrage erhalten externe Anbieter typischerweise:

- die öffentliche IP-Adresse,
- Datum und Zeitpunkt,
- technische Verbindungsinformationen,
- den angeforderten Kartenausschnitt oder Suchbereich,
- eingegebene Suchbegriffe,
- gegebenenfalls Koordinaten bzw. Suchmittelpunkte.

PizzaScan kontrolliert die Serverprotokolle und Aufbewahrungsfristen dieser unabhängigen Anbieter nicht.

## 8. Restaurantdetails und externe Links

Restaurantdetails können Informationen aus OpenStreetMap/Overpass/Photon enthalten, etwa:

- Name und Adresse,
- Koordinaten,
- Öffnungszeiten,
- Telefonnummer,
- Website oder Speisekarte,
- vorhandene Angaben zu Lieferung, Abholung, Barrierefreiheit oder Ernährung.

Telefon-, Webseiten-, Routen- und andere externe Links werden erst nach einer Nutzeraktion geöffnet. Danach gelten die Datenschutzbestimmungen der jeweiligen externen App oder Website.

## 9. Rezensionsbaukasten und Google Maps

PizzaScan enthält einen Baukasten zum Formulieren eigener Restaurantrezensionen.

Dafür werden ausschließlich Angaben verwendet, die der Nutzer selbst auswählt oder eingibt. KI-Fotowerte werden nicht automatisch als persönliche Restaurant-Erfahrung ausgegeben.

PizzaScan kann einen fertigen Text in die Android-Zwischenablage kopieren. Inhalte in der Zwischenablage können abhängig von Android-Version, Geräteeinstellungen und anderen installierten Apps außerhalb von PizzaScan zugänglich sein.

Beim freiwilligen Öffnen von Google Maps werden Restaurantinformationen an die externe Google-Maps-App bzw. Google-Webseite übergeben. PizzaScan:

- veröffentlicht keine Rezension automatisch,
- meldet sich nicht in ein Google-Konto ein,
- hat keinen Zugriff auf das Google-Konto,
- kann veröffentlichte Google-Rezensionen nicht verändern oder löschen.

Google Datenschutz: <https://policies.google.com/privacy?hl=de>

## 10. Lokale Exporte und Dateien

Bestimmte Daten können auf Wunsch als Datei exportiert werden, zum Beispiel Analyse- oder Rezensionsdaten. Der Nutzer bestimmt über Android, wo diese Datei gespeichert oder mit welchem Dienst sie geteilt wird.

Wird dabei ein Cloud-Speicher oder eine andere App gewählt, gelten deren eigene Datenschutzbedingungen. PizzaScan kontrolliert eine anschließend außerhalb der App gespeicherte Datei nicht mehr.

## 11. Werbung, Tracking und Analytics

Die aktuelle PizzaScan-Version enthält:

- keine Werbeplattform,
- kein eigenes Analytics-SDK,
- kein eigenes Profiling-System,
- kein soziales Netzwerk oder Community-System,
- keinen eigenen Benutzerkonto-Dienst.

Unabhängige externe Dienste, die für Karte, Suche oder Modelldownload erforderlich sind, können eigene technische Serverprotokolle führen.

Google Play und das Android-Betriebssystem können außerdem eigenständig Installations-, Geräte-, Sicherheits- oder Store-Daten verarbeiten. Diese Verarbeitung erfolgt nicht durch PizzaScan selbst und richtet sich nach den Datenschutzbestimmungen von Google bzw. des Geräteanbieters.

## 12. Speicherdauer und Löschen

Lokal gespeicherte PizzaScan-Daten bleiben grundsätzlich auf dem Gerät, bis sie durch eine App-Funktion, Android, das vollständige Löschen der App-Daten oder eine Deinstallation entfernt werden.

Mögliche Löschwege sind insbesondere:

- einzelne lokale Bewertungen oder Entwürfe in der App löschen,
- heruntergeladene KI-Modelle über die Modellverwaltung entfernen,
- App-Daten über **Android → Apps → PizzaScan → Speicher → Daten löschen** entfernen,
- PizzaScan deinstallieren.

Außerhalb von PizzaScan exportierte Dateien müssen am jeweiligen Speicherort separat gelöscht werden. Bei Google oder anderen externen Diensten veröffentlichte Inhalte müssen dort gelöscht werden.

## 13. Datensicherheit

PizzaScan verwendet den privaten Android-App-Speicher für lokale Anwendungsdaten und persistente Modelldateien. Netzwerkverbindungen zu unterstützten Diensten werden über HTTPS verwendet, soweit der jeweilige Dienst dies unterstützt.

Trotz technischer Schutzmaßnahmen kann kein System absolute Sicherheit garantieren. Nutzer sollten ihr Android-Gerät mit geeigneten Gerätesicherheitsfunktionen schützen.

## 14. Rechtsgrundlagen nach DSGVO

Soweit die Verarbeitung personenbezogener Daten unter die DSGVO fällt, kommen abhängig von der jeweiligen Funktion insbesondere folgende Rechtsgrundlagen in Betracht:

- **Art. 6 Abs. 1 lit. a DSGVO – Einwilligung**, insbesondere bei freiwilliger Standortfreigabe,
- **Art. 6 Abs. 1 lit. b DSGVO – Durchführung der vom Nutzer angeforderten App-Funktion**, soweit einschlägig,
- **Art. 6 Abs. 1 lit. f DSGVO – berechtigtes Interesse** an einem sicheren, funktionsfähigen und missbrauchsresistenten technischen Betrieb, soweit einschlägig.

Eine erteilte Standortberechtigung kann für die Zukunft über Android widerrufen werden.

## 15. Internationale Datenübermittlung

Externe Anbieter für Karten, Suche oder Modelldownload können Daten außerhalb Deutschlands bzw. außerhalb des Europäischen Wirtschaftsraums verarbeiten. Maßgeblich sind insoweit die Datenschutzinformationen und Rechtsgrundlagen des jeweiligen Anbieters.

PizzaScan selbst betreibt keinen eigenen Cloud-Dienst, an den persönliche Pizza-Fotos oder private Rezensionsentwürfe zur Verarbeitung übertragen werden.

## 16. Rechte betroffener Personen

Soweit die gesetzlichen Voraussetzungen erfüllt sind, bestehen insbesondere Rechte auf:

- Auskunft,
- Berichtigung,
- Löschung,
- Einschränkung der Verarbeitung,
- Datenübertragbarkeit,
- Widerspruch,
- Widerruf einer Einwilligung für die Zukunft.

Außerdem besteht das Recht, sich bei einer zuständigen Datenschutzaufsichtsbehörde zu beschweren.

Daten, die ausschließlich lokal auf dem eigenen Android-Gerät gespeichert sind, kann der Entwickler technisch nicht aus der Ferne einsehen oder löschen. Diese Daten können direkt über die App oder Android gelöscht werden.

## 17. Kinder und Zielgruppe

PizzaScan richtet sich nicht speziell an Kinder. Die App enthält kein eigenes Kinderkonto-, Profil- oder Community-System und sammelt nicht wissentlich personenbezogene Daten von Kindern über ein eigenes Backend.

## 18. Änderungen dieser Datenschutzerklärung

Diese Datenschutzerklärung wird angepasst, wenn sich Funktionen, externe Dienste oder rechtliche Anforderungen wesentlich ändern. Die aktuelle Fassung wird dauerhaft im öffentlichen PizzaScan-Repository veröffentlicht.

---

## English summary

PizzaScan does not require an account and does not operate its own backend for user photos, restaurant reviews or profiles. User-created ratings, drafts and analysis data are primarily stored locally on the Android device.

Optional foreground location access is used for nearby restaurant and pizza-place searches. OpenStreetMap, Overpass and Photon may receive IP addresses, search text, map areas and coordinates when their services are used. Search autocomplete may perform network requests while the user is actively typing.

AI photo analysis is performed locally. Selected model files are downloaded from Hugging Face after user confirmation and are then kept in persistent private Android app storage so that they do not normally need to be downloaded again after app restarts or ordinary cache clearing. Photos are not uploaded to the model provider for inference.

PizzaScan does not automatically publish Google reviews and currently contains no advertising, own analytics SDK or own user-tracking backend.

Contact: <https://kosch.cloud/> · Project: <https://github.com/chekento/Pizzascan>
