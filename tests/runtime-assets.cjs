// Exercise the packaged ONNX runtime after removing duplicate standalone JS bundles.
const {chromium}=require('playwright'),esbuild=require('esbuild'),fs=require('node:fs'),assert=require('node:assert/strict');
const {server,mapFixtures}=require('./helpers.cjs');
// Minimal ONNX Identity graph: one float enters and the same float must leave.
const field=(id,value)=>typeof value==='number'?[id*8,value]:[id*8+2,value.length,...value];
const str=(id,value)=>field(id,[...Buffer.from(value)]);
const info=name=>[...str(1,name),...field(2,field(1,[...field(1,1),...field(2,field(1,field(1,1)))]))];
const graph=[...field(1,[...str(1,'x'),...str(2,'y'),...str(4,'Identity')]),...str(2,'PizzaScan runtime packaging check'),...field(11,info('x')),...field(12,info('y'))];
const model=[...field(1,8),...field(7,graph),...field(8,field(2,13))];
(async()=>{
 const probe='web/vendor/runtime-probe.js';
 await esbuild.build({stdin:{contents:`import * as ort from 'onnxruntime-web';ort.env.wasm.numThreads=1;ort.env.wasm.proxy=false;ort.env.wasm.wasmPaths=new URL('./ort/',self.location.href).href;self.onmessage=async e=>{try{const session=await ort.InferenceSession.create(new Uint8Array(e.data),{executionProviders:['wasm']});const out=await session.run({x:new ort.Tensor('float32',new Float32Array([42]),[1])});self.postMessage({value:out.y.data[0]});await session.release();}catch(error){self.postMessage({error:error.message});}};`,resolveDir:process.cwd(),sourcefile:'runtime-probe.js'},bundle:true,format:'esm',platform:'browser',outfile:probe,minify:true});
 const {server:s,url}=await server();let browser;
 try{
  browser=await chromium.launch();const page=await browser.newPage(),failed=[],loaded=[];
  await mapFixtures(page);page.on('response',r=>{if(r.url().includes('/vendor/ort/')){loaded.push(new URL(r.url()).pathname);if(!r.ok())failed.push(r.status()+': '+r.url());}});
  await page.goto(url);
  const result=await page.evaluate(bytes=>new Promise((resolve,reject)=>{const worker=new Worker('vendor/runtime-probe.js',{type:'module'});const timer=setTimeout(()=>{worker.terminate();reject(Error('Runtime did not initialize'));},20000);worker.onerror=e=>{clearTimeout(timer);worker.terminate();reject(Error(e.message));};worker.onmessage=e=>{clearTimeout(timer);worker.terminate();resolve(e.data);};worker.postMessage(bytes);}),model);
  assert.deepEqual(result,{value:42});assert.deepEqual(failed,[]);assert.ok(loaded.some(x=>x.endsWith('.wasm')),'Real local WASM must load');
  assert.ok(fs.readdirSync('web/vendor/ort').every(f=>/^ort-wasm.*\.(wasm|mjs)$/.test(f)),'No duplicate standalone runtime bundles');
  console.log('PASS packaged ONNX runtime: real WASM Identity inference, local loaders, no missing files',loaded);
 }finally{if(browser)await browser.close();s.close();fs.rmSync(probe,{force:true});}
})().catch(e=>{console.error(e);process.exitCode=1;});
