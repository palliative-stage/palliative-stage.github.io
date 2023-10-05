(()=>{"use strict";var e={913:()=>{try{self["workbox:core:6.4.1"]&&_()}catch(e){}},977:()=>{try{self["workbox:precaching:6.4.1"]&&_()}catch(e){}},80:()=>{try{self["workbox:routing:6.4.1"]&&_()}catch(e){}},873:()=>{try{self["workbox:strategies:6.4.1"]&&_()}catch(e){}}},t={};function s(a){var n=t[a];if(void 0!==n)return n.exports;var i=t[a]={exports:{}};return e[a](i,i.exports,s),i.exports}(()=>{s(913);const e=(e,...t)=>{let s=e;return t.length>0&&(s+=` :: ${JSON.stringify(t)}`),s};class t extends Error{constructor(t,s){super(e(t,s)),this.name=t,this.details=s}}const a={googleAnalytics:"googleAnalytics",precache:"precache-v2",prefix:"workbox",runtime:"runtime",suffix:"undefined"!=typeof registration?registration.scope:""},n=e=>[a.prefix,e,a.suffix].filter((e=>e&&e.length>0)).join("-"),i=e=>e||n(a.precache),r=e=>e||n(a.runtime);function c(e,t){const s=t();return e.waitUntil(s),s}s(977);function o(e){if(!e)throw new t("add-to-cache-list-unexpected-type",{entry:e});if("string"==typeof e){const t=new URL(e,location.href);return{cacheKey:t.href,url:t.href}}const{revision:s,url:a}=e;if(!a)throw new t("add-to-cache-list-unexpected-type",{entry:e});if(!s){const e=new URL(a,location.href);return{cacheKey:e.href,url:e.href}}const n=new URL(a,location.href),i=new URL(a,location.href);return n.searchParams.set("__WB_REVISION__",s),{cacheKey:n.href,url:i.href}}class h{constructor(){this.updatedURLs=[],this.notUpdatedURLs=[],this.handlerWillStart=async({request:e,state:t})=>{t&&(t.originalRequest=e)},this.cachedResponseWillBeUsed=async({event:e,state:t,cachedResponse:s})=>{if("install"===e.type&&t&&t.originalRequest&&t.originalRequest instanceof Request){const e=t.originalRequest.url;s?this.notUpdatedURLs.push(e):this.updatedURLs.push(e)}return s}}}class l{constructor({precacheController:e}){this.cacheKeyWillBeUsed=async({request:e,params:t})=>{const s=(null==t?void 0:t.cacheKey)||this._precacheController.getCacheKeyForURL(e.url);return s?new Request(s,{headers:e.headers}):e},this._precacheController=e}}let u;async function f(e,s){let a=null;if(e.url){a=new URL(e.url).origin}if(a!==self.location.origin)throw new t("cross-origin-copy-response",{origin:a});const n=e.clone(),i={headers:new Headers(n.headers),status:n.status,statusText:n.statusText},r=s?s(i):i,c=function(){if(void 0===u){const e=new Response("");if("body"in e)try{new Response(e.body),u=!0}catch(e){u=!1}u=!1}return u}()?n.body:await n.blob();return new Response(c,r)}function d(e,t){const s=new URL(e);for(const e of t)s.searchParams.delete(e);return s.href}class p{constructor(){this.promise=new Promise(((e,t)=>{this.resolve=e,this.reject=t}))}}const g=new Set;s(873);function y(e){return"string"==typeof e?new Request(e):e}class w{constructor(e,t){this._cacheKeys={},Object.assign(this,t),this.event=t.event,this._strategy=e,this._handlerDeferred=new p,this._extendLifetimePromises=[],this._plugins=[...e.plugins],this._pluginStateMap=new Map;for(const e of this._plugins)this._pluginStateMap.set(e,{});this.event.waitUntil(this._handlerDeferred.promise)}async fetch(e){const{event:s}=this;let a=y(e);if("navigate"===a.mode&&s instanceof FetchEvent&&s.preloadResponse){const e=await s.preloadResponse;if(e)return e}const n=this.hasCallback("fetchDidFail")?a.clone():null;try{for(const e of this.iterateCallbacks("requestWillFetch"))a=await e({request:a.clone(),event:s})}catch(e){if(e instanceof Error)throw new t("plugin-error-request-will-fetch",{thrownErrorMessage:e.message})}const i=a.clone();try{let e;e=await fetch(a,"navigate"===a.mode?void 0:this._strategy.fetchOptions);for(const t of this.iterateCallbacks("fetchDidSucceed"))e=await t({event:s,request:i,response:e});return e}catch(e){throw n&&await this.runCallbacks("fetchDidFail",{error:e,event:s,originalRequest:n.clone(),request:i.clone()}),e}}async fetchAndCachePut(e){const t=await this.fetch(e),s=t.clone();return this.waitUntil(this.cachePut(e,s)),t}async cacheMatch(e){const t=y(e);let s;const{cacheName:a,matchOptions:n}=this._strategy,i=await this.getCacheKey(t,"read"),r=Object.assign(Object.assign({},n),{cacheName:a});s=await caches.match(i,r);for(const e of this.iterateCallbacks("cachedResponseWillBeUsed"))s=await e({cacheName:a,matchOptions:n,cachedResponse:s,request:i,event:this.event})||void 0;return s}async cachePut(e,s){const a=y(e);var n;await(n=0,new Promise((e=>setTimeout(e,n))));const i=await this.getCacheKey(a,"write");if(!s)throw new t("cache-put-with-no-response",{url:(r=i.url,new URL(String(r),location.href).href.replace(new RegExp(`^${location.origin}`),""))});var r;const c=await this._ensureResponseSafeToCache(s);if(!c)return!1;const{cacheName:o,matchOptions:h}=this._strategy,l=await self.caches.open(o),u=this.hasCallback("cacheDidUpdate"),f=u?await async function(e,t,s,a){const n=d(t.url,s);if(t.url===n)return e.match(t,a);const i=Object.assign(Object.assign({},a),{ignoreSearch:!0}),r=await e.keys(t,i);for(const t of r)if(n===d(t.url,s))return e.match(t,a)}(l,i.clone(),["__WB_REVISION__"],h):null;try{await l.put(i,u?c.clone():c)}catch(e){if(e instanceof Error)throw"QuotaExceededError"===e.name&&await async function(){for(const e of g)await e()}(),e}for(const e of this.iterateCallbacks("cacheDidUpdate"))await e({cacheName:o,oldResponse:f,newResponse:c.clone(),request:i,event:this.event});return!0}async getCacheKey(e,t){const s=`${e.url} | ${t}`;if(!this._cacheKeys[s]){let a=e;for(const e of this.iterateCallbacks("cacheKeyWillBeUsed"))a=y(await e({mode:t,request:a,event:this.event,params:this.params}));this._cacheKeys[s]=a}return this._cacheKeys[s]}hasCallback(e){for(const t of this._strategy.plugins)if(e in t)return!0;return!1}async runCallbacks(e,t){for(const s of this.iterateCallbacks(e))await s(t)}*iterateCallbacks(e){for(const t of this._strategy.plugins)if("function"==typeof t[e]){const s=this._pluginStateMap.get(t),a=a=>{const n=Object.assign(Object.assign({},a),{state:s});return t[e](n)};yield a}}waitUntil(e){return this._extendLifetimePromises.push(e),e}async doneWaiting(){let e;for(;e=this._extendLifetimePromises.shift();)await e}destroy(){this._handlerDeferred.resolve(null)}async _ensureResponseSafeToCache(e){let t=e,s=!1;for(const e of this.iterateCallbacks("cacheWillUpdate"))if(t=await e({request:this.request,response:t,event:this.event})||void 0,s=!0,!t)break;return s||t&&200!==t.status&&(t=void 0),t}}class _ extends class{constructor(e={}){this.cacheName=r(e.cacheName),this.plugins=e.plugins||[],this.fetchOptions=e.fetchOptions,this.matchOptions=e.matchOptions}handle(e){const[t]=this.handleAll(e);return t}handleAll(e){e instanceof FetchEvent&&(e={event:e,request:e.request});const t=e.event,s="string"==typeof e.request?new Request(e.request):e.request,a="params"in e?e.params:void 0,n=new w(this,{event:t,request:s,params:a}),i=this._getResponse(n,s,t);return[i,this._awaitComplete(i,n,s,t)]}async _getResponse(e,s,a){let n;await e.runCallbacks("handlerWillStart",{event:a,request:s});try{if(n=await this._handle(s,e),!n||"error"===n.type)throw new t("no-response",{url:s.url})}catch(t){if(t instanceof Error)for(const i of e.iterateCallbacks("handlerDidError"))if(n=await i({error:t,event:a,request:s}),n)break;if(!n)throw t}for(const t of e.iterateCallbacks("handlerWillRespond"))n=await t({event:a,request:s,response:n});return n}async _awaitComplete(e,t,s,a){let n,i;try{n=await e}catch(i){}try{await t.runCallbacks("handlerDidRespond",{event:a,request:s,response:n}),await t.doneWaiting()}catch(e){e instanceof Error&&(i=e)}if(await t.runCallbacks("handlerDidComplete",{event:a,request:s,response:n,error:i}),t.destroy(),i)throw i}}{constructor(e={}){e.cacheName=i(e.cacheName),super(e),this._fallbackToNetwork=!1!==e.fallbackToNetwork,this.plugins.push(_.copyRedirectedCacheableResponsesPlugin)}async _handle(e,t){const s=await t.cacheMatch(e);return s||(t.event&&"install"===t.event.type?await this._handleInstall(e,t):await this._handleFetch(e,t))}async _handleFetch(e,s){let a;const n=s.params||{};if(!this._fallbackToNetwork)throw new t("missing-precache-entry",{cacheName:this.cacheName,url:e.url});{0;const t=n.integrity,i=e.integrity,r=!i||i===t;if(a=await s.fetch(new Request(e,{integrity:i||t})),t&&r){this._useDefaultCacheabilityPluginIfNeeded();await s.cachePut(e,a.clone());0}}return a}async _handleInstall(e,s){this._useDefaultCacheabilityPluginIfNeeded();const a=await s.fetch(e);if(!await s.cachePut(e,a.clone()))throw new t("bad-precaching-response",{url:e.url,status:a.status});return a}_useDefaultCacheabilityPluginIfNeeded(){let e=null,t=0;for(const[s,a]of this.plugins.entries())a!==_.copyRedirectedCacheableResponsesPlugin&&(a===_.defaultPrecacheCacheabilityPlugin&&(e=s),a.cacheWillUpdate&&t++);0===t?this.plugins.push(_.defaultPrecacheCacheabilityPlugin):t>1&&null!==e&&this.plugins.splice(e,1)}}_.defaultPrecacheCacheabilityPlugin={cacheWillUpdate:async({response:e})=>!e||e.status>=400?null:e},_.copyRedirectedCacheableResponsesPlugin={cacheWillUpdate:async({response:e})=>e.redirected?await f(e):e};class v{constructor({cacheName:e,plugins:t=[],fallbackToNetwork:s=!0}={}){this._urlsToCacheKeys=new Map,this._urlsToCacheModes=new Map,this._cacheKeysToIntegrities=new Map,this._strategy=new _({cacheName:i(e),plugins:[...t,new l({precacheController:this})],fallbackToNetwork:s}),this.install=this.install.bind(this),this.activate=this.activate.bind(this)}get strategy(){return this._strategy}precache(e){this.addToCacheList(e),this._installAndActiveListenersAdded||(self.addEventListener("install",this.install),self.addEventListener("activate",this.activate),this._installAndActiveListenersAdded=!0)}addToCacheList(e){const s=[];for(const a of e){"string"==typeof a?s.push(a):a&&void 0===a.revision&&s.push(a.url);const{cacheKey:e,url:n}=o(a),i="string"!=typeof a&&a.revision?"reload":"default";if(this._urlsToCacheKeys.has(n)&&this._urlsToCacheKeys.get(n)!==e)throw new t("add-to-cache-list-conflicting-entries",{firstEntry:this._urlsToCacheKeys.get(n),secondEntry:e});if("string"!=typeof a&&a.integrity){if(this._cacheKeysToIntegrities.has(e)&&this._cacheKeysToIntegrities.get(e)!==a.integrity)throw new t("add-to-cache-list-conflicting-integrities",{url:n});this._cacheKeysToIntegrities.set(e,a.integrity)}if(this._urlsToCacheKeys.set(n,e),this._urlsToCacheModes.set(n,i),s.length>0){const e=`Workbox is precaching URLs without revision info: ${s.join(", ")}\nThis is generally NOT safe. Learn more at https://bit.ly/wb-precache`;console.warn(e)}}}install(e){return c(e,(async()=>{const t=new h;this.strategy.plugins.push(t);for(const[t,s]of this._urlsToCacheKeys){const a=this._cacheKeysToIntegrities.get(s),n=this._urlsToCacheModes.get(t),i=new Request(t,{integrity:a,cache:n,credentials:"same-origin"});await Promise.all(this.strategy.handleAll({params:{cacheKey:s},request:i,event:e}))}const{updatedURLs:s,notUpdatedURLs:a}=t;return{updatedURLs:s,notUpdatedURLs:a}}))}activate(e){return c(e,(async()=>{const e=await self.caches.open(this.strategy.cacheName),t=await e.keys(),s=new Set(this._urlsToCacheKeys.values()),a=[];for(const n of t)s.has(n.url)||(await e.delete(n),a.push(n.url));return{deletedURLs:a}}))}getURLsToCacheKeys(){return this._urlsToCacheKeys}getCachedURLs(){return[...this._urlsToCacheKeys.keys()]}getCacheKeyForURL(e){const t=new URL(e,location.href);return this._urlsToCacheKeys.get(t.href)}getIntegrityForCacheKey(e){return this._cacheKeysToIntegrities.get(e)}async matchPrecache(e){const t=e instanceof Request?e.url:e,s=this.getCacheKeyForURL(t);if(s){return(await self.caches.open(this.strategy.cacheName)).match(s)}}createHandlerBoundToURL(e){const s=this.getCacheKeyForURL(e);if(!s)throw new t("non-precached-url",{url:e});return t=>(t.request=new Request(e),t.params=Object.assign({cacheKey:s},t.params),this.strategy.handle(t))}}s(80);(async()=>{const e=function(){const e=JSON.parse(new URLSearchParams(self.location.search).get("params"));return e.debug&&console.log("[Docusaurus-PWA][SW]: Service Worker params:",e),e}(),t=[{"revision":"27aa9294306ae23cd858a749f68f4370","url":"404.html"},{"revision":"43fe650930d4a1cb918d392bf3d57780","url":"assets/css/styles.1345c406.css"},{"revision":"7bd05971bb492e5cdf54ccd0b57f3afc","url":"assets/js/02a46a75.6e6a0d29.js"},{"revision":"85076831974f7d35b6c511255ae244a8","url":"assets/js/05245a82.a09943a7.js"},{"revision":"f605c0957b9f318d77bab8ea282ab442","url":"assets/js/0e384e19.21501390.js"},{"revision":"6a141797c58763f70dabd8c0d025b5c9","url":"assets/js/131.b9bfc6a4.js"},{"revision":"8652dec106828dedf446df4b4ecb9a47","url":"assets/js/16b5735a.e95a62c4.js"},{"revision":"ac1dd33df08fa4ce3edf3de2b0190336","url":"assets/js/17896441.42201da1.js"},{"revision":"6a2204ec1731fd10c371c28c5fa33cf2","url":"assets/js/1be78505.0927ab11.js"},{"revision":"2e02f253f9f261169b1c26ab76e6c207","url":"assets/js/230.d9c1936c.js"},{"revision":"d2f01b31ddb4c6cb5b39482eebdd64ea","url":"assets/js/24f21787.a54bd0aa.js"},{"revision":"5656fe7e3f2b8cc490e4e9ecc5d9b3f0","url":"assets/js/283.10375697.js"},{"revision":"4c51193365d1bf8ac04b572a637c65e4","url":"assets/js/2fb3e5d1.10956c34.js"},{"revision":"df9b81cda28dd7c3211215edc0f3a402","url":"assets/js/383fb4d4.0ff092e8.js"},{"revision":"aeeaf92841ff01d4a4fed36d3ab3c304","url":"assets/js/3d1e2607.2590edd6.js"},{"revision":"2d7082ce16e59be634a6a617f9698482","url":"assets/js/3fda9635.4fc010f6.js"},{"revision":"9efdaf163adf4bae1a8c1245cd851867","url":"assets/js/58e36e06.d98eb4b1.js"},{"revision":"6abd218f2bcd856bd781677e1feb12c2","url":"assets/js/608.bb6d7611.js"},{"revision":"2bfe6552812e0520e56f85353b367bad","url":"assets/js/61b8ba19.f5fba8f2.js"},{"revision":"f87c334d4f9b67eddd01e196d13635e3","url":"assets/js/6f67c9f5.c2df3163.js"},{"revision":"f05b8f5272b7b6d0b64cfb8f018374ff","url":"assets/js/7ff0a669.bd12c2b6.js"},{"revision":"ae2b85f649842fb908af1b08272f1469","url":"assets/js/8b277495.73594645.js"},{"revision":"c892f0c27f22c8acb0d88310337803a0","url":"assets/js/935f2afb.7990f863.js"},{"revision":"9c66fbe555fce956b1d66a791350c6d3","url":"assets/js/a46a8f7a.a00ddbb0.js"},{"revision":"4018d33aa2de440b92e563f504d28c51","url":"assets/js/b7ced3bb.a40b8845.js"},{"revision":"bc4010d82fe97dc9421b2ae8fc3afad3","url":"assets/js/cee6205e.3443b038.js"},{"revision":"a7370ad3dc0a41e4f5c873531fee5cc1","url":"assets/js/e8ad4079.167b6d8c.js"},{"revision":"73d90a1e9340e0b3f36ec9684f10cda9","url":"assets/js/eaf39973.b2e6b35f.js"},{"revision":"b40f9083e8bca47034a1ca12c8b759d7","url":"assets/js/faea993e.911d4930.js"},{"revision":"f558764fe8c328c92401566349756a49","url":"assets/js/fcb28d21.3ddd3c7d.js"},{"revision":"fd106bb8f7241f06eb17130acb55d615","url":"assets/js/main.03bbd331.js"},{"revision":"fc29200446173deff1ae550a8150d16e","url":"assets/js/runtime~main.609d695e.js"},{"revision":"80a49f5f9f46a447bd7c49d85afddfa5","url":"Emergency_Situations/Bleeding.html"},{"revision":"08e19e97b3e351dbf5e95b7a970490f0","url":"Emergency_Situations/Hypercalcaemia.html"},{"revision":"3f7466a1b9099993bd7d135ff5a214db","url":"Emergency_Situations/Seizures.html"},{"revision":"eaaf2df31da5dba917f3a0dc5e3ac9da","url":"Emergency_Situations/Spinal_Cord.html"},{"revision":"40ac4481620d0db8775c1a2c5ff33687","url":"Emergency_Situations/Superior_Vena_Cava.html"},{"revision":"8dd7114f83c7de740ce3472a7d6b78b3","url":"index.html"},{"revision":"e9c79b322d60870c20e44ac627665abb","url":"manifest.json"},{"revision":"358f295518e164200c3884b44085a032","url":"test/Anorexia_cachexia.html"},{"revision":"d5912beca0ed04473e458db3a73c1ad8","url":"test/BowelObstruction.html"},{"revision":"93b197807f6271bfee8e378fe9cb006a","url":"test/Breathlessness.html"},{"revision":"c25746e3df861f1d518c015a5fed5ce3","url":"test/Constipation.html"},{"revision":"1f31e75c8629ed256dff16e3f90e1e97","url":"test/Coughing.html"},{"revision":"1813344e04d6ed74e98e339fab9a28d5","url":"test/Delirium.html"},{"revision":"6b064499bbe66d72f0ebad26d980d0e6","url":"test/Depression.html"},{"revision":"589231760990a95ffe307aeec568f0e4","url":"test/Diarrhoea.html"},{"revision":"e275b5bf92fb1e0998d6d6f51553b856","url":"test/Hiccups.html"},{"revision":"e18cc502bacb93e3025a02a4f04d73bc","url":"test/Itchiness.html"},{"revision":"2caea898e45e8ebe298f23f90b54dbcf","url":"test/NauseaVomiting.html"},{"revision":"48a6669f7d0f37b9fe4ee06a7cda67c2","url":"test/Pain.html"},{"revision":"eced84233cda743a253b8e4ea2fca871","url":"tutorial-basics/Kidney.html"},{"revision":"e31327ee5a22e79b8874a341624e30e1","url":"tutorial-basics/Liver.html"},{"revision":"1dd378bb522edb096d0d0ab3f90725c9","url":"tutorial-basics/MouthCare.html"},{"revision":"1f897f3c8c07a2c9c4f8c663b78b2d3c","url":"assets/images/Icons-b524a20ea8b03ba21a2771aa9120b0c7.png"},{"revision":"1f897f3c8c07a2c9c4f8c663b78b2d3c","url":"Icons.png"},{"revision":"4343e07bf942aefb5f334501958fbc0e","url":"img/favicon.ico"},{"revision":"aa4fa2cdc39d33f2ee3b8f245b6d30d9","url":"img/logo.svg"},{"revision":"66fb688b916c24325df428e4589b0b74","url":"img/pal-favicon.png"}],s=new v({fallbackToNetwork:!0});e.offlineMode&&(s.addToCacheList(t),e.debug&&console.log("[Docusaurus-PWA][SW]: addToCacheList",{precacheManifest:t})),await async function(e){}(),self.addEventListener("install",(t=>{e.debug&&console.log("[Docusaurus-PWA][SW]: install event",{event:t}),t.waitUntil(s.install(t))})),self.addEventListener("activate",(t=>{e.debug&&console.log("[Docusaurus-PWA][SW]: activate event",{event:t}),t.waitUntil(s.activate(t))})),self.addEventListener("fetch",(async t=>{if(e.offlineMode){const a=t.request.url,n=function(e){const t=[],s=new URL(e,self.location.href);return s.origin!==self.location.origin||(s.search="",s.hash="",t.push(s.href),s.pathname.endsWith("/")?t.push(`${s.href}index.html`):t.push(`${s.href}/index.html`)),t}(a);for(let i=0;i<n.length;i+=1){const r=n[i],c=s.getCacheKeyForURL(r);if(c){const s=caches.match(c);e.debug&&console.log("[Docusaurus-PWA][SW]: serving cached asset",{requestURL:a,possibleURL:r,possibleURLs:n,cacheKey:c,cachedResponse:s}),t.respondWith(s);break}}}})),self.addEventListener("message",(async t=>{e.debug&&console.log("[Docusaurus-PWA][SW]: message event",{event:t});"SKIP_WAITING"===(t.data&&t.data.type)&&self.skipWaiting()}))})()})()})();