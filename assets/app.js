/* =====================================================================
   Yuet Wan London — shared helpers (used by all pages + the editor)
   ===================================================================== */
window.YW = (function(){
  const API = "https://script.google.com/macros/s/AKfycbyUoOwvu32QbKPaLIueyJFFSqft0b7qoASYEImHE3Mj-kRBxphaLbm1yyuXigFfiDKDrw/exec";
  const DATA_URL = "/data.json"; // static snapshot baked by the GitHub Action (Jamstack)
  const MON = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const CAT_ZH = {Performance:"演出",Workshop:"工作坊",Talk:"講座",Music:"音樂"};
  const TINT = {Performance:"#C8402E",Workshop:"#2E7E72",Talk:"#B8893C",Music:"#3E6E84"};
  const ICON = {
    Performance:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16v7a8 8 0 0 1-16 0z"/><path d="M8.5 10c.7-.6 1.8-.6 2.5 0"/><path d="M13 10c.7-.6 1.8-.6 2.5 0"/><path d="M9 14c1.2 1.1 4.8 1.1 6 0"/></svg>',
    Workshop:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M7 12V6.6a1.5 1.5 0 0 1 3 0V11M10 11V5.6a1.5 1.5 0 0 1 3 0V11M13 11.5V7a1.5 1.5 0 0 1 3 0v6a6 6 0 0 1-6 6 6 6 0 0 1-4.5-2L4 14.6a1.6 1.6 0 0 1 2.3-2.1L8 14"/></svg>',
    Talk:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5h16a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H9l-4 3v-3H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z"/><path d="M8 9.5h8M8 12.5h5"/></svg>',
    Music:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V6l11-2v11"/><circle cx="6" cy="18" r="2.6"/><circle cx="17" cy="15" r="2.6"/></svg>'
  };
  const USER_ICON='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>';

  function esc(s){return String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");}
  function isTrue(v){return v===true||String(v).toUpperCase()==="TRUE";}
  function lines(s){return String(s||"").split(/\n+/).map(x=>x.trim()).filter(Boolean);}
  function lat(){const id="l"+Math.random().toString(36).slice(2,7);return '<svg class="lat" viewBox="0 0 200 200" preserveAspectRatio="xMidYMid slice"><defs><pattern id="'+id+'" width="40" height="70" patternUnits="userSpaceOnUse"><path d="M20 0 L40 11 L40 35 L20 46 L0 35 L0 11Z M20 46 L40 57 L40 81 M20 46 L0 57 L0 81" fill="none" stroke="#F4ECDD" stroke-width="1.3"/></pattern></defs><rect width="200" height="200" fill="url(#'+id+')"/></svg>';}
  function fmtDate(ev,lang){
    if(ev.date_label) return ev.date_label;
    const s=ev.date_start; if(!s) return "";
    const d=new Date(s); if(isNaN(d)) return s;
    return lang==="zh" ? `${d.getFullYear()}年${d.getMonth()+1}月${d.getDate()}日` : `${d.getDate()} ${MON[d.getMonth()]} ${d.getFullYear()}`;
  }
  function isPast(ev){
    const s=String(ev.status||"").toLowerCase();
    if(s==="past") return true; if(s==="upcoming") return false;
    const e=ev.date_end||ev.date_start;
    return e ? new Date(e) < new Date(new Date().toDateString()) : false;
  }
  /* Public pages: read the STATIC snapshot baked by the build (fast, CDN-served).
     Falls back to a locally cached copy, then to whatever the page provides. */
  let _dataP = null;
  async function fetchData(){
    if(_dataP) return _dataP;          // memoise: one request per page load
    _dataP = (async function(){
      try{
        const r = await fetch(DATA_URL, {cache:"no-cache"});
        if(!r.ok) throw new Error("data.json " + r.status);
        const j = await r.json();
        try{ localStorage.setItem("yw_data", JSON.stringify(j)); }catch(e){}
        return j;
      }catch(e){
        try{ const c = localStorage.getItem("yw_data"); if(c) return JSON.parse(c); }catch(_){}
        throw e;
      }
    })();
    return _dataP;
  }
  /* Editor only: always read LIVE from the Google Sheet so the admin edits current data. */
  async function fetchLive(){
    const r = await fetch(API, {cache:"no-store"});
    return r.json();
  }
  async function post(payload){
    const r=await fetch(API,{method:"POST",body:JSON.stringify(payload)}); return r.json();
  }
  /* Wipe locally cached data + any browser caches / service workers, so the next
     load pulls the freshest published snapshot. */
  async function clearCache(){
    _dataP = null;
    try{ localStorage.removeItem("yw_data"); }catch(e){}
    try{ if(self.caches){ const ks=await caches.keys(); await Promise.all(ks.map(function(k){return caches.delete(k);})); } }catch(e){}
    try{ if(navigator.serviceWorker && navigator.serviceWorker.getRegistrations){ const rs=await navigator.serviceWorker.getRegistrations(); await Promise.all(rs.map(function(r){return r.unregister();})); } }catch(e){}
    return true;
  }
  function settingsMap(arr){ const m={}; (arr||[]).forEach(s=>{ if(s.key) m[s.key]=s.value; }); return m; }

  /* language: swaps every [data-en]/[data-zh] node, sets <html lang>, toggles button label */
  function applyStaticLang(lang){
    document.documentElement.lang = lang==="zh" ? "zh-Hant" : "en";
    document.querySelectorAll("[data-en]").forEach(el=>{const v=el.getAttribute("data-"+lang); if(v!=null) el.textContent=v;});
    document.querySelectorAll("[data-en-ph]").forEach(el=>{const v=el.getAttribute("data-"+lang+"-ph"); if(v!=null) el.placeholder=v;});
    const t=document.getElementById("langtog"); if(t) t.textContent = lang==="en" ? "中文" : "EN";
  }
  /* wire the mobile burger menu */
  function setupNav(){
    const b=document.getElementById("burger"), n=document.getElementById("navlinks");
    if(b&&n){ b.onclick=()=>n.classList.toggle("open"); n.querySelectorAll("a").forEach(a=>a.onclick=()=>n.classList.remove("open")); }
  }

  /* language persistence: survives across pages via localStorage, shareable via ?lang=zh-hant */
  function loadLang(){
    var u=new URLSearchParams(location.search).get("lang");
    if(u) return u.toLowerCase().indexOf("zh")===0 ? "zh" : "en";
    try{ return localStorage.getItem("yw_lang")==="zh" ? "zh" : "en"; }catch(e){ return "en"; }
  }
  function saveLang(l){
    try{ localStorage.setItem("yw_lang", l); }catch(e){}
    try{ var url=new URL(location.href); url.searchParams.set("lang", l==="zh"?"zh-hant":"en"); history.replaceState(null,"",url); }catch(e){}
  }

  /* ---------- social links (footer) ---------- */
  const SOCIAL = {
    facebook:{name:"Facebook", bg:"#3b5998", svg:'<svg viewBox="0 0 24 24"><path d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07c0 6.02 4.39 11.01 10.13 11.93v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.96.93-1.96 1.89v2.25h3.33l-.53 3.49h-2.8v8.44C19.61 23.08 24 18.09 24 12.07Z"/></svg>'},
    instagram:{name:"Instagram", bg:"linear-gradient(45deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)", svg:'<svg viewBox="0 0 24 24"><path d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.43.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.43.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.7 3.7 0 0 1-1.38-.9 3.7 3.7 0 0 1-.9-1.38c-.16-.43-.36-1.06-.41-2.23C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.43-.16 1.06-.36 2.23-.41C8.42 2.17 8.8 2.16 12 2.16M12 0C8.74 0 8.33.01 7.05.07 5.78.13 4.9.33 4.14.63c-.79.3-1.46.72-2.13 1.38C1.35 2.68.93 3.35.63 4.14.33 4.9.13 5.78.07 7.05.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.06 1.27.26 2.15.56 2.91.3.79.72 1.46 1.38 2.13.67.66 1.34 1.08 2.13 1.38.76.3 1.64.5 2.91.56C8.33 23.99 8.74 24 12 24s3.67-.01 4.95-.07c1.27-.06 2.15-.26 2.91-.56a5.9 5.9 0 0 0 2.13-1.38 5.9 5.9 0 0 0 1.38-2.13c.3-.76.5-1.64.56-2.91.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95c-.06-1.27-.26-2.15-.56-2.91a5.9 5.9 0 0 0-1.38-2.13A5.9 5.9 0 0 0 19.86.63c-.76-.3-1.64-.5-2.91-.56C15.67.01 15.26 0 12 0Zm0 5.84a6.16 6.16 0 1 0 0 12.32 6.16 6.16 0 0 0 0-12.32ZM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8Zm6.41-10.85a1.44 1.44 0 1 0 0 2.88 1.44 1.44 0 0 0 0-2.88Z"/></svg>'},
    youtube:{name:"YouTube", bg:"#ff0000", svg:'<svg viewBox="0 0 24 24"><path d="M23.5 6.19a3.02 3.02 0 0 0-2.12-2.14C19.5 3.55 12 3.55 12 3.55s-7.5 0-9.38.5A3.02 3.02 0 0 0 .5 6.19C0 8.07 0 12 0 12s0 3.93.5 5.81a3.02 3.02 0 0 0 2.12 2.14c1.88.5 9.38.5 9.38.5s7.5 0 9.38-.5a3.02 3.02 0 0 0 2.12-2.14C24 15.93 24 12 24 12s0-3.93-.5-5.81ZM9.55 15.57V8.43L15.82 12l-6.27 3.57Z"/></svg>'},
    rednote:{name:"Rednote", bg:"#ff2e47", img:"/img/rednote-xiaohongshu.svg"},
    whatsapp:{name:"WhatsApp", bg:"#25d366", svg:'<svg viewBox="0 0 24 24"><path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.16-.17.2-.35.22-.64.08-.3-.15-1.26-.47-2.39-1.48-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.61-.92-2.21-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.07 2.88 1.21 3.07.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.69.62.71.23 1.36.2 1.87.12.57-.09 1.76-.72 2-1.41.25-.7.25-1.29.18-1.41-.08-.13-.27-.2-.57-.35M12.05 21.79h-.01a9.87 9.87 0 0 1-5.03-1.38l-.36-.21-3.74.98 1-3.65-.24-.37a9.86 9.86 0 0 1-1.51-5.26c0-5.45 4.44-9.88 9.89-9.88 2.64 0 5.12 1.03 6.99 2.9a9.83 9.83 0 0 1 2.89 6.99c0 5.45-4.43 9.88-9.88 9.88m8.41-18.3A11.82 11.82 0 0 0 12.05 0C5.5 0 .16 5.34.16 11.89c0 2.1.55 4.14 1.59 5.95L.06 24l6.3-1.65a11.88 11.88 0 0 0 5.68 1.45h.01c6.55 0 11.89-5.34 11.89-11.89 0-3.18-1.24-6.16-3.48-8.42Z"/></svg>'},
    x:{name:"X (Twitter)", bg:"#000000", svg:'<svg viewBox="0 0 24 24"><path d="M18.9 1.15h3.68l-8.04 9.19L24 22.85h-7.41l-5.8-7.58-6.64 7.58H.47l8.6-9.83L0 1.15h7.59l5.24 6.93 6.07-6.93Zm-1.29 19.5h2.04L6.49 3.24H4.3L17.61 20.64Z"/></svg>'},
    tiktok:{name:"TikTok", bg:"#000000", svg:'<svg viewBox="0 0 24 24"><path d="M12.53.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07Z"/></svg>'},
    linkedin:{name:"LinkedIn", bg:"#0e76a8", svg:'<svg viewBox="0 0 24 24"><path d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12Zm1.78 13.02H3.56V9h3.56v11.45ZM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45C23.2 24 24 23.23 24 22.27V1.73C24 .77 23.2 0 22.22 0Z"/></svg>'},
    pinterest:{name:"Pinterest", bg:"#bd081c", svg:'<svg viewBox="0 0 24 24"><path d="M12.02 0C5.4 0 .03 5.37.03 11.99c0 5.08 3.16 9.42 7.62 11.16-.11-.95-.2-2.4.04-3.44.22-.94 1.41-5.96 1.41-5.96s-.36-.72-.36-1.78c0-1.66.97-2.91 2.17-2.91 1.02 0 1.52.77 1.52 1.69 0 1.03-.65 2.57-.99 3.99-.29 1.19.6 2.17 1.78 2.17 2.13 0 3.77-2.25 3.77-5.49 0-2.86-2.06-4.87-5.01-4.87-3.41 0-5.41 2.56-5.41 5.2 0 1.03.39 2.14.89 2.74.1.12.11.23.08.35-.09.37-.29 1.2-.33 1.36-.05.22-.17.27-.4.17-1.5-.69-2.43-2.88-2.43-4.65 0-3.78 2.75-7.25 7.92-7.25 4.16 0 7.39 2.97 7.39 6.92 0 4.14-2.61 7.46-6.23 7.46-1.21 0-2.35-.63-2.76-1.38l-.75 2.85c-.27 1.04-1 2.35-1.5 3.15 1.12.35 2.31.53 3.55.53 6.61 0 11.99-5.36 11.99-11.99C23.97 5.39 18.59.02 11.98.02L12.02 0Z"/></svg>'}
  };
  function renderSocial(){
    var host=document.getElementById("socialLinks"); if(!host) return;
    fetchData().then(function(j){
      var list=((j&&j.social)||[]).slice().sort(function(a,b){return (+a.order||0)-(+b.order||0);});
      host.innerHTML=list.filter(function(s){return s.url && SOCIAL[String(s.platform||"").toLowerCase()];}).map(function(s){
        var p=SOCIAL[String(s.platform).toLowerCase()];
        var inner = p.img ? '<img class="simg" src="'+p.img+'" alt="">' : p.svg;
        return '<a href="'+esc(s.url)+'" target="_blank" rel="noopener" aria-label="'+esc(p.name)+'" style="background:'+p.bg+'">'+inner+'</a>';
      }).join("");
    }).catch(function(){});
  }

  /* ---------- page transitions + scroll reveal ---------- */
  function initMotion(){
    var docEl=document.documentElement, reduce=false;
    try{ reduce=matchMedia('(prefers-reduced-motion: reduce)').matches; }catch(e){}

    if(!reduce){
      // fade the page out on internal navigation (pairs with the CSS fade-in)
      document.addEventListener('click', function(e){
        if(e.defaultPrevented||e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey) return;
        var a=e.target.closest && e.target.closest('a'); if(!a) return;
        var href=a.getAttribute('href');
        if(!href||a.target==='_blank'||a.hasAttribute('download')) return;
        if(href[0]==='#'||/^(mailto:|tel:|javascript:)/i.test(href)) return;
        var url; try{ url=new URL(href, location.href); }catch(_){ return; }
        if(url.origin!==location.origin) return;
        if(url.href===location.href || (url.pathname===location.pathname && url.hash)) return; // same page / anchor
        e.preventDefault();
        docEl.classList.add('leaving');
        setTimeout(function(){ location.href=url.href; }, 160);
      }, true);
      // if the user comes back via the back button (bfcache), clear the fade-out state
      window.addEventListener('pageshow', function(ev){ if(ev.persisted) docEl.classList.remove('leaving'); });
    }

    if(reduce || !docEl.classList.contains('reveal-on')) return;
    var SEL='.sec,.news,.bloghead,.bgrid,.art,.elayout', io;
    try{
      io=new IntersectionObserver(function(es){ es.forEach(function(en){ if(en.isIntersecting){ en.target.classList.add('in'); io.unobserve(en.target); } }); }, {rootMargin:'0px 0px -6% 0px', threshold:0.04});
    }catch(e){
      document.querySelectorAll(SEL).forEach(function(el){ el.classList.add('in'); }); return;
    }
    function scan(){ document.querySelectorAll(SEL).forEach(function(el){ if(el.__rv) return; el.__rv=1; io.observe(el); }); }
    scan();
    var pend=false;
    try{ new MutationObserver(function(){ if(pend)return; pend=true; requestAnimationFrame(function(){ pend=false; scan(); }); }).observe(document.body,{childList:true,subtree:true}); }catch(e){}
  }

  return {API,DATA_URL,MON,CAT_ZH,TINT,ICON,USER_ICON,SOCIAL,esc,isTrue,lines,lat,fmtDate,isPast,fetchData,fetchLive,post,clearCache,renderSocial,initMotion,settingsMap,applyStaticLang,setupNav,loadLang,saveLang};
})();
