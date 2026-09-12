/* PizzaScan UI localization: de, en, it, es, fr. Device-language default + manual override. */
(function(root){
'use strict';
const KEY='pizzascan-language-v1';
const supported=['de','en','it','es','fr'];
const names={de:'Deutsch',en:'English',it:'Italiano',es:'Español',fr:'Français'};
const detected=String(navigator.language||'de').slice(0,2).toLowerCase();
let lang=localStorage.getItem(KEY)|| (supported.includes(detected)?detected:'de');
if(!supported.includes(lang))lang='de';
document.documentElement.lang=lang;

const rows=[];
const add=(de,en,it,es,fr)=>rows.push([de,{en,it,es,fr}]);
// Main navigation, map and onboarding.
add('DEIN NÄCHSTER LIEBLINGSPLATZ','YOUR NEXT FAVORITE PLACE','IL TUO PROSSIMO POSTO PREFERITO','TU PRÓXIMO LUGAR FAVORITO','VOTRE PROCHAINE ADRESSE PRÉFÉRÉE');
add('Gute Pizza. Ganz nah.','Great pizza. Right nearby.','Buona pizza. Proprio qui vicino.','Buena pizza. Muy cerca.','Bonne pizza. Tout près.');
add('Restaurant, Pizzeria oder Ort','Restaurant, pizzeria or place','Ristorante, pizzeria o luogo','Restaurante, pizzería o lugar','Restaurant, pizzeria ou lieu');
add('Suchen','Search','Cerca','Buscar','Rechercher');
add('Suche minimieren','Minimize search','Riduci ricerca','Minimizar búsqueda','Réduire la recherche');
add('Suchtreffer','Search results','Risultati di ricerca','Resultados de búsqueda','Résultats de recherche');
add('Filter','Filters','Filtri','Filtros','Filtres');
add('◷ Jetzt geöffnet','◷ Open now','◷ Aperto ora','◷ Abierto ahora','◷ Ouvert maintenant');
add('🟢 Nur geöffnet','🟢 Open only','🟢 Solo aperti','🟢 Solo abiertos','🟢 Ouverts uniquement');
add('Vollbild','Fullscreen','Schermo intero','Pantalla completa','Plein écran');
add('← Zurück','← Back','← Indietro','← Atrás','← Retour');
add('Pizzakarte','Pizza map','Mappa pizza','Mapa de pizza','Carte des pizzas');
add('Hier suchen','Search here','Cerca qui','Buscar aquí','Rechercher ici');
add('Karte wird geladen …','Loading map …','Caricamento mappa …','Cargando mapa …','Chargement de la carte …');
add('Was bedeuten die Symbole?','What do the symbols mean?','Cosa significano i simboli?','¿Qué significan los símbolos?','Que signifient les symboles ?');
add('Grün: geöffnet. Grau: geschlossen. Gelb: Öffnungszeiten unbekannt. Maßgeblich sind die hinterlegten Ortsdaten.','Green: open. Gray: closed. Yellow: opening hours unknown. The stored place data is authoritative.','Verde: aperto. Grigio: chiuso. Giallo: orari sconosciuti. Fanno fede i dati del luogo disponibili.','Verde: abierto. Gris: cerrado. Amarillo: horario desconocido. Prevalecen los datos disponibles del lugar.','Vert : ouvert. Gris : fermé. Jaune : horaires inconnus. Les données du lieu disponibles font foi.');
add('Meine Rezensionsentwürfe','My review drafts','Le mie bozze di recensione','Mis borradores de reseña','Mes brouillons d’avis');
add('Pizza im Umkreis','Pizza nearby','Pizza nei dintorni','Pizza cercanas','Pizzas à proximité');
add('♡ Gemerkt','♡ Saved','♡ Salvati','♡ Guardados','♡ Enregistrés');
add('Alle Orte','All places','Tutti i luoghi','Todos los lugares','Tous les lieux');
add('Karte','Map','Mappa','Mapa','Carte');
add('Fotobewertung','Photo analysis','Analisi foto','Análisis de foto','Analyse photo');
add('Einstellungen','Settings','Impostazioni','Ajustes','Paramètres');
add('Schließen','Close','Chiudi','Cerrar','Fermer');
add('GPS Standort verwenden','Use GPS location','Usa posizione GPS','Usar ubicación GPS','Utiliser la position GPS');
add('Karte im Vollbild öffnen','Open map fullscreen','Apri mappa a schermo intero','Abrir mapa a pantalla completa','Ouvrir la carte en plein écran');
add('Vollbild verlassen','Exit fullscreen','Esci da schermo intero','Salir de pantalla completa','Quitter le plein écran');
add('Restaurantsuche öffnen','Open restaurant search','Apri ricerca ristoranti','Abrir búsqueda de restaurantes','Ouvrir la recherche de restaurants');
add('Kartenfilter öffnen','Open map filters','Apri filtri mappa','Abrir filtros del mapa','Ouvrir les filtres de carte');
add('Restaurant oder Pizza-Ort suchen','Search restaurant or pizza place','Cerca ristorante o locale pizza','Buscar restaurante o lugar de pizza','Rechercher un restaurant ou une pizzeria');

add('DEIN FOTO. EIN GENAUERER BLICK.','YOUR PHOTO. A CLOSER LOOK.','LA TUA FOTO. UNO SGUARDO PIÙ ATTENTO.','TU FOTO. UNA MIRADA MÁS DE CERCA.','VOTRE PHOTO. UN REGARD PLUS PRÉCIS.');
add('Wie sieht deine Pizza aus?','What does your pizza look like?','Com’è la tua pizza?','¿Cómo se ve tu pizza?','À quoi ressemble votre pizza ?');
add('25 Fotokriterien, 100 simulierte Perspektiven. Deine eigene Meinung zählt separat.','25 photo criteria, 100 simulated perspectives. Your own opinion stays separate.','25 criteri fotografici, 100 prospettive simulate. La tua opinione resta separata.','25 criterios fotográficos, 100 perspectivas simuladas. Tu opinión se mantiene separada.','25 critères photo, 100 perspectives simulées. Votre propre avis reste séparé.');
add('Pizza fotografieren','Photograph pizza','Fotografa la pizza','Fotografiar pizza','Photographier la pizza');
add('Kamera öffnen oder Foto auswählen','Open camera or choose photo','Apri la fotocamera o scegli una foto','Abrir cámara o elegir foto','Ouvrir l’appareil photo ou choisir une photo');
add('LOKALE KI','LOCAL AI','IA LOCALE','IA LOCAL','IA LOCALE');
add('Wechseln ↗','Change ↗','Cambia ↗','Cambiar ↗','Changer ↗');
add('Offline-Modell: Download, Datenschutz & Disclaimer ↗','Offline model: download, privacy & disclaimer ↗','Modello offline: download, privacy e disclaimer ↗','Modelo offline: descarga, privacidad y descargo ↗','Modèle hors ligne : téléchargement, confidentialité et avertissement ↗');
add('Foto lokal analysieren','Analyze photo locally','Analizza foto in locale','Analizar foto localmente','Analyser la photo localement');
add('Modell wird geladen …','Loading model …','Caricamento modello …','Cargando modelo …','Chargement du modèle …');
add('Abbrechen','Cancel','Annulla','Cancelar','Annuler');
add('Deine Fotoanalysen','Your photo analyses','Le tue analisi foto','Tus análisis de foto','Vos analyses photo');
add('Dein ausgewähltes Pizzafoto','Your selected pizza photo','La foto della pizza selezionata','Tu foto de pizza seleccionada','Votre photo de pizza sélectionnée');

add('WILLKOMMEN BEI PIZZASCAN','WELCOME TO PIZZASCAN','BENVENUTO SU PIZZASCAN','BIENVENIDO A PIZZASCAN','BIENVENUE SUR PIZZASCAN');
add('Finden. Fotografieren.\nPizza verstehen.','Find. Photograph.\nUnderstand pizza.','Trova. Fotografa.\nCapisci la pizza.','Encuentra. Fotografía.\nEntiende la pizza.','Trouvez. Photographiez.\nComprenez la pizza.');
add('Karte mit GPS und Fotoanalyse direkt auf deinem Gerät. Drei kostenlose KI-Modelle, kein API-Schlüssel.','GPS map and photo analysis directly on your device. Three free AI models, no API key.','Mappa GPS e analisi foto direttamente sul dispositivo. Tre modelli IA gratuiti, nessuna chiave API.','Mapa GPS y análisis de fotos directamente en tu dispositivo. Tres modelos de IA gratuitos, sin clave API.','Carte GPS et analyse photo directement sur votre appareil. Trois modèles d’IA gratuits, sans clé API.');
add('Warum ein Offline-Modell? Erklärung & Disclaimer ↗','Why an offline model? Explanation & disclaimer ↗','Perché un modello offline? Spiegazione e disclaimer ↗','¿Por qué un modelo offline? Explicación y descargo ↗','Pourquoi un modèle hors ligne ? Explication et avertissement ↗');
add('Mit meinem Standort starten','Start with my location','Inizia con la mia posizione','Empezar con mi ubicación','Commencer avec ma position');
add('Ohne Standort starten','Start without location','Inizia senza posizione','Empezar sin ubicación','Commencer sans position');
add('Datenschutzerklärung','Privacy policy','Informativa sulla privacy','Política de privacidad','Politique de confidentialité');

// Common map/details/actions.
add('Details','Details','Dettagli','Detalles','Détails');
add('Details ↗','Details ↗','Dettagli ↗','Detalles ↗','Détails ↗');
add('Rezension','Review','Recensione','Reseña','Avis');
add('Route','Route','Percorso','Ruta','Itinéraire');
add('Route starten ↗','Start route ↗','Avvia percorso ↗','Iniciar ruta ↗','Démarrer l’itinéraire ↗');
add('Pizza bewerten','Rate pizza','Valuta pizza','Valorar pizza','Évaluer la pizza');
add('✍️ Rezension aus meinem Besuch erstellen','✍️ Create review from my visit','✍️ Crea recensione dalla mia visita','✍️ Crear reseña de mi visita','✍️ Créer un avis à partir de ma visite');
add('♡ Merken','♡ Save','♡ Salva','♡ Guardar','♡ Enregistrer');
add('♥ Gemerkt','♥ Saved','♥ Salvato','♥ Guardado','♥ Enregistré');
add('Foto zuordnen','Assign photo','Associa foto','Asignar foto','Associer la photo');
add('Details aktualisieren','Refresh details','Aggiorna dettagli','Actualizar detalles','Actualiser les détails');
add('Öffnungszeiten','Opening hours','Orari di apertura','Horario','Horaires');
add('Angebot & Ausstattung','Offer & amenities','Offerta e servizi','Oferta y servicios','Offre et équipements');
add('Quelle & Position','Source & location','Fonte e posizione','Fuente y ubicación','Source et position');
add('Keine weiteren Angaben hinterlegt.','No further information available.','Nessun’altra informazione disponibile.','No hay más información disponible.','Aucune autre information disponible.');
add('☎ Anrufen','☎ Call','☎ Chiama','☎ Llamar','☎ Appeler');
add('🌐 Website','🌐 Website','🌐 Sito web','🌐 Sitio web','🌐 Site web');
add('📋 Speisekarte','📋 Menu','📋 Menu','📋 Menú','📋 Menu');
add('Google Maps ↗','Google Maps ↗','Google Maps ↗','Google Maps ↗','Google Maps ↗');
add('Adresse wird in den Details ergänzt','Address will be completed in details','L’indirizzo verrà completato nei dettagli','La dirección se completará en los detalles','L’adresse sera complétée dans les détails');
add('Pizza-Ort','Pizza place','Locale pizza','Lugar de pizza','Lieu de pizza');
add('Pizzeria / Restaurant','Pizzeria / Restaurant','Pizzeria / Ristorante','Pizzería / Restaurante','Pizzeria / Restaurant');
add('Imbiss / Schnellrestaurant','Fast food / quick-service restaurant','Fast food / ristorazione veloce','Comida rápida / restaurante rápido','Restauration rapide');
add('Foodtruck','Food truck','Food truck','Food truck','Food truck');
add('Pizzaautomat','Pizza vending machine','Distributore automatico di pizza','Máquina expendedora de pizza','Distributeur automatique de pizza');
add('Weitere Pizza-Orte','Other pizza places','Altri locali pizza','Otros lugares de pizza','Autres lieux de pizza');
add('Café','Café','Caffè','Café','Café');
add('geöffnet','open','aperto','abierto','ouvert');
add('geschlossen','closed','chiuso','cerrado','fermé');
add('Unbekannt','Unknown','Sconosciuto','Desconocido','Inconnu');
add('Ja','Yes','Sì','Sí','Oui');
add('Nein','No','No','No','Non');

// Settings/local AI.
add('SPRACHE','LANGUAGE','LINGUA','IDIOMA','LANGUE');
add('App-Sprache','App language','Lingua dell’app','Idioma de la app','Langue de l’application');
add('Automatisch wurde die Gerätesprache verwendet. Du kannst sie hier jederzeit ändern.','The device language was selected automatically. You can change it here at any time.','La lingua del dispositivo è stata selezionata automaticamente. Puoi cambiarla qui in qualsiasi momento.','Se seleccionó automáticamente el idioma del dispositivo. Puedes cambiarlo aquí en cualquier momento.','La langue de l’appareil a été sélectionnée automatiquement. Vous pouvez la modifier ici à tout moment.');
add('Dunkler Modus','Dark mode','Modalità scura','Modo oscuro','Mode sombre');
add('Foto-KI','Photo AI','IA foto','IA de foto','IA photo');
add('Heruntergeladene Modelle entfernen','Remove downloaded models','Rimuovi modelli scaricati','Eliminar modelos descargados','Supprimer les modèles téléchargés');
add('Modell einsatzbereit. Das Foto kann jetzt offline analysiert werden.','Model ready. The photo can now be analyzed offline.','Modello pronto. Ora la foto può essere analizzata offline.','Modelo listo. Ahora la foto puede analizarse sin conexión.','Modèle prêt. La photo peut maintenant être analysée hors ligne.');
add('Vorgang abgebrochen. Vollständig geladene Modelldateien bleiben gespeichert.','Process cancelled. Fully downloaded model files remain stored.','Operazione annullata. I file del modello completamente scaricati restano memorizzati.','Proceso cancelado. Los archivos de modelo descargados por completo permanecen guardados.','Opération annulée. Les fichiers de modèle entièrement téléchargés restent enregistrés.');
add('Deine KI bleibt bei dir.','Your AI stays with you.','La tua IA resta con te.','Tu IA se queda contigo.','Votre IA reste avec vous.');
add('OFFLINE-KI · ERKLÄRUNG & DISCLAIMER','OFFLINE AI · EXPLANATION & DISCLAIMER','IA OFFLINE · SPIEGAZIONE E DISCLAIMER','IA OFFLINE · EXPLICACIÓN Y DESCARGO','IA HORS LIGNE · EXPLICATION ET AVERTISSEMENT');
add('VOR DEM MODELL-DOWNLOAD','BEFORE MODEL DOWNLOAD','PRIMA DEL DOWNLOAD DEL MODELLO','ANTES DE DESCARGAR EL MODELO','AVANT LE TÉLÉCHARGEMENT DU MODÈLE');
add('Offline-KI vorbereiten','Prepare offline AI','Prepara IA offline','Preparar IA offline','Préparer l’IA hors ligne');
add('Bestätigen & starten','Confirm & start','Conferma e avvia','Confirmar e iniciar','Confirmer et démarrer');
add('Später · ohne Download zurück','Later · return without download','Più tardi · torna senza download','Más tarde · volver sin descargar','Plus tard · revenir sans téléchargement');
add('AUSGEWÄHLTES OFFLINE-MODELL','SELECTED OFFLINE MODEL','MODELLO OFFLINE SELEZIONATO','MODELO OFFLINE SELECCIONADO','MODÈLE HORS LIGNE SÉLECTIONNÉ');
add('zusätzlicher Download','additional download','download aggiuntivo','descarga adicional','téléchargement supplémentaire');
add('Auf deinem Gerät','On your device','Sul tuo dispositivo','En tu dispositivo','Sur votre appareil');
add('Fotoanalyse ohne KI-API-Schlüssel','Photo analysis without AI API key','Analisi foto senza chiave API IA','Análisis de foto sin clave API de IA','Analyse photo sans clé API IA');
add('Warum wird ein Modell geladen?','Why is a model downloaded?','Perché viene scaricato un modello?','¿Por qué se descarga un modelo?','Pourquoi un modèle est-il téléchargé ?');
add('Download, Speicher und Kosten','Download, storage and costs','Download, memoria e costi','Descarga, almacenamiento y costes','Téléchargement, stockage et coûts');
add('Was funktioniert anschließend offline?','What works offline afterwards?','Cosa funziona offline dopo?','¿Qué funciona sin conexión después?','Qu’est-ce qui fonctionne ensuite hors ligne ?');
add('Datenschutz und Grenzen im Detail','Privacy and limitations in detail','Privacy e limiti nel dettaglio','Privacidad y límites en detalle','Confidentialité et limites en détail');
add('Modellname und Herkunft','Model name and origin','Nome e origine del modello','Nombre y origen del modelo','Nom et origine du modèle');
add('Verstanden','Got it','Capito','Entendido','Compris');

// Photo report.
add('DEINE FOTOBEWERTUNG','YOUR PHOTO ANALYSIS','LA TUA ANALISI FOTO','TU ANÁLISIS DE FOTO','VOTRE ANALYSE PHOTO');
add('Deine Pizza','Your pizza','La tua pizza','Tu pizza','Votre pizza');
add('Deine Pizza im Detail','Your pizza in detail','La tua pizza nel dettaglio','Tu pizza en detalle','Votre pizza en détail');
add('KI-Fotoindex / 10','AI photo index / 10','Indice foto IA / 10','Índice foto IA / 10','Indice photo IA / 10');
add('25 Kriterien','25 criteria','25 criteri','25 criterios','25 critères');
add('100 simulierte Profile','100 simulated profiles','100 profili simulati','100 perfiles simulados','100 profils simulés');
add('100 Perspektiven','100 perspectives','100 prospettive','100 perspectivas','100 perspectives');
add('So entsteht die Bewertung','How the score is created','Come viene calcolata la valutazione','Cómo se crea la puntuación','Comment la note est calculée');
add('Pizzeria zuordnen','Assign pizzeria','Associa pizzeria','Asignar pizzería','Associer une pizzeria');
add('Ohne Ortszuordnung','Without place assignment','Senza luogo associato','Sin lugar asignado','Sans lieu associé');
add('Deine persönliche Bewertung','Your personal rating','La tua valutazione personale','Tu valoración personal','Votre note personnelle');
add('Was hast du selbst erlebt?','What did you personally experience?','Cosa hai vissuto personalmente?','¿Qué experimentaste personalmente?','Qu’avez-vous personnellement vécu ?');
add('Eigene Bewertung speichern','Save personal rating','Salva valutazione personale','Guardar valoración personal','Enregistrer la note personnelle');
add('JSON exportieren','Export JSON','Esporta JSON','Exportar JSON','Exporter JSON');
add('Lokal löschen','Delete locally','Elimina in locale','Eliminar localmente','Supprimer localement');
add('Bewertungsprofil auswählen','Select rating profile','Seleziona profilo di valutazione','Seleccionar perfil de valoración','Sélectionner un profil d’évaluation');
add('Rand','Crust rim','Cornicione','Borde','Bord');
add('Backbild','Bake appearance','Cottura','Horneado','Cuisson');
add('Belag','Toppings','Condimento','Ingredientes','Garniture');
add('Komposition','Composition','Composizione','Composición','Composition');
add('Foto','Photo','Foto','Foto','Photo');
add('deutlich','clear','chiaro','claro','net');
add('moderat','moderate','moderato','moderado','modéré');
add('uneindeutig','ambiguous','ambiguo','ambiguo','ambigu');

// 25 visible photo criteria.
add('Randbräunung','Rim browning','Doratura del cornicione','Dorado del borde','Brunissement du bord');
add('Randform','Rim shape','Forma del cornicione','Forma del borde','Forme du bord');
add('Randvolumen','Rim volume','Volume del cornicione','Volumen del borde','Volume du bord');
add('Randblasen','Rim bubbles','Bolle del cornicione','Burbujas del borde','Bulles du bord');
add('Randintegrität','Rim integrity','Integrità del cornicione','Integridad del borde','Intégrité du bord');
add('Oberflächenbräunung','Surface browning','Doratura della superficie','Dorado de la superficie','Brunissement de la surface');
add('Verkohlungsverteilung','Char distribution','Distribuzione delle bruciature','Distribución del tostado','Répartition des zones grillées');
add('Backgleichmäßigkeit','Bake evenness','Uniformità di cottura','Uniformidad del horneado','Uniformité de cuisson');
add('Oberflächenstruktur','Surface texture','Struttura della superficie','Textura de la superficie','Texture de surface');
add('Rand-Mitte-Kontrast','Rim-center contrast','Contrasto cornicione-centro','Contraste borde-centro','Contraste bord-centre');
add('Käseschmelze','Cheese melt','Fusione del formaggio','Fundido del queso','Fonte du fromage');
add('Käseverteilung','Cheese distribution','Distribuzione del formaggio','Distribución del queso','Répartition du fromage');
add('Saucenverteilung','Sauce distribution','Distribuzione della salsa','Distribución de la salsa','Répartition de la sauce');
add('Belagverteilung','Topping distribution','Distribuzione del condimento','Distribución de ingredientes','Répartition de la garniture');
add('Belagabgrenzung','Topping definition','Definizione degli ingredienti','Definición de ingredientes','Définition de la garniture');
add('Farbvielfalt','Color variety','Varietà cromatica','Variedad de color','Variété des couleurs');
add('Formbalance','Shape balance','Equilibrio della forma','Equilibrio de la forma','Équilibre de la forme');
add('Proportion Rand/Mitte','Rim/center proportion','Proporzione cornicione/centro','Proporción borde/centro','Proportion bord/centre');
add('Visuelle Ordnung','Visual order','Ordine visivo','Orden visual','Ordre visuel');
add('Gesamteindruck','Overall impression','Impressione generale','Impresión general','Impression générale');
add('Bildschärfe','Image sharpness','Nitidezza','Nitidez','Netteté');
add('Belichtung','Exposure','Esposizione','Exposición','Exposition');
add('Bildausschnitt','Framing','Inquadratura','Encuadre','Cadrage');
add('Sicht auf Belag','Topping visibility','Visibilità del condimento','Visibilidad de ingredientes','Visibilité de la garniture');
add('Farbwiedergabe','Color rendering','Resa cromatica','Reproducción del color','Rendu des couleurs');

// Venue feature labels.
add('Küche','Cuisine','Cucina','Cocina','Cuisine');
add('Lieferung','Delivery','Consegna','Entrega','Livraison');
add('Mitnehmen','Takeaway','Asporto','Para llevar','À emporter');
add('Vor Ort essen','Dine in','Consumazione sul posto','Comer en el local','Sur place');
add('Außenplätze','Outdoor seating','Posti all’aperto','Terraza','Places extérieures');
add('Rollstuhl','Wheelchair access','Accesso sedia a rotelle','Acceso en silla de ruedas','Accès fauteuil roulant');
add('Vegetarisch','Vegetarian','Vegetariano','Vegetariano','Végétarien');
add('Vegan','Vegan','Vegano','Vegano','Végane');
add('Glutenfrei','Gluten-free','Senza glutine','Sin gluten','Sans gluten');
add('Sitzplätze','Seating','Posti a sedere','Asientos','Places assises');
add('Marke','Brand','Marca','Marca','Marque');
add('Betreiber','Operator','Gestore','Operador','Exploitant');
add('Reservierung','Reservation','Prenotazione','Reserva','Réservation');
add('Bezahlung','Payment','Pagamento','Pago','Paiement');
add('Bargeld','Cash','Contanti','Efectivo','Espèces');
add('Kreditkarte','Credit card','Carta di credito','Tarjeta de crédito','Carte de crédit');
add('Debitkarte','Debit card','Carta di debito','Tarjeta de débito','Carte de débit');
add('Kontaktlos','Contactless','Contactless','Sin contacto','Sans contact');

// Review builder UI and generated phrases.
add('Vor Ort','Dine in','Sul posto','En el local','Sur place');
add('Abholung','Takeaway','Asporto','Recogida','À emporter');
add('Geschmack','Taste','Gusto','Sabor','Goût');
add('Pizzateig','Pizza dough','Impasto','Masa de pizza','Pâte à pizza');
add('Temperatur','Temperature','Temperatura','Temperatura','Température');
add('Service','Service','Servizio','Servicio','Service');
add('Wartezeit','Waiting time','Tempo di attesa','Tiempo de espera','Temps d’attente');
add('Preis-Leistung','Value for money','Rapporto qualità-prezzo','Relación calidad-precio','Rapport qualité-prix');
add('Ambiente','Atmosphere','Ambiente','Ambiente','Ambiance');
add('Lautstärke','Noise level','Rumorosità','Nivel de ruido','Niveau sonore');
add('Sauberkeit vor Ort','Cleanliness','Pulizia sul posto','Limpieza del local','Propreté sur place');
add('Speisenauswahl','Menu selection','Scelta dei piatti','Variedad de platos','Choix des plats');
add('Zugang','Access','Accesso','Acceso','Accès');
add('Verpackung','Packaging','Imballaggio','Embalaje','Emballage');
add('Sehr lecker','Very tasty','Molto buono','Muy rico','Très bon');
add('In Ordnung','Okay','Nella norma','Correcto','Correct');
add('Nicht mein Geschmack','Not my taste','Non fa per me','No es de mi gusto','Pas à mon goût');
add('Luftig','Airy','Soffice e arioso','Aireada','Aérée');
add('Knusprig','Crispy','Croccante','Crujiente','Croustillante');
add('Zu weich','Too soft','Troppo morbido','Demasiado blanda','Trop molle');
add('Zu trocken','Too dry','Troppo secco','Demasiado seca','Trop sèche');
add('Gut abgestimmt','Well balanced','Ben equilibrato','Bien equilibrado','Bien équilibré');
add('Großzügig','Generous','Abbondante','Generoso','Généreux');
add('Zu wenig','Too little','Troppo poco','Muy poco','Trop peu');
add('Angenehm heiß','Nicely hot','Ben caldo','Bien caliente','Bien chaud');
add('Lauwarm','Lukewarm','Tiepido','Tibio','Tiède');
add('Zu kalt','Too cold','Troppo freddo','Demasiado frío','Trop froid');
add('Sehr freundlich','Very friendly','Molto cordiale','Muy amable','Très aimable');
add('Aufmerksam','Attentive','Attento','Atento','Attentionné');
add('Unaufmerksam','Inattentive','Poco attento','Poco atento','Peu attentionné');
add('Kurz','Short','Breve','Corta','Court');
add('Angemessen','Reasonable','Adeguato','Razonable','Raisonnable');
add('Zu lang','Too long','Troppo lungo','Demasiado largo','Trop long');
add('Sehr gut','Very good','Molto buono','Muy buena','Très bon');
add('Fair','Fair','Corretto','Justo','Correct');
add('Zu teuer','Too expensive','Troppo caro','Demasiado caro','Trop cher');
add('Gemütlich','Cozy','Accogliente','Acogedor','Convivial');
add('Schön gestaltet','Nicely designed','Ben arredato','Bonito diseño','Bien aménagé');
add('Schlicht','Simple','Semplice','Sencillo','Simple');
add('Ungemütlich','Uncomfortable','Poco accogliente','Incómodo','Peu agréable');
add('Ruhig','Quiet','Tranquillo','Tranquilo','Calme');
add('Lebhaft','Lively','Vivace','Animado','Animé');
add('Zu laut','Too loud','Troppo rumoroso','Demasiado ruidoso','Trop bruyant');
add('Sauberer Eindruck','Clean impression','Impressione pulita','Impresión limpia','Impression de propreté');
add('Vegetarische Auswahl','Vegetarian options','Scelta vegetariana','Opciones vegetarianas','Choix végétarien');
add('Vegane Auswahl','Vegan options','Scelta vegana','Opciones veganas','Choix végane');
add('Stufenloser Eingang','Step-free entrance','Ingresso senza gradini','Entrada sin escalones','Entrée sans marche');
add('Pünktlich','On time','Puntuale','A tiempo','À l’heure');
add('Verspätet','Late','In ritardo','Con retraso','En retard');
add('Gut verpackt','Well packed','Ben confezionato','Bien empaquetado','Bien emballé');
add('Viel Verpackung','Too much packaging','Molto imballaggio','Mucho embalaje','Beaucoup d’emballage');
add('Beschädigt','Damaged','Danneggiato','Dañado','Endommagé');

for(const row of root.PizzaI18nExtra||[])add(...row);
const exact=new Map(rows.map(([de,t])=>[de,t]));
const attrs=['aria-label','placeholder','title','alt'];
const skip='script,style,textarea,code,[translate=\"no\"],[data-i18n-ignore]';
function tr(s){if(lang==='de'||!s)return s;const direct=exact.get(s);if(direct?.[lang])return direct[lang];
 let out=s;
 const patterns={
  en:[[/^(\d+) von (\d+) Orten$/,'$1 of $2 places'],[/^(\d+) Pizza-Orte$/,'$1 pizza places'],[/^Pizza im Umkreis · (.+)$/,'Pizza nearby · $1'],[/^Aktualisiert (.+)$/,'Updated $1'],[/^(.+) · ca\. (\d+) MB zusätzlicher Erstdownload nach Bestätigung\. Danach Fotoanalyse offline, solange die Modelldateien gespeichert bleiben\.$/,'$1 · approx. $2 MB additional first download after confirmation. Afterwards photo analysis works offline while the model files remain stored.'],[/^Fotoanalyse auf deinem Gerät · (\d+) \/ 25 Kriterien$/,'Photo analysis on your device · $1 / 25 criteria'],[/^(.+) · Datei (\d+) \/ (\d+) MB$/,'$1 · file $2 / $3 MB'],[/^Bestätigen & starten · ca\. (\d+) MB$/,'Confirm & start · approx. $1 MB']],
  it:[[/^(\d+) von (\d+) Orten$/,'$1 di $2 luoghi'],[/^(\d+) Pizza-Orte$/,'$1 locali pizza'],[/^Pizza im Umkreis · (.+)$/,'Pizza nei dintorni · $1'],[/^Aktualisiert (.+)$/,'Aggiornato $1'],[/^(.+) · ca\. (\d+) MB zusätzlicher Erstdownload nach Bestätigung\. Danach Fotoanalyse offline, solange die Modelldateien gespeichert bleiben\.$/,'$1 · circa $2 MB di download iniziale aggiuntivo dopo la conferma. Poi l’analisi foto funziona offline finché i file del modello restano memorizzati.'],[/^Fotoanalyse auf deinem Gerät · (\d+) \/ 25 Kriterien$/,'Analisi foto sul dispositivo · $1 / 25 criteri'],[/^(.+) · Datei (\d+) \/ (\d+) MB$/,'$1 · file $2 / $3 MB'],[/^Bestätigen & starten · ca\. (\d+) MB$/,'Conferma e avvia · circa $1 MB']],
  es:[[/^(\d+) von (\d+) Orten$/,'$1 de $2 lugares'],[/^(\d+) Pizza-Orte$/,'$1 lugares de pizza'],[/^Pizza im Umkreis · (.+)$/,'Pizza cercanas · $1'],[/^Aktualisiert (.+)$/,'Actualizado $1'],[/^(.+) · ca\. (\d+) MB zusätzlicher Erstdownload nach Bestätigung\. Danach Fotoanalyse offline, solange die Modelldateien gespeichert bleiben\.$/,'$1 · aprox. $2 MB de descarga inicial adicional tras confirmar. Después, el análisis funciona sin conexión mientras los archivos del modelo sigan guardados.'],[/^Fotoanalyse auf deinem Gerät · (\d+) \/ 25 Kriterien$/,'Análisis de foto en tu dispositivo · $1 / 25 criterios'],[/^(.+) · Datei (\d+) \/ (\d+) MB$/,'$1 · archivo $2 / $3 MB'],[/^Bestätigen & starten · ca\. (\d+) MB$/,'Confirmar e iniciar · aprox. $1 MB']],
  fr:[[/^(\d+) von (\d+) Orten$/,'$1 sur $2 lieux'],[/^(\d+) Pizza-Orte$/,'$1 lieux de pizza'],[/^Pizza im Umkreis · (.+)$/,'Pizzas à proximité · $1'],[/^Aktualisiert (.+)$/,'Actualisé $1'],[/^(.+) · ca\. (\d+) MB zusätzlicher Erstdownload nach Bestätigung\. Danach Fotoanalyse offline, solange die Modelldateien gespeichert bleiben\.$/,'$1 · env. $2 Mo de téléchargement initial supplémentaire après confirmation. Ensuite, l’analyse photo fonctionne hors ligne tant que les fichiers du modèle restent enregistrés.'],[/^Fotoanalyse auf deinem Gerät · (\d+) \/ 25 Kriterien$/,'Analyse photo sur votre appareil · $1 / 25 critères'],[/^(.+) · Datei (\d+) \/ (\d+) MB$/,'$1 · fichier $2 / $3 Mo'],[/^Bestätigen & starten · ca\. (\d+) MB$/,'Confirmer et démarrer · env. $1 Mo']]
 };
 for(const [re,repl] of patterns[lang]||[])if(re.test(out))return out.replace(re,repl);
 for(const [pattern,...copies] of root.PizzaI18nPatterns||[]){const re=new RegExp(pattern);if(re.test(out))return out.replace(re,copies[supported.indexOf(lang)-1]);}
 const focus=s.match(/^Schwerpunkt (.+)$/);if(focus)return ({en:'Focus ',it:'Focus ',es:'Enfoque ',fr:'Accent '}[lang])+tr(focus[1]);
 if(s.includes(' · '))return s.split(' · ').map(tr).join(' · ');
 const prefix=s.match(/^([^\p{L}\p{N}]+)([\p{L}][\s\S]*)$/u);if(prefix)return prefix[1]+tr(prefix[2]);
 return out;
}
function translateTextNode(node){if(node.parentElement?.closest(skip))return;const raw=node.nodeValue;if(!raw||!raw.trim())return;const lead=raw.match(/^\s*/)[0],tail=raw.match(/\s*$/)[0],body=raw.slice(lead.length,raw.length-tail.length);const next=tr(body);if(next!==body)node.nodeValue=lead+next+tail;}
function translateElement(el){if(!(el instanceof Element)||el.closest(skip))return;for(const a of attrs){const v=el.getAttribute(a);if(v){const n=tr(v);if(n!==v)el.setAttribute(a,n);}}for(const n of el.childNodes)if(n.nodeType===Node.TEXT_NODE)translateTextNode(n);}
function translateTree(rootNode=document.body){if(lang==='de')return;translateElement(rootNode);const walker=document.createTreeWalker(rootNode,NodeFilter.SHOW_ELEMENT|NodeFilter.SHOW_TEXT);let n;while((n=walker.nextNode())){if(n.nodeType===Node.TEXT_NODE)translateTextNode(n);else translateElement(n);}}

function languageControl(){if(document.getElementById('pizzascan-language-control'))return;const body=document.getElementById('sheet-body');if(!body)return;const block=document.createElement('section');block.id='pizzascan-language-control';block.className='language-control';block.innerHTML=`<p class="eyebrow">SPRACHE</p><div class="field"><label for="pizzascan-language-select">App-Sprache</label><select id="pizzascan-language-select">${supported.map(code=>`<option value="${code}" ${code===lang?'selected':''}>${names[code]}</option>`).join('')}</select></div><p class="hint">Automatisch wurde die Gerätesprache verwendet. Du kannst sie hier jederzeit ändern.</p><hr>`;body.prepend(block);const select=document.getElementById('pizzascan-language-select');select.onchange=()=>changeLanguage(select.value,select);translateTree(block);}
function changeLanguage(code,select){if(!supported.includes(code))return false;if(root.PizzaScan?.diagnostics?.().busy){if(select)select.value=lang;root.toast?.(tr('Bitte den laufenden Modellvorgang zuerst beenden'));return false;}localStorage.setItem(KEY,code);location.reload();return true;}
function welcomeLanguage(){const welcome=document.getElementById('welcome');if(!welcome||document.getElementById('welcome-language'))return;const label=document.createElement('label');label.className='welcome-language';label.innerHTML=`<span>Sprache / Language</span><select id="welcome-language" aria-label="Sprache / Language">${supported.map(code=>`<option value="${code}" ${code===lang?'selected':''}>${names[code]}</option>`).join('')}</select>`;welcome.prepend(label);label.querySelector('select').onchange=e=>changeLanguage(e.target.value,e.target);}
function hookSettings(){const button=document.getElementById('settings-open');if(button)button.addEventListener('click',()=>setTimeout(languageControl,0));const sheetBody=document.getElementById('sheet-body');if(sheetBody)new MutationObserver(()=>{setTimeout(()=>{try{if(typeof sheetKind!=='undefined'&&sheetKind==='settings')languageControl();}catch{}translateTree(sheetBody);},0);}).observe(sheetBody,{childList:true,subtree:true});}

function localizedReview(text){if(lang==='de'||!text)return text;const replacements={
 'Ich war vor Ort essen.':{en:'I ate at the restaurant.',it:'Ho mangiato sul posto.',es:'Comí en el restaurante.',fr:'J’ai mangé sur place.'},
 'Ich habe das Restaurant besucht.':{en:'I visited the restaurant.',it:'Ho visitato il ristorante.',es:'Visité el restaurante.',fr:'J’ai visité le restaurant.'},
 'Ich habe vor Ort gegessen.':{en:'I ate on site.',it:'Ho mangiato sul posto.',es:'Comí en el local.',fr:'J’ai mangé sur place.'},
 'Ich habe mein Essen abgeholt.':{en:'I picked up my food.',it:'Ho ritirato il mio ordine.',es:'Recogí mi comida.',fr:'J’ai récupéré ma commande.'},
 'Ich habe zum Mitnehmen bestellt.':{en:'I ordered takeaway.',it:'Ho ordinato da asporto.',es:'Pedí para llevar.',fr:'J’ai commandé à emporter.'},
 'Ich habe eine Lieferung bestellt.':{en:'I ordered delivery.',it:'Ho ordinato la consegna.',es:'Pedí a domicilio.',fr:'J’ai commandé une livraison.'},
 'Meine Bestellung wurde geliefert.':{en:'My order was delivered.',it:'Il mio ordine è stato consegnato.',es:'Mi pedido fue entregado.',fr:'Ma commande a été livrée.'},
 'Das Essen hat mir sehr gut geschmeckt.':{en:'I really enjoyed the food.',it:'Il cibo mi è piaciuto molto.',es:'La comida me gustó mucho.',fr:'J’ai beaucoup aimé le repas.'},
 'Geschmacklich fand ich das Essen in Ordnung.':{en:'I found the food okay in terms of taste.',it:'Ho trovato il gusto nella norma.',es:'El sabor me pareció correcto.',fr:'J’ai trouvé le goût correct.'},
 'Das Essen hat meinen Geschmack nicht getroffen.':{en:'The food was not to my taste.',it:'Il cibo non era di mio gusto.',es:'La comida no fue de mi gusto.',fr:'Le repas n’était pas à mon goût.'},
 'Der Pizzateig war schön luftig.':{en:'The pizza dough was nicely airy.',it:'L’impasto era piacevolmente soffice e arioso.',es:'La masa estaba agradablemente aireada.',fr:'La pâte était agréablement aérée.'},
 'Der Pizzateig war angenehm knusprig.':{en:'The pizza dough was pleasantly crispy.',it:'L’impasto era piacevolmente croccante.',es:'La masa estaba agradablemente crujiente.',fr:'La pâte était agréablement croustillante.'},
 'Der Belag war für mich gut abgestimmt.':{en:'The toppings felt well balanced to me.',it:'Ho trovato il condimento ben equilibrato.',es:'Los ingredientes me parecieron bien equilibrados.',fr:'J’ai trouvé la garniture bien équilibrée.'},
 'Die Pizza war großzügig belegt.':{en:'The pizza had generous toppings.',it:'La pizza era condita generosamente.',es:'La pizza llevaba ingredientes abundantes.',fr:'La pizza était généreusement garnie.'},
 'Das Essen war angenehm heiß.':{en:'The food was pleasantly hot.',it:'Il cibo era piacevolmente caldo.',es:'La comida estaba agradablemente caliente.',fr:'Le repas était agréablement chaud.'},
 'Ich wurde sehr freundlich bedient.':{en:'The service was very friendly.',it:'Il servizio è stato molto cordiale.',es:'El trato fue muy amable.',fr:'Le service était très aimable.'},
 'Der Service war aufmerksam.':{en:'The service was attentive.',it:'Il servizio è stato attento.',es:'El servicio fue atento.',fr:'Le service était attentionné.'},
 'Die Wartezeit war kurz.':{en:'The wait was short.',it:'L’attesa è stata breve.',es:'La espera fue corta.',fr:'L’attente a été courte.'},
 'Die Wartezeit fand ich angemessen.':{en:'I found the waiting time reasonable.',it:'Ho trovato adeguato il tempo di attesa.',es:'El tiempo de espera me pareció razonable.',fr:'J’ai trouvé le temps d’attente raisonnable.'},
 'Das Preis-Leistungs-Verhältnis fand ich sehr gut.':{en:'I found the value for money very good.',it:'Ho trovato molto buono il rapporto qualità-prezzo.',es:'La relación calidad-precio me pareció muy buena.',fr:'J’ai trouvé le rapport qualité-prix très bon.'},
 'Ich fand das Ambiente gemütlich.':{en:'I found the atmosphere cozy.',it:'Ho trovato l’ambiente accogliente.',es:'El ambiente me pareció acogedor.',fr:'J’ai trouvé l’ambiance conviviale.'},
 'Es war angenehm ruhig.':{en:'It was pleasantly quiet.',it:'L’ambiente era piacevolmente tranquillo.',es:'Estaba agradablemente tranquilo.',fr:'C’était agréablement calme.'},
 'Die Speisenauswahl fand ich vielseitig.':{en:'I found the menu varied.',it:'Ho trovato varia la scelta dei piatti.',es:'La variedad de platos me pareció amplia.',fr:'J’ai trouvé le choix des plats varié.'},
 'Die Lieferung kam zur angekündigten Zeit.':{en:'The delivery arrived at the announced time.',it:'La consegna è arrivata all’orario previsto.',es:'La entrega llegó a la hora anunciada.',fr:'La livraison est arrivée à l’heure annoncée.'},
 'Das Essen war gut verpackt.':{en:'The food was well packed.',it:'Il cibo era ben confezionato.',es:'La comida estaba bien empaquetada.',fr:'Le repas était bien emballé.'},
 'Ich würde wiederkommen.':{en:'I would come back.',it:'Tornerei volentieri.',es:'Volvería.',fr:'Je reviendrais.'},
 'Ich würde wieder hier bestellen.':{en:'I would order here again.',it:'Ordinerei di nuovo qui.',es:'Volvería a pedir aquí.',fr:'Je commanderais à nouveau ici.'}
 };
 let out=text;for(const [de,t] of Object.entries(replacements)){if(t[lang])out=out.split(de).join(t[lang]);}
 out=out.replace(/Meine persönliche Bewertung: ([0-9,.]+) von 10 Punkten\./g,{en:'My personal rating: $1 out of 10.',it:'La mia valutazione personale: $1 su 10.',es:'Mi valoración personal: $1 de 10.',fr:'Ma note personnelle : $1 sur 10.'}[lang]);
 out=out.replace(/Gesamtbewertung: ([0-9,.]+) von 10 Punkten\./g,{en:'Overall rating: $1 out of 10.',it:'Valutazione complessiva: $1 su 10.',es:'Valoración general: $1 de 10.',fr:'Note globale : $1 sur 10.'}[lang]);
 out=out.replace(/Bestellt habe ich: /g,{en:'I ordered: ',it:'Ho ordinato: ',es:'Pedí: ',fr:'J’ai commandé : '}[lang]);
 return out;
}
function hookReview(){if(root.PizzaReview?.generate&&!root.PizzaReview.__i18n){const original=root.PizzaReview.generate.bind(root.PizzaReview);root.PizzaReview.generate=input=>localizedReview(original(input));root.PizzaReview.__i18n=true;}}
function hookPhoton(){if(!root.PizzaPlaces?.Service||lang==='de'||root.PizzaPlaces.Service.prototype.__i18nPhoton)return;const proto=root.PizzaPlaces.Service.prototype,old=proto.photon;proto.photon=async function(q,center,{signal,force=false}={}){try{const text=root.PizzaPlaces.text,key=text(q)+'|'+center.lat.toFixed(3)+'|'+center.lng.toFixed(3)+'|'+lang,stored=this.cache.get(key)||this.read('pizzascan-search-'+key);if(!force&&stored&&Date.now()-stored.time<86400000)return stored.items;const run=async()=>{if(signal?.aborted)throw new DOMException('Aborted','AbortError');await new Promise(r=>setTimeout(r,Math.max(0,1100-(Date.now()-this.lastPhoton))));if(signal?.aborted)throw new DOMException('Aborted','AbortError');this.lastPhoton=Date.now();const u=new URL('https://photon.komoot.io/api/');u.search=new URLSearchParams({q,lat:String(center.lat),lon:String(center.lng),limit:'8',lang});const data=await this.json(u.href,{},signal,16000),items=root.PizzaPlaces.fromPhoton(data),entry={time:Date.now(),items};this.cache.set(key,entry);this.write('pizzascan-search-'+key,entry);return items;};const promise=this.photonQueue.then(run,run);this.photonQueue=promise.catch(()=>{});return promise;}catch(e){return old.call(this,q,center,{signal,force});}};proto.__i18nPhoton=true;}

function init(){if(root.PizzaScanNative&&typeof root.bridge==='function')root.bridge('setLanguage',{language:lang}).catch(console.error);const confirmOriginal=root.confirm.bind(root);root.confirm=message=>confirmOriginal(tr(String(message)));welcomeLanguage();hookReview();hookPhoton();hookSettings();translateTree(document.body);new MutationObserver(muts=>{for(const m of muts){if(m.type==='attributes')translateElement(m.target);if(m.type==='characterData')translateTextNode(m.target);for(const n of m.addedNodes){if(n.nodeType===Node.TEXT_NODE)translateTextNode(n);else if(n.nodeType===Node.ELEMENT_NODE)translateTree(n);}}}).observe(document.body,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:attrs});}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
root.PizzaI18n={get language(){return lang;},supported,names,translate:tr,setLanguage:changeLanguage};
})(globalThis);
