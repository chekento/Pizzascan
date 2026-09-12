# Datenschutzerklärung für PizzaScan

Stand: 12. September 2026 · Version 2.2.0 · Android-Paket cloud.kosch.pizzascan

## Verantwortlicher und Kontakt

Verantwortlich für PizzaScan: Kolja Schumann, kosch.cloud. Bei Fragen zum Datenschutz oder zur Ausübung deiner Rechte nutze bitte das [Kontaktformular auf kosch.cloud](https://kosch.cloud/) und gib „PizzaScan Datenschutz“ als Anliegen an. Die Website wird erst geöffnet, wenn du den Link auswählst; für das Formular gelten die dort angegebenen Bedingungen.

## Überblick

PizzaScan bietet eine Pizzakarte, lokale Fotoanalyse und einen privaten Baukasten für Restaurantrezensionen. Es gibt kein Konto, keine Community, kein Werbe-, Analyse- oder Tracking-SDK und keinen PizzaScan-Server für Fotos oder Bewertungen. Die App veröffentlicht keine Inhalte automatisch. Für Karten, Ortssuchen und Modelldownloads verbindet sie sich direkt mit externen Diensten.

## Fotos und lokale KI

Du wählst ein einzelnes Foto mit Androids Dateiauswahl oder einer Kamera-App aus. PizzaScan hat keinen pauschalen Zugriff auf deine Fotobibliothek. Das Bild wird lokal verkleinert und neu als JPEG gespeichert; dabei werden die ursprünglichen EXIF-Metadaten nicht übernommen. Die Bildanalyse läuft ausschließlich auf deinem Gerät. PizzaScan lädt dein Foto dafür weder hoch noch verwendet es zum Training.

Zur Wahl stehen CLIP ViT-B/32 und CLIP ViT-B/16 von OpenAI sowie SigLIP Base Patch16-224 von Google, jeweils als ONNX-Konvertierung von Xenova. Nach deiner Bestätigung werden Modellgewichte von [Hugging Face](https://huggingface.co/privacy) und dessen Download-Infrastruktur geladen. Der Anbieter erhält dabei technisch notwendige Verbindungsdaten wie IP-Adresse, Zeitpunkt, angeforderte Modelldatei und Browser-/App-Kennung, aber kein Foto und keinen Rezensionstext. Die Modelle benötigen ungefähr 160–210 MB je Modell. Danach ist die Fotoanalyse offline möglich, solange die Dateien im Cache vorhanden sind. Fehlende Dateien können entsprechend der Downloadfreigabe später erneut geladen werden.

## Karte, Restaurant- und Standortsuche

Kartenausschnitte werden von tile.openstreetmap.org geladen. Restaurantdaten kommen von overpass-api.de und bei Bedarf overpass.private.coffee. Abgesendete Suchbegriffe und der Abgleich von Restaurantadressen werden über photon.komoot.io verarbeitet. Diese Dienste erhalten die jeweils angefragten Kartenausschnitte, Suchmittelpunkte oder Suchtexte, bei Detailabfragen die ausgewählte OSM-Ortskennung sowie IP-Adresse und technische Verbindungsdaten. Bei Nutzung deines Standorts können Suchmittelpunkte und Suchbereiche Rückschlüsse auf deinen genauen oder ungefähren Standort ermöglichen. Eingabevorschläge vor dem Absenden stammen ausschließlich aus lokal vorhandenen Orten.

GPS wird nur nach deiner Aktion oder bei zuvor aktiviertem Standortstart und vorhandener Android-Berechtigung abgefragt. Ein ungefährer Standort reicht ebenfalls. Es gibt keine Standortabfrage im Hintergrund und kein Bewegungsprofil der App. Du kannst die Berechtigung jederzeit in Android widerrufen und stattdessen einen Ort manuell suchen. Der letzte Kartenmittelpunkt und Kartenfilter bleiben lokal gespeichert.

Informationen zu den Anbietern: [OpenStreetMap Foundation](https://osmfoundation.org/wiki/Privacy_Policy), [overpass-api.de](https://overpass-api.de/), [Private.coffee](https://private.coffee/privacy.html) und [komoot / Photon](https://www.komoot.com/privacy). Die Dienste können Verbindungsprotokolle für Betrieb und Missbrauchsschutz führen. PizzaScan steuert deren Aufbewahrungsdauer nicht und verspricht keine sofortige Löschung dieser Protokolle. Für Rechteanfragen zu solchen Protokollen wende dich auch an den jeweiligen Anbieter.

## Rezensionsbaukasten, Export und externe Links

Eigene Restaurantbewertungen, ausgewählte Bausteine und bearbeitete Rezensionstexte werden lokal gespeichert. Der Baukasten verarbeitet ausschließlich deine eigenen Angaben; KI-Fotowerte werden nicht übernommen. „Kopieren“ überträgt nur den angezeigten Text in die Zwischenablage deines Geräts. „Google Maps öffnen“ öffnet außerhalb der App eine Ortssuche mit Name, Adresse und Koordinaten des ausgewählten Restaurants. Den Text musst du dort selbst einfügen und veröffentlichen. Dabei gelten die [Datenschutzbestimmungen von Google](https://policies.google.com/privacy?hl=de).

Fotoanalysen können mit Foto und Bewertungsdaten als JSON exportiert werden. Einzelne Rezensionsentwürfe lassen sich mit Restaurantzuordnung, eigenen Angaben und Text als JSON sichern und in der Entwurfsübersicht wiederherstellen; dieser Export enthält kein Foto und keine KI-Werte. Beim Export entscheidest du über Androids Speicherdialog, wohin die Datei gelangt. Wenn du einen Cloud-Speicher auswählst oder exportierte Daten anderweitig teilst, verarbeitet der gewählte Anbieter diese Daten. Website-, Telefon- und Routenlinks öffnen erst nach deiner Aktion die jeweilige externe Anwendung. PizzaScan hat keinen Zugriff auf dortige Konten oder veröffentlichte Rezensionen.

## Speicher, Aufbewahrung und Löschung

Fotoanalysen liegen in der lokalen IndexedDB der App; Entwürfe, Einstellungen, gemerkte Orte und der Karten-Cache in deren lokalem Webspeicher. Sie bleiben bis zur Löschung oder Deinstallation erhalten. Modelle liegen im Web-Cache; Android kann diesen bei Platzmangel bereinigen. Temporäre Kameradateien liegen im privaten App-Cache und können vom System gelöscht werden. Bei einer erneuten Fotoauswahl bereinigt die App dort Dateien, die älter als 24 Stunden sind. Android-Cloud-Backups der App sind deaktiviert.

Eine Fotoanalyse löschst du in ihren Details mit „Lokal löschen“, einen Rezensionsentwurf im Baukasten mit „Entwurf löschen“, Modelle in den Einstellungen mit „Heruntergeladene Modelle entfernen“. Alle App-Daten entfernst du über Android → Apps → PizzaScan → Speicher → Daten löschen oder durch Deinstallation. Außerhalb der App gespeicherte Exporte und bei Google veröffentlichte Rezensionen musst du dort separat löschen. Es existiert kein PizzaScan-Konto, das zusätzlich gelöscht werden müsste.

## Zwecke, Rechtsgrundlagen und Sicherheit

Die Verarbeitung dient der von dir genutzten App-Funktion (Art. 6 Abs. 1 Buchst. b DSGVO); soweit eine Einwilligung erforderlich ist, beruht die optionale Standortnutzung und Modellfreigabe auf deiner Entscheidung (Art. 6 Abs. 1 Buchst. a DSGVO). Eine erteilte Freigabe kannst du für die Zukunft durch Entzug der Standortberechtigung beziehungsweise Entfernen der Modelle zurücksetzen. Die Rechtmäßigkeit vorheriger Verarbeitung bleibt davon unberührt.

Karten- und Modellanfragen erfolgen verschlüsselt über HTTPS. Fotos und Entwürfe liegen im App-Speicher unter dem Schutz des Android-Geräts. Bitte sichere dein Gerät mit einer Bildschirmsperre. Bei externen Anbietern kann eine Verarbeitung außerhalb der EU/des EWR stattfinden. Die jeweiligen Anbieter erläutern in ihren Datenschutzhinweisen Standorte, Rechtsgrundlagen und gegebenenfalls Schutzmaßnahmen für internationale Übermittlungen. Die App enthält keine Werbung und verkauft keine Daten.

## Deine Rechte

Nach den gesetzlichen Voraussetzungen hast du Rechte auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung, Datenübertragbarkeit und Widerspruch sowie auf Widerruf erteilter Einwilligungen. Außerdem kannst du dich bei einer zuständigen Datenschutzaufsichtsbehörde beschweren. Der Entwickler kann deine ausschließlich lokal gespeicherten Fotos oder Entwürfe nicht aus der Ferne einsehen oder löschen. Dafür stehen die beschriebenen Funktionen auf deinem Gerät bereit.

## Grenzen der Fotoanalyse

Die Werte sind experimentelle Bild-Text-Vergleiche. Die 100 Perspektiven sind simulierte Gewichtungsprofile derselben 25 Fotowerte, keine echten Experten und keine unabhängigen Gutachten. Geschmack, Geruch, Temperatur, Allergene, Hygiene und Lebensmittelsicherheit lassen sich damit nicht zuverlässig bestimmen. Die App trifft keine rechtlich oder ähnlich erheblichen automatisierten Entscheidungen über Personen.
