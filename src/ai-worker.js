import {env, AutoTokenizer, AutoProcessor, AutoModel, RawImage} from '@huggingface/transformers';
import A from '../web/analysis.js';
env.allowLocalModels=false;
env.useBrowserCache=true;
env.backends.onnx.wasm.numThreads=1;
env.backends.onnx.wasm.proxy=false;
env.backends.onnx.wasm.wasmPaths=new URL('./ort/',self.location.href).href;
let engine=null,busy=false;
const send=(type,data={})=>self.postMessage({type,...data});
async function load(id){const spec=A.models.find(m=>m.id===id);if(!spec)throw Error('Unbekanntes Modell');if(engine?.id===id)return engine;if(engine){await engine.model.dispose();engine=null;}
 const opts={dtype:'q8',device:'wasm',progress_callback:p=>send('progress',{stage:'download',file:p.file||'',loaded:p.loaded,total:p.total,progress:p.progress,status:p.status})};
 const [tokenizer,processor,model]=await Promise.all([AutoTokenizer.from_pretrained(spec.repo),AutoProcessor.from_pretrained(spec.repo),AutoModel.from_pretrained(spec.repo,opts)]);
 engine={id,spec,tokenizer,processor,model};send('loaded',{id});return engine;
}
async function logits(e,pixels,texts){const inputs=e.tokenizer(texts,{padding:e.spec.family==='siglip'?'max_length':true,truncation:true});const out=await e.model({...inputs,...pixels});if(!out.logits_per_image)throw Error('Modell liefert keinen Bild-Text-Vergleich');const values=Array.from(out.logits_per_image.data);if(values.length!==texts.length)throw Error('Unerwartete Ausgabedimension');return values;}
self.onmessage=async event=>{if(busy)return;busy=true;try{const {type,id,photo}=event.data,e=await load(id);if(type==='load'){send('ready',{id});return;}
 const img=await RawImage.read(photo);const pixels=await e.processor(img);send('progress',{stage:'analyse',done:0});const gate=A.softmax(await logits(e,pixels,A.gate));if(gate[0]<.35||gate[0]!==Math.max(...gate))throw Error('Keine eindeutig erkennbare Pizza. Bitte ein scharfes Foto der ganzen Pizza wählen.');
 const all=[];for(let i=0;i<25;i+=4){const prompts=A.categories.slice(i,i+4).flatMap(c=>c.prompts);all.push(...await logits(e,pixels,prompts));send('progress',{stage:'analyse',done:Math.min(25,i+4)});}
 const scores=A.results(all);send('result',{id,scores,overall:A.overall(scores),pizzaMatch:gate[0],method:A.method,createdAt:new Date().toISOString()});
 }catch(e){send('error',{message:e.message||String(e)});}finally{busy=false;}};
