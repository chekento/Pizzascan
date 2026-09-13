# PizzaScan 2.3.0 für Google Play vorbereiten

Stand: 13. September 2026. Das Entwicklerkonto ist bereits verifiziert. Dieser Leitfaden bereitet den kommenden Test vor; es wurde noch keine Version in Play Console hochgeladen oder veröffentlicht.

## Aktueller Stand

Die signierte **PizzaScan-2.3.0-Test.apk** enthält stabile Kartenmarker, fünf Sprachen, die freigegebenen Grafiken und den neuen Filter für kostenlose offene Ortsbewertungen. Sie dient zunächst zur Geräteprüfung. Ergebnisse und noch offene Prüfungen: [VERIFICATION-2.3.0.md](../docs/VERIFICATION-2.3.0.md).

**Ein neues Play-Bundle mit diesen Änderungen ist noch nicht erstellt.** Das frühere 2.2.0-AAB enthält den Bewertungsfilter nicht. Nach dem Gerätetest wird das aktuelle Release-Bundle gebaut und mit dem passenden Upload-Schlüssel signiert. Die Test-APK ist kein Play-Uploadpaket.

## 1. App-Eintrag und Paket

Name **PizzaScan**, Standardsprache **Deutsch (Deutschland)**, Typ **App**, Kategorie **Essen & Trinken**, kostenlos und ohne Werbung oder In-App-Käufe. Paket-ID für Play: `cloud.kosch.pizzascan`. Aktueller Quellstand: VersionName `2.3.0`, VersionCode `6`, Android mindestens 8 / API 26, Ziel Android 16 / API 36. Vor dem Bundlebau prüfen, ob VersionCode 6 in diesem Play-Eintrag noch unbenutzt ist; verwendete Codes können nicht erneut hochgeladen werden.

