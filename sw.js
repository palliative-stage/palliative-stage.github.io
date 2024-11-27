(()=>{"use strict";var e={913:()=>{try{self["workbox:core:6.4.1"]&&_()}catch(e){}},977:()=>{try{self["workbox:precaching:6.4.1"]&&_()}catch(e){}},80:()=>{try{self["workbox:routing:6.4.1"]&&_()}catch(e){}},873:()=>{try{self["workbox:strategies:6.4.1"]&&_()}catch(e){}}},t={};function s(a){var n=t[a];if(void 0!==n)return n.exports;var i=t[a]={exports:{}};return e[a](i,i.exports,s),i.exports}(()=>{s(913);const e=(e,...t)=>{let s=e;return t.length>0&&(s+=` :: ${JSON.stringify(t)}`),s};class t extends Error{constructor(t,s){super(e(t,s)),this.name=t,this.details=s}}const a={googleAnalytics:"googleAnalytics",precache:"precache-v2",prefix:"workbox",runtime:"runtime",suffix:"undefined"!=typeof registration?registration.scope:""},n=e=>[a.prefix,e,a.suffix].filter((e=>e&&e.length>0)).join("-"),i=e=>e||n(a.precache),r=e=>e||n(a.runtime);function c(e,t){const s=t();return e.waitUntil(s),s}s(977);function o(e){if(!e)throw new t("add-to-cache-list-unexpected-type",{entry:e});if("string"==typeof e){const t=new URL(e,location.href);return{cacheKey:t.href,url:t.href}}const{revision:s,url:a}=e;if(!a)throw new t("add-to-cache-list-unexpected-type",{entry:e});if(!s){const e=new URL(a,location.href);return{cacheKey:e.href,url:e.href}}const n=new URL(a,location.href),i=new URL(a,location.href);return n.searchParams.set("__WB_REVISION__",s),{cacheKey:n.href,url:i.href}}class h{constructor(){this.updatedURLs=[],this.notUpdatedURLs=[],this.handlerWillStart=async({request:e,state:t})=>{t&&(t.originalRequest=e)},this.cachedResponseWillBeUsed=async({event:e,state:t,cachedResponse:s})=>{if("install"===e.type&&t&&t.originalRequest&&t.originalRequest instanceof Request){const e=t.originalRequest.url;s?this.notUpdatedURLs.push(e):this.updatedURLs.push(e)}return s}}}class l{constructor({precacheController:e}){this.cacheKeyWillBeUsed=async({request:e,params:t})=>{const s=(null==t?void 0:t.cacheKey)||this._precacheController.getCacheKeyForURL(e.url);return s?new Request(s,{headers:e.headers}):e},this._precacheController=e}}let u;async function f(e,s){let a=null;if(e.url){a=new URL(e.url).origin}if(a!==self.location.origin)throw new t("cross-origin-copy-response",{origin:a});const n=e.clone(),i={headers:new Headers(n.headers),status:n.status,statusText:n.statusText},r=s?s(i):i,c=function(){if(void 0===u){const e=new Response("");if("body"in e)try{new Response(e.body),u=!0}catch(e){u=!1}u=!1}return u}()?n.body:await n.blob();return new Response(c,r)}function d(e,t){const s=new URL(e);for(const e of t)s.searchParams.delete(e);return s.href}class p{constructor(){this.promise=new Promise(((e,t)=>{this.resolve=e,this.reject=t}))}}const g=new Set;s(873);function y(e){return"string"==typeof e?new Request(e):e}class w{constructor(e,t){this._cacheKeys={},Object.assign(this,t),this.event=t.event,this._strategy=e,this._handlerDeferred=new p,this._extendLifetimePromises=[],this._plugins=[...e.plugins],this._pluginStateMap=new Map;for(const e of this._plugins)this._pluginStateMap.set(e,{});this.event.waitUntil(this._handlerDeferred.promise)}async fetch(e){const{event:s}=this;let a=y(e);if("navigate"===a.mode&&s instanceof FetchEvent&&s.preloadResponse){const e=await s.preloadResponse;if(e)return e}const n=this.hasCallback("fetchDidFail")?a.clone():null;try{for(const e of this.iterateCallbacks("requestWillFetch"))a=await e({request:a.clone(),event:s})}catch(e){if(e instanceof Error)throw new t("plugin-error-request-will-fetch",{thrownErrorMessage:e.message})}const i=a.clone();try{let e;e=await fetch(a,"navigate"===a.mode?void 0:this._strategy.fetchOptions);for(const t of this.iterateCallbacks("fetchDidSucceed"))e=await t({event:s,request:i,response:e});return e}catch(e){throw n&&await this.runCallbacks("fetchDidFail",{error:e,event:s,originalRequest:n.clone(),request:i.clone()}),e}}async fetchAndCachePut(e){const t=await this.fetch(e),s=t.clone();return this.waitUntil(this.cachePut(e,s)),t}async cacheMatch(e){const t=y(e);let s;const{cacheName:a,matchOptions:n}=this._strategy,i=await this.getCacheKey(t,"read"),r=Object.assign(Object.assign({},n),{cacheName:a});s=await caches.match(i,r);for(const e of this.iterateCallbacks("cachedResponseWillBeUsed"))s=await e({cacheName:a,matchOptions:n,cachedResponse:s,request:i,event:this.event})||void 0;return s}async cachePut(e,s){const a=y(e);var n;await(n=0,new Promise((e=>setTimeout(e,n))));const i=await this.getCacheKey(a,"write");if(!s)throw new t("cache-put-with-no-response",{url:(r=i.url,new URL(String(r),location.href).href.replace(new RegExp(`^${location.origin}`),""))});var r;const c=await this._ensureResponseSafeToCache(s);if(!c)return!1;const{cacheName:o,matchOptions:h}=this._strategy,l=await self.caches.open(o),u=this.hasCallback("cacheDidUpdate"),f=u?await async function(e,t,s,a){const n=d(t.url,s);if(t.url===n)return e.match(t,a);const i=Object.assign(Object.assign({},a),{ignoreSearch:!0}),r=await e.keys(t,i);for(const t of r)if(n===d(t.url,s))return e.match(t,a)}(l,i.clone(),["__WB_REVISION__"],h):null;try{await l.put(i,u?c.clone():c)}catch(e){if(e instanceof Error)throw"QuotaExceededError"===e.name&&await async function(){for(const e of g)await e()}(),e}for(const e of this.iterateCallbacks("cacheDidUpdate"))await e({cacheName:o,oldResponse:f,newResponse:c.clone(),request:i,event:this.event});return!0}async getCacheKey(e,t){const s=`${e.url} | ${t}`;if(!this._cacheKeys[s]){let a=e;for(const e of this.iterateCallbacks("cacheKeyWillBeUsed"))a=y(await e({mode:t,request:a,event:this.event,params:this.params}));this._cacheKeys[s]=a}return this._cacheKeys[s]}hasCallback(e){for(const t of this._strategy.plugins)if(e in t)return!0;return!1}async runCallbacks(e,t){for(const s of this.iterateCallbacks(e))await s(t)}*iterateCallbacks(e){for(const t of this._strategy.plugins)if("function"==typeof t[e]){const s=this._pluginStateMap.get(t),a=a=>{const n=Object.assign(Object.assign({},a),{state:s});return t[e](n)};yield a}}waitUntil(e){return this._extendLifetimePromises.push(e),e}async doneWaiting(){let e;for(;e=this._extendLifetimePromises.shift();)await e}destroy(){this._handlerDeferred.resolve(null)}async _ensureResponseSafeToCache(e){let t=e,s=!1;for(const e of this.iterateCallbacks("cacheWillUpdate"))if(t=await e({request:this.request,response:t,event:this.event})||void 0,s=!0,!t)break;return s||t&&200!==t.status&&(t=void 0),t}}class _ extends class{constructor(e={}){this.cacheName=r(e.cacheName),this.plugins=e.plugins||[],this.fetchOptions=e.fetchOptions,this.matchOptions=e.matchOptions}handle(e){const[t]=this.handleAll(e);return t}handleAll(e){e instanceof FetchEvent&&(e={event:e,request:e.request});const t=e.event,s="string"==typeof e.request?new Request(e.request):e.request,a="params"in e?e.params:void 0,n=new w(this,{event:t,request:s,params:a}),i=this._getResponse(n,s,t);return[i,this._awaitComplete(i,n,s,t)]}async _getResponse(e,s,a){let n;await e.runCallbacks("handlerWillStart",{event:a,request:s});try{if(n=await this._handle(s,e),!n||"error"===n.type)throw new t("no-response",{url:s.url})}catch(t){if(t instanceof Error)for(const i of e.iterateCallbacks("handlerDidError"))if(n=await i({error:t,event:a,request:s}),n)break;if(!n)throw t}for(const t of e.iterateCallbacks("handlerWillRespond"))n=await t({event:a,request:s,response:n});return n}async _awaitComplete(e,t,s,a){let n,i;try{n=await e}catch(i){}try{await t.runCallbacks("handlerDidRespond",{event:a,request:s,response:n}),await t.doneWaiting()}catch(e){e instanceof Error&&(i=e)}if(await t.runCallbacks("handlerDidComplete",{event:a,request:s,response:n,error:i}),t.destroy(),i)throw i}}{constructor(e={}){e.cacheName=i(e.cacheName),super(e),this._fallbackToNetwork=!1!==e.fallbackToNetwork,this.plugins.push(_.copyRedirectedCacheableResponsesPlugin)}async _handle(e,t){const s=await t.cacheMatch(e);return s||(t.event&&"install"===t.event.type?await this._handleInstall(e,t):await this._handleFetch(e,t))}async _handleFetch(e,s){let a;const n=s.params||{};if(!this._fallbackToNetwork)throw new t("missing-precache-entry",{cacheName:this.cacheName,url:e.url});{0;const t=n.integrity,i=e.integrity,r=!i||i===t;if(a=await s.fetch(new Request(e,{integrity:i||t})),t&&r){this._useDefaultCacheabilityPluginIfNeeded();await s.cachePut(e,a.clone());0}}return a}async _handleInstall(e,s){this._useDefaultCacheabilityPluginIfNeeded();const a=await s.fetch(e);if(!await s.cachePut(e,a.clone()))throw new t("bad-precaching-response",{url:e.url,status:a.status});return a}_useDefaultCacheabilityPluginIfNeeded(){let e=null,t=0;for(const[s,a]of this.plugins.entries())a!==_.copyRedirectedCacheableResponsesPlugin&&(a===_.defaultPrecacheCacheabilityPlugin&&(e=s),a.cacheWillUpdate&&t++);0===t?this.plugins.push(_.defaultPrecacheCacheabilityPlugin):t>1&&null!==e&&this.plugins.splice(e,1)}}_.defaultPrecacheCacheabilityPlugin={cacheWillUpdate:async({response:e})=>!e||e.status>=400?null:e},_.copyRedirectedCacheableResponsesPlugin={cacheWillUpdate:async({response:e})=>e.redirected?await f(e):e};class v{constructor({cacheName:e,plugins:t=[],fallbackToNetwork:s=!0}={}){this._urlsToCacheKeys=new Map,this._urlsToCacheModes=new Map,this._cacheKeysToIntegrities=new Map,this._strategy=new _({cacheName:i(e),plugins:[...t,new l({precacheController:this})],fallbackToNetwork:s}),this.install=this.install.bind(this),this.activate=this.activate.bind(this)}get strategy(){return this._strategy}precache(e){this.addToCacheList(e),this._installAndActiveListenersAdded||(self.addEventListener("install",this.install),self.addEventListener("activate",this.activate),this._installAndActiveListenersAdded=!0)}addToCacheList(e){const s=[];for(const a of e){"string"==typeof a?s.push(a):a&&void 0===a.revision&&s.push(a.url);const{cacheKey:e,url:n}=o(a),i="string"!=typeof a&&a.revision?"reload":"default";if(this._urlsToCacheKeys.has(n)&&this._urlsToCacheKeys.get(n)!==e)throw new t("add-to-cache-list-conflicting-entries",{firstEntry:this._urlsToCacheKeys.get(n),secondEntry:e});if("string"!=typeof a&&a.integrity){if(this._cacheKeysToIntegrities.has(e)&&this._cacheKeysToIntegrities.get(e)!==a.integrity)throw new t("add-to-cache-list-conflicting-integrities",{url:n});this._cacheKeysToIntegrities.set(e,a.integrity)}if(this._urlsToCacheKeys.set(n,e),this._urlsToCacheModes.set(n,i),s.length>0){const e=`Workbox is precaching URLs without revision info: ${s.join(", ")}\nThis is generally NOT safe. Learn more at https://bit.ly/wb-precache`;console.warn(e)}}}install(e){return c(e,(async()=>{const t=new h;this.strategy.plugins.push(t);for(const[t,s]of this._urlsToCacheKeys){const a=this._cacheKeysToIntegrities.get(s),n=this._urlsToCacheModes.get(t),i=new Request(t,{integrity:a,cache:n,credentials:"same-origin"});await Promise.all(this.strategy.handleAll({params:{cacheKey:s},request:i,event:e}))}const{updatedURLs:s,notUpdatedURLs:a}=t;return{updatedURLs:s,notUpdatedURLs:a}}))}activate(e){return c(e,(async()=>{const e=await self.caches.open(this.strategy.cacheName),t=await e.keys(),s=new Set(this._urlsToCacheKeys.values()),a=[];for(const n of t)s.has(n.url)||(await e.delete(n),a.push(n.url));return{deletedURLs:a}}))}getURLsToCacheKeys(){return this._urlsToCacheKeys}getCachedURLs(){return[...this._urlsToCacheKeys.keys()]}getCacheKeyForURL(e){const t=new URL(e,location.href);return this._urlsToCacheKeys.get(t.href)}getIntegrityForCacheKey(e){return this._cacheKeysToIntegrities.get(e)}async matchPrecache(e){const t=e instanceof Request?e.url:e,s=this.getCacheKeyForURL(t);if(s){return(await self.caches.open(this.strategy.cacheName)).match(s)}}createHandlerBoundToURL(e){const s=this.getCacheKeyForURL(e);if(!s)throw new t("non-precached-url",{url:e});return t=>(t.request=new Request(e),t.params=Object.assign({cacheKey:s},t.params),this.strategy.handle(t))}}s(80);(async()=>{const e=function(){const e=JSON.parse(new URLSearchParams(self.location.search).get("params"));return e.debug&&console.log("[Docusaurus-PWA][SW]: Service Worker params:",e),e}(),t=[{"revision":"ec5b6925d3851be6a06b0b9c7d82ea06","url":"404.html"},{"revision":"95ab71d0e8c893bb88d08c59337cb7e4","url":"assets/css/styles.ec40c98d.css"},{"revision":"36a0c5682099ec92e262f8ff91ef76a5","url":"assets/js/02a46a75.75ba675f.js"},{"revision":"1a35a0b35f93b2749b344fc3524eccb8","url":"assets/js/0e384e19.33460934.js"},{"revision":"6a141797c58763f70dabd8c0d025b5c9","url":"assets/js/131.b9bfc6a4.js"},{"revision":"ac1dd33df08fa4ce3edf3de2b0190336","url":"assets/js/17896441.42201da1.js"},{"revision":"6a2204ec1731fd10c371c28c5fa33cf2","url":"assets/js/1be78505.0927ab11.js"},{"revision":"5c1824ba3510f7ee83cfc112827d2585","url":"assets/js/1d4a91a3.4629643f.js"},{"revision":"2e02f253f9f261169b1c26ab76e6c207","url":"assets/js/230.d9c1936c.js"},{"revision":"5656fe7e3f2b8cc490e4e9ecc5d9b3f0","url":"assets/js/283.10375697.js"},{"revision":"52646a1d9e294fe1d8c25542898f6d39","url":"assets/js/2a453410.ba0e52b3.js"},{"revision":"7a3232678ed7d6c1cead2d76eb55a1b1","url":"assets/js/2fa65207.6255d3e0.js"},{"revision":"1ba1453b772704e1560e1f6656fbe7ae","url":"assets/js/36433dca.68595e7d.js"},{"revision":"e00e0398993f5221dc011a57b71858f6","url":"assets/js/383fb4d4.29747915.js"},{"revision":"0e3f18da6ca143866e68bf6c1c45e279","url":"assets/js/3c0140d7.914d4f11.js"},{"revision":"2d3dcb7c1ae9bbea92a06ff5818014b2","url":"assets/js/3d834173.f49c09fb.js"},{"revision":"15fa714a23fed262e1a9e0f1fd387bc5","url":"assets/js/3ed3a75b.807b7ba9.js"},{"revision":"d5eee95cb363399a6ea242d00b780a14","url":"assets/js/560d8297.bd6f371b.js"},{"revision":"196c08c942e26aa4c68dce65cb45ae87","url":"assets/js/5897bde7.acd04dc2.js"},{"revision":"692c04839297864d75d7bff4f437f876","url":"assets/js/58e36e06.f52eb259.js"},{"revision":"6abd218f2bcd856bd781677e1feb12c2","url":"assets/js/608.bb6d7611.js"},{"revision":"2b1a8821c7be77da3aa10d352e5686a0","url":"assets/js/61196cfa.359167f7.js"},{"revision":"6e3d5e95094d5cdd30eccc9e1b60a4a3","url":"assets/js/692fcdae.9827b823.js"},{"revision":"d85feb7073b50323dd5c20530814bf7e","url":"assets/js/6bc8de31.1fae87a5.js"},{"revision":"b830db39bcf4039b35b0d23d62d093ab","url":"assets/js/7698d8c8.693b1df8.js"},{"revision":"1fbe5714f08cd058f4100c6355e3cfd4","url":"assets/js/91719928.8e1c4c8d.js"},{"revision":"3adcb4603da59b3e6ccd4c568a5789e6","url":"assets/js/924eb06f.813a7489.js"},{"revision":"1f4a65cda2182e710c9e80371dbaf2ea","url":"assets/js/935f2afb.a928cb25.js"},{"revision":"7244e237f8b830e5b628695343064943","url":"assets/js/ba3d10c8.2ecc8b94.js"},{"revision":"1581024050befc35c3e25ec912e39bbd","url":"assets/js/c006647d.b3f60a25.js"},{"revision":"0ef536808ebaf7abe512193f78bb6993","url":"assets/js/cb165134.9bbbe8ac.js"},{"revision":"857d452491da84d925ae2f44dbbbd0e8","url":"assets/js/e379451d.91f5e3e5.js"},{"revision":"3ad856befb2430732c41732fcf89c39c","url":"assets/js/e8ad4079.79ab1e3f.js"},{"revision":"ee51a07c3457eac30f44616e03f47dfd","url":"assets/js/faea993e.8dd2ea80.js"},{"revision":"6406139277e5cd9891b1f7011e02e5ba","url":"assets/js/main.8f5ac88b.js"},{"revision":"1f62187acd84fa5fdc32c4cd5115e1f9","url":"assets/js/runtime~main.48f482bc.js"},{"revision":"404d0d928955a4d31438a2568a1d2a16","url":"Emergency_Situations/Bleeding.html"},{"revision":"b3c87443c8a05c2a897c0d3fb1643cd5","url":"Emergency_Situations/Hypercalcaemia.html"},{"revision":"db74a3b57079b1aa4695139721f27ba5","url":"Emergency_Situations/Seizures.html"},{"revision":"b7cb01819f31f910fd667524b1392ed5","url":"Emergency_Situations/Spinal_Cord.html"},{"revision":"f4968251df6e5720e3f47ec8ad5d0b54","url":"Emergency_Situations/Superior_Vena_Cava.html"},{"revision":"3856ab8b9e8b9b2440af0b0eab25fadb","url":"EOL/Kidney.html"},{"revision":"051492506cd6d8caa104fd46bdbfe71e","url":"EOL/Liver.html"},{"revision":"bb7e8e1914a7b8de7636b316c75b4a83","url":"EOL/MouthCare.html"},{"revision":"12df225e2728f77f7ad577a1c26e1930","url":"index.html"},{"revision":"e9c79b322d60870c20e44ac627665abb","url":"manifest.json"},{"revision":"c78ab8a3d9ddadc037afe0792b8d5a25","url":"Symptom_Control/Anorexia_cachexia.html"},{"revision":"36402063e8b95c16a2a1afe12d5d2171","url":"Symptom_Control/BowelObstruction.html"},{"revision":"925416d9d316a207ce46ff338d475856","url":"Symptom_Control/Breathlessness.html"},{"revision":"34da46182994103f586c518a022e81ce","url":"Symptom_Control/Constipation.html"},{"revision":"2bbd95145a2ebfd2f0a77937302e9ed2","url":"Symptom_Control/Coughing.html"},{"revision":"e4fe1d5675a35fcaeba8759963119418","url":"Symptom_Control/Delirium.html"},{"revision":"ece2ee57762f2437f5c94cc126a037ac","url":"Symptom_Control/Depression.html"},{"revision":"2303f0a5c2910dd08de7796496fd3058","url":"Symptom_Control/Diarrhoea.html"},{"revision":"eb6a47c72f937cf8e8997d33ea0386de","url":"Symptom_Control/Hiccups.html"},{"revision":"2282c6d79226c6391b55f42be80594eb","url":"Symptom_Control/Itchiness.html"},{"revision":"c068274201753b0ffbeb4f6d8ef2b248","url":"Symptom_Control/NauseaVomiting.html"},{"revision":"5e7dcfe3a9393a88eaf7bd86cb969339","url":"Symptom_Control/PainSubmenu/Pain1.html"},{"revision":"f4794ef144ffd35fe7e2fabe6fe9d87c","url":"Symptom_Control/PainSubmenu/Pain2.html"},{"revision":"1f9cb1ffd490aa1732612770b5193f3c","url":"Symptom_Control/PainSubmenu/Pain3.html"},{"revision":"271fa47724d29f392c4d080f1e1a6d53","url":"Symptom_Control/PainSubmenu/Pain4.html"},{"revision":"f8d5406a8e52e6290a92d8fa6420fc21","url":"Symptom_Control/PainSubmenu/Pain5.html"},{"revision":"86c6e18712002892e7047b2f55d01d99","url":"assets/images/Icons-6d79f716a21407d696c522e4a90cc1ca.png"},{"revision":"86c6e18712002892e7047b2f55d01d99","url":"Icons.png"},{"revision":"4343e07bf942aefb5f334501958fbc0e","url":"img/favicon.ico"},{"revision":"aa4fa2cdc39d33f2ee3b8f245b6d30d9","url":"img/logo.svg"},{"revision":"66fb688b916c24325df428e4589b0b74","url":"img/pal-favicon.png"}],s=new v({fallbackToNetwork:!0});e.offlineMode&&(s.addToCacheList(t),e.debug&&console.log("[Docusaurus-PWA][SW]: addToCacheList",{precacheManifest:t})),await async function(e){}(),self.addEventListener("install",(t=>{e.debug&&console.log("[Docusaurus-PWA][SW]: install event",{event:t}),t.waitUntil(s.install(t))})),self.addEventListener("activate",(t=>{e.debug&&console.log("[Docusaurus-PWA][SW]: activate event",{event:t}),t.waitUntil(s.activate(t))})),self.addEventListener("fetch",(async t=>{if(e.offlineMode){const a=t.request.url,n=function(e){const t=[],s=new URL(e,self.location.href);return s.origin!==self.location.origin||(s.search="",s.hash="",t.push(s.href),s.pathname.endsWith("/")?t.push(`${s.href}index.html`):t.push(`${s.href}/index.html`)),t}(a);for(let i=0;i<n.length;i+=1){const r=n[i],c=s.getCacheKeyForURL(r);if(c){const s=caches.match(c);e.debug&&console.log("[Docusaurus-PWA][SW]: serving cached asset",{requestURL:a,possibleURL:r,possibleURLs:n,cacheKey:c,cachedResponse:s}),t.respondWith(s);break}}}})),self.addEventListener("message",(async t=>{e.debug&&console.log("[Docusaurus-PWA][SW]: message event",{event:t});"SKIP_WAITING"===(t.data&&t.data.type)&&self.skipWaiting()}))})()})()})();