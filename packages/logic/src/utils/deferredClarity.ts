export const CLARITY_FALLBACK_DELAY_MS = 4_000

/**
 * Inline Microsoft Clarity bootstrap for the SSR head.
 *
 * Mirrors the official snippet's `window.clarity` queue stub so any early
 * `clarity(...)` call is kept, but the vendor tag stays off the critical path:
 * it loads on the first interaction or 4s after window.load, like the deferred
 * gtag on alquilame.
 */
export function deferredClarityBootstrap(projectId: string): string {
  if (!/^[a-z0-9]+$/i.test(projectId)) throw new Error(`Invalid Clarity project id: ${projectId}`)
  return `(()=>{const w=window,d=document,id='${projectId}',events=['pointerdown','touchstart','keydown','scroll'];w.clarity=w.clarity||function(){(w.clarity.q=w.clarity.q||[]).push(arguments)};let started=false,timer;const schedule=()=>{timer=w.setTimeout(load,${CLARITY_FALLBACK_DELAY_MS})};const cleanup=()=>{events.forEach(event=>w.removeEventListener(event,load));w.removeEventListener('load',schedule);if(timer!==undefined)w.clearTimeout(timer)};const load=()=>{if(started)return;started=true;cleanup();if(d.querySelector('script[data-deferred-clarity]'))return;const script=d.createElement('script');script.async=true;script.src='https://www.clarity.ms/tag/'+id;script.dataset.deferredClarity='';d.head.appendChild(script)};events.forEach(event=>w.addEventListener(event,load,{once:true,passive:true}));if(d.readyState==='complete')schedule();else w.addEventListener('load',schedule,{once:true})})();`
}
