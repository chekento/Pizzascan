# Offene Ortsbewertungen in PizzaScan

Stand: 13. September 2026. Es werden keine kostenpflichtigen Bewertungs-APIs aktiviert und keine API-Schlüssel benötigt.

## Datenquelle und Rechte

PizzaScan liest die öffentliche [Mangrove-API](https://docs.mangrove.reviews/) der Open Reviews Association. Der Anbieter beschreibt den Zugang ausdrücklich als kostenlos und den Datensatz als offen: [Technologie und Integration](https://open-reviews.net/technology/). Die [Nutzungsbedingungen, Abschnitt 8](https://mangrove.reviews/terms) erlauben die Aggregation mit Verweis auf den Datensatz. Standard ist CC BY 4.0; einzelne Beiträge können CC BY-SA 4.0 verwenden. Die Lizenzen gelten für die Bewertungsdaten, unabhängig von der Lizenz des App-Quellcodes.

Die App zeigt nur Zahlen, Anzahl, Abrufdatum, Quelle und Originalverweise. Sie übernimmt keine Rezensionstexte oder Fotos. Bei veränderter Darstellung wird die eigene Berechnung ausdrücklich erläutert; Lizenz und Quellen sind in den Details zugänglich. Bei enthaltenen BY-SA-Beiträgen wird das abgeleitete Ergebnis als CC BY-SA 4.0 ausgewiesen. Unbekannte oder eingeschränkte Lizenzen, als Fremdimport gekennzeichnete Beiträge und ausdrücklich generierte oder affiliierte Bewertungen werden nicht berücksichtigt.

Google Maps, Tripadvisor und Yelp sind zusätzliche, erst durch Antippen geöffnete Suchlinks. Es gibt kein Scraping, keine inoffizielle Proxy-API und keinen Abruf ihrer Sterne oder Rezensionstexte. Diese Plattformwerte können deshalb nicht als Filtergrundlage dienen. Eine breit abgedeckte, dauerhaft kostenlose Mehranbieter-Sternequelle wird nicht versprochen.

## Berechnung und Filter

Mangrove verwendet 0–100 Punkte. Wie in der [Referenzoberfläche](https://gitlab.com/open-reviews/mangrove/-/blob/master/ui/components/SubjectProfile.vue) wird auf 1–5 Sterne umgerechnet: `1 + Punkte / 25`. PizzaScan bildet einen eigenen arithmetischen Mittelwert aus den zugeordneten Einzelbewertungen; dies ist nicht Mangroves statistisch gewichteter Qualitätswert. Pro öffentlicher Bewertungsidentität zählt nur der neueste passende Eintrag. Veröffentlichte Nachkommastelle und Filter verwenden denselben gerundeten Wert.

- Der Regler reicht von 0 bis 5 in Schritten von 0,1. **0 schaltet den Bewertungsfilter aus.**
- **Ab 4,6** bedeutet **größer oder gleich 4,6** des angezeigten Mittelwerts.
- Ohne zugeordnete offene Bewertung gibt es keine erfundene Null- oder Fünf-Sterne-Bewertung. Bei aktivem Mindestwert werden solche Orte standardmäßig ausgeblendet. Die gesonderte Option kann sie einschließen.
- Karte, Ergebnisliste und gemerkte Orte verwenden dieselbe Filterfunktion. Öffnungszeiten und Ortstypen bleiben zusätzliche Bedingungen.
- Eigene Besuchswertungen, Rezensionstexte und KI-Fotowerte sind unabhängig davon.
- Abdeckung und Zuordnung können lückenhaft sein. PizzaScan verifiziert keine tatsächlichen Besuche.

## Ortszuordnung und Betrieb

Ein OSM-Bezug muss dieselbe Node-, Way- oder Relation-ID haben und höchstens 200 Meter abweichen. Ohne OSM-ID sind ein exakt normalisierter Name und höchstens 25 Meter Abstand erforderlich. Bei mehreren passenden geladenen Orten wird keine Namenszuordnung vorgenommen.

Abfragen bündeln geladene Orte in Bereichen von sechs Kilometern. Sie verwenden ausschließlich den öffentlichen HTTPS-Endpunkt, ohne Cookies oder Zugangsdaten. Der Dienst wird höchstens in acht Bereichen je Durchlauf abgefragt. Antworten werden paginiert; eine nach sechs Seiten noch unvollständige Antwort wird nicht als vollständiger Mittelwert ausgegeben. HTTP 429 und Retry-After werden auch bei manueller Aktualisierung respektiert. Veraltete Anfragen werden abgebrochen.

Der lokale Cache speichert reduzierte Bewertungsdaten ohne Texte, Fotos oder sonstige persönliche Metadaten. Frische Daten werden 15 Minuten wiederverwendet; Ergebnisse älter als sieben Tage nicht mehr angezeigt. Eine erfolgreiche Aktualisierung ersetzt den betreffenden Bereich, damit entfernte Bewertungen nicht aus alten Daten zurückkehren. Fehler werden von fehlenden Bewertungen unterschieden. Ein voller oder gesperrter Speicher verhindert keinen erfolgreichen Abruf.

Die Verbindung zur Open Reviews Association und die abschaltbare Funktion sind in der [Datenschutzerklärung](Datenschutz.md) und im [Datensicherheits-Arbeitsblatt](../store/DATENSICHERHEIT.md) berücksichtigt.

## Verifikation

`npm test` prüft unter anderem Skala, Grenzwerte, Rechtekennzeichen, Dubletten/Edits, falsche Filialen, Paginierung, Abbruch, Cache und Ausfälle. `npm run ratings-smoke` prüft die reale Oberfläche in Deutsch, Englisch, Italienisch, Spanisch und Französisch einschließlich Speicherung, Karte/Liste, gemerkter Orte, Ausschalten der Verbindung, Quellenlinks und mobiler Darstellung. Diese Tests verwenden ausdrücklich Testdaten; echte Restaurants bekommen keine eingebauten Beispielbewertungen.
