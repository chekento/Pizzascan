<p align="center">
  <img src="store/graphics/PizzaScan-App-Icon-512.png" alt="PizzaScan" width="112" height="112">
</p>

<h1 align="center">PizzaScan 2.3.3</h1>
<p align="center"><strong>Gute Pizza finden · offene Bewertungen filtern · Fotos lokal analysieren</strong></p>
<p align="center">Deutsch · English · Italiano · Español · Français</p>

<p align="center">
  <img src="store/graphics/PizzaScan-Feature-EN-1024x500.png" alt="PizzaScan Feature Graphic" width="1024">
</p>

## 🚀 Direkt testen

<table>
<tr>
<td align="center" width="50%">
<h3>📱 Android · technische Vorab-APK</h3>
<p><strong>PizzaScan 2.3.3</strong> für direkte Geräte- und Funktionsprüfungen.</p>
<p><a href="https://raw.githubusercontent.com/chekento/Pizzascan/main/downloads/PizzaScan-2.3.3-Test.apk"><strong>⬇️ PizzaScan 2.3.3 Test-APK herunterladen</strong></a></p>
<p><sub>Paket: cloud.kosch.pizzascan.lang1 · nicht die spätere Play-Testausgabe</sub></p>
</td>
<td align="center" width="50%">
<h3>🌐 Browser-Demo</h3>
<p>Die Weboberfläche lässt sich ohne Installation ausprobieren.</p>
<p><a href="https://raw.githack.com/chekento/Pizzascan/main/web/index.html"><strong>▶ PizzaScan 2.3.3 im Browser öffnen</strong></a></p>
<p><sub>Technische Demo: Android-spezifische Funktionen können im Browser abweichen.</sub></p>
</td>
</tr>
</table>

<p align="center">
<a href="downloads/SHA256SUMS-2.3.3.txt"><strong>SHA-256 prüfen</strong></a>
&nbsp; · &nbsp;
<strong><a href="https://raw.githack.com/chekento/Pizzascan/main/docs/release-dashboard.html">🚦 Release-Dashboard</a></strong>
</p>

## 🧪 Beim Google-Play-Release testen

<table>
<tr>
<td align="center">
<h3>PizzaScan Beta Testers</h3>
<p><strong>Die eigentliche Tester-Version wird nicht über GitHub verteilt.</strong></p>
<p>Für den offiziellen Release-Test wird PizzaScan über den <strong>geschlossenen Google-Play-Test</strong> ausgegeben. Tritt zuerst der offiziellen Google Group bei. Sobald der Play-Test freigeschaltet ist, wird dort der <strong>offizielle Google-Play-Opt-in-/Testlink</strong> bereitgestellt.</p>
<p><a href="https://groups.google.com/g/pizzascan-beta-testers"><strong>👉 PizzaScan Beta Testers auf Google Groups beitreten</strong></a></p>
<p><sub>Google Group beitreten → offiziellen Play-Testlink erhalten → über Google Play teilnehmen und installieren → Feedback geben.</sub></p>
</td>
</tr>
</table>

> **Wichtig für Tester:** Die GitHub-APK ist ausschließlich eine technische Vorabversion für direkte Geräte- und Funktionsprüfungen. Sie ist **nicht** die spätere Play-Store-Testausgabe und eine Installation dieser APK zählt **nicht** als Teilnahme am geschlossenen Google-Play-Test.

<p align="center">
<a href="docs/Datenschutz.md">Datenschutz</a> ·
<a href="docs/Offene-Bewertungen.md">Offene Bewertungen</a> ·
<a href="store/TESTPLAN.md">Testplan</a> ·
<a href="store/PLAY-CONSOLE.md">Google Play</a>
</p>

<details open>
<summary><strong>🚦 Google Play Release Dashboard · 3 erledigt · 3 in Arbeit · 2 ausstehend</strong></summary>

