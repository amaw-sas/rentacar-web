export const GTAG_MEASUREMENT_ID = 'G-ZPZC1TP9T0'
export const GTAG_FALLBACK_DELAY_MS = 8_000

/**
 * Inline GA4 bootstrap used in the SSR head.
 *
 * The dataLayer stub exists before Nuxt hydrates, so analytics calls made while
 * gtag.js is deferred remain ordered in the standard Google queue. The vendor
 * script consumes that existing queue when it starts. pointerdown runs before
 * a contact link's click handler, ensuring that the load starts while the click
 * event itself is still queued safely by the stub.
 */
export const DEFERRED_GTAG_BOOTSTRAP = `(()=>{const w=window,d=document,id='${GTAG_MEASUREMENT_ID}',events=['pointerdown','touchstart','keydown','scroll'];w.dataLayer=w.dataLayer||[];w.gtag=w.gtag||function(){w.dataLayer.push(arguments)};w.gtag('js',new Date());w.gtag('config',id,{send_page_view:false});let started=false,timer;const schedule=()=>{timer=w.setTimeout(load,${GTAG_FALLBACK_DELAY_MS})};const cleanup=()=>{events.forEach(event=>w.removeEventListener(event,load));w.removeEventListener('load',schedule);if(timer!==undefined)w.clearTimeout(timer)};const load=()=>{if(started)return;started=true;cleanup();if(d.querySelector('script[data-deferred-gtag]'))return;const script=d.createElement('script');script.async=true;script.src='https://www.googletagmanager.com/gtag/js?id='+encodeURIComponent(id);script.dataset.deferredGtag='';d.head.appendChild(script)};events.forEach(event=>w.addEventListener(event,load,{once:true,passive:true}));if(d.readyState==='complete')schedule();else w.addEventListener('load',schedule,{once:true})})();`
