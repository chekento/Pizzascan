# Datenschutzerklärung für PizzaScan

Stand: 14. September 2026 · Version 2.3.3 · Android-Paket `cloud.kosch.pizzascan`

## Verantwortlicher und Kontakt

Verantwortlich für PizzaScan: Kolja Werner Schumann (KoSch), Deutschland. Bei Fragen zum Datenschutz oder zur Ausübung deiner Rechte nutze bitte [kosch.cloud](https://kosch.cloud/) oder das öffentliche [PizzaScan-GitHub-Repository](https://github.com/chekento/Pizzascan). Weitere veröffentlichte Entwickler-Kontaktdaten ergeben sich aus dem Google-Play-Entwicklerprofil.

## Überblick

PizzaScan bietet eine Pizzakarte, Restaurant- und Pizzeriasuche, lokale Fotoanalyse und einen privaten Baukasten für Restaurantrezensionen. Es gibt kein Konto, keine Community, kein Werbe-, Analyse- oder Tracking-SDK und keinen PizzaScan-Server für Fotos oder Bewertungen. Die App veröffentlicht keine Inhalte automatisch. Für Karten, Ortssuchen, offene Ortsbewertungen und Modelldownloads verbindet sie sich direkt mit externen Diensten.

## Fotos und lokale KI

Du wählst ein einzelnes Foto mit Androids Dateiauswahl oder einer Kamera-App aus. PizzaScan hat keinen pauschalen Zugriff auf deine Fotobibliothek. Das Bild wird lokal verkleinert und neu als JPEG gespeichert; dabei werden die ursprünglichen EXIF-Metadaten nicht übernommen. Die Bildanalyse läuft ausschließlich auf deinem Gerät. PizzaScan lädt dein Foto dafür weder hoch noch verwendet es zum Training.

Zur Wahl stehen CLIP ViT-B/32 und CLIP ViT-B/16 von OpenAI sowie SigLIP Base Patch16-224 von Google, jeweils als ONNX-Konvertierung von Xenova. Nach deiner Bestätigung werden Modellgewichte von [Hugging Face](https://huggingface.co/privacy) und dessen Download-Infrastruktur geladen. Der Anbieter erhält dabei technisch notwendige Verbindungsdaten wie IP-Adresse, Zeitpunkt, angeforderte Modelldatei und Browser-/App-Kennung, aber kein Foto und keinen Rezensionstext. Die Modelle benötigen ungefähr 160–210 MB je Modell.

Nach erfolgreichem Download speichert PizzaScan die Modelldateien im privaten persistenten App-Speicher von Android. Dasselbe Modell wird nach App-Neustarts und nach normalem Leeren des App-Caches wiederverwendet und muss nicht bei jedem Start erneut heruntergeladen werden. Ein Modell wird erst durch die ausdrückliche Funktion zum Entfernen heruntergeladener Modelle, durch „App-Daten löschen“ oder durch Deinstallation entfernt.

## Karte, Restaurant-, Orts- und Standortsuche

Kartenausschnitte werden von `tile.openstreetmap.org` geladen. Restaurantdaten kommen von `overpass-api.de` und bei Bedarf `overpass.private.coffee`. Für die normale Orts-/Adresssuche, Restaurantadressabgleiche und die verzögerten Online-Suchvorschläge verwendet PizzaScan primär `photon.komoot.io` (Photon). Photon kann dabei Suchtext und Suchmittelpunkt erhalten.

### Nominatim-Fallback in Version 2.3.3

Wenn du eine Suche **ausdrücklich absendest** und Photon technisch fehlschlägt oder keinen brauchbaren Treffer liefert, kann PizzaScan als Fallback `nominatim.openstreetmap.org` verwenden. Dieser Fallback wird **nicht für Autocomplete oder bloße Texteingabe** verwendet.

An Nominatim übermittelt PizzaScan in dieser Fallback-Anfrage den eingegebenen Suchtext, die gewünschte Sprache sowie technische Abfrageparameter für das Ergebnisformat. PizzaScan fügt der Nominatim-Fallback-Anfrage **keine Standortkoordinaten bzw. keinen Suchmittelpunkt** hinzu. Wie bei jedem direkt angesprochenen Webdienst erhält Nominatim trotzdem technisch notwendige Verbindungsdaten wie die öffentliche IP-Adresse, Zeitpunkt und Client-/HTTP-Informationen. Die Fallback-Anfragen werden gedrosselt; erfolgreiche Ergebnisse werden in der App bzw. im isolierten Fallback-Kontext ungefähr 24 Stunden zwischengespeichert, um unnötige Wiederholungsanfragen zu vermeiden.

Photon erhält bei seinen Suchanfragen je nach Funktion Suchtexte und einen Suchmittelpunkt. Overpass erhält Kartenausschnitte bzw. Suchbereiche und bei Detailabfragen OSM-Ortskennungen. Bei Nutzung deines Standorts können Suchmittelpunkte und Suchbereiche Rückschlüsse auf deinen genauen oder ungefähren Standort ermöglichen.

GPS wird nur nach deiner Aktion oder bei zuvor aktiviertem Standortstart und vorhandener Android-Berechtigung abgefragt. Ein ungefährer Standort reicht ebenfalls. Es gibt keine Standortabfrage im Hintergrund und kein Bewegungsprofil der App. Du kannst die Berechtigung jederzeit in Android widerrufen und stattdessen einen Ort, ein Restaurant oder eine Pizzeria manuell suchen. Der letzte Kartenmittelpunkt und Kartenfilter bleiben lokal gespeichert.

Informationen zu den Anbietern: [OpenStreetMap Foundation](https://osmfoundation.org/wiki/Privacy_Policy), [Nominatim Usage Policy](https://operations.osmfoundation.org/policies/nominatim/), [overpass-api.de](https://overpass-api.de/), [Private.coffee](https://private.coffee/privacy.html) und [komoot / Photon](https://www.komoot.com/privacy). Die Dienste können Verbindungsprotokolle für Betrieb und Missbrauchsschutz führen. PizzaScan steuert deren Aufbewahrungsdauer nicht und verspricht keine sofortige Löschung dieser Protokolle. Für Rechteanfragen zu solchen Protokollen wende dich auch an den jeweiligen Anbieter.

## Offene Ortsbewertungen und Bewertungsfilter

Wenn „Offene Bewertungen laden“ eingeschaltet ist, fragt PizzaScan `api.mangrove.reviews` direkt nach öffentlichen Bewertungen im Bereich geladener Orte ab. Die Open Reviews Association erhält den abgefragten Suchbereich sowie IP-Adresse und technische Verbindungsdaten. Bei standortnaher Suche kann der Bereich Rückschlüsse auf deinen Standort ermöglichen. Deine Fotos, eigenen Bewertungen und Entwürfe werden nicht übertragen. Die Funktion ist in den Einstellungen abschaltbar.

Der lokale Bewertungs-Cache enthält nur Zahlen, Ortsbezüge, öffentliche Bewertungskennungen und die zur Vermeidung von Doppelzählungen nötigen öffentlichen Identitäten, keine Rezensionstexte oder Fotos. Er wird bei Bedarf nach 15 Minuten aktualisiert; gespeicherte Ergebnisse werden höchstens sieben Tage genutzt und bei einem Neuabruf ersetzt. Alle Daten lassen sich über Androids App-Speicher löschen. Externe Links zu Google Maps, Tripadvisor und Yelp werden erst nach Antippen geöffnet; dabei gehen die Suchangaben an den gewählten Anbieter.

Hinweise der Anbieter: [Open Reviews / Mangrove](https://mangrove.reviews/terms), [Tripadvisor](https://www.tripadvisor.com/pages/privacy.html) und [Yelp](https://terms.yelp.com/privacy).

### Optionale Google Maps Reviews (Places API New)

Wenn du freiwillig einen eigenen Google Places API-Key hinterlegst und für einen ausgewählten Restauranttreffer ausdrücklich **Google Maps Reviews laden** auswählst, übermittelt PizzaScan Name, Adresse und Koordinaten des Restaurants sowie die gewählte Sprache direkt an die Google Places API (New). Google erhält dabei außerdem technisch notwendige Verbindungsdaten wie die öffentliche IP-Adresse und verarbeitet den verwendeten API-Key bzw. das zugehörige Cloud-Projekt. Der Key wird ausschließlich lokal im App-Webspeicher gespeichert und nicht an KoSch oder einen PizzaScan-Server übertragen.

Google kann für die Places API ein Cloud-Projekt mit aktivierter Abrechnung verlangen. Ohne eigenen Key findet keine Places-API-Abfrage statt; PizzaScan bleibt vollständig nutzbar und öffnet Google Maps weiterhin nur extern. Google liefert für diese Funktion höchstens fünf Rezensionen pro passenden Ort. PizzaScan speichert die abgerufenen Google-Bewertungen und Rezensionstexte nicht dauerhaft; sie verbleiben nur im Arbeitsspeicher der laufenden Sitzung. Google-Datenschutz: <https://policies.google.com/privacy?hl=de>.

## Rezensionsbaukasten, Export und externe Links

Eigene Restaurantbewertungen, ausgewählte Bausteine und bearbeitete Rezensionstexte werden lokal gespeichert. Der Baukasten verarbeitet ausschließlich deine eigenen Angaben; KI-Fotowerte werden nicht übernommen. „Kopieren“ überträgt nur den angezeigten Text in die Zwischenablage deines Geräts. „Google Maps öffnen“ öffnet außerhalb der App eine Ortssuche mit Name, Adresse und Koordinaten des ausgewählten Restaurants. Den Text musst du dort selbst einfügen und veröffentlichen. Dabei gelten die [Datenschutzbestimmungen von Google](https://policies.google.com/privacy?hl=de).

Fotoanalysen können mit Foto und Bewertungsdaten als JSON exportiert werden. Einzelne Rezensionsentwürfe lassen sich mit Restaurantzuordnung, eigenen Angaben und Text als JSON sichern und in der Entwurfsübersicht wiederherstellen; dieser Export enthält kein Foto und keine KI-Werte. Beim Export entscheidest du über Androids Speicherdialog, wohin die Datei gelangt. Wenn du einen Cloud-Speicher auswählst oder exportierte Daten anderweitig teilst, verarbeitet der gewählte Anbieter diese Daten. Website-, Telefon- und Routenlinks öffnen erst nach deiner Aktion die jeweilige externe Anwendung. PizzaScan hat keinen Zugriff auf dortige Konten oder veröffentlichte Rezensionen.

## Speicher, Aufbewahrung und Löschung

Fotoanalysen liegen in der lokalen IndexedDB der App; Entwürfe, Einstellungen, gemerkte Orte, Such-/Fallback-Caches und Kartendaten im lokalen App-/Webspeicher. Heruntergeladene KI-Modelle liegen im privaten persistenten Android-App-Speicher und nicht im normalen Cache. Temporäre Kameradateien können im privaten App-Cache liegen und vom System gelöscht werden. Android-Cloud-Backups der App sind deaktiviert.

Eine Fotoanalyse löschst du in ihren Details mit „Lokal löschen“, einen Rezensionsentwurf im Baukasten mit „Entwurf löschen“, Modelle in den Einstellungen mit „Heruntergeladene Modelle entfernen“. Alle App-Daten entfernst du über Android → Apps → PizzaScan → Speicher → Daten löschen oder durch Deinstallation. Außerhalb der App gespeicherte Exporte und bei Google veröffentlichte Rezensionen musst du dort separat löschen. Es existiert kein PizzaScan-Konto, das zusätzlich gelöscht werden müsste.

## Zwecke, Rechtsgrundlagen und Sicherheit

Die Verarbeitung dient der von dir genutzten App-Funktion (Art. 6 Abs. 1 Buchst. b DSGVO); soweit eine Einwilligung erforderlich ist, beruht die optionale Standortnutzung und Modellfreigabe auf deiner Entscheidung (Art. 6 Abs. 1 Buchst. a DSGVO). Eine erteilte Freigabe kannst du für die Zukunft durch Entzug der Standortberechtigung beziehungsweise Entfernen der Modelle zurücksetzen. Die Rechtmäßigkeit vorheriger Verarbeitung bleibt davon unberührt.

Karten-, Such- und Modellanfragen erfolgen verschlüsselt über HTTPS. Fotos, Entwürfe und persistente Modelldateien liegen im privaten App-Bereich unter dem Schutz des Android-Geräts. Bitte sichere dein Gerät mit einer Bildschirmsperre. Bei externen Anbietern kann eine Verarbeitung außerhalb der EU/des EWR stattfinden. Die jeweiligen Anbieter erläutern in ihren Datenschutzhinweisen Standorte, Rechtsgrundlagen und gegebenenfalls Schutzmaßnahmen für internationale Übermittlungen. Die App enthält keine Werbung und verkauft keine Daten.

## Deine Rechte

Nach den gesetzlichen Voraussetzungen hast du Rechte auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung, Datenübertragbarkeit und Widerspruch sowie auf Widerruf erteilter Einwilligungen. Außerdem kannst du dich bei einer zuständigen Datenschutzaufsichtsbehörde beschweren. Der Entwickler kann deine ausschließlich lokal gespeicherten Fotos oder Entwürfe nicht aus der Ferne einsehen oder löschen. Dafür stehen die beschriebenen Funktionen auf deinem Gerät bereit.

## Grenzen der Fotoanalyse

Die Werte sind experimentelle Bild-Text-Vergleiche. Die 100 Perspektiven sind simulierte Gewichtungsprofile derselben 25 Fotowerte, keine echten Experten und keine unabhängigen Gutachten. Geschmack, Geruch, Temperatur, Allergene, Hygiene und Lebensmittelsicherheit lassen sich damit nicht zuverlässig bestimmen. Die App trifft keine rechtlich oder ähnlich erheblichen automatisierten Entscheidungen über Personen.