| Status | Meilenstein | Aktueller Stand |
|---|---|---|
| ✅ | **2.3.3 Quellstand & Repo** | Robuster Suchfallback, Karten-Recovery, Filtererhalt, Bewertungsfilter, Ratings-Links, kompakte Navigation, 5 Sprachen und optionale Google-Maps-Reviews sind auf `main`. |
| ✅ | **CI-Build & Android 16** | Build, Lint, Web/UI-Tests, Modelltests und Android-16-Smoke-Test sind für 2.3.3 erfolgreich. |
| ✅ | **Technische Vorab-APK** | `downloads/PizzaScan-2.3.3-Test.apk` wird aus dem aktuellen 2.3.3-Build für direkte Geräteprüfung veröffentlicht. |
| 🟡 | **Echter Geräte-Abnahmetest** | 2.3.3 muss auf dem realen Android-Gerät final bestätigt werden. |
| 🟡 | **Play-AAB & Signierung** | Das 2.3.3 Release-AAB wird erzeugt und validiert; finale Upload-Signierung für `cloud.kosch.pizzascan` steht aus. |
| 🟡 | **Play Console** | Store-Assets, Datenschutz und Datensicherheitsunterlagen sind vorbereitet; Formulare noch nicht vollständig abgeschlossen. |
| ⏳ | **Geschlossener Google-Play-Test** | [Google Group](https://groups.google.com/g/pizzascan-beta-testers) ist vorbereitet; AAB-Upload, Track-Freigabe und offizieller Play-Opt-in-Link fehlen noch. |
| ⏳ | **Produktion** | Nach geschlossenem Test und den gegebenenfalls geltenden Play-Testanforderungen. |

**Aktuelle Phase:** `Pre-closed-test` · **Version:** `2.3.3` · **VersionCode:** `10` · **Stand:** 14.09.2026  
[🧪 Tester-Gruppe](https://groups.google.com/g/pizzascan-beta-testers) · [🚦 Dashboard öffnen](https://raw.githack.com/chekento/Pizzascan/main/docs/release-dashboard.html) · [Play-Console-Checkliste](store/PLAY-CONSOLE.md) · [Testplan](store/TESTPLAN.md)

</details>

## Neu in 2.3.3

- 🔎 **robustere Orts-/Adresssuche:** Photon bleibt Primärdienst; bei einer ausdrücklich abgesendeten Suche greift ein Nominatim-Fallback, wenn Photon fehlschlägt **oder keinen brauchbaren Treffer liefert**.
- ⌨️ **kein Nominatim-Autocomplete:** Suchvorschläge bleiben bei Photon; der Fallback wird nur nach bewusstem Absenden einer Suche verwendet.
- 🔄 **Karten-Recovery:** Nach Rückkehr in die App bzw. wiederhergestellter Verbindung kann PizzaScan die Karte automatisch neu laden.
- 🎛️ **Filter bleiben deine Filter:** die einmalige Start-Erkennung überschreibt später nicht mehr deinen selbst gewählten Suchradius oder andere Filter.
- ⭐ **Mindestbewertung 0,0–5,0 in 0,1-Schritten**, z. B. nur Orte ab **4,6 / 5**.
- 🌱 **Mangrove / Open Reviews** als kostenlose offene Bewertungsquelle; Orte ohne offene Bewertung separat ein-/ausblendbar.
- ↗ **Google Maps, Tripadvisor und Yelp** als externe Portal-Suchlinks in Restaurantdetails; deren Bewertungen werden nicht kopiert.
- 🗺️ **optionale Google-Maps-Reviews:** mit einem eigenen Google-Places-API-Key können reale Google-Bewertungen und bis zu fünf Rezensionen gezielt geladen werden; ohne Key bleibt PizzaScan vollständig nutzbar und öffnet Google Maps extern.
- 📍 **stabile Kartenmarker** beim Zoomen, Verschieben, Vollbild und Drehen.
- 🌍 vollständige Oberfläche in **DE / EN / IT / ES / FR**.
- 🤖 persistente Offline-Modellablage unter Android: ein bereits geladenes Modell bleibt nach normalem App-Neustart und Cache-Bereinigung erhalten.

## Hauptfunktionen

| Funktion | PizzaScan Android |
|---|---|
| 🍕 Karte | OpenStreetMap, GPS, Emoji-Marker, Pizzerien und Restaurants |
| 🔎 Suche | Restaurant/Pizzeria, Ort und Adresse; Photon + kontrollierter Nominatim-Fallback |
| ⭐ Bewertungen | offene Bewertungsdaten + Mindestwert-Filter |
| 📍 Details | Adresse, Kontakt, Öffnungszeiten, externe Bewertungsportale |
| 📷 Fotoanalyse | 25 sichtbare Kriterien, Skala 0,1–10,0 |
| 👥 Perspektiven | 100 simulierte Bewertungsprofile auf denselben Modellwerten |
| 🤖 Lokale KI | CLIP B/32, CLIP B/16 oder SigLIP B/16 via ONNX/WASM |
| ✍️ Review Builder | eigene Erfahrungen zu Essen, Service, Atmosphäre usw. |

## Bewertungsfilter

Unter **Einstellungen → Offene Ortsbewertungen → Mindestbewertung** wird der gewünschte Grenzwert gesetzt. Der Filter wirkt auf Karte und Liste. Bei `0` ist er deaktiviert. Bei aktivem Grenzwert können Orte ohne bekannte offene Bewertung bewusst zusätzlich eingeblendet werden.

Die offenen Daten stammen aus **Mangrove / Open Reviews**. Google Maps, Tripadvisor und Yelp werden als externe Links geöffnet. Zusätzlich kann optional ein eigener Google-Places-API-Key verwendet werden, um Google-Maps-Ratingdaten und bis zu fünf Rezensionen explizit abzurufen. Für die Google Places API kann ein Google-Cloud-Projekt mit aktivierter Abrechnung erforderlich sein; diese Integration ist optional und keine Voraussetzung für die Nutzung von PizzaScan. Details zu Quelle, Lizenz und Berechnung: [docs/Offene-Bewertungen.md](docs/Offene-Bewertungen.md).

## Fotoanalyse

Die Fotoanalyse läuft lokal auf dem Gerät. Sie ist ein experimenteller visueller Index und keine wissenschaftliche Geschmacks- oder Qualitätsmessung. PizzaScan bewertet sichtbare Bildmerkmale anhand von 25 Kriterien. Die 100 Profile sind **100 simulierte Gewichtungsperspektiven**, keine 100 realen Menschen und keine 100 unabhängigen KI-Gutachten.

Die Modelle werden erst nach ausdrücklicher Bestätigung heruntergeladen und anschließend im privaten Android-App-Speicher gehalten. Kein KI-Abo und kein API-Key erforderlich.

## Technik und Test

- Android 8+ (`minSdk 26`), Target SDK 36.
- WebView-App mit gepackten Web-Assets.
- OpenStreetMap / Overpass, Photon, kontrollierter Nominatim-Fallback, Leaflet.
- CI-Tests für Ratings, Suche, Fallback, Karten-Recovery, Navigation, i18n, Marker, Runtime-Assets und lokale Modelle.
- Android-16-Emulator-Smoke-Test vor Veröffentlichung der technischen 2.3.3-Test-APK.
- Der geschlossene Release-Test wird separat über Google Play verteilt.

Die vollständigen Quellen liegen unter `web/` und `app/`. Play-Store-Vorbereitung und Testplan befinden sich unter `store/`.

---

<p align="center"><strong>By KoSch of <a href="https://kosch.cloud">kosch.cloud</a> based on <a href="https://pizzascan.on.websim.com">pizzascan.on.websim.com</a> ❣️</strong></p>
