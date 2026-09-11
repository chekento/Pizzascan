/* Shared offline-model explanation for onboarding, settings and first use. */
(function(root){
 'use strict';
 const esc=root.PizzaCore.esc;
 function html(model){
  return `<div class="model-explanation">
   <div class="model-facts"><p class="eyebrow">AUSGEWÄHLTES OFFLINE-MODELL</p><h2>${esc(model.fullName)}</h2>
    <p>${esc(model.developer)} · ONNX-Konvertierung von Xenova</p>
    <div class="model-fact-row"><span><strong>ca. ${model.downloadMB} MB</strong><small>zusätzlicher Download</small></span><span><strong>Auf deinem Gerät</strong><small>Fotoanalyse ohne KI-API-Schlüssel</small></span></div>
   </div>
   <h2>Warum wird ein Modell geladen?</h2>
   <p>Das Modell enthält die bereits erlernten Bild- und Textmuster, mit denen PizzaScan dein Pizzafoto mit Beschreibungen vergleicht. So kann die Fotobewertung auf deinem Smartphone rechnen, ohne dein Foto an einen KI-Dienst zu senden. Es wird dabei kein neues Modell mit deinen Fotos trainiert.</p>
   <p><strong>Zusätzlich zur APK:</strong> Die Modelldateien sind nicht in der APK enthalten. Erst nach deiner Bestätigung lädt PizzaScan das gewählte Modell von Hugging Face und speichert es auf diesem Gerät. Die Karte lässt sich auch ohne Modell verwenden.</p>
   <p class="notice"><strong>Disclaimer zur Fotobewertung:</strong> Der experimentelle KI-Fotoindex von 0,1 bis 10,0 ist eine Einschätzung sichtbarer Merkmale, keine verlässliche Qualitätsmessung. Geschmack, Geruch, Temperatur, Allergene, Hygiene und Lebensmittelsicherheit lassen sich daraus nicht bestimmen. Die 100 Perspektiven sind simulierte Gewichtungen derselben 25 Werte – keine 100 echten Experten oder unabhängigen Gutachten.</p>
   <details><summary>Download, Speicher und Kosten</summary>
    <p>Der Erstdownload für ${esc(model.fullName)} umfasst ungefähr ${model.downloadMB} MB einschließlich kleiner Begleitdateien. Die Größe kann sich mit Modellversionen ändern. WLAN wird empfohlen; mobile Daten können Kosten verursachen. Für die Modelle fallen in PizzaScan keine Modellnutzungsgebühren an. Du brauchst weder ein KI-Abo noch einen Account oder API-Schlüssel beim Modellanbieter.</p>
    <p>Halte zusätzlich zur App mehrere hundert MB Speicher frei. Jedes weitere gewählte Modell benötigt seinen eigenen Download; alle drei zusammen ungefähr 530 MB. Während des Ladens und Rechnens braucht die App außerdem Arbeitsspeicher. Dauer, Akkuverbrauch und Erwärmung hängen vom Gerät ab. Du kannst den laufenden Vorgang abbrechen; bereits vollständig gespeicherte Modelldateien können wiederverwendet werden.</p>
   </details>
   <details><summary>Was funktioniert anschließend offline?</summary>
    <p>Nach einem vollständig abgeschlossenen Download funktioniert die Fotobewertung auch ohne Internet, solange die Modelldateien noch im App-Cache liegen. Ein Wechsel zu einem bisher ungenutzten Modell erfordert einen weiteren Download mit eigener Bestätigung. Ein vorhandenes Modell wird wiederverwendet.</p>
    <p>Android oder eine Speicherbereinigung können den Cache entfernen. Bei einer späteren Analyse können dann fehlende Dateien des bereits bestätigten Modells erneut geladen werden. Unter Einstellungen → Foto-KI → „Heruntergeladene Modelle entfernen“ kannst du die Modelldateien und ihre Downloadfreigaben löschen. Deine gespeicherten Fotos und Bewertungen bleiben dabei erhalten.</p>
    <p>„Offline“ bezieht sich auf die Fotoanalyse. Neue Kartenkacheln, Restaurantsuche, aktuelle Ortsdaten, Community und Google Maps benötigen weiterhin eine Internetverbindung. PizzaScan wechselt bei einem KI-Fehler nicht automatisch zu einer Cloud-Analyse.</p>
   </details>
   <details><summary>Datenschutz und Grenzen im Detail</summary>
    <p>Beim Modell-Download erhalten Hugging Face und seine Auslieferungsserver technisch notwendige Verbindungsdaten wie deine IP-Adresse und die angefragten Modelldateien. Dein Foto und deine Bewertung werden für die Analyse nicht mitgesendet. Fotos und Ergebnisse bleiben in PizzaScan lokal gespeichert, bis du sie löschst oder bewusst exportierst bzw. teilst. Community-Beiträge und Teilen-Aktionen haben eine eigene Bestätigung.</p>
    <p>CLIP und SigLIP sind allgemeine Bild-Sprach-Modelle, keine speziell geprüften Pizza-Gutachter. Sie vergleichen das Foto mit vier englischen Beschreibungen je Kategorie. Beleuchtung, Perspektive, Bildschärfe, Pizzastil und erlernte Verzerrungen können die Werte beeinflussen. Nachkommastellen bedeuten keine entsprechende Messgenauigkeit; unterschiedliche Modelle können unterschiedlich urteilen.</p>
    <p>Deine persönliche Bewertung bleibt getrennt. Prüfe einen Google-Maps-Entwurf vor der Veröffentlichung und stütze Aussagen über Geschmack oder Service auf deine tatsächliche Erfahrung. PizzaScan veröffentlicht keine Rezension automatisch.</p>
   </details>
   <details><summary>Modellname und Herkunft</summary>
    <p>Verwendet wird <strong>${esc(model.fullName)}</strong> von ${esc(model.developer)} in der speichersparenden q8-ONNX-Fassung von Xenova. Die lokale Ausführung erfolgt mit Transformers.js und ONNX Runtime. CLIP steht für „Contrastive Language–Image Pre-training“, SigLIP für „Sigmoid Loss for Language–Image Pre-training“.</p>
    <p class="model-source">Modellquelle: <a href="https://huggingface.co/${esc(model.repo)}">${esc(model.repo)} ↗</a>. Dieser Link öffnet die externe Modellseite. Die Modellauswahl in den Einstellungen lädt für sich allein keine Modelldateien.</p>
   </details>
  </div>`;
 }
 root.PizzaModelInfo={html,version:1};
})(globalThis);
