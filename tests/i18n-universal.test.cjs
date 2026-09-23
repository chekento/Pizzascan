const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const source=fs.readFileSync(path.join(__dirname,'../web/i18n-universal.js'),'utf8');
const page=fs.readFileSync(path.join(__dirname,'../docs/index.html'),'utf8');
const dashboard=fs.readFileSync(path.join(__dirname,'../docs/release-dashboard.html'),'utf8');
const releaseStatus=JSON.parse(fs.readFileSync(path.join(__dirname,'../docs/release-status.json'),'utf8'));

test('universal app localization exposes browser-detected locales and persistent language selection',()=>{
 for(const code of ['de','en','it','es','fr','pt','nl','pl','tr','ru','ja','zh','ko','ar'])assert.match(source,new RegExp(`['"]${code}['"]`),code);
 assert.match(source,/navigator\.languages/);
 assert.match(source,/pizzascan-language-v1/);
 assert.match(source,/MutationObserver/);
 assert.match(source,/documentElement\.dir/);
});

test('GitHub language page contains the same current APK, checksum, changelog and archive links',()=>{
 for(const value of ['2.3.23','Build 58','PizzaScan-2.3.23.apk','SHA256SUMS-2.3.23.txt','CHANGELOG.md','downloads/README.md'])assert.match(page,new RegExp(value.replace(/[.]/g,'\\.')),value);
 for(const code of ['pt','nl','pl','tr','ru','ja','zh','ko','ar'])assert.match(page,new RegExp(`['\\"]${code}['\\"]`),code);
});

test('release dashboard and status data stay on the published Build 58 release',()=>{
 assert.match(dashboard,/release-status\.json/);
 assert.match(dashboard,/2\.3\.23/);
 assert.deepEqual({version:releaseStatus.version,build:releaseStatus.build,completed:releaseStatus.completed,total:releaseStatus.total},{version:'2.3.23',build:58,completed:5,total:5});
 assert.equal(releaseStatus.apk,'https://raw.githubusercontent.com/chekento/Pizzascan/main/downloads/PizzaScan-2.3.23.apk');
});
