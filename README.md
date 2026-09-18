<p align="center">
  <img src="store/graphics/PizzaScan-App-Icon-512.png" alt="PizzaScan" width="112" height="112">
</p>

<h1 align="center">PizzaScan 2.3.9 · Build 44</h1>
<p align="center"><strong>Weltweit Pizza und italienische Restaurants finden · schnell · relevant · transparent</strong></p>
<p align="center">Deutsch · English · Italiano · Español · Français</p>

<p align="center">
  <img src="store/graphics/PizzaScan-Feature-EN-1024x500.png" alt="PizzaScan Feature Graphic" width="1024">
</p>

## 📱 Aktuelle APK direkt herunterladen

<p align="center">
  <a href="https://raw.githubusercontent.com/chekento/Pizzascan/main/downloads/PizzaScan-2.3.9.apk"><strong>⬇️ PizzaScan 2.3.9 · Build 44 APK herunterladen</strong></a>
</p>

<p align="center"><strong>Version 2.3.9 · Build 44 · Android 8+ · Target SDK 36 · cloud.kosch.pizzascan</strong></p>

> **Build 44 zieht die Android-Version mindestens auf den Stand des ursprünglichen WebSim-Projekts:** Die WebSim-Pizza-/Italien-Suchfamilien bleiben vollständig erhalten, generische Restaurants bleiben draußen, der erste erfolgreiche Overpass-Spiegel wird ohne Wartefenster sofort gerendert und weitere Spiegel ergänzen nur noch im Hintergrund. Der alte Runtime-Pfad, der auf alle Provider warten konnte, ist deaktiviert.

<p align="center">
<a href="downloads/SHA256SUMS-2.3.9.txt"><strong>SHA-256</strong></a>
&nbsp; · &nbsp;
<a href="CHANGELOG.md"><strong>📝 Changelog</strong></a>
&nbsp; · &nbsp;
<a href="downloads/README.md"><strong>📦 APK-Archiv</strong></a>
&nbsp; · &nbsp;
<a href="https://raw.githack.com/chekento/Pizzascan/main/web/index.html"><strong>🌐 Browser-Version</strong></a>
</p>

## 🍕 Relevanz statt beliebiger Restaurant-Treffer

Build 44 verwendet den ursprünglichen WebSim-Suchkern als Mindestbasis und erweitert ihn gezielt:

- **Kein allgemeiner Gastro-Vollscan mehr.** Normale Burger-, Döner-, asiatische oder sonstige Restaurants ohne Pizza-/Italien-Bezug werden nicht gelistet.
- **Pizza muss trotzdem nicht im Namen stehen.** Eine Bar, ein Café oder Restaurant wird gefunden, wenn strukturierte OSM-Daten Pizza belegen, z. B. über `cuisine`, `speciality`, Produkte, Beschreibung, Notizen oder Pizzaautomat-Tags.
- **Italienische Restaurants bleiben sichtbar**, wenn OSM einen belastbaren italienischen Bezug enthält, z. B. `cuisine=italian`, Ristorante, Trattoria, Osteria oder Cucina Italiana.
- Italienisch bedeutet nicht automatisch Pizza: bestätigte Pizza-Orte und italienische Kandidaten werden getrennt gekennzeichnet.
- Mehrsprachige Pizza-Signale werden unterstützt, unter anderem lateinische Schreibweisen sowie Japanisch, Chinesisch, Arabisch, Kyrillisch, Griechisch, Hebräisch, Koreanisch und Thai.
- Alte Build-42-Cacheeinträge ohne Pizza-/Italien-Evidenz werden aus der sichtbaren Ergebnisliste entfernt.

## ⚡ Schnellere progressive Suche

- Primärer Ortsindex: **OpenStreetMap / Overpass** über mehrere HTTPS-Spiegel.
- Gezielte Abfrage statt unnötig großer allgemeiner Gastro-Abfrage.
- Der **erste erfolgreiche OSM-Spiegel wird sofort gerendert**; es gibt kein zusätzliches 3,5-s- oder vollständiges Provider-Wartefenster mehr. Weitere Spiegel ergänzen/deduplizieren danach im Hintergrund.
- Keine künstliche 20-/50-/100-Treffergrenze für relevante OSM-Ergebnisse.
- Ein eingestellter Radius wird exakt verwendet: **5 km bedeutet auch intern 5 km**.
- `0 km` nutzt den aktuellen Kartenausschnitt.
- GPS, Orts-/Adresssuche und „Hier suchen“ setzen den realen Suchbereich.
- Cache-first: bekannte relevante Orte bleiben bei temporären Provider-/Netzproblemen verfügbar.

## 🌍 Weltweit

PizzaScan hat keine Länder-Whitelist. Eine frische Installation startet ohne GPS neutral in der Weltübersicht. GPS, Orts-/Adresssuche oder die bewusst gewählte Kartenregion setzen anschließend das Suchzentrum.

