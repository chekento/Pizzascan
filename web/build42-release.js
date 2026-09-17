/* PizzaScan Build 42 release metadata overlay. */
(function(root){
 'use strict';
 const R=root.PizzaReleaseInfo;if(!R?.RELEASE)return;
 Object.assign(R.RELEASE,{version:'2.3.7',build:42,apk:'https://raw.githubusercontent.com/chekento/Pizzascan/main/downloads/PizzaScan-2.3.7.apk'});
 const text={
  de:'Build 42 ersetzt die zu enge Pizza-/Italien-Filterpipeline durch progressive, breite OSM-Gastro-Discovery: alle benannten Restaurants, Fast-Food-Orte, Cafés, Foodtrucks, Takeaways, Food Courts, Bars, Pubs und Biergärten im aktiven Suchgebiet werden als Kandidaten geladen. Erste OSM-Treffer erscheinen sofort; weitere Spiegel ergänzen im Hintergrund. Pizza im Namen ist keine Voraussetzung.',
  en:'Build 42 replaces the overly narrow pizza/Italian filter pipeline with progressive broad OSM food-venue discovery: every named restaurant, fast-food venue, café, food truck, takeaway, food court, bar, pub and beer garden in the active search area is loaded as a candidate. First OSM results render immediately; additional mirrors merge in the background. Pizza in the name is not required.',
  it:'La build 42 usa una ricerca OSM progressiva e ampia: tutti i ristoranti, fast food, caffè, food truck, takeaway, food court, bar, pub e biergarten nominati nell’area attiva sono candidati. I primi risultati appaiono subito e le altre fonti OSM vengono unite in seguito.',
  es:'La build 42 usa descubrimiento OSM progresivo y amplio: todos los restaurantes, comida rápida, cafés, food trucks, takeaway, food courts, bares, pubs y biergarten con nombre del área activa se cargan como candidatos. Los primeros resultados aparecen de inmediato y otros espejos OSM se fusionan después.',
  fr:'La build 42 utilise une découverte OSM progressive et large : tous les restaurants, fast-foods, cafés, food trucks, plats à emporter, food courts, bars, pubs et biergartens nommés de la zone active sont chargés comme candidats. Les premiers résultats apparaissent immédiatement, puis les autres miroirs OSM sont fusionnés.'
 };
 for(const [lang,copy] of Object.entries(R.COPY||{})){copy.nextText=text[lang]||text.en;copy.historyText=(copy.historyText||'').replace('2.3.5','2.3.6');}
 try{R.syncVersion?.();R.decorate?.();}catch{}
})(typeof window!=='undefined'?window:globalThis);
