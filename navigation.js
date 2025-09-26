(function() {
  // --- GSAP YÜKLEYİCİ ---
  function ensureGsap(callback) {
    if (window.gsap) return callback();
    var script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js';
    script.onload = callback;
    document.head.appendChild(script);
  }

  // --- SAYFA GEÇİŞ VE RENK YÖNETİMİ ---
  function initializeNavigation() {
    const homeButton = document.querySelector('.link-block.home');
    const aboutButton = document.querySelector('.link-block.about');
    const homeContainer = document.querySelector('.home-container');
    const aboutContainer = document.querySelector('.about-container');
    const radialLinkText = document.querySelector('.link-radial .link');
    const body = document.body;

    if (!homeButton || !aboutButton || !homeContainer || !aboutContainer) {
      console.error("PUF Navigasyon: Gerekli elementler bulunamadı.");
      return;
    }

    // Başlangıç durumu
    body.classList.add('home-mode');
    gsap.set(homeContainer, { opacity: 1, display: 'flex' });
    gsap.set(aboutContainer, { opacity: 0, display: 'none' });

    aboutButton.addEventListener('click', function(e) {
      e.preventDefault();
      if (body.classList.contains('about-mode')) return;
      if (window.pufParticleSystem) {
        window.pufParticleSystem.updateParticleColors('about');
      }
      gsap.timeline()
        .to(homeContainer, { opacity: 0, duration: 0.4, onComplete: () => gsap.set(homeContainer, { display: 'none' }) })
        .set(aboutContainer, { display: 'flex' })
        .to(aboutContainer, { opacity: 1, duration: 0.4 });
    });

    homeButton.addEventListener('click', function(e) {
      e.preventDefault();
      if (body.classList.contains('home-mode')) return;
      if (window.pufParticleSystem) {
        window.pufParticleSystem.updateParticleColors('home');
      }
      gsap.timeline()
        .to(aboutContainer, { opacity: 0, duration: 0.4, onComplete: () => gsap.set(aboutContainer, { display: 'none' }) })
        .set(homeContainer, { display: 'flex' })
        .to(homeContainer, { opacity: 1, duration: 0.4 });
    });
  }

  // --- BAŞLATMA ---
  function runAll() {
    initializeNavigation();
    if (typeof initializeRadialAnimations === 'function') {
      initializeRadialAnimations();
    }
  }

  if (document.readyState === 'complete') {
    ensureGsap(runAll);
  } else {
    window.addEventListener('load', () => ensureGsap(runAll));
  }
})();
