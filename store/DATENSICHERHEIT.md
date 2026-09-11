# Datensicherheit – Arbeitsblatt für PizzaScan 2.2.0

Grundlage ist der tatsächliche Quellcode dieser Version, keine bereits eingereichte Console-Erklärung. Vor Einreichung Anbieterbedingungen und alle tatsächlich auf Play aktiven Versionen abgleichen.

Google zählt Übertragung vom Gerät auch dann als Erhebung, wenn nur Dritte empfangen. Rein lokale Verarbeitung zählt nicht dazu. Flüchtige Verarbeitung darf nur bei entsprechend nachgewiesener Aufbewahrung gewählt werden. Bewusst vom Nutzer ausgelöstes Teilen kann eine Ausnahme von der Angabe „Weitergabe“ sein. [Definitionen bei Google](https://support.google.com/googleplay/android-developer/answer/10787469?hl=en).

| Datentyp / Funktion | Tatsächlicher Weg | Vorschlag für die Console |
|---|---|---|
| Genauer / ungefährer Standort | GPS bleibt im Arbeitsspeicher; der damit gewählte Mittelpunkt und Kartenbereich gehen bei Suche an Overpass/Photon, Kartenausschnitte an OSM. Letzter Kartenmittelpunkt lokal. | Erhoben und konservativ als an Dritte weitergegeben erklären; optional, Funktionalität. GPS kann abgelehnt und durch manuelle Suche ersetzt werden. |
| Suchverlauf innerhalb der App | Abgesendete Orts-/Restaurantbegriffe an Photon, einschließlich Suchmittelpunkt. Lokaler Suchcache. | Erhoben und weitergegeben; optional, Funktionalität. Keine Online-Vorschläge während des Tippens. |
| Geräte- oder andere IDs / technische Verbindungsdaten | IP-Adresse und App-/Browserkennung an Karten- und Downloadanbieter; keine Werbe-ID, kein eigener stabiler Tracking-Identifier. | Konservativ als erhoben/weitergegeben für Funktionalität angeben; bei Online-Kartennutzung technisch erforderlich. Keine Anonymität zusagen. |
| Fotos | Verarbeitung, Analyse und Speicherung ausschließlich lokal; optional bewusst gewählter JSON-Export. | Für lokale Analyse nicht als erhoben deklarieren. User-gesteuerte Exporte gesondert anhand der Google-Ausnahme prüfen. |
| Eigene Bewertungen / Rezensionstexte | Lokaler Speicher; Kopieren in Zwischenablage erst auf Aktion. Keine Veröffentlichung durch PizzaScan. | Nicht als serverseitig erhoben erklären. Kopieren/Wechsel zu Google Maps nur nutzergesteuert. |
| Name, E-Mail, Zahlungsdaten, Werbung, Analytics | Keine Eingabefelder, Konten oder SDKs dafür in der App. Kontaktformular wird bei Linkwahl extern geöffnet. | Keine entsprechende App-Erhebung behaupten. Externe Websiteverarbeitung in der Datenschutzerklärung erläutert. |

Alle eingebauten Karten- und Modellabrufe verwenden HTTPS. Nicht „nur flüchtig“ ankreuzen, solange die Protokollierung und Löschfristen aller Anbieter nicht entsprechend belegt sind. Nicht ohne Grundlage die Dienstleister-Ausnahme für öffentliche Kartenserver annehmen: Es wurde kein Auftragsverarbeitungsvertrag mit ihnen festgestellt. Keine unabhängige Sicherheitszertifizierung oder Familienprogramm-Teilnahme angeben.

Löschung: Einzelfotos und Entwürfe direkt in der App; Modellcache in den Einstellungen; alle Daten über Android-App-Speicher oder Deinstallation. Es gibt kein Konto. Bereits exportierte Dateien oder bei Google veröffentlichte Texte liegen unter der Kontrolle des Nutzers beziehungsweise des Zielanbieters. Die App kann Drittanbieter-Protokolle nicht aus der Ferne löschen.

Dieses Arbeitsblatt ist eine konservative technische Zuordnung. Die exakten Optionen, Pflicht-/Wahlstatus und Angaben zu Drittanbieteraufbewahrung müssen vor Absenden anhand des tatsächlichen Betriebs geprüft werden. Der Verantwortliche und die erreichbare Supportadresse müssen mit dem Entwicklerkonto übereinstimmen.
