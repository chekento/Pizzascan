# PizzaScan – Datenschutzerklärung

**Stand:** 14. September 2026  
**Version:** 2.3.3  
**Android-Paket für Google Play:** `cloud.kosch.pizzascan`

Diese Datei entspricht inhaltlich der für den aktuellen Release gepflegten [Datenschutzerklärung unter `docs/Datenschutz.md`](docs/Datenschutz.md). PizzaScan ist so konzipiert, dass persönliche Bewertungen, Fotos, Entwürfe und KI-Auswertungen möglichst lokal auf dem Android-Gerät verarbeitet werden.

## 1. Verantwortlicher und Kontakt

Verantwortlich für PizzaScan ist **Kolja Werner Schumann (KoSch), Deutschland**. Kontakt ist über <https://kosch.cloud/> und das öffentliche Projekt <https://github.com/chekento/Pizzascan> möglich. Weitere veröffentlichte Entwickler-Kontaktdaten ergeben sich aus dem Google-Play-Entwicklerprofil.

## 2. Kurzfassung

PizzaScan benötigt kein Benutzerkonto und betreibt keinen eigenen Server für Benutzerprofile, Fotos oder Restaurantbewertungen.

- Fotos für die KI-Analyse werden lokal auf dem Gerät verarbeitet.
- Heruntergeladene Offline-KI-Modelle werden im privaten persistenten App-Speicher gespeichert und wiederverwendet.
- Standortzugriff ist optional und erfolgt nur im Vordergrund.
- Restaurant-, Karten- und Suchdaten werden über externe OpenStreetMap-basierte Dienste geladen.
- Photon ist Primärdienst für Orts-/Adresssuche und Autocomplete.
- Nominatim wird in 2.3.3 nur nach ausdrücklich abgesendeter Suche als Fallback genutzt, wenn Photon fehlschlägt oder keinen brauchbaren Treffer liefert; nicht für Autocomplete.
- Offene Ortsbewertungen stammen optional von Mangrove/Open Reviews.
- Eigene Bewertungen, Notizen, gemerkte Orte und Rezensionsentwürfe werden lokal gespeichert.
- PizzaScan veröffentlicht keine Google-Rezension automatisch.
- Die App enthält keine Werbung, kein eigenes Analytics-SDK und kein eigenes Nutzertracking.
- PizzaScan verkauft keine personenbezogenen Daten.

## 3. Lokal gespeicherte App-Daten

Abhängig von der Nutzung speichert PizzaScan lokal unter anderem Einstellungen und Darstellungsoptionen, den zuletzt verwendeten Kartenausschnitt und Suchparameter, gemerkte oder besuchte Restaurants, eigene Restaurantbewertungen und Notizen, Rezensionsentwürfe, Ergebnisse lokaler Fotoanalysen, ausgewählte Fotos, persistente Offline-KI-Modelldateien sowie reduzierte offene Bewertungsdaten und Such-/Fallback-Caches. Diese Daten werden nicht automatisch an einen PizzaScan-Benutzerdatenserver übertragen, weil ein solcher Server nicht betrieben wird.

## 4. Persistente Offline-KI-Modelle

PizzaScan kann CLIP ViT-B/32, CLIP ViT-B/16 und SigLIP Base Patch16-224 lokal als ONNX-/Web-Ausführung verwenden. Vor dem ersten Einsatz informiert PizzaScan über Zweck und ungefähre Downloadgröße. Erst nach Bestätigung wird das gewählte Modell geladen.

Nach erfolgreichem Download liegen die Modelldateien im privaten persistenten Android-App-Speicher. Ein normaler App-Neustart oder normales Leeren des Cache löst deshalb nicht automatisch einen erneuten vollständigen Download aus. Entfernt werden die Dateien durch die entsprechende App-Funktion, vollständiges Löschen der App-Daten oder Deinstallation.

Die Modelldateien werden bei Bedarf von **Hugging Face** bzw. dessen Download-Infrastruktur geladen. Dabei erhält der Anbieter technisch notwendige Verbindungsdaten wie IP-Adresse, Zeitpunkt und angeforderte Datei, aber kein für die lokale Analyse gewähltes Foto oder privates Rezensionstextfeld. Datenschutz: <https://huggingface.co/privacy>.

## 5. Fotoauswahl, Kamera und lokale KI-Analyse

Ein Foto wird über Androids System-Dateiauswahl oder eine Kamera-App bereitgestellt. PizzaScan benötigt keinen pauschalen dauerhaften Zugriff auf die gesamte Fotobibliothek. Das Bild wird lokal verarbeitet und für die KI-Inferenz nicht an Hugging Face, OpenAI, Google oder einen anderen Cloud-KI-Dienst hochgeladen.

Die lokale Fotoanalyse ist experimentell. Geschmack, Geruch, Temperatur, Hygiene, Allergene oder Lebensmittelsicherheit lassen sich aus einem Foto nicht zuverlässig bestimmen.

