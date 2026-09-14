# PizzaScan 2.3.2 für Google Play vorbereiten

Stand: 14. September 2026. Das Entwicklerkonto ist bereits verifiziert. PizzaScan befindet sich in der Phase **Pre-closed-test**: Der aktuelle 2.3.2-Quellstand baut erfolgreich, Web/UI- und Modelltests sind grün, der Android-16-Smoke-Test ist erfolgreich und die technische 2.3.2-Test-APK ist im Repository veröffentlicht. Ein final mit dem vorgesehenen Google-Play-Uploadschlüssel signiertes AAB wurde noch nicht in Play Console hochgeladen oder veröffentlicht.

Aktueller Status: [Release-Dashboard](../docs/release-dashboard.html) · [Statusdaten](../docs/release-status.json)

## Aktueller Stand

Die **PizzaScan-2.3.2-Test.apk** unter `downloads/` enthält stabile Kartenmarker, fünf Sprachen, den Mindestbewertungsfilter, offene Mangrove/Open-Reviews-Daten, externe Google-Maps/Tripadvisor/Yelp-Links, die kompakte Karten/Fotobewertungs-Navigation sowie den robusteren Orts-/Adresssuchfallback. Photon bleibt Primärdienst; nur bei einer ausdrücklich abgesendeten Suche kann Nominatim einspringen, wenn Photon fehlschlägt oder keinen brauchbaren Treffer liefert. Nominatim wird nicht für Autocomplete verwendet. Außerdem erholt sich die Karte nach Netz-/App-Rückkehr besser und die einmalige Start-Erkennung überschreibt später nicht mehr den vom Nutzer gesetzten Radius.

Der CI-Workflow erzeugt außerdem ein **PizzaScan-2.3.2-unsigned.aab** und ein unsigned Release-APK. Das Bundle wird technisch mit Bundletool validiert, ist aber noch **nicht mit dem finalen Upload-Schlüssel für Google Play signiert**. Die technische Test-APK ist kein Play-Uploadpaket.

## 1. App-Eintrag und Paket

Name **PizzaScan**, Standardsprache **Deutsch (Deutschland)**, Typ **App**, Kategorie **Essen & Trinken**, kostenlos und ohne Werbung oder In-App-Käufe. Paket-ID für Play: `cloud.kosch.pizzascan`. Aktueller Quellstand: VersionName `2.3.2`, VersionCode `8`, Android mindestens 8 / API 26, Ziel Android 16 / API 36. Vor dem Bundle-Upload prüfen, ob VersionCode 8 in diesem Play-Eintrag noch unbenutzt ist; verwendete Codes können nicht erneut hochgeladen werden.

