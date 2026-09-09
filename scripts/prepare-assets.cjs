const fs=require('node:fs'),path=require('node:path'),esbuild=require('esbuild');
const root=path.resolve(__dirname,'..'),out=path.join(root,'web/vendor');fs.mkdirSync(out,{recursive:true});
fs.cpSync(path.join(root,'node_modules/leaflet/dist'),path.join(out,'leaflet'),{recursive:true});
fs.copyFileSync(path.join(root,'node_modules/leaflet/LICENSE'),path.join(out,'leaflet/LICENSE'));
(async()=>{
 await esbuild.build({entryPoints:['src/ai-worker.js'],bundle:true,format:'esm',platform:'browser',outfile:'web/vendor/ai-worker.js',minify:true,define:{'process.env.NODE_ENV':'"production"'}});
 await esbuild.build({entryPoints:['src/hours.js'],bundle:true,format:'iife',globalName:'PizzaHours',platform:'browser',outfile:'web/vendor/hours.js',minify:true});
 await esbuild.build({entryPoints:['src/community.js'],bundle:true,format:'iife',globalName:'PizzaCommunity',platform:'browser',outfile:'web/vendor/community.js',minify:true});
 const ort=path.dirname(path.dirname(require.resolve('onnxruntime-web')));fs.mkdirSync(path.join(out,'ort'),{recursive:true});
 for(const f of fs.readdirSync(path.join(ort,'dist')))if(/\.wasm$|\.mjs$/.test(f))fs.copyFileSync(path.join(ort,'dist',f),path.join(out,'ort',f));
 // Legal notices for bundled libraries; model cards are linked in settings.
 for(const [name,file] of [['@huggingface/transformers','LICENSE'],['onnxruntime-web','LICENSE'],['nostr-tools','LICENSE'],['opening_hours','LICENSE'],['tz-lookup','LICENSE']]){const p=path.join(root,'node_modules',name,file);if(fs.existsSync(p))fs.copyFileSync(p,path.join(out,name.replaceAll('/','-')+'-LICENSE.txt'));}
 console.log('Local model runtime, Nostr signature verification and map assets bundled.');
})().catch(e=>{console.error(e);process.exit(1)});