## 6. Standortdaten

PizzaScan kann nach Android-Berechtigung den Standort im Vordergrund verwenden, um Restaurants und Pizza-Orte in der Umgebung anzuzeigen. Die Nutzung ist optional, es gibt keine Hintergrund-Ortung und kein durch PizzaScan aufgebautes Bewegungsprofil. Die Berechtigung kann jederzeit entzogen werden. Die App kann stattdessen manuell über Restaurant-, Pizzeria-, Orts- und Adresssuche genutzt werden.

Bei einer standortbezogenen Karten- oder Photon-Suche können Koordinaten bzw. Suchbereiche an die dafür verwendeten externen Dienste übertragen werden.

## 7. Karten-, Restaurant-, Pizzeria-, Orts- und Adresssuche

PizzaScan verwendet Dienste aus dem OpenStreetMap-Ökosystem:

- **OpenStreetMap / `tile.openstreetmap.org`** für Kartenkacheln,
- **Overpass** (`overpass-api.de`, bei Bedarf `overpass.private.coffee`) für Restaurant- und POI-Daten,
- **Photon / `photon.komoot.io`** als Primärdienst für Ort-/Adresssuche, Restaurantadressabgleich und verzögerte Online-Suchvorschläge,
- **Nominatim / `nominatim.openstreetmap.org`** ausschließlich als Fallback bei einer ausdrücklich abgesendeten Suche, wenn Photon fehlschlägt oder keinen brauchbaren Treffer liefert.

Photon kann Suchtext und Suchmittelpunkt erhalten. Der Nominatim-Fallback erhält von PizzaScan Suchtext, Sprache und technische Ergebnisparameter, aber **keine von PizzaScan hinzugefügten Standortkoordinaten bzw. keinen Suchmittelpunkt**. Nominatim wird nicht für Autocomplete oder bloße Texteingabe verwendet. Die Fallback-Anfragen werden gedrosselt und erfolgreiche Ergebnisse ungefähr 24 Stunden zwischengespeichert.

Alle direkt angesprochenen Dienste erhalten technisch notwendige Verbindungsdaten wie öffentliche IP-Adresse, Zeitpunkt und HTTP-/Client-Informationen. PizzaScan kontrolliert deren Serverprotokolle und Aufbewahrungsfristen nicht.

Datenschutz/Policies: <https://osmfoundation.org/wiki/Privacy_Policy> · <https://operations.osmfoundation.org/policies/nominatim/> · <https://private.coffee/privacy.html> · <https://www.komoot.com/privacy>.

## 8. Offene Ortsbewertungen

Wenn „Offene Bewertungen laden“ eingeschaltet ist, fragt PizzaScan `api.mangrove.reviews` nach öffentlichen Bewertungsdaten im Bereich geladener Orte. Die Open Reviews Association erhält dabei Suchbereich sowie technisch notwendige Verbindungsdaten. Eigene Fotos, eigene Bewertungen und Entwürfe werden nicht übertragen.

Der lokale Bewertungs-Cache enthält keine fremden Rezensionstexte oder Fotos. Externe Links zu Google Maps, Tripadvisor und Yelp werden erst nach Antippen geöffnet. Anbieterinformationen: <https://mangrove.reviews/terms> · <https://www.tripadvisor.com/pages/privacy.html> · <https://terms.yelp.com/privacy>.

### Optionale Google Maps Reviews (Places API New)

Wenn du freiwillig einen eigenen Google Places API-Key hinterlegst und für einen ausgewählten Restauranttreffer ausdrücklich **Google Maps Reviews laden** auswählst, übermittelt PizzaScan Name, Adresse und Koordinaten des Restaurants sowie die gewählte Sprache direkt an die Google Places API (New). Google erhält dabei außerdem technisch notwendige Verbindungsdaten wie die öffentliche IP-Adresse und verarbeitet den verwendeten API-Key bzw. das zugehörige Cloud-Projekt. Der Key wird ausschließlich lokal im App-Webspeicher gespeichert und nicht an KoSch oder einen PizzaScan-Server übertragen.

Google kann für die Places API ein Cloud-Projekt mit aktivierter Abrechnung verlangen. Ohne eigenen Key findet keine Places-API-Abfrage statt; PizzaScan bleibt vollständig nutzbar und öffnet Google Maps weiterhin nur extern. Google liefert für diese Funktion höchstens fünf Rezensionen pro passenden Ort. PizzaScan speichert die abgerufenen Google-Bewertungen und Rezensionstexte nicht dauerhaft; sie verbleiben nur im Arbeitsspeicher der laufenden Sitzung. Google-Datenschutz: <https://policies.google.com/privacy?hl=de>.

## 9. Rezensionsbaukasten und externe Apps

