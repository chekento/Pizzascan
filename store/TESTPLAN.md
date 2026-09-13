# Testplan vor dem Play-Start

Ergebnisse mit Gerät, Android- und WebView-Version, Datum und tatsächlich beobachtetem Verhalten festhalten. Keine Restaurantrezension nur für den Test öffentlich veröffentlichen.

1. Neue Installation: ohne Standort starten, anschließend Stadt suchen; später GPS gezielt erlauben und ablehnen. Symbole, Trefferliste und Vollbild testen.
2. Restaurantdetails: Adressen, Website, Speisekarte und Öffnungsstatus gegen Originalquellen prüfen. Bei fehlenden Daten keine Werte erfinden. Nur-geöffnet-Filter inklusive unbekannter Zeiten testen.
3. Baukasten ohne Foto öffnen. Vor Ort, Abholung und Lieferung wechseln. Ausgewählte und nicht ausgewählte Aspekte, Wartezeit-Nachfrage, negative und positive Angaben testen.
4. Eigenen Text bearbeiten, danach Baustein ändern: Text bleibt bestehen. Bausteine bewusst übernehmen. Entwurf schließen, App neu starten und denselben Ort öffnen. Ein anderes Restaurant darf den Entwurf nicht übernehmen.
5. Entwurfsübersicht ohne Internet öffnen und nach einem Text suchen. Einzelnen Entwurf exportieren, löschen und wiederherstellen. Bei vorhandenem Entwurf Ersetzen abbrechen; vorhandener Text bleibt erhalten. Fehlerhafte Datei importieren: andere Entwürfe bleiben unverändert.
6. Bewertung 0,1 / 7,8 / 10,0 und leere/ungültige Eingaben prüfen. Kopieren erst nach Bewertung und Erlebnisbestätigung. In Google Maps Restaurant prüfen und Entwurf nur ansehen, nicht für den Test veröffentlichen.
7. Modellhinweis öffnen und abbrechen: kein KI-Download. CLIP B/32 im WLAN vorbereiten. Eigenes Pizzafoto und Nicht-Pizzafoto testen. 25 Kriterien und 100 simulierte Profile öffnen. Flugmodus mit frischem Foto testen. Wahlweise andere Modelle wiederholen; diese benötigen eigenen Speicher.
8. Kamera/Dateiauswahl abbrechen und erfolgreich nutzen. Modellvorgang abbrechen. Bei Netzfehler vorhandene Daten weiterhin prüfen.
9. Datenschutzerklärung ohne Internet öffnen. Einzelnen Entwurf, einzelne Analyse und Modellcache löschen. Andere Einträge bleiben erhalten.
10. Dunkles Design, Querformat, 360-Pixel-Breite, größere Schrift, Android-Zurück sowie Tastatur im Baukasten prüfen.
11. Signiertes Update über die vorhandene **2.3.0-Testfassung mit Paket-ID `.lang1`** testen: Fotos, Entwürfe, gemerkte Orte, Einstellungen und Modelle bleiben erhalten. `.search1` und die Play-Paket-ID sind getrennte Installationen. Play-Testversion nach Abgleich der Signierschlüssel prüfen. Pre-Launch-Bericht abarbeiten.
12. Kartenmarker: einen Ort und GPS-Punkt merken, Karte mehrfach ziehen, zoomen, Vollbild öffnen und Gerät drehen. Beide Punkte bleiben an denselben geografischen Positionen. Eine Ortssuche darf ihre Treffer nach kurzer Wartezeit nicht wieder verlieren.
13. Einstellungen → Offene Ortsbewertungen: Regler auf **ab 4,6 / 5** stellen, speichern, App neu starten. Liste und Karte müssen dieselben passenden Orte zeigen. Wert in 0,1er-Schritten ändern; bei 0 wird nur der Bewertungsfilter ausgeschaltet. „Orte ohne Bewertung einschließen“, „nur geöffnet“ und gemerkte Orte gemeinsam testen. Bei wenigen Mangrove-Daten sind leere Treffer möglich; keine Teststerne für echte Orte einbauen.
14. Bewertungsdetails: Quelle, Anzahl, Abrufdatum und Berechnung prüfen. Gleichnamige Filialen dürfen nicht vermischt werden. Google Maps, Tripadvisor und Yelp müssen außerhalb der App öffnen; diese Plattformsterne wirken nicht auf den Filter. Fremde Rezensionstexte erscheinen nicht in der App.
15. Netzfehler bei Bewertungen: zuerst online laden, dann ohne Netz erneut öffnen. Vorhandene Daten werden mit ihrem Datum dargestellt; fehlende Daten bekommen keine erfundenen Null-Sterne. „Offene Bewertungen laden“ ausschalten und neu starten: keine neuen Mangrove-Abfragen. Nach mehr als sieben Tagen dürfen alte Cache-Werte nicht mehr als Filtergrundlage dienen.
16. Deutsch, Englisch, Italienisch, Spanisch und Französisch wechseln. Einstellungen, Bewertungsdetails, leere Treffer, Datenschutz und Mindestwert müssen in der gewählten Sprache erscheinen und nach Neustart so bleiben. Den dünnen Footer mit beiden Links sowie das freigegebene Launcher-Symbol prüfen.

Feedbacktabelle: Datum | Gerät | Android/WebView | Testschritt | Erwartung | Beobachtung | Screenshot | behoben in Version.

Automatisierte Browser- und Modultests stehen in [VERIFICATION-2.3.0.md](../docs/VERIFICATION-2.3.0.md). Die obigen Telefon- und Play-Tests sind noch durchzuführen; dafür wurden keine erfolgreichen Ergebnisse vorgetragen.
