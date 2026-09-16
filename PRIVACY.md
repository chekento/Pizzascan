# PizzaScan – Datenschutzerklärung

**Stand:** 16. September 2026  
**Version:** 2.3.5  
**Android-Paket für Google Play:** `cloud.kosch.pizzascan`

Die ausführliche und für den aktuellen Release maßgebliche Datenschutzerklärung wird unter [`docs/Datenschutz.md`](docs/Datenschutz.md) gepflegt. Diese Root-Datei fasst die wichtigsten Punkte zusammen und verweist für Details, Anbieterinformationen, Speicherfristen und Betroffenenrechte auf die vollständige Fassung.

## Verantwortlicher und Kontakt

Verantwortlich für PizzaScan ist **Kolja Werner Schumann (KoSch), Deutschland**. Kontakt ist über <https://kosch.cloud/> und das öffentliche Projekt <https://github.com/chekento/Pizzascan> möglich. Weitere veröffentlichte Entwickler-Kontaktdaten ergeben sich aus dem Google-Play-Entwicklerprofil.

## Kurzfassung

PizzaScan benötigt kein Benutzerkonto und betreibt keinen eigenen Server für Benutzerprofile, Pizza-Fotos oder private Restaurantbewertungen. Die App enthält keine Werbung, kein eigenes Analytics-SDK, kein Community-System und verkauft keine personenbezogenen Daten.

- Fotos für die KI-Analyse werden lokal auf dem Gerät verarbeitet.
- Offline-KI-Modelle werden erst nach Bestätigung geladen und im privaten persistenten App-Speicher wiederverwendet.
- Standortzugriff ist optional, nur im Vordergrund und kann jederzeit entzogen werden.
- Karten-, Restaurant- und Suchdaten kommen aus dem OpenStreetMap-Ökosystem; für die Pizza-/Italien-Suche können mehrere öffentliche Overpass-Mirrors parallel abgefragt und nach OSM-ID zusammengeführt werden.
- Bereits gefundene passende Orte werden lokal in IndexedDB zwischengespeichert und beim nächsten Start wieder geladen.
- Als selbst besucht bestätigte und selbst bewertete Orte werden in einem dauerhaften lokalen Besuchsarchiv gespeichert. Dieses Archiv kann als Markdown-Datei gesichert und später wieder geladen werden.
- Öffentliche Ortsbewertungen können optional von Mangrove / Open Reviews gelesen werden.
- Das **freiwillige Veröffentlichen eigener Bewertungen zu Open Reviews / Mangrove ist standardmäßig ausgeschaltet**. Auch nach Aktivierung findet kein automatischer Upload statt; jede konkrete Veröffentlichung erfordert einen ausdrücklichen Nutzerbefehl.
- Für einen freiwillig veröffentlichten Open-Reviews-Beitrag werden Bewertung, optionaler freigegebener Rezensionstext, Ortsname/Koordinaten, OSM-ID und ein pseudonymer öffentlicher Signaturschlüssel direkt an `api.mangrove.reviews` übertragen. Der zugehörige private P-256-Schlüssel bleibt lokal in der App.
- Google Maps, Tripadvisor und Yelp werden nur nach Antippen als externe Ziele geöffnet. Eine optionale Google-Places-Reviews-Funktion benötigt einen vom Nutzer selbst hinterlegten API-Key.

## Lokale Daten und Exporte

Je nach Nutzung speichert PizzaScan lokal Einstellungen, Kartenansicht und Filter, gefundene Ortsdaten, gemerkte Orte, das Besuchsarchiv, eigene Bewertungen und Notizen, Rezensionsentwürfe, Fotoanalysen, ausgewählte Fotos, Offline-KI-Modelle sowie reduzierte Caches für offene Bewertungs- und Suchdaten.

Das Besuchsarchiv kann als Markdown exportiert werden. Der Export enthält Ortsdaten, eigene Bewertungen und gegebenenfalls eigene Notizen, aber keine Fotos und keinen privaten Open-Reviews-Signaturschlüssel. Außerhalb der App gespeicherte Dateien liegen in der Verantwortung des vom Nutzer gewählten Speicherorts oder Cloud-Anbieters.

## Externe Dienste

Abhängig von der verwendeten Funktion kann PizzaScan direkte HTTPS-Verbindungen insbesondere zu folgenden Diensten aufbauen:

- OpenStreetMap-Kartenkacheln,
- `overpass-api.de`, `overpass.private.coffee`, `overpass.osm.jp` und `maps.mail.ru` für OSM-POI-Daten,
- `photon.komoot.io` und bei ausdrücklich abgesendeter Suche gegebenenfalls Nominatim für Ort-/Adresssuche,
- `api.mangrove.reviews` für optional geladene offene Bewertungen und nur nach ausdrücklicher Freigabe für eigene veröffentlichte Beiträge,
- Hugging Face für den Download der vom Nutzer bestätigten lokalen KI-Modelle,
- optional Google Places API (New), wenn der Nutzer selbst einen API-Key hinterlegt und die Funktion aufruft.

Solche Dienste erhalten technisch notwendige Verbindungsdaten wie IP-Adresse und Zeitpunkt. Standortnahe Suchbereiche können Rückschlüsse auf einen ungefähren oder genauen Standort ermöglichen. Details und Links zu den Anbieterinformationen stehen in [`docs/Datenschutz.md`](docs/Datenschutz.md).

## Löschen und Widerruf

Lokale Daten können über die jeweiligen App-Funktionen beziehungsweise vollständig über **Android → Apps → PizzaScan → Speicher → Daten löschen** oder durch Deinstallation entfernt werden. Das Abschalten einer optionalen Netzwerkfunktion stoppt zukünftige Übermittlungen, löscht aber keine bereits bewusst extern veröffentlichten Beiträge. Außerhalb von PizzaScan gespeicherte Exporte und extern veröffentlichte Inhalte müssen am jeweiligen Ziel separat verwaltet werden.

Soweit die DSGVO anwendbar ist, erläutert die vollständige Datenschutzerklärung Rechtsgrundlagen, internationale Datenübermittlungen und Betroffenenrechte. Für ausschließlich lokal gespeicherte Daten kann der Entwickler keine Fernlöschung durchführen.

**Vollständige Datenschutzerklärung:** [`docs/Datenschutz.md`](docs/Datenschutz.md)