Unicode-sichere Suche erhält Orts- und Restaurantnamen in Originalschrift. Die Testmatrix enthält Regionen in Europa, Nord- und Südamerika, Afrika, Asien und Ozeanien sowie einen Dateline-Fall.

## 🗺️ Karte & Bedienung

- OpenStreetMap-/Leaflet-Karte mit GPS und Vollbildmodus.
- Suchradius **0–10 km in 0,5-km-Schritten** mit sichtbarem Suchzentrum und Radiuskreis.
- Filter „Jetzt geöffnet“, Mindestbewertung, Ortstypen, Besuche und persönliche Bewertungen.
- Pizza-Radar für relevante Orte im aktuellen Gebiet.
- Build 44 ersetzt den früher überdimensionierten Such-/Refresh-Bereich durch eine **kompakte Karten-Toolbar**. Redundante Großbuttons werden entfernt; Status und Cache-Hinweis bleiben klein und dezent.
- Bottom-Navigation für Karte und Fotobewertung, Portrait/Landscape und Dark Mode.

## ⭐ Bewertungen & persönliche Historie

- Eigene Restaurantbewertung von **0,1–10,0**.
- Favoriten, Besuche und persönliche Historie bleiben lokal gespeichert.
- Mangrove / Open Reviews als offene Bewertungsquelle.
- Bewertungsfilter mit Dezimalwerten, z. B. **≥ 4,6**.
- Links zu Google Maps, Tripadvisor, Yelp und Mangrove zur externen Gegenprüfung.
- Google-/Microsoft-proprietäre POI-Daten werden nicht rechtswidrig in den OSM-Index kopiert.

## ✍️ Review Builder

- Dine-in, Takeaway und Delivery.
- Adaptive positive/negative Bausteine für Geschmack, Teig, Belag, Temperatur, Service, Wartezeit, Preis-Leistung, Ambiente, Sauberkeit, Lieferung und Verpackung.
- Eigener Freitext, lokale Entwürfe, JSON-Export/-Import und Google-kompatible Sternableitung aus der eigenen Bewertung.
- Foto-KI wird nicht als persönliche Restaurant-Erfahrung ausgegeben.

## 📷 Lokale Foto-KI

- Foto aufnehmen oder auswählen.
- Lokale Analyse mit **CLIP ViT-B/32**, **CLIP ViT-B/16** oder **SigLIP Base Patch16-224** über ONNX/WASM.
- Modell wird erst nach Bestätigung heruntergeladen und bleibt danach im privaten App-Speicher verfügbar.
- **25 sichtbare Kriterien** und **100 simulierte Gewichtungsperspektiven**; keine Behauptung von 100 realen Experten.
- Fotoanalyse bleibt getrennt von Restaurantbewertung und Review Builder.
- Fotos werden für die Analyse nicht an einen PizzaScan-Server hochgeladen.

## 🛡️ Stabilität, Datenschutz & Recovery

- Offline-/Cache-first-Verhalten.
- Mehrere OSM-Provider mit Failover und progressiver Zusammenführung.
- Abgebrochene alte Anfragen dürfen neuere Resultate nicht überschreiben.
- Health Check, Privacy Dashboard und begrenztes lokales Runtime-Recovery-Log.
- Cache-Reparatur entfernt nur temporäre Karten-/Suchdaten; Favoriten, eigene Bewertungen, Einstellungen und Offline-Modelle bleiben erhalten.
- In-App-Datenschutzerklärung und Modell-Download-Disclaimer.

## 🔎 Datenquellen und Grenzen

OpenStreetMap ist der frei zusammenführbare Hauptindex. Google Maps und Microsoft/Bing/Azure können zur externen Gegenprüfung geöffnet werden, deren proprietäre POI-Daten werden jedoch nicht unzulässig mit OSM/Leaflet vermischt.

Keine öffentliche Quelle kann garantieren, dass jeder reale Betrieb weltweit vollständig und aktuell erfasst ist. PizzaScan versucht deshalb, **alle verfügbaren relevanten OSM-Signale vollständig auszuwerten**, statt fachfremde Restaurants als vermeintliche Pizza-Treffer anzuzeigen.

## ✅ Release-Gate

Der veröffentlichte Android-Build wird vor dem Main-Publish geprüft auf:

- Unit-/Regressionstests
- Browser-/Playwright-Smokes
- Build-43-Relevanztest: generisches Restaurant raus, Pizza-Bar ohne „Pizza“ im Namen rein, italienische Trattoria rein
- Web-UI direkt aus der gebauten APK
- Android-Lint, Paket und Signatur
- Android-16-Installation/Start
- reale CLIP-B/32-, CLIP-B/16- und SigLIP-Inferenz

---

<p align="center"><strong>By KoSch · <a href="https://kosch.cloud">kosch.cloud</a></strong><br>
Based on <a href="https://pizzascan.on.websim.com">pizzascan.on.websim.com</a> ❣️</p>
