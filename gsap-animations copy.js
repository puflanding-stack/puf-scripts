document.addEventListener('DOMContentLoaded', function() {
  // GSAP ve Gerekli Eklentilerin Yüklendiğini Kontrol Et
  if (typeof gsap === 'undefined' || typeof SplitText === 'undefined' || typeof ScrambleTextPlugin === 'undefined') {
    console.error("GSAP veya gerekli eklentiler yüklenmedi.");
    return;
  }

  // --- ANİMASYON VE SAYFA DURUM YÖNETİMİ ---
  const AnimationState = {
    about: {
      h1Dark: { hasRevealed: false, timeline: null },
      pDark: { hasAnimated: false, timeline: null, splitTextInstance: null },
      headlines: { hasInitialized: false, timelines: [] }
    },
    home: {
      h1Scramble: { hasAnimated: false }
    }
  };

  let smoother;
  let isAboutMode = false;

  // ScrollSmoother'ı Başlatma ve Yönetme
  function initScrollSmoother() {
    gsap.registerPlugin(ScrollTrigger, ScrollSmoother);
    smoother = ScrollSmoother.create({
      wrapper: '#smooth-wrapper', // HTML'deki smooth-wrapper ID'si
      content: '#smooth-content', // HTML'deki smooth-content ID'si
      smooth: 1,
      effects: true
    });
    // Başlangıçta "home" modunda olduğumuz için scroll'u devre dışı bırak
    smoother.disable();
    document.body.style.overflow = 'hidden';
  }

  // "Home" Moduna Geçiş
  function switchToHomeMode() {
    if (!isAboutMode) return;
    isAboutMode = false;
    
    if (smoother) {
      smoother.disable();
      document.body.style.overflow = 'hidden';
    }
    
    // About sayfası animasyonlarını sıfırla
    AboutH1Dark.reset();
    AboutPDark.reset();
    AboutHeadlines.reset();
    
    // Sayfa geçiş animasyonu
    const aboutContainer = document.querySelector('.about-container');
    const homeContainer = document.querySelector('.home-container');
    if (aboutContainer && homeContainer) {
      gsap.timeline()
        .to(aboutContainer, { opacity: 0, duration: 0.4, onComplete: () => gsap.set(aboutContainer, { display: 'none' }) })
        .set(homeContainer, { display: 'flex' })
        .to(homeContainer, { opacity: 1, duration: 0.4 });
    }
  }

  // "About" Moduna Geçiş
  function switchToAboutMode() {
    if (isAboutMode) return;
    isAboutMode = true;

    if (smoother) {
      smoother.enable();
      document.body.style.overflow = '';
    }
    
    // About sayfası animasyonlarını başlat
    setTimeout(() => {
      AboutH1Dark.createAnimation();
      AboutPDark.createAnimation();
      AboutHeadlines.createAnimations();
    }, 200);

    // Sayfa geçiş animasyonu
    const aboutContainer = document.querySelector('.about-container');
    const homeContainer = document.querySelector('.home-container');
    if (aboutContainer && homeContainer) {
      gsap.timeline()
        .to(homeContainer, { opacity: 0, duration: 0.4, onComplete: () => gsap.set(homeContainer, { display: 'none' }) })
        .set(aboutContainer, { display: 'flex' })
        .to(aboutContainer, { opacity: 1, duration: 0.4 });
    }
  }

  // --- TÜM ANİMASYON MODÜLLERİ ---
  
  const HomepageH1Scramble = {
    init() {
      // ... mevcut kodunuzdaki HomepageH1Scramble.init içeriği
    }
  };

  const AboutH1Dark = {
    init() {
      const h1Dark = document.querySelector('.h1-dark');
      if (!h1Dark) return;
      this.element = h1Dark;
      gsap.set(h1Dark, { opacity: 0, visibility: 'hidden', display: 'none' });
    },
    createAnimation() {
      if (AnimationState.about.h1Dark.hasRevealed) return;
      // ... mevcut kodunuzdaki createAnimation içeriği
    },
    reset() {
      if (!this.element) return;
      // ... mevcut kodunuzdaki reset içeriği
    }
  };

  const AboutPDark = {
    init() {
      const pDark = document.querySelector('.p-dark');
      if (!pDark) return;
      this.element = pDark;
      gsap.set(pDark, { opacity: 0, visibility: 'hidden' });
    },
    createAnimation() {
      if (AnimationState.about.pDark.hasAnimated) return;
      // ... mevcut kodunuzdaki createAnimation içeriği
    },
    reset() {
      if (!this.element) return;
      // ... mevcut kodunuzdaki reset içeriği
    }
  };

  const AboutHeadlines = {
    init() {
      const headlines = document.querySelectorAll('.headline');
      if (!headlines.length) return;
      this.headlines = headlines;
    },
    createAnimations() {
      if (AnimationState.about.headlines.hasInitialized) return;
      // ... mevcut kodunuzdaki createAnimations içeriği
    },
    reset() {
      // ... mevcut kodunuzdaki reset içeriği
    }
  };

  // --- BAŞLANGIÇ VE OLAY DİNLEYİCİLERİ ---
  function initialize() {
    const homeButton = document.querySelector('.link-block.home');
    const aboutButton = document.querySelector('.link-block.about');

    if (homeButton && aboutButton) {
      homeButton.addEventListener('click', switchToHomeMode);
      aboutButton.addEventListener('click', switchToAboutMode);
    }

    // ScrollSmoother'ı başlat
    initScrollSmoother();

    // Home sayfası animasyonlarını başlat
    HomepageH1Scramble.init();

    // About sayfası animasyonlarını init et
    AboutH1Dark.init();
    AboutPDark.init();
    AboutHeadlines.init();

    // Resize Event Listener
    let resizeTimeout;
    window.addEventListener('resize', function() {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(function() {
        if (isAboutMode) {
          AboutH1Dark.reset();
          setTimeout(() => AboutH1Dark.createAnimation(), 300);
          
          AboutPDark.reset();
          setTimeout(() => AboutPDark.createAnimation(), 300);
        }
      }, 250);
    });
  }
  
  initialize();
});