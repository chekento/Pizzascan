# Offene Ortsbewertungen in PizzaScan

Stand: 16. September 2026. Es werden keine kostenpflichtigen Bewertungs-APIs aktiviert und keine API-Schlüssel benötigt.

## Datenquelle und Rechte

PizzaScan liest die öffentliche [Mangrove-API](https://docs.mangrove.reviews/) der Open Reviews Association. Der Anbieter beschreibt den Zugang ausdrücklich als kostenlos und den Datensatz als offen: [Technologie und Integration](https://open-reviews.net/technology/). Die [Nutzungsbedingungen, Abschnitt 8](https://mangrove.reviews/terms) erlauben die Aggregation mit Verweis auf den Datensatz. Standard ist CC BY 4.0; einzelne Beiträge können CC BY-SA 4.0 verwenden. Die Lizenzen gelten für die Bewertungsdaten, unabhängig von der Lizenz des App-Quellcodes.

Die App zeigt beim Lesen nur Zahlen, Anzahl, Abrufdatum, Quelle und Originalverweise. Sie übernimmt keine fremden Rezensionstexte oder Fotos in den dauerhaften lokalen Bewertungs-Cache. Bei veränderter Darstellung wird die eigene Berechnung ausdrücklich erläutert; Lizenz und Quellen sind in den Details zugänglich. Bei enthaltenen BY-SA-Beiträgen wird das abgeleitete Ergebnis als CC BY-SA 4.0 ausgewiesen. Unbekannte oder eingeschränkte Lizenzen, als Fremdimport gekennzeichnete Beiträge und ausdrücklich generierte oder affiliierte Bewertungen werden nicht berücksichtigt.

Google Maps, Tripadvisor und Yelp sind zusätzliche, erst durch Antippen geöffnete Suchlinks. Es gibt kein Scraping und keine inoffizielle Proxy-API. Eine breit abgedeckte, dauerhaft kostenlose Mehranbieter-Sternequelle wird nicht versprochen.

## Lesen, Berechnung und Filter

Mangrove verwendet 0–100 Punkte. Wie in der [Referenzoberfläche](https://gitlab.com/open-reviews/mangrove/-/blob/master/ui/components/SubjectProfile.vue) wird auf 1–5 Sterne umgerechnet: `1 + Punkte / 25`. PizzaScan bildet einen eigenen arithmetischen Mittelwert aus den zugeordneten Einzelbewertungen; dies ist nicht Mangroves statistisch gewichteter Qualitätswert. Pro öffentlicher Bewertungsidentität zählt nur der neueste passende Eintrag. Veröffentlichte Nachkommastelle und Filter verwenden denselben gerundeten Wert.

- Der Regler reicht von 0 bis 5 in Schritten von 0,1. **0 schaltet den Bewertungsfilter aus.**
- **Ab 4,6** bedeutet **größer oder gleich 4,6** des angezeigten Mittelwerts.
- Ohne zugeordnete offene Bewertung gibt es keine erfundene Null- oder Fünf-Sterne-Bewertung. Bei aktivem Mindestwert werden solche Orte standardmäßig ausgeblendet. Die gesonderte Option kann sie einschließen.
- Karte, Ergebnisliste und gemerkte Orte verwenden dieselbe Filterfunktion. Öffnungszeiten und Ortstypen bleiben zusätzliche Bedingungen.
- Eigene Besuchswertungen, Rezensionstexte und KI-Fotowerte sind unabhängig davon.
- Abdeckung und Zuordnung können lückenhaft sein. PizzaScan verifiziert keine tatsächlichen Besuche.

## Freiwillig zum Open-Reviews-Netzwerk beitragen

Build 37 ergänzt eine getrennte Schreibfunktion. Sie ist **standardmäßig deaktiviert**. Auch nach Aktivierung in den Einstellungen wird **nichts automatisch hochgeladen**. Erst ein ausdrücklicher Klick auf „Auf Open Reviews veröffentlichen“ für eine konkrete eigene, als besucht bestätigte Bewertung löst die Übermittlung aus.

PizzaScan erstellt dafür lokal einen ECDSA-P-256-Schlüssel und signiert einen ES256-JWT entsprechend der aktuellen [Mangrove Server API](https://docs.mangrove.reviews/). Der öffentliche Schlüssel identifiziert die pseudonyme Bewertungsidentität; der private Schlüssel bleibt im lokalen IndexedDB-Speicher der App. Es ist kein API-Key erforderlich.

Für einen neuen Beitrag werden insbesondere übermittelt:

- die von dir festgelegte eigene Bewertung, intern für Mangrove auf 0–100 skaliert,
- optional der von dir ausdrücklich zur Veröffentlichung ausgewählte Rezensionstext,
- ein `geo:`-Subjekt mit Ortsname und Koordinaten,
- die OpenStreetMap-Ortskennung als Metadatum,
- `client_id` für PizzaScan und die angegebene offene Lizenz,
- der öffentliche Signaturschlüssel und die kryptografische Signatur.

Wenn derselbe lokale Schlüssel einen bereits aus PizzaScan veröffentlichten Beitrag für denselben Ort erneut veröffentlicht, erzeugt PizzaScan eine Mangrove-`edit`-Aktion statt absichtlich eine zweite unabhängige Bewertung desselben lokalen Nutzers anzulegen. Die dafür nötige Signaturkennung des ursprünglichen Beitrags wird lokal gespeichert.

Das Abschalten der Funktion stoppt zukünftige Uploads, löscht aber keine bereits öffentlich veröffentlichten Beiträge. Öffentliche Beiträge können von Dritten über das Open-Reviews-Netzwerk abgerufen und entsprechend ihrer Lizenz weiterverarbeitet werden. Die Datenschutzhinweise hierzu stehen in [Datenschutz.md](Datenschutz.md).

## Ortszuordnung und Betrieb

Ein OSM-Bezug muss dieselbe Node-, Way- oder Relation-ID haben und höchstens 200 Meter abweichen. Ohne OSM-ID sind ein exakt normalisierter Name und höchstens 25 Meter Abstand erforderlich. Bei mehreren passenden geladenen Orten wird keine Namenszuordnung vorgenommen.

Abfragen bündeln geladene Orte in Bereichen von sechs Kilometern. Sie verwenden ausschließlich den öffentlichen HTTPS-Endpunkt, ohne Cookies oder Zugangsdaten. Der Dienst wird höchstens in acht Bereichen je Durchlauf abgefragt. Antworten werden paginiert; eine nach sechs Seiten noch unvollständige Antwort wird nicht als vollständiger Mittelwert ausgegeben. HTTP 429 und Retry-After werden auch bei manueller Aktualisierung respektiert. Veraltete Anfragen werden abgebrochen.

Der lokale Lese-Cache speichert reduzierte Bewertungsdaten ohne fremde Texte, Fotos oder sonstige persönliche Metadaten. Frische Daten werden 15 Minuten wiederverwendet; Ergebnisse älter als sieben Tage nicht mehr angezeigt. Eine erfolgreiche Aktualisierung ersetzt den betreffenden Bereich, damit entfernte Bewertungen nicht aus alten Daten zurückkehren. Fehler werden von fehlenden Bewertungen unterschieden. Ein voller oder gesperrter Speicher verhindert keinen erfolgreichen Abruf.

Die optionale Schreibidentität wird davon getrennt gespeichert. Der private Schlüssel verlässt bei normaler Nutzung nicht den lokalen App-Speicher. Beim Löschen aller App-Daten oder bei Deinstallation geht dieser lokale Schlüssel verloren, sofern er nicht anderweitig gesichert wurde; bereits veröffentlichte Beiträge bleiben dadurch im öffentlichen Netzwerk bestehen.

Die Verbindung zur Open Reviews Association und die abschaltbaren Lese- und Schreibfunktionen sind in der [Datenschutzerklärung](Datenschutz.md) berücksichtigt.

## Verifikation

`npm test` prüft unter anderem Skala, Grenzwerte, Rechtekennzeichen, Dubletten/Edits, falsche Filialen, Paginierung, Abbruch, Cache und Ausfälle. Für die freiwillige Schreibfunktion werden zusätzlich die 0,1–10-zu-0–100-Abbildung, `geo:`-Subjekte, OSM-Metadaten, ES256/P-256-Signatur, Edit-Bezug und der HTTPS-`PUT`-Submitpfad getestet. `npm run ratings-smoke` prüft die reale Oberfläche in Deutsch, Englisch, Italienisch, Spanisch und Französisch einschließlich Speicherung, Karte/Liste, gemerkter Orte, Ausschalten der Verbindung, Quellenlinks und mobiler Darstellung. Diese Tests verwenden ausdrücklich Testdaten; echte Restaurants bekommen keine eingebauten Beispielbewertungen.