API 36 erfüllt die seit 31. August 2026 geltende Ziel-API-Vorgabe für neue Smartphone-Apps und Updates. [Google: Ziel-API](https://support.google.com/googleplay/android-developer/answer/11926878?hl=en).

Eine erreichbare **Support-E-Mail-Adresse** und die erforderlichen Kontaktangaben aus dem bestehenden Entwicklerkonto übernehmen. Die Datenschutzerklärung nennt **Kolja Werner Schumann (KoSch)** und das Kontaktformular auf kosch.cloud. Es wurde keine E-Mail-Adresse oder Testergruppen-Adresse erfunden.

## 2. Signierung und Bundle

Neue Play-Apps verwenden [Android App Bundles](https://developer.android.com/guide/app-bundle). Vor dem ersten Upload die Seite **App-Integrität → App-Signierung** und vorhandene Schlüssel abgleichen. Der frühere Produktionsschlüssel hat den Zertifikat-Fingerabdruck SHA-256 `53af9ce0b7893f99153f34b4617dabf1c7ddafb45f8625ca5ea32d090ae9768f`.

Falls bisherige Produktionsinstallationen von `cloud.kosch.pizzascan` über Play aktualisierbar bleiben sollen, muss deren App-Signierschlüssel übernommen werden. Bei erstmaliger Einrichtung unterstützt Play den Import eines vorhandenen Schlüssels; dafür die aktuelle PEPK-Anleitung der eigenen Console verwenden. Ist Play App Signing bereits eingerichtet, dessen registrierten App- und Upload-Schlüssel verwenden. Private Schlüssel bleiben im separat gesicherten Signierbackup und werden niemals im Repository abgelegt. [Google: App-Signierung](https://developer.android.com/studio/publish/app-signing).

Die Testfassung hat die **andere Paket-ID `cloud.kosch.pizzascan.lang1`** und einen eigenen Testschlüssel. Die Play-App wird daneben installiert und übernimmt ihre lokalen Daten oder Modellgewichte nicht automatisch. Die Test-Signatur ist keine Freigabe für den Produktionsschlüssel.

## 3. Texte, Bilder und Datenschutz

Die deutschen Eintragstexte liegen unter `de-DE/`, Versionshinweise zusätzlich unter `en-US/`. Die freigegebenen Bilder sind:

| Verwendung | Datei | Maße |
|---|---|---|
| App-Symbol | `graphics/PizzaScan-App-Icon-512.png` | 512 × 512 PNG |
| Vorstellungsgrafik Deutsch | `graphics/PizzaScan-Feature-DE-1024x500.png` | 1024 × 500 PNG |
| Vorstellungsgrafik Englisch | `graphics/PizzaScan-Feature-EN-1024x500.png` | 1024 × 500 PNG |

Beide Vorstellungsgrafiken sind jeweils kleiner als 15 MB. Dasselbe App-Symbol ist in Android enthalten. Für den endgültigen Store-Eintrag aktuelle Telefon-Screenshots aus dem freigegebenen Build aufnehmen; ältere Screenshots erst auf Übereinstimmung mit der aktuellen Oberfläche prüfen. Testdaten dürfen keine echten Restaurantbewertungen vortäuschen. [Google: Grafiken](https://support.google.com/googleplay/android-developer/answer/9866151?hl=en).

Website: [kosch.cloud](https://kosch.cloud). Öffentliche [Datenschutzerklärung](https://github.com/chekento/Pizzascan/blob/main/docs/Datenschutz.md); derselbe Inhalt ist in der App offline erreichbar. Die Support-E-Mail im Store ergänzen. [Google: Nutzerdaten](https://support.google.com/googleplay/android-developer/answer/10144311?hl=de).

## 4. App-Inhalte und Datensicherheit

[DATENSICHERHEIT.md](DATENSICHERHEIT.md) berücksichtigt auch Mangrove/Open Reviews und die verzögerten Photon-Suchvorschläge. Nicht pauschal „Keine Daten erhoben“ wählen: Fotos, eigene Rezensionstexte und KI-Analyse bleiben lokal; Karten-, Such-, Bewertungs- und Downloadanbieter erhalten die für ihre Verbindungen nötigen Daten.

Alle Funktionen sind ohne Login erreichbar. Es gibt keine Kontoerstellung, Werbung oder öffentliche Community. Aus Mangrove werden nur offene Zahlen übernommen, keine fremden Rezensionstexte oder Fotos. Google Maps, Tripadvisor und Yelp öffnen sich als externe Suchlinks. Pflichtangaben zu Altersgruppen, Ländern und Händlerstatus anhand des tatsächlichen Angebots ausfüllen; diese Erklärungen wurden nicht im Namen des Entwicklers abgegeben.

## 5. Geräteprüfung und interner Test

Zunächst die aktuelle APK anhand von [TESTPLAN.md](TESTPLAN.md) auf einem echten Telefon prüfen, insbesondere Installation als Update, Standort, Kamera, Modellstart, Offline-Nutzung und Mindestbewertung. Beobachtungen mit Gerät, Android- und WebView-Version festhalten.

Danach das korrekt signierte Release-AAB in **Testen → Interner Test** hochladen, Bundle-Details auf Paket-ID, Versionscode, API und Zertifikate prüfen und Versionshinweise einfügen. Testkonten hinzufügen, den Opt-in-Link öffnen und über Play installieren. Den Pre-Launch-Bericht auswerten, insbesondere Android-Zurück, Kamera/Dateiauswahl, Standort, Querformat und Schriftvergrößerung. Die Test-APK ersetzt diese Play-Prüfung nicht.

## 6. Freiwillige Tester über Google Groups

Die geplante Testergruppe kann für einen **geschlossenen Test** verwendet werden. Ihre tatsächliche Gruppenadresse ist noch einzutragen.

1. In der Google Group freiwillige Tester aufnehmen. Sie müssen mit dem Google-Konto Mitglied sein, das sie für Play verwenden.
2. In Play Console unter **Testen → Geschlossener Test → Tester → Google Groups** die echte Gruppenadresse im Format `gruppenname@googlegroups.com` eintragen.
3. Die Testversion im geschlossenen Track verfügbar machen. Den von Play erzeugten Opt-in-Link zusammen mit Testplan und Feedbackweg an die Tester geben.
4. Tester treten zuerst der Gruppe bei, öffnen dann den Opt-in-Link, nehmen am Test teil und installieren über Google Play. Der Gruppeneintritt allein genügt nicht.

Google dokumentiert den [Test mit Google Groups und Opt-in-Link](https://support.google.com/googleplay/android-developer/answer/9845334?hl=en). Ein APK-Download von GitHub zählt nicht als Teilnahme am geschlossenen Play-Test.

Für persönliche Entwicklerkonten, die nach dem 13. November 2023 angelegt wurden, verlangt Google mindestens **12 Tester, die 14 Tage ohne Unterbrechung am geschlossenen Test teilnehmen**. Danach kann Produktionszugang beantragt werden; er wird nicht automatisch erteilt. Ob diese Pflicht für das vorhandene Konto gilt, zeigt die Console. Echte Nutzung und Rückmeldungen sammeln. [Google: Testpflicht](https://support.google.com/googleplay/android-developer/answer/14151465?hl=en).

## 7. Freigabe vorbereiten

Erst nach abgearbeiteten Gerätebefunden, Pre-Launch-Bericht und gegebenenfalls Testpflicht Produktionszugang beantragen und den Store-Eintrag zur Prüfung einreichen. Vor jedem Update VersionCode und Signierung abgleichen. Die App bleibt kostenlos; es werden keine kostenpflichtigen Bewertungs-APIs aktiviert.
