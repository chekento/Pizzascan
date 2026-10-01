# Datenschutz, KI- & Drittanbietertransparenz — PizzaScan

**Stand:** 1. Oktober 2026  
**Version:** 2.3.23 · Build 58  
**Android-Paket:** `cloud.kosch.pizzascan`  
**Projekt:** https://github.com/chekento/Pizzascan  
**Kontakt / Anbieterinformationen:** https://kosch.cloud

Die ausführliche Datenschutzerklärung wird unter [`docs/Datenschutz.md`](docs/Datenschutz.md) gepflegt. Diese Root-Seite fasst zusätzlich KI-/ML-Funktionen, Drittanbieter, externe Dienste, Build-Werkzeuge und APK-Signierung transparent zusammen.

## 1. Kurzfassung

PizzaScan benötigt kein Benutzerkonto und betreibt keinen eigenen Server für Benutzerprofile, Pizza-Fotos oder private Restaurantbewertungen.

- Keine Werbung.
- Kein eigenes Analytics-/Tracking-SDK.
- Standortzugriff ist optional und nur im Vordergrund.
- Fotos für die KI-Analyse werden lokal verarbeitet.
- KI-Modelle werden erst nach ausdrücklicher Bestätigung geladen.
- Eigene Bewertungen und Besuchsdaten bleiben grundsätzlich lokal.
- Eine Veröffentlichung zu Open Reviews / Mangrove erfolgt nur nach ausdrücklicher Aktivierung und konkretem Nutzerbefehl.
- Google Maps, Tripadvisor und Yelp werden nur nach bewusster Nutzeraktion als externe Ziele geöffnet.
- Eine optionale Google-Places-Funktion benötigt einen vom Nutzer selbst bereitgestellten API-Key.

## 2. KI / Machine Learning — was macht die KI?

PizzaScan verwendet KI/ML **ausschließlich für die optionale Analyse eines vom Nutzer ausgewählten Pizza-/Food-Fotos**.

| Modell / Komponente | Aufgabe | Datenfluss |
|---|---|---|
| **CLIP ViT-B/32 (OpenAI)** | Bild-Text-Ähnlichkeiten für sichtbare Fotoeigenschaften | Lokale Inferenz nach Modelldownload |
| **CLIP ViT-B/16 (OpenAI)** | Alternative, feinere Bild-Text-Ähnlichkeitsanalyse | Lokale Inferenz |
| **SigLIP Base Patch16-224 (Google)** | Alternative visuelle Embedding-/Ähnlichkeitsanalyse | Lokale Inferenz |
| **Xenova / Transformers.js** | Browser-/WebView-Laufzeit für die Modelle | Modelllauf lokal in App/WebView |
| **Hugging Face** | Downloadquelle der bestätigten Modellgewichte | Erhält beim Download technische Verbindungsdaten, aber kein Foto |

Die Analyse erzeugt experimentelle Werte für **25 sichtbare Kriterien**. Die in der Oberfläche verwendeten **100 Perspektiven sind simulierte Gewichtungsprofile** derselben Fotoanalyse. Sie sind keine 100 realen Experten, keine unabhängigen Gutachten und keine Menschen.

### Was die KI nicht macht

- Keine Fotos werden zur KI-Auswertung an OpenAI, Google oder Hugging Face hochgeladen.
- Die Modelle werden nicht mit Nutzerfotos nachtrainiert.
- Es findet keine Gesichtserkennung oder biometrische Identifikation statt.
- Die KI bewertet nicht zuverlässig Geschmack, Geruch, Temperatur, Allergene, Hygiene oder Lebensmittelsicherheit.
- KI-Werte werden nicht automatisch als persönliche Restaurantbewertung veröffentlicht.
- PizzaScan verwendet keinen ChatGPT-/LLM-Chatbot für die Fotoanalyse.

## 3. Android-Berechtigungen

Die aktuelle App deklariert:

- `INTERNET` — Karten, Restaurant-/Adresssuche, Modelldownloads und optionale externe Bewertungsdienste.
- `ACCESS_COARSE_LOCATION` — optionaler ungefährer Vordergrundstandort.
- `ACCESS_FINE_LOCATION` — optionaler genauer Vordergrundstandort.

Es gibt keine Hintergrundstandortberechtigung.

Für Fotos nutzt PizzaScan die Android-Dateiauswahl bzw. eine externe Kamera-App. Die App fordert keinen pauschalen Medienbibliothekszugriff an.

## 4. Externe Dienste und Datenquellen

Je nach verwendeter Funktion kann PizzaScan HTTPS-Verbindungen aufbauen zu:

| Dienst | Zweck | Typische übertragene Daten |
|---|---|---|
| **OpenStreetMap / tile.openstreetmap.org** | Kartenkacheln | sichtbarer Kartenbereich, IP/Verbindungsdaten |
| **Overpass** (`overpass-api.de`, `overpass.private.coffee`, `overpass.osm.jp`, `maps.mail.ru`) | Pizza-/Restaurant-POIs | Karten-BBox, OSM-Abfragen |
| **Photon / komoot** | Ort-/Adresssuche | Suchtext, je nach Funktion Suchmittelpunkt |
| **Nominatim** | expliziter Such-Fallback | Suchtext, Sprache und technische Parameter |
| **Mangrove / Open Reviews** | offene Bewertungen lesen; optional bewusst eigene veröffentlichen | Suchbereich; bei Veröffentlichung Bewertung, freigegebener Text, Ortsdaten, öffentlicher Schlüssel |
| **Hugging Face** | Download lokaler ML-Modelle | Modelldatei-Anfrage und technische Verbindungsdaten |
| **Google Places API (optional)** | ausgewählte Google-Reviews, nur mit eigenem Key | Ortsname, Adresse, Koordinaten, Sprache, API-Key/Cloudprojekt |
| **Google Maps / Tripadvisor / Yelp** | externe Gegenprüfung | erst nach Nutzer-Tap im externen Ziel |

Externe Dienste können IP-Adresse, Zeitpunkt, User-Agent und weitere technisch notwendige Protokolldaten nach ihren eigenen Regeln verarbeiten.

## 5. Lokale Daten

Je nach Nutzung können lokal gespeichert werden:

- Kartenansicht und Filter,
- gefundene OSM-Orte und lokale Caches,
- Favoriten,
- Besuchsarchiv,
- persönliche Bewertungen und Notizen,
- Rezensionsentwürfe,
- Fotoanalysen,
- ausgewählte lokale Fotos,
- heruntergeladene KI-Modelle,
- optionaler eigener Google-Places-Key,
- lokaler privater P-256-Schlüssel für bewusst veröffentlichte Open-Reviews-Beiträge.

Diese Daten werden nicht als PizzaScan-Nutzerprofil an einen eigenen Server übertragen.

## 6. Drittanbieter-Bibliotheken und Werkzeuge

### App-/WebView-Laufzeit

- **Leaflet 1.9.4** — Kartenoberfläche.
- **@huggingface/transformers 3.8.1** — lokale ML-Inferenz.
- **opening_hours 3.11.0** — Verarbeitung von Öffnungszeiten.
- **tz-lookup 6.1.25** — Zeitzonenbestimmung aus Koordinaten.
- **AndroidX WebKit / AndroidX Core** — Android-WebView- und Plattformintegration.

### Entwicklungs-/Testwerkzeuge

- **Playwright** — Browser-/Smoke-Tests.
- **esbuild** — Asset-/Build-Verarbeitung.
- **Sharp** — Grafik-/Asset-Verarbeitung.
- **Node.js, Gradle, Android SDK, JDK** — Build-System.
- **GitHub Actions / GitHub Releases** — CI und Distribution.

Entwicklungswerkzeuge sind nicht automatisch Laufzeit-Tracker in der installierten App.

## 7. Eigene Bewertungen und Open Reviews

Das Lesen öffentlicher Mangrove/Open-Reviews-Daten ist getrennt von der Veröffentlichung eigener Inhalte.

Eine eigene Bewertung wird **nicht automatisch veröffentlicht**. Für die Veröffentlichung muss die Funktion aktiviert und anschließend die konkrete Bewertung ausdrücklich gesendet werden.

Der private P-256-Schlüssel bleibt lokal; nur der öffentliche Signaturschlüssel wird für den öffentlichen Beitrag verwendet.

## 8. Zertifikate, Signierung und Prüfsummen

Der im Repository verwendete `direct`-Build ist derzeit mit einer **Android-Test-/Debug-Signierkonfiguration** signiert. Diese Identität ermöglicht die technische APK-Installation, ist aber **kein Play-Store-Produktionszertifikat und keine unabhängige Sicherheits-/Datenschutz-Zertifizierung**.

SHA-256-Prüfsummen werden zur Integritätskontrolle veröffentlicht. Sie bestätigen, ob eine Datei dem veröffentlichten Hash entspricht; sie zertifizieren nicht die inhaltliche Sicherheit der App.

PizzaScan installiert keine eigene Root-CA und verlangt keine Benutzerzertifikate.

## 9. Löschung und Kontrolle

Lokale Daten können über App-Funktionen, **Android → Apps → PizzaScan → Speicher → Daten löschen** oder durch Deinstallation entfernt werden. Exportdateien und extern bewusst veröffentlichte Inhalte müssen am jeweiligen Ziel separat verwaltet werden.

Modelle können über die App-Funktion zum Entfernen heruntergeladener Modelle gelöscht werden. Standortberechtigungen lassen sich jederzeit über Android widerrufen.

## 10. Ausführliche Datenschutzerklärung

Die vollständige Fassung mit Speicherfristen, externen Datenflüssen, Rechtsgrundlagen, Nutzerrechten und Details zu Mangrove/Open Reviews und Google Places steht hier:

**[docs/Datenschutz.md](docs/Datenschutz.md)**

## 11. Änderungen

Wenn neue KI-Modelle, Online-Dienste, Berechtigungen, Accounts, Analytics oder andere Datenflüsse hinzukommen, müssen diese Dokumente vor Veröffentlichung entsprechend aktualisiert werden.

---

**Repository:** https://github.com/chekento/Pizzascan  
**Anbieter / Kontakt:** https://kosch.cloud
