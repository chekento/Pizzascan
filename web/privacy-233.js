/* PizzaScan 2.3.3 privacy supplement: keep localized in-app privacy aligned with the shipped search fallback. */
(function(root){
'use strict';
const previous=root.showPrivacy;
if(typeof previous!=='function'||previous.__privacy233)return;
const text={
 en:{
  date:'Updated: 14 September 2026 · Version 2.3.3 · Android package cloud.kosch.pizzascan',
  title:'Nominatim fallback in version 2.3.3',
  body:'Photon remains the primary service for place/address search and online suggestions. Only after you explicitly submit a search, if Photon fails or returns no usable match, PizzaScan may use nominatim.openstreetmap.org as a fallback. Nominatim is not used for autocomplete or mere typing. PizzaScan sends the submitted search text, selected language and result-format parameters to this fallback, but does not add location coordinates or a search centre. The service still receives technically necessary connection data such as your public IP address. Fallback requests are throttled and successful results are cached for about 24 hours.'
 },
 it:{
  date:'Aggiornata: 14 settembre 2026 · Versione 2.3.3 · Pacchetto Android cloud.kosch.pizzascan',
  title:'Fallback Nominatim nella versione 2.3.3',
  body:'Photon resta il servizio principale per la ricerca di luoghi/indirizzi e per i suggerimenti online. Solo dopo l’invio esplicito di una ricerca, se Photon non risponde correttamente o non restituisce un risultato utilizzabile, PizzaScan può usare nominatim.openstreetmap.org come fallback. Nominatim non viene usato per il completamento automatico o durante la sola digitazione. PizzaScan invia al fallback il testo della ricerca, la lingua scelta e i parametri del formato dei risultati, ma non aggiunge coordinate di posizione né un centro di ricerca. Il servizio riceve comunque i dati tecnici necessari alla connessione, come l’indirizzo IP pubblico. Le richieste fallback sono limitate e i risultati riusciti vengono memorizzati per circa 24 ore.'
 },
 es:{
  date:'Actualizada: 14 de septiembre de 2026 · Versión 2.3.3 · Paquete Android cloud.kosch.pizzascan',
  title:'Fallback de Nominatim en la versión 2.3.3',
  body:'Photon sigue siendo el servicio principal para buscar lugares/direcciones y para las sugerencias en línea. Solo después de enviar expresamente una búsqueda, si Photon falla o no devuelve un resultado utilizable, PizzaScan puede usar nominatim.openstreetmap.org como alternativa. Nominatim no se usa para autocompletar ni por el mero hecho de escribir. PizzaScan envía al fallback el texto de búsqueda, el idioma elegido y parámetros del formato de resultados, pero no añade coordenadas de ubicación ni un centro de búsqueda. El servicio recibe igualmente datos técnicos necesarios para la conexión, como la dirección IP pública. Las solicitudes de fallback se limitan y los resultados correctos se guardan en caché durante unas 24 horas.'
 },
 fr:{
  date:'Mise à jour : 14 septembre 2026 · Version 2.3.3 · Package Android cloud.kosch.pizzascan',
  title:'Repli Nominatim dans la version 2.3.3',
  body:'Photon reste le service principal pour la recherche de lieux/adresses et les suggestions en ligne. Uniquement après l’envoi explicite d’une recherche, si Photon échoue ou ne renvoie aucun résultat exploitable, PizzaScan peut utiliser nominatim.openstreetmap.org comme solution de repli. Nominatim n’est pas utilisé pour l’autocomplétion ni pendant la simple saisie. PizzaScan transmet au service de repli le texte recherché, la langue choisie et les paramètres de format de résultat, mais n’ajoute pas de coordonnées de localisation ni de centre de recherche. Le service reçoit néanmoins les données techniques nécessaires à la connexion, comme l’adresse IP publique. Les requêtes de repli sont limitées et les résultats réussis sont mis en cache pendant environ 24 heures.'
 }
};
async function showPrivacy232(){
 await previous();
 const lang=root.PizzaI18n?.language||document.documentElement.lang||'de';
 if(lang==='de')return;
 const copy=text[lang];
 const body=document.getElementById('sheet-body');
 const article=body?.querySelector('.privacy-localized');
 if(!copy||!article||article.querySelector('[data-privacy-233]'))return;
 const hint=article.querySelector('.hint');
 if(hint)hint.textContent=copy.date;
 const section=document.createElement('section');
 section.dataset.privacy233='true';
 const heading=document.createElement('h2');heading.textContent=copy.title;
 const paragraph=document.createElement('p');paragraph.textContent=copy.body;
 section.append(heading,paragraph);
 const sections=article.querySelectorAll('section');
 const mapSection=sections[4];
 if(mapSection)mapSection.after(section);else article.append(section);
 const providers=document.createElement('p');providers.dataset.privacy233='providers';
 const label=document.createTextNode('Nominatim / OpenStreetMap Foundation: ');
 const link=document.createElement('a');link.href='https://operations.osmfoundation.org/policies/nominatim/';link.target='_blank';link.rel='noopener';link.textContent='Nominatim Usage Policy';
 providers.append(label,link);
 section.append(providers);
}
showPrivacy232.__privacy233=true;
root.showPrivacy=showPrivacy232;
root.GoogleReviewsUI?.patchPrivacy?.();
})(globalThis);