Eigene Restaurantbewertungen, ausgewählte Bausteine und bearbeitete Rezensionstexte werden lokal gespeichert. Der Baukasten verwendet ausschließlich eigene Angaben; KI-Fotowerte werden nicht als persönliche Restaurant-Erfahrung übernommen. Kopieren überträgt den angezeigten Text in die Android-Zwischenablage. Google Maps und andere externe Ziele werden erst nach einer Nutzeraktion geöffnet. PizzaScan veröffentlicht keine Rezension automatisch und hat keinen Zugriff auf externe Konten. Google Datenschutz: <https://policies.google.com/privacy?hl=de>.

## 10. Exporte

Analyse- und Rezensionsdaten können auf Wunsch als JSON exportiert werden. Der Nutzer bestimmt über Android den Speicherort bzw. die Ziel-App. Wird ein Cloud-Speicher oder eine andere App gewählt, gelten deren eigene Datenschutzbedingungen. PizzaScan kontrolliert eine außerhalb der App gespeicherte Datei nicht mehr.

## 11. Werbung, Tracking und Analytics

Die aktuelle PizzaScan-Version enthält keine Werbeplattform, kein eigenes Analytics-SDK, kein eigenes Profiling-System, kein soziales Netzwerk bzw. Community-System und keinen eigenen Benutzerkonto-Dienst. Unabhängige externe Dienste für Karte, Suche, offene Bewertungen oder Modelldownload können eigene technische Serverprotokolle führen.

## 12. Speicherdauer und Löschen

Lokal gespeicherte PizzaScan-Daten bleiben grundsätzlich auf dem Gerät, bis sie durch eine App-Funktion, vollständiges Löschen der App-Daten oder Deinstallation entfernt werden. Such-/Fallback-Caches werden funktionsbedingt wesentlich kürzer genutzt; Nominatim-Fallback-Ergebnisse ungefähr 24 Stunden.

Mögliche Löschwege: einzelne lokale Bewertungen/Entwürfe/Analysen in der App, heruntergeladene KI-Modelle über die Modellverwaltung sowie alle Daten über **Android → Apps → PizzaScan → Speicher → Daten löschen** oder Deinstallation. Außerhalb von PizzaScan exportierte Dateien und extern veröffentlichte Inhalte müssen am jeweiligen Ziel separat gelöscht werden.

## 13. Datensicherheit

PizzaScan verwendet privaten Android-App-Speicher für lokale Daten und persistente Modelldateien. Unterstützte Netzverbindungen werden über HTTPS aufgebaut. Nutzer sollten ihr Android-Gerät mit geeigneten Gerätesicherheitsfunktionen schützen.

## 14. Rechtsgrundlagen nach DSGVO

Soweit die DSGVO anwendbar ist, kommen abhängig von der Funktion insbesondere Art. 6 Abs. 1 lit. a DSGVO (Einwilligung, beispielsweise freiwillige Standortfreigabe), Art. 6 Abs. 1 lit. b DSGVO (angeforderte App-Funktion, soweit einschlägig) und Art. 6 Abs. 1 lit. f DSGVO (sicherer und funktionsfähiger technischer Betrieb, soweit einschlägig) in Betracht. Freigaben können für die Zukunft widerrufen werden.

## 15. Internationale Datenübermittlung

Externe Anbieter für Karten, Suche, offene Bewertungen oder Modelldownload können Daten außerhalb Deutschlands bzw. außerhalb des Europäischen Wirtschaftsraums verarbeiten. Maßgeblich sind deren jeweilige Datenschutzinformationen und Rechtsgrundlagen. PizzaScan selbst betreibt keinen eigenen Cloud-Dienst, an den private Pizza-Fotos oder private Rezensionsentwürfe zur Verarbeitung übertragen werden.

## 16. Rechte betroffener Personen

Soweit die gesetzlichen Voraussetzungen erfüllt sind, bestehen insbesondere Rechte auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung, Datenübertragbarkeit, Widerspruch und Widerruf einer Einwilligung für die Zukunft sowie das Recht auf Beschwerde bei einer zuständigen Datenschutzaufsichtsbehörde.

Daten, die ausschließlich lokal auf dem eigenen Android-Gerät gespeichert sind, kann der Entwickler technisch nicht aus der Ferne einsehen oder löschen.

## 17. Kinder und Zielgruppe

PizzaScan richtet sich nicht speziell an Kinder. Die App enthält kein eigenes Kinderkonto-, Profil- oder Community-System und sammelt nicht wissentlich personenbezogene Daten von Kindern über ein eigenes Backend.

## 18. Änderungen

Diese Datenschutzerklärung wird angepasst, wenn sich Funktionen, externe Dienste oder rechtliche Anforderungen wesentlich ändern. Maßgeblich ist die im Repository und für den veröffentlichten App-Stand ausgewiesene aktuelle Fassung.