API 36 erfüllt die seit 31. August 2026 geltende Ziel-API-Vorgabe für neue Smartphone-Apps und Updates. [Google: Ziel-API](https://support.google.com/googleplay/android-developer/answer/11926878?hl=en).

Eine erreichbare **Support-E-Mail-Adresse** und die erforderlichen Kontaktangaben aus dem bestehenden Entwicklerkonto übernehmen. Die Datenschutzerklärung nennt **Kolja Werner Schumann (KoSch)** und das Kontaktangebot auf kosch.cloud. Es wurde keine zusätzliche E-Mail-Adresse erfunden.

## 2. Signierung und Bundle

Neue Play-Apps verwenden [Android App Bundles](https://developer.android.com/guide/app-bundle). Vor dem ersten Upload die Seite **App-Integrität → App-Signierung** und vorhandene Schlüssel abgleichen. Der frühere Produktionsschlüssel wurde im Projekt bereits separat dokumentiert; Fingerabdrücke und tatsächliche Console-Konfiguration vor Verwendung erneut direkt in Play Console prüfen.

Falls bisherige Produktionsinstallationen von `cloud.kosch.pizzascan` über Play aktualisierbar bleiben sollen, muss der dort registrierte Signierpfad beibehalten werden. Bei erstmaliger Einrichtung unterstützt Play den Import eines vorhandenen Schlüssels; dafür die aktuelle PEPK-Anleitung der eigenen Console verwenden. Ist Play App Signing bereits eingerichtet, dessen registrierten App- und Upload-Schlüssel verwenden. Private Schlüssel bleiben im separat gesicherten Signierbackup und werden niemals im Repository abgelegt. [Google: App-Signierung](https://developer.android.com/studio/publish/app-signing).

Die technische Testfassung hat die **andere Paket-ID `cloud.kosch.pizzascan.lang1`** und einen Testschlüssel. Sie kann getrennt neben der Play-App installiert werden. Ein Update einer älteren technischen `.lang1`-APK funktioniert nur, wenn beide APKs mit demselben Testschlüssel signiert wurden. Die Test-Signatur ist keine Freigabe für den Produktions-/Uploadschlüssel.

## 3. Texte, Bilder und Datenschutz

Die deutschen Eintragstexte liegen unter `de-DE/`, Versionshinweise zusätzlich unter `en-US/`. Die freigegebenen Bilder sind:

| Verwendung | Datei | Maße |
|---|---|---|
| App-Symbol | `graphics/PizzaScan-App-Icon-512.png` | 512 × 512 PNG |
| Vorstellungsgrafik Deutsch | `graphics/PizzaScan-Vorstellung-DE-1024x500.png` | 1024 × 500 PNG |
| Vorstellungsgrafik Englisch | `graphics/PizzaScan-Feature-EN-1024x500.png` | 1024 × 500 PNG |

Beide Vorstellungsgrafiken sind jeweils kleiner als 15 MB. Dasselbe App-Symbol ist in Android enthalten. Für den endgültigen Store-Eintrag aktuelle Telefon-Screenshots aus dem freigegebenen Build aufnehmen; ältere Screenshots erst auf Übereinstimmung mit der aktuellen Oberfläche prüfen. Testdaten dürfen keine echten Restaurantbewertungen vortäuschen. [Google: Grafiken](https://support.google.com/googleplay/android-developer/answer/9866151?hl=en).

Website: [kosch.cloud](https://kosch.cloud). Öffentliche [Datenschutzerklärung](../docs/Datenschutz.md); derselbe Funktionsumfang ist in der App offline beschrieben. Für 2.3.2 müssen dort neben OpenStreetMap/Overpass/Photon auch der nur bei ausdrücklich abgesendeter Suche verwendete Nominatim-Fallback, Mangrove/Open Reviews und Hugging-Face-Modelldownloads berücksichtigt sein. Die Support-E-Mail im Store ergänzen. [Google: Nutzerdaten](https://support.google.com/googleplay/android-developer/answer/10144311?hl=de).

## 4. App-Inhalte und Datensicherheit

[DATENSICHERHEIT.md](DATENSICHERHEIT.md) berücksichtigt Mangrove/Open Reviews, Photon-Suchvorschläge und den Nominatim-Fallback. Nicht pauschal „Keine Daten erhoben“ wählen: Fotos, eigene Rezensionstexte und KI-Analyse bleiben lokal; Karten-, Such-, Bewertungs- und Downloadanbieter erhalten die für ihre Verbindungen nötigen Daten.

Für die Suche gilt technisch:
- **Photon**: Primärdienst für Orts-/Adresssuche und Autocomplete; Suchtext und Suchmittelpunkt können übertragen werden.
- **Nominatim**: nur nach bewusstem Absenden einer Suche als Fallback bei Photon-Fehler oder leerem/brauchlosem Photon-Ergebnis; kein Autocomplete. PizzaScan sendet in dieser Fallback-Anfrage Suchtext und Sprache, aber keinen Standortparameter. Der Server erhält dennoch technisch notwendige Verbindungsdaten wie die IP-Adresse.
- Fallback-Anfragen werden gedrosselt und Suchergebnisse lokal ungefähr 24 Stunden zwischengespeichert.

Alle Funktionen sind ohne Login erreichbar. Es gibt keine Kontoerstellung, Werbung oder öffentliche Community. Aus Mangrove werden nur offene Zahlen übernommen, keine fremden Rezensionstexte oder Fotos. Google Maps, Tripadvisor und Yelp öffnen sich als externe Suchlinks. Pflichtangaben zu Altersgruppen, Ländern und Händlerstatus anhand des tatsächlichen Angebots ausfüllen; diese Erklärungen wurden nicht im Namen des Entwicklers abgegeben.

## 5. Geräteprüfung

Zunächst die aktuelle **2.3.2-Test-APK** anhand von [TESTPLAN.md](TESTPLAN.md) auf einem echten Telefon prüfen. Priorität haben Installation, Startsuche, Orts-/Adresssuche inklusive Fallback, Karten-Recovery nach Netz-/App-Rückkehr, Erhalt eigener Filter, Standort, Marker-Stabilität, Bewertungsfilter, Kamera, Modellstart, Modellpersistenz und Offline-Verhalten. Beobachtungen mit Gerät, Android- und WebView-Version festhalten.

Automatisiert sind für 2.3.2 bereits erfolgreich: Build/Lint, Web- und UI-Tests, aus der echten APK extrahierte UI-Prüfung, Such-/Fallback- und Karten-Regressionstests, Ratings, fünf Sprachen, alle drei lokalen Modellpfade sowie Android-16-Instrumentierung. Diese CI-Prüfung ersetzt den echten Geräte- und Play-Pre-Launch-Test nicht.

## 6. AAB hochladen

Erst nach Geräte-Abnahme das **2.3.2-AAB / VersionCode 8** mit dem korrekten Upload-Schlüssel signieren und in **Testen → Interner Test** bzw. direkt in den geplanten geschlossenen Track hochladen. Bundle-Details auf Paket-ID, Versionscode, API und Zertifikate prüfen und Versionshinweise einfügen.

Danach den Pre-Launch-Bericht auswerten, insbesondere Android-Zurück, Kamera/Dateiauswahl, Standort, Querformat, Schriftvergrößerung, WebView und Netzfehler. Die GitHub-Test-APK ersetzt diese Play-Prüfung nicht.

## 7. Freiwillige Tester über Google Groups

Die vorbereitete Testergruppe ist für den **geschlossenen Test** vorgesehen. Der offizielle Play-Opt-in-Link kann erst erzeugt werden, nachdem ein gültiges AAB in den geschlossenen Track hochgeladen und die Testergruppe dort hinterlegt wurde.

1. In der Google Group freiwillige Tester aufnehmen. Sie müssen mit dem Google-Konto Mitglied sein, das sie für Play verwenden.
2. In Play Console unter **Testen → Geschlossener Test → Tester → Google Groups** die echte Gruppenadresse im Format `gruppenname@googlegroups.com` eintragen.
3. Die Testversion im geschlossenen Track verfügbar machen. Den von Play erzeugten Opt-in-Link zusammen mit Testplan und Feedbackweg an die Tester geben.
4. Tester treten zuerst der Gruppe bei, öffnen dann den Opt-in-Link, nehmen am Test teil und installieren über Google Play. Der Gruppeneintritt allein genügt nicht.

Google dokumentiert den [Test mit Google Groups und Opt-in-Link](https://support.google.com/googleplay/android-developer/answer/9845334?hl=en). Ein APK-Download von GitHub zählt nicht als Teilnahme am geschlossenen Play-Test.

Für persönliche Entwicklerkonten, die nach dem 13. November 2023 angelegt wurden, verlangt Google mindestens **12 Tester, die 14 Tage ohne Unterbrechung am geschlossenen Test teilnehmen**. Danach kann Produktionszugang beantragt werden; er wird nicht automatisch erteilt. Ob diese Pflicht für das vorhandene Konto gilt, zeigt die Console. Echte Nutzung und Rückmeldungen sammeln. [Google: Testpflicht](https://support.google.com/googleplay/android-developer/answer/14151465?hl=en).

## 8. Freigabe vorbereiten

Erst nach abgearbeiteten Gerätebefunden, Pre-Launch-Bericht und gegebenenfalls Testpflicht Produktionszugang beantragen und den Store-Eintrag zur Prüfung einreichen. Vor jedem Update VersionCode und Signierung abgleichen. Die App bleibt kostenlos; es werden keine kostenpflichtigen Bewertungs-APIs aktiviert.
