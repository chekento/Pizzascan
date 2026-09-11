# PizzaScan 2.2.0 für Google Play vorbereiten

Stand: 11. September 2026. Das Paket enthält die technische Vorbereitung und Eintragstexte. Ein Console-Konto, die persönlichen Pflichtangaben und Googles Prüfung werden dadurch nicht ersetzt. Noch nichts bei Google veröffentlicht.

## 1. Entwicklerkonto

Öffne [Play Console](https://play.google.com/console/), lege bei Bedarf ein Entwicklerkonto an und vervollständige die dort verlangte Identitäts- und Geräteprüfung. Wähle den Kontotyp entsprechend deiner tatsächlichen Tätigkeit. Registrierung und gegebenenfalls Zahlungen führst du selbst in deinem Google-Konto aus.

Halte eine erreichbare **Support-E-Mail-Adresse**, deinen rechtlichen Namen und die von Google verlangten Anschrift-/Kontaktangaben bereit. Es wurde keine E-Mail-Adresse erfunden. Die App-Datenschutzerklärung nennt Kolja Schumann und das vorhandene Kontaktformular von kosch.cloud. Prüfe vor Einreichung, ob dieser Verantwortliche für dein Entwicklerkonto zutrifft und ob weitere Kontaktdaten ergänzt werden müssen.

## 2. App anlegen

Name **PizzaScan**, Standardsprache **Deutsch (Deutschland)**, Typ **App**, Kategorie **Essen & Trinken**. Die App enthält keine Bezahlfunktionen und ist als kostenloser Eintrag vorbereitet. Bestätige Google-Erklärungen erst nach eigener Prüfung. Paket-ID unverändert: `cloud.kosch.pizzascan`. VersionName `2.2.0`, VersionCode `5`, Android mindestens 8 / API 26, Ziel Android 16 / API 36. Dieses Ziel erfüllt die seit 31. August 2026 geltende Vorgabe für neue Smartphone-Apps. [Google: Ziel-API](https://support.google.com/googleplay/android-developer/answer/11926878?hl=en).

## 3. Signierung vor dem ersten Upload festlegen

Für Google Play ist die Datei **PizzaScan-2.2.0.aab** bestimmt. Die APK dient zur direkten Installation außerhalb des Stores. Neue Play-Apps verwenden Android App Bundles. [Android App Bundle](https://developer.android.com/guide/app-bundle).

Damit bisherige PizzaScan-2.x-Installationen später auf die Play-Version aktualisiert werden können, muss Play dieselbe bestehende App-Signatur verwenden. Wähle bei der erstmaligen Einrichtung von **Play App Signing** die Option zum Importieren eines vorhandenen Signierschlüssels. Verwende die in deiner Console angezeigte PEPK-Anleitung und ihren öffentlichen Verschlüsselungsschlüssel. Dafür benötigst du das bereits separat bereitgestellte **private Signierbackup**. Es ist absichtlich nicht in diesem Store-Paket enthalten. Den privaten Schlüssel niemals in GitHub, Store-Grafiken oder öffentliche Dateien kopieren. [Google: App-Signierung](https://developer.android.com/studio/publish/app-signing).

Bestehendes Zertifikat SHA-256: `53af9ce0b7893f99153f34b4617dabf1c7ddafb45f8625ca5ea32d090ae9768f`.

Das AAB ist mit diesem vorhandenen Schlüssel für den Upload signiert. Google unterscheidet Upload-Schlüssel und App-Signierschlüssel. Falls dein Console-Eintrag bereits einen anderen Upload-Schlüssel registriert hat, muss das Bundle mit genau diesem Upload-Schlüssel signiert werden. Falls Play bereits einen anderen App-Signierschlüssel verwendet, erst die Signierungsseite abgleichen. Nicht versuchsweise die installierte App deinstallieren: Dabei gehen lokale Daten verloren.

## 4. Store-Eintrag füllen

Kopiere `de-DE/title.txt`, `short-description.txt` und `full-description.txt` in die zugehörigen Felder. Lade `graphics/icon-512.png`, `graphics/feature-1024x500.png` und die nummerierten Telefon-Screenshots hoch. Die Grafiken haben die erforderlichen Pixelmaße; die Screenshots zeigen die tatsächliche Oberfläche, der Baukasten ausdrücklich ein Beispielrestaurant. Alt-Texte stehen in `graphics/BILDNACHWEIS.txt`. Prüfe den Store-Vorschauzuschnitt. [Google: Grafiken](https://support.google.com/googleplay/android-developer/answer/9866151?hl=en).

Trage deine Support-E-Mail ein. Website: https://kosch.cloud/ . Datenschutzerklärung: https://github.com/chekento/Pizzascan/blob/main/docs/Datenschutz.md . Die URL muss ohne Anmeldung öffentlich erreichbar bleiben. Die identische Erklärung liegt zusätzlich lokal in der App unter Einstellungen → Datenschutz & lokale Daten. Bei Veröffentlichung einer eigenen HTML-Seite kann `privacy.html` aus diesem Paket verwendet und die Console-URL entsprechend ersetzt werden. [Google: Nutzerdaten](https://support.google.com/googleplay/android-developer/answer/10144311?hl=de).

## 5. App-Inhalte und Datensicherheit

Siehe `DATENSICHERHEIT.md`. **Nicht pauschal „Keine Daten erhoben“ wählen:** Die Bildanalyse bleibt lokal, doch Karten- und Modelldienste erhalten Such- und Verbindungsdaten.

App-Zugriff: alle Funktionen ohne Login zugänglich. Werbung: keine. Keine Kontoerstellung oder In-App-Käufe. Keine öffentliche Community und kein In-App-Feed. Die App überträgt keine KI-Fotowerte in Google-Rezensionen. Im Altersfreigabefragebogen die tatsächlichen Inhalte und externen Funktionen angeben; keine Altersfreigabe vorweg erfinden. Zielaltersgruppen und Länder bestimmst du für dein Angebot. Es wurden keine Kinderausrichtung, Händlererklärung oder gesetzlichen Selbstauskünfte in deinem Namen bestätigt.

## 6. Intern testen

Unter Testen → Interner Test eine Version erstellen, AAB hochladen und Versionshinweise aus `de-DE/release-notes.txt` einfügen. Bundle-Details auf Paket-ID, VersionCode 5, Ziel-API 36 und Zertifikate prüfen. Eigene Testkonten hinzufügen, Opt-in-Link öffnen und über Play installieren. Siehe `TESTPLAN.md`. Den Pre-Launch-Bericht prüfen, insbesondere Kamera/Dateiauswahl, Standortberechtigung, Zurück-Gesten, Bildschirmgrößen und Modellstart.

Der erste Modelldownload kann je nach Gerät und Verbindung dauern. Testern den Downloadhinweis zeigen und nach erfolgreichem Laden die Analyse auch im Flugmodus mit einem neuen Foto ausprobieren. Der Rezensionsbaukasten benötigt keinen Modelldownload.

## 7. Geschlossener Test, falls für dein Konto erforderlich

Für persönliche Entwicklerkonten, die nach dem 13. November 2023 angelegt wurden, sind mindestens zwölf Tester nötig, die dem geschlossenen Test mindestens 14 Tage ohne Unterbrechung beigetreten bleiben. Danach beantragst du Produktionszugang; dies ist keine automatische Freigabe. Echte Rückmeldungen sammeln und beheben, keine Testberichte erfinden. [Google: Testpflicht](https://support.google.com/googleplay/android-developer/answer/14151465?hl=en).

## 8. Zur Prüfung einreichen

Wenn alle Console-Aufgaben, Testpflichten, Kontaktangaben, Datenschutzhinweise und Berichte geklärt sind, Produktionsversion vorbereiten und zur Google-Prüfung einreichen. Veröffentlichungssteuerung verwenden, wenn du den Zeitpunkt nach Freigabe selbst bestimmen möchtest. Neue Updates benötigen einen höheren VersionCode und die passende Signierung. Die technische Vorbereitung ist keine Zusage über Googles Zulassung.
