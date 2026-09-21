'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');

test('Build 57 renders first map/POI results without waiting for every provider',()=>{
 const map=fs.readFileSync('web/map-ui.js','utf8');
 const history=fs.readFileSync('web/place-history.js','utf8');
 assert.match(map,/onBatch:batch=>acceptBatch/);
 assert.match(history,/Promise\.any\(tasks\)/);
 assert.match(history,/onBatch\?\./);
 assert.match(history,/__pizzascanProgressive/);
});

test('Build 57 keeps the magnifying glass still and animates only the search button',()=>{
 const css=fs.readFileSync('web/hotfix-map.css','utf8');
 assert.match(css,/pizzascan-search-button/);
 assert.match(css,/#map-view\.map-searching #map-refresh/);
 assert.match(css,/#map-view\.map-searching #search-toggle,#map-view\.map-searching #fs-search\{animation:none/);
 assert.doesNotMatch(css,/search-rotate/);
});

test('Build 57 collection backup is visible and accepts large archives',()=>{
 const history=fs.readFileSync('web/place-history.js','utf8');
 assert.match(history,/Sammlung exportieren \/ importieren/);
 assert.match(history,/MAX_ARCHIVE_RECORDS=1000000/);
 assert.match(history,/MAX_ARCHIVE_BYTES=512\*1024\*1024/);
 const java=fs.readFileSync('app/src/main/java/cloud/kosch/pizzascan/MainActivity.java','utf8');
 assert.match(java,/pizzascan-export-/);
 assert.match(java,/new FileInputStream/);
 assert.doesNotMatch(java,/StringBuilder pendingExportChunks/);
});
