(()=>{"use strict";var e={913:()=>{try{self["workbox:core:6.4.1"]&&_()}catch(e){}},977:()=>{try{self["workbox:precaching:6.4.1"]&&_()}catch(e){}},80:()=>{try{self["workbox:routing:6.4.1"]&&_()}catch(e){}},873:()=>{try{self["workbox:strategies:6.4.1"]&&_()}catch(e){}}},t={};function s(a){var n=t[a];if(void 0!==n)return n.exports;var i=t[a]={exports:{}};return e[a](i,i.exports,s),i.exports}(()=>{s(913);const e=(e,...t)=>{let s=e;return t.length>0&&(s+=` :: ${JSON.stringify(t)}`),s};class t extends Error{constructor(t,s){super(e(t,s)),this.name=t,this.details=s}}const a={googleAnalytics:"googleAnalytics",precache:"precache-v2",prefix:"workbox",runtime:"runtime",suffix:"undefined"!=typeof registration?registration.scope:""},n=e=>[a.prefix,e,a.suffix].filter((e=>e&&e.length>0)).join("-"),i=e=>e||n(a.precache),r=e=>e||n(a.runtime);function c(e,t){const s=t();return e.waitUntil(s),s}s(977);function o(e){if(!e)throw new t("add-to-cache-list-unexpected-type",{entry:e});if("string"==typeof e){const t=new URL(e,location.href);return{cacheKey:t.href,url:t.href}}const{revision:s,url:a}=e;if(!a)throw new t("add-to-cache-list-unexpected-type",{entry:e});if(!s){const e=new URL(a,location.href);return{cacheKey:e.href,url:e.href}}const n=new URL(a,location.href),i=new URL(a,location.href);return n.searchParams.set("__WB_REVISION__",s),{cacheKey:n.href,url:i.href}}class h{constructor(){this.updatedURLs=[],this.notUpdatedURLs=[],this.handlerWillStart=async({request:e,state:t})=>{t&&(t.originalRequest=e)},this.cachedResponseWillBeUsed=async({event:e,state:t,cachedResponse:s})=>{if("install"===e.type&&t&&t.originalRequest&&t.originalRequest instanceof Request){const e=t.originalRequest.url;s?this.notUpdatedURLs.push(e):this.updatedURLs.push(e)}return s}}}class l{constructor({precacheController:e}){this.cacheKeyWillBeUsed=async({request:e,params:t})=>{const s=(null==t?void 0:t.cacheKey)||this._precacheController.getCacheKeyForURL(e.url);return s?new Request(s,{headers:e.headers}):e},this._precacheController=e}}let u;async function f(e,s){let a=null;if(e.url){a=new URL(e.url).origin}if(a!==self.location.origin)throw new t("cross-origin-copy-response",{origin:a});const n=e.clone(),i={headers:new Headers(n.headers),status:n.status,statusText:n.statusText},r=s?s(i):i,c=function(){if(void 0===u){const e=new Response("");if("body"in e)try{new Response(e.body),u=!0}catch(e){u=!1}u=!1}return u}()?n.body:await n.blob();return new Response(c,r)}function d(e,t){const s=new URL(e);for(const e of t)s.searchParams.delete(e);return s.href}class p{constructor(){this.promise=new Promise(((e,t)=>{this.resolve=e,this.reject=t}))}}const g=new Set;s(873);function y(e){return"string"==typeof e?new Request(e):e}class w{constructor(e,t){this._cacheKeys={},Object.assign(this,t),this.event=t.event,this._strategy=e,this._handlerDeferred=new p,this._extendLifetimePromises=[],this._plugins=[...e.plugins],this._pluginStateMap=new Map;for(const e of this._plugins)this._pluginStateMap.set(e,{});this.event.waitUntil(this._handlerDeferred.promise)}async fetch(e){const{event:s}=this;let a=y(e);if("navigate"===a.mode&&s instanceof FetchEvent&&s.preloadResponse){const e=await s.preloadResponse;if(e)return e}const n=this.hasCallback("fetchDidFail")?a.clone():null;try{for(const e of this.iterateCallbacks("requestWillFetch"))a=await e({request:a.clone(),event:s})}catch(e){if(e instanceof Error)throw new t("plugin-error-request-will-fetch",{thrownErrorMessage:e.message})}const i=a.clone();try{let e;e=await fetch(a,"navigate"===a.mode?void 0:this._strategy.fetchOptions);for(const t of this.iterateCallbacks("fetchDidSucceed"))e=await t({event:s,request:i,response:e});return e}catch(e){throw n&&await this.runCallbacks("fetchDidFail",{error:e,event:s,originalRequest:n.clone(),request:i.clone()}),e}}async fetchAndCachePut(e){const t=await this.fetch(e),s=t.clone();return this.waitUntil(this.cachePut(e,s)),t}async cacheMatch(e){const t=y(e);let s;const{cacheName:a,matchOptions:n}=this._strategy,i=await this.getCacheKey(t,"read"),r=Object.assign(Object.assign({},n),{cacheName:a});s=await caches.match(i,r);for(const e of this.iterateCallbacks("cachedResponseWillBeUsed"))s=await e({cacheName:a,matchOptions:n,cachedResponse:s,request:i,event:this.event})||void 0;return s}async cachePut(e,s){const a=y(e);var n;await(n=0,new Promise((e=>setTimeout(e,n))));const i=await this.getCacheKey(a,"write");if(!s)throw new t("cache-put-with-no-response",{url:(r=i.url,new URL(String(r),location.href).href.replace(new RegExp(`^${location.origin}`),""))});var r;const c=await this._ensureResponseSafeToCache(s);if(!c)return!1;const{cacheName:o,matchOptions:h}=this._strategy,l=await self.caches.open(o),u=this.hasCallback("cacheDidUpdate"),f=u?await async function(e,t,s,a){const n=d(t.url,s);if(t.url===n)return e.match(t,a);const i=Object.assign(Object.assign({},a),{ignoreSearch:!0}),r=await e.keys(t,i);for(const t of r)if(n===d(t.url,s))return e.match(t,a)}(l,i.clone(),["__WB_REVISION__"],h):null;try{await l.put(i,u?c.clone():c)}catch(e){if(e instanceof Error)throw"QuotaExceededError"===e.name&&await async function(){for(const e of g)await e()}(),e}for(const e of this.iterateCallbacks("cacheDidUpdate"))await e({cacheName:o,oldResponse:f,newResponse:c.clone(),request:i,event:this.event});return!0}async getCacheKey(e,t){const s=`${e.url} | ${t}`;if(!this._cacheKeys[s]){let a=e;for(const e of this.iterateCallbacks("cacheKeyWillBeUsed"))a=y(await e({mode:t,request:a,event:this.event,params:this.params}));this._cacheKeys[s]=a}return this._cacheKeys[s]}hasCallback(e){for(const t of this._strategy.plugins)if(e in t)return!0;return!1}async runCallbacks(e,t){for(const s of this.iterateCallbacks(e))await s(t)}*iterateCallbacks(e){for(const t of this._strategy.plugins)if("function"==typeof t[e]){const s=this._pluginStateMap.get(t),a=a=>{const n=Object.assign(Object.assign({},a),{state:s});return t[e](n)};yield a}}waitUntil(e){return this._extendLifetimePromises.push(e),e}async doneWaiting(){let e;for(;e=this._extendLifetimePromises.shift();)await e}destroy(){this._handlerDeferred.resolve(null)}async _ensureResponseSafeToCache(e){let t=e,s=!1;for(const e of this.iterateCallbacks("cacheWillUpdate"))if(t=await e({request:this.request,response:t,event:this.event})||void 0,s=!0,!t)break;return s||t&&200!==t.status&&(t=void 0),t}}class _ extends class{constructor(e={}){this.cacheName=r(e.cacheName),this.plugins=e.plugins||[],this.fetchOptions=e.fetchOptions,this.matchOptions=e.matchOptions}handle(e){const[t]=this.handleAll(e);return t}handleAll(e){e instanceof FetchEvent&&(e={event:e,request:e.request});const t=e.event,s="string"==typeof e.request?new Request(e.request):e.request,a="params"in e?e.params:void 0,n=new w(this,{event:t,request:s,params:a}),i=this._getResponse(n,s,t);return[i,this._awaitComplete(i,n,s,t)]}async _getResponse(e,s,a){let n;await e.runCallbacks("handlerWillStart",{event:a,request:s});try{if(n=await this._handle(s,e),!n||"error"===n.type)throw new t("no-response",{url:s.url})}catch(t){if(t instanceof Error)for(const i of e.iterateCallbacks("handlerDidError"))if(n=await i({error:t,event:a,request:s}),n)break;if(!n)throw t}for(const t of e.iterateCallbacks("handlerWillRespond"))n=await t({event:a,request:s,response:n});return n}async _awaitComplete(e,t,s,a){let n,i;try{n=await e}catch(i){}try{await t.runCallbacks("handlerDidRespond",{event:a,request:s,response:n}),await t.doneWaiting()}catch(e){e instanceof Error&&(i=e)}if(await t.runCallbacks("handlerDidComplete",{event:a,request:s,response:n,error:i}),t.destroy(),i)throw i}}{constructor(e={}){e.cacheName=i(e.cacheName),super(e),this._fallbackToNetwork=!1!==e.fallbackToNetwork,this.plugins.push(_.copyRedirectedCacheableResponsesPlugin)}async _handle(e,t){const s=await t.cacheMatch(e);return s||(t.event&&"install"===t.event.type?await this._handleInstall(e,t):await this._handleFetch(e,t))}async _handleFetch(e,s){let a;const n=s.params||{};if(!this._fallbackToNetwork)throw new t("missing-precache-entry",{cacheName:this.cacheName,url:e.url});{0;const t=n.integrity,i=e.integrity,r=!i||i===t;if(a=await s.fetch(new Request(e,{integrity:i||t})),t&&r){this._useDefaultCacheabilityPluginIfNeeded();await s.cachePut(e,a.clone());0}}return a}async _handleInstall(e,s){this._useDefaultCacheabilityPluginIfNeeded();const a=await s.fetch(e);if(!await s.cachePut(e,a.clone()))throw new t("bad-precaching-response",{url:e.url,status:a.status});return a}_useDefaultCacheabilityPluginIfNeeded(){let e=null,t=0;for(const[s,a]of this.plugins.entries())a!==_.copyRedirectedCacheableResponsesPlugin&&(a===_.defaultPrecacheCacheabilityPlugin&&(e=s),a.cacheWillUpdate&&t++);0===t?this.plugins.push(_.defaultPrecacheCacheabilityPlugin):t>1&&null!==e&&this.plugins.splice(e,1)}}_.defaultPrecacheCacheabilityPlugin={cacheWillUpdate:async({response:e})=>!e||e.status>=400?null:e},_.copyRedirectedCacheableResponsesPlugin={cacheWillUpdate:async({response:e})=>e.redirected?await f(e):e};class v{constructor({cacheName:e,plugins:t=[],fallbackToNetwork:s=!0}={}){this._urlsToCacheKeys=new Map,this._urlsToCacheModes=new Map,this._cacheKeysToIntegrities=new Map,this._strategy=new _({cacheName:i(e),plugins:[...t,new l({precacheController:this})],fallbackToNetwork:s}),this.install=this.install.bind(this),this.activate=this.activate.bind(this)}get strategy(){return this._strategy}precache(e){this.addToCacheList(e),this._installAndActiveListenersAdded||(self.addEventListener("install",this.install),self.addEventListener("activate",this.activate),this._installAndActiveListenersAdded=!0)}addToCacheList(e){const s=[];for(const a of e){"string"==typeof a?s.push(a):a&&void 0===a.revision&&s.push(a.url);const{cacheKey:e,url:n}=o(a),i="string"!=typeof a&&a.revision?"reload":"default";if(this._urlsToCacheKeys.has(n)&&this._urlsToCacheKeys.get(n)!==e)throw new t("add-to-cache-list-conflicting-entries",{firstEntry:this._urlsToCacheKeys.get(n),secondEntry:e});if("string"!=typeof a&&a.integrity){if(this._cacheKeysToIntegrities.has(e)&&this._cacheKeysToIntegrities.get(e)!==a.integrity)throw new t("add-to-cache-list-conflicting-integrities",{url:n});this._cacheKeysToIntegrities.set(e,a.integrity)}if(this._urlsToCacheKeys.set(n,e),this._urlsToCacheModes.set(n,i),s.length>0){const e=`Workbox is precaching URLs without revision info: ${s.join(", ")}\nThis is generally NOT safe. Learn more at https://bit.ly/wb-precache`;console.warn(e)}}}install(e){return c(e,(async()=>{const t=new h;this.strategy.plugins.push(t);for(const[t,s]of this._urlsToCacheKeys){const a=this._cacheKeysToIntegrities.get(s),n=this._urlsToCacheModes.get(t),i=new Request(t,{integrity:a,cache:n,credentials:"same-origin"});await Promise.all(this.strategy.handleAll({params:{cacheKey:s},request:i,event:e}))}const{updatedURLs:s,notUpdatedURLs:a}=t;return{updatedURLs:s,notUpdatedURLs:a}}))}activate(e){return c(e,(async()=>{const e=await self.caches.open(this.strategy.cacheName),t=await e.keys(),s=new Set(this._urlsToCacheKeys.values()),a=[];for(const n of t)s.has(n.url)||(await e.delete(n),a.push(n.url));return{deletedURLs:a}}))}getURLsToCacheKeys(){return this._urlsToCacheKeys}getCachedURLs(){return[...this._urlsToCacheKeys.keys()]}getCacheKeyForURL(e){const t=new URL(e,location.href);return this._urlsToCacheKeys.get(t.href)}getIntegrityForCacheKey(e){return this._cacheKeysToIntegrities.get(e)}async matchPrecache(e){const t=e instanceof Request?e.url:e,s=this.getCacheKeyForURL(t);if(s){return(await self.caches.open(this.strategy.cacheName)).match(s)}}createHandlerBoundToURL(e){const s=this.getCacheKeyForURL(e);if(!s)throw new t("non-precached-url",{url:e});return t=>(t.request=new Request(e),t.params=Object.assign({cacheKey:s},t.params),this.strategy.handle(t))}}s(80);(async()=>{const e=function(){const e=JSON.parse(new URLSearchParams(self.location.search).get("params"));return e.debug&&console.log("[Docusaurus-PWA][SW]: Service Worker params:",e),e}(),t=[{"revision":"faeb3774392125837c936e992c4f25c4","url":"404.html"},{"revision":"43fe650930d4a1cb918d392bf3d57780","url":"assets/css/styles.1345c406.css"},{"revision":"1d3575c4c8036a4a05c29688e750ffa1","url":"assets/js/02a46a75.5d668fc3.js"},{"revision":"06ec4704eba3e965e58a3b29dd729621","url":"assets/js/0e384e19.ec4a5f0a.js"},{"revision":"6a141797c58763f70dabd8c0d025b5c9","url":"assets/js/131.b9bfc6a4.js"},{"revision":"ac1dd33df08fa4ce3edf3de2b0190336","url":"assets/js/17896441.42201da1.js"},{"revision":"6a2204ec1731fd10c371c28c5fa33cf2","url":"assets/js/1be78505.0927ab11.js"},{"revision":"a160b664cb0b5e7bdccc2ad4c64b109b","url":"assets/js/1d4a91a3.9c3aaf3d.js"},{"revision":"2e02f253f9f261169b1c26ab76e6c207","url":"assets/js/230.d9c1936c.js"},{"revision":"5656fe7e3f2b8cc490e4e9ecc5d9b3f0","url":"assets/js/283.10375697.js"},{"revision":"e63104bc0482d5ecf765d1d8885d2c3e","url":"assets/js/2a453410.7290c398.js"},{"revision":"8b20736f12c37d843206c12cf8dfd9de","url":"assets/js/2fa65207.9fe5b9b8.js"},{"revision":"69af0aaeaff52e48ed2ef4fd065f94d1","url":"assets/js/36433dca.91e913f8.js"},{"revision":"a25207b18f51fc611e0511101ed5f641","url":"assets/js/383fb4d4.76775f40.js"},{"revision":"7d9c3c409518818db4d7890344066805","url":"assets/js/3c0140d7.230da762.js"},{"revision":"0cc11cff039434869130e8831579b9e8","url":"assets/js/3d834173.5bad2219.js"},{"revision":"b3aa9f90ce9e596b5d4774a000e3dee4","url":"assets/js/3ed3a75b.1baf8a78.js"},{"revision":"e807dd421884908a3ce017f7a8a5653b","url":"assets/js/560d8297.e7305b01.js"},{"revision":"96cdb2ead2e084f7c6b81f1aee6339f1","url":"assets/js/5897bde7.e7dedcd7.js"},{"revision":"a5fec6cfdbdd904539f898819d47c018","url":"assets/js/58e36e06.d8d8cb7c.js"},{"revision":"6abd218f2bcd856bd781677e1feb12c2","url":"assets/js/608.bb6d7611.js"},{"revision":"61551672f70b7524ee092ae468aa2528","url":"assets/js/61196cfa.091d22fb.js"},{"revision":"3606c4e596591ee28733db819e852717","url":"assets/js/692fcdae.c7d6ab1b.js"},{"revision":"b23b352bf165a077523f0dc33bd290f6","url":"assets/js/6bc8de31.1538b3fd.js"},{"revision":"6ed0d65bd885478210464ef9f2e445d6","url":"assets/js/7698d8c8.cae613e5.js"},{"revision":"d0504e75a58705bdd227c623779422b7","url":"assets/js/91719928.0a3395c9.js"},{"revision":"a8fc7154e9a088636995530bac17c20c","url":"assets/js/924eb06f.7452b297.js"},{"revision":"e7f0e9cdfd4e476c97e583d2c5490a31","url":"assets/js/935f2afb.6f9b05d6.js"},{"revision":"e3916a9f2cc02caa134c711e09d1dfcb","url":"assets/js/ba3d10c8.6ec2e30c.js"},{"revision":"921a5d34651314b2bb54509ad95a1d71","url":"assets/js/c006647d.02f4d14d.js"},{"revision":"5ef16379d6c3853bfb347730bf85ac39","url":"assets/js/cb165134.0693bbb0.js"},{"revision":"bc3740748f66e389d71fb5b237ecf971","url":"assets/js/e379451d.7216d6dd.js"},{"revision":"d10cb0ba41a97b7565cdd87f0f7df3b7","url":"assets/js/e8ad4079.91cdfa67.js"},{"revision":"8f9eea65c2f4745469124ca9caacf5b1","url":"assets/js/faea993e.11940f1a.js"},{"revision":"404363bfff42b95e354d944322a76242","url":"assets/js/main.f8de5c2e.js"},{"revision":"57a997c8528137b1f26f19a72a2b4e3b","url":"assets/js/runtime~main.e30c46a0.js"},{"revision":"52622c5dbf65f85f033d6ac68f3159e7","url":"Emergency_Situations/Bleeding.html"},{"revision":"b36a7c9365aac17eb18ef171fd0f156d","url":"Emergency_Situations/Hypercalcaemia.html"},{"revision":"d8bfb049905bb1769b791ee0520ff20c","url":"Emergency_Situations/Seizures.html"},{"revision":"2bc24bb73d7bd22893a707ffab948418","url":"Emergency_Situations/Spinal_Cord.html"},{"revision":"6530784175a3074f39467486338b46e1","url":"Emergency_Situations/Superior_Vena_Cava.html"},{"revision":"284754e5fe145d46824d03c46ff10b8f","url":"EOL/Kidney.html"},{"revision":"fd0cd320037f6b4126282193ccc21b4c","url":"EOL/Liver.html"},{"revision":"00fa99a7d83a00b054e2e51cc4d22fe6","url":"EOL/MouthCare.html"},{"revision":"5d00c91c27b7c673d59aec8870818877","url":"index.html"},{"revision":"e9c79b322d60870c20e44ac627665abb","url":"manifest.json"},{"revision":"a21c4dbf5e69ea46670bbe01792fc571","url":"Symptom_Control/Anorexia_cachexia.html"},{"revision":"156ab1f4d043ddb272d097fa895c3458","url":"Symptom_Control/BowelObstruction.html"},{"revision":"707fcfad99edfabdce370ffb74033ca2","url":"Symptom_Control/Breathlessness.html"},{"revision":"ec7b0cdd2b196b9baa5b39623b619a23","url":"Symptom_Control/Constipation.html"},{"revision":"1974686dee04dff8a8a9107730d54514","url":"Symptom_Control/Coughing.html"},{"revision":"d4eda581caab95bbc9082cfa7ff6e801","url":"Symptom_Control/Delirium.html"},{"revision":"c7dd177b67e06e89b07ca7d6c72f3411","url":"Symptom_Control/Depression.html"},{"revision":"95868dddc81548ad4d019da8312d93e4","url":"Symptom_Control/Diarrhoea.html"},{"revision":"87dbd8d632bd9af2be1b350958753ec3","url":"Symptom_Control/Hiccups.html"},{"revision":"2db5c5e3a76bb9d5ee01a8dad6232121","url":"Symptom_Control/Itchiness.html"},{"revision":"16ae4a4d28e240983a24f6313503f1aa","url":"Symptom_Control/NauseaVomiting.html"},{"revision":"17b910d3994d1c0a2fae69a359062553","url":"Symptom_Control/PainSubmenu/Pain1.html"},{"revision":"e7b66d2b6e243b74f721a3e9a55751f6","url":"Symptom_Control/PainSubmenu/Pain2.html"},{"revision":"9ef1b9db6c04c83a69ae988c483d1fe0","url":"Symptom_Control/PainSubmenu/Pain3.html"},{"revision":"a57b10ce2f815c5fd2525833260919ad","url":"Symptom_Control/PainSubmenu/Pain4.html"},{"revision":"91788159fbb2360d8f709d216345970c","url":"Symptom_Control/PainSubmenu/Pain5.html"},{"revision":"1f897f3c8c07a2c9c4f8c663b78b2d3c","url":"assets/images/Icons-b524a20ea8b03ba21a2771aa9120b0c7.png"},{"revision":"1f897f3c8c07a2c9c4f8c663b78b2d3c","url":"Icons.png"},{"revision":"4343e07bf942aefb5f334501958fbc0e","url":"img/favicon.ico"},{"revision":"aa4fa2cdc39d33f2ee3b8f245b6d30d9","url":"img/logo.svg"},{"revision":"66fb688b916c24325df428e4589b0b74","url":"img/pal-favicon.png"}],s=new v({fallbackToNetwork:!0});e.offlineMode&&(s.addToCacheList(t),e.debug&&console.log("[Docusaurus-PWA][SW]: addToCacheList",{precacheManifest:t})),await async function(e){}(),self.addEventListener("install",(t=>{e.debug&&console.log("[Docusaurus-PWA][SW]: install event",{event:t}),t.waitUntil(s.install(t))})),self.addEventListener("activate",(t=>{e.debug&&console.log("[Docusaurus-PWA][SW]: activate event",{event:t}),t.waitUntil(s.activate(t))})),self.addEventListener("fetch",(async t=>{if(e.offlineMode){const a=t.request.url,n=function(e){const t=[],s=new URL(e,self.location.href);return s.origin!==self.location.origin||(s.search="",s.hash="",t.push(s.href),s.pathname.endsWith("/")?t.push(`${s.href}index.html`):t.push(`${s.href}/index.html`)),t}(a);for(let i=0;i<n.length;i+=1){const r=n[i],c=s.getCacheKeyForURL(r);if(c){const s=caches.match(c);e.debug&&console.log("[Docusaurus-PWA][SW]: serving cached asset",{requestURL:a,possibleURL:r,possibleURLs:n,cacheKey:c,cachedResponse:s}),t.respondWith(s);break}}}})),self.addEventListener("message",(async t=>{e.debug&&console.log("[Docusaurus-PWA][SW]: message event",{event:t});"SKIP_WAITING"===(t.data&&t.data.type)&&self.skipWaiting()}))})()})()})();