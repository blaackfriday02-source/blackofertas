/* main.js — slider, vitrine, CTAs e eventos ViewContent / InitiateCheckout / Contact */

const images = [
  'png/BUT1.png',
  'png/BUT2.png',
  'png/BUT3.png',
  'png/BUT4.jpg', // confirme extensão; troque pra .png se for o caso
  'png/BUT5.png'
];

// identificação opcional dos “produtos/vitrines” (pra métricas)
const productMap = [
  { id: 'BUT1', name: 'Banner 1', price: 0 },
  { id: 'BUT2', name: 'Banner 2', price: 0 },
  { id: 'BUT3', name: 'Banner 3', price: 0 },
  { id: 'BUT4', name: 'Banner 4', price: 0 },
  { id: 'BUT5', name: 'Banner 5', price: 0 },
];

const INTERVAL_MS = 3000;

document.addEventListener('DOMContentLoaded', () => {
  const slider     = document.getElementById('slider');
  const mapButtons = document.getElementById('mapButtons');
  const instaLink  = document.querySelector('.insta-link');
  const centralBtn = document.querySelector('.central-btn');

  if(!slider){ console.error('Elemento #slider não encontrado.'); return; }

  // ViewContent geral (landing) — dispara só se pixel estiver carregado (consentimento ok)
  if(window.fbq){
    fbq('track','ViewContent',{
      content_ids:['landing_home'],
      content_type:'product_group',
      content_category:'BlackCampaign'
    });
  }
  if(window.gtag){
    gtag('event','view_item_list',{ item_list_name:'landing_home' });
  }

  // Monta slides
  images.forEach((src, i) => {
    const slide = document.createElement('div');
    slide.className = 'slide';
    if(i===0) slide.classList.add('active');
    const img = document.createElement('img');
    img.src = src;
    img.alt = `Imagem ${i+1}`;
    slide.appendChild(img);
    slider.appendChild(slide);
  });

  // Preload
  images.forEach(src => { const im=new Image(); im.src=src; });

  let slides = slider.querySelectorAll('.slide');
  let current = 0;
  let timerId = null;
  let userSelected = false;

  function setSliderHeightForIndex(index){
    const s=slides[index]; if(!s) return;
    const img=s.querySelector('img'); if(!img) return;
    const apply=()=>{ const h=img.clientHeight||img.naturalHeight||0; slider.style.height=(h>0? h+'px':'auto'); };
    if(img.complete) apply(); else img.addEventListener('load', apply, {once:true});
  }

  function showSlide(index){
    index = (index + slides.length) % slides.length;
    setSliderHeightForIndex(index);
    slides.forEach((s, idx) => s.classList.toggle('active', idx===index));
    current = index;
  }

  function nextSlide(){ showSlide((current+1)%slides.length); }
  function startAuto(){ stopAuto(); timerId=setInterval(nextSlide, INTERVAL_MS); }
  function stopAuto(){ if(timerId){ clearInterval(timerId); timerId=null; } }

  setTimeout(()=>setSliderHeightForIndex(0), 50);
  startAuto();

  slider.addEventListener('touchstart', stopAuto, {passive:true});
  slider.addEventListener('touchend',   () => { if(!userSelected) startAuto(); }, {passive:true});
  slider.addEventListener('mouseenter', stopAuto);
  slider.addEventListener('mouseleave', () => { if(!userSelected) startAuto(); });

  // Vitrine: clique nas áreas
  if(mapButtons){
    const fireViewContent = (idx)=>{
      const p = productMap[idx] || { id:`BUT${idx+1}`, name:`Banner ${idx+1}`, price:0 };
      if(window.fbq){
        fbq('track','ViewContent',{
          content_ids:[p.id],
          content_name:p.name,
          content_type:'product',
          value:p.price,
          currency:'BRL'
        });
      }
      if(window.gtag){
        gtag('event','view_item',{ items:[{ item_id:p.id, item_name:p.name, price:p.price }] });
      }
    };

    mapButtons.addEventListener('click', (e)=>{
      const btn = e.target.closest('button[data-index]'); if(!btn) return;
      const idx = Number(btn.dataset.index);
      showSlide(idx);
      userSelected = true; setTimeout(()=>{ userSelected=false; }, 5000);
      startAuto();
      fireViewContent(idx);
    });

    mapButtons.addEventListener('keydown', (e)=>{
      if(e.key==='Enter' || e.key===' '){
        const btn = e.target.closest('button[data-index]'); if(!btn) return;
        e.preventDefault();
        const idx = Number(btn.dataset.index);
        showSlide(idx);
        userSelected = true; setTimeout(()=>{ userSelected=false; }, 5000);
        startAuto();
        fireViewContent(idx);
      }
    });
  }

  // Instagram CTA (usado como "Comprar") — MESMA ABA
  if (instaLink) {
    const href = instaLink.dataset.href || instaLink.getAttribute('href') || '/';

    instaLink.addEventListener('touchstart', () => {
      instaLink.classList.add('touch-expand');
      setTimeout(() => instaLink.classList.remove('touch-expand'), 700);
    }, { passive: true });

    instaLink.addEventListener('click', (ev) => {
      // respeita Ctrl/Meta/Shift ou botão do meio (abrir nova aba manualmente)
      if (ev.ctrlKey || ev.metaKey || ev.shiftKey || ev.button === 1) return;

      ev.preventDefault();                       // segura a navegação instantânea
      instaLink.classList.add('expand-click');   // micro animação

      // eventos levinhos (opcional)
      if (window.fbq) {
        fbq('track', 'ViewContent', { content_ids: ['cta_comprar'], content_type: 'product' });
      }
      if (window.gtag) {
        gtag('event', 'view_item', { items: [{ item_id: 'cta_comprar' }] });
      }

      // redireciona NA MESMA ABA
      setTimeout(() => {
        window.location.href = href;            // 👈 chave da mudança
      }, 150);
    });

    // acessibilidade (Enter/Espaço)
    instaLink.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        instaLink.click();
      }
    });
  }

  // Central de Vendas (CTA principal) — InitiateCheckout + Contact (abre Whats em nova aba, isso pode ficar assim)
  if(centralBtn){
    const href = centralBtn.getAttribute('href') || centralBtn.dataset.href || null;

    centralBtn.addEventListener('touchstart', ()=>{ centralBtn.classList.add('touch-expand'); setTimeout(()=>centralBtn.classList.remove('touch-expand'), 600); }, {passive:true});
    centralBtn.addEventListener('click', (ev)=>{
      if(ev.ctrlKey||ev.metaKey||ev.shiftKey||ev.button===1) return;
      ev.preventDefault();
      centralBtn.classList.add('expand-click');

      const p = productMap[current] || { id:`BUT${current+1}`, name:`Banner ${current+1}`, price:0 };

      // Eventos “seguros” para funil sem carrinho:
      if(window.fbq){
        fbq('track','InitiateCheckout',{ content_ids:[p.id], content_name:p.name, content_type:'product' });
        fbq('track','Contact',{ method:'WhatsApp', placement:'central', product_ref:p.id });
      }
      if(window.gtag){
        gtag('event','begin_checkout',{ items:[{ item_id:p.id, item_name:p.name, price:p.price }] });
        gtag('event','contact',{ method:'whatsapp', placement:'central', item_id:p.id });
      }

      setTimeout(()=>{
        if(href) window.open(href,'_blank','noopener,noreferrer');
        setTimeout(()=>centralBtn.classList.remove('expand-click'), 350);
      },140);
    });
    centralBtn.addEventListener('keydown', (e)=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); centralBtn.click(); } });
  }

  // Teclas esquerda/direita
  document.addEventListener('keydown', (e)=>{
    if(e.key==='ArrowRight'){ nextSlide(); startAuto(); }
    else if(e.key==='ArrowLeft'){ showSlide((current-1+slides.length)%slides.length); startAuto(); }
  });

  // Recalcula em resize
  window.addEventListener('resize', ()=>{
    slides = slider.querySelectorAll('.slide');
    setSliderHeightForIndex(current);
  });
});

