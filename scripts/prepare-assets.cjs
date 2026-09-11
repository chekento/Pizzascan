const fs=require('node:fs'),path=require('node:path'),esbuild=require('esbuild');
const root=path.resolve(__dirname,'..'),out=path.join(root,'web/vendor');fs.rmSync(out,{recursive:true,force:true});fs.mkdirSync(out,{recursive:true});
fs.cpSync(path.join(root,'node_modules/leaflet/dist'),path.join(out,'leaflet'),{recursive:true});
fs.copyFileSync(path.join(root,'node_modules/leaflet/LICENSE'),path.join(out,'leaflet/LICENSE'));
(async()=>{
 await esbuild.build({entryPoints:['src/ai-worker.js'],bundle:true,format:'esm',platform:'browser',outfile:'web/vendor/ai-worker.js',minify:true,define:{'process.env.NODE_ENV':'"production"'}});
 await esbuild.build({entryPoints:['src/hours.js'],bundle:true,format:'iife',globalName:'PizzaHours',platform:'browser',outfile:'web/vendor/hours.js',minify:true});
 const ort=path.dirname(path.dirname(require.resolve('onnxruntime-web')));fs.mkdirSync(path.join(out,'ort'),{recursive:true});
 for(const f of fs.readdirSync(path.join(ort,'dist')))if(/\.wasm$|\.mjs$/.test(f))fs.copyFileSync(path.join(ort,'dist',f),path.join(out,'ort',f));
 // Preserve actual license filenames, including SPDX LICENSES directories.
 for(const name of ['@huggingface/transformers','onnxruntime-web','onnxruntime-common','opening_hours','tz-lookup','i18next','suncalc']){const dir=path.join(root,'node_modules',name),target=path.join(out,'licenses',name.replaceAll('/','-'));fs.mkdirSync(target,{recursive:true});for(const file of fs.readdirSync(dir))if(/^(licen[sc]e|copying|notice)/i.test(file))fs.cpSync(path.join(dir,file),path.join(target,file),{recursive:true});}
 // Distribute the unmodified LGPL module, unminified code and its license texts.
 fs.cpSync(path.join(root,'node_modules/opening_hours'),path.join(out,'opening-hours-source'),{recursive:true});
 console.log('Local model runtime and map assets bundled.');
})().catch(e=>{console.error(e);process.exit(1)});
