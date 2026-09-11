'use strict';
async function showPrivacy(){
 const response=await fetch('privacy.html');if(!response.ok)throw Error('Datenschutzerklärung konnte nicht geöffnet werden');
 const page=new DOMParser().parseFromString(await response.text(),'text/html');
 openSheet('privacy','DATENSCHUTZ',page.querySelector('main').innerHTML+'<button id="privacy-close" class="secondary full">Zurück zur App</button>');
 $('privacy-close').onclick=closeSheet;
}
