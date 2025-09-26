document.addEventListener('DOMContentLoaded', function() {
  if (typeof gsap === 'undefined') {
    return;
  }
  if (typeof SplitText === 'undefined') {
    return;
  }
  if (typeof ScrambleTextPlugin === 'undefined') {
  }

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

  const HomepageH1Scramble = {
    init() {
      if (AnimationState.home.h1Scramble.hasAnimated) return;
      AnimationState.home.h1Scramble.hasAnimated = true;
      const elements = document.querySelectorAll('.h1-wrap .scramble-text');
      if (!elements.length) {
        return;
      }
      elements.forEach((el, index) => {
        const originalText = el.textContent;
        if (originalText.trim().length === 0) return;
        gsap.set(el, {
          opacity: 1,
          visibility: 'visible',
          color: '#ffffff'
        });
        el.textContent = "";
        gsap.to(el, {
          scrambleText: {
            text: originalText,
            chars: "upperAndLowerCase",
            revealDelay: 1.2
          },
          duration: 3.5,
          delay: 0.5 + (index * 0.5),
          ease: "power2.inOut"
        });
      });
    }
  };

  const AboutH1Dark = {
    init() {
      const h1Dark = document.querySelector('.h1-dark');
      if (!h1Dark) {
        return;
      }
      this.element = h1Dark;
      gsap.set(h1Dark, {
        opacity: 0,
        visibility: 'hidden',
        display: 'none'
      });
      this.setupObserver();
    },
    createAnimation() {
      if (AnimationState.about.h1Dark.hasRevealed) return;
      AnimationState.about.h1Dark.hasRevealed = true;
      const originalText = this.element.textContent || this.element.innerText;
      const splitText = new SplitText(this.element, {
        type: "lines",
        linesClass: "reveal-line"
      });
      const lines = splitText.lines;
      gsap.set(this.element, {
        opacity: 1,
        visibility: 'visible',
        display: 'block'
      });
      gsap.set(lines, {
        opacity: 1,
        position: "relative",
        display: "block"
      });
      AnimationState.about.h1Dark.timeline = gsap.timeline({
        delay: 0.3,
        onStart: () => {},
        onComplete: () => {}
      });
      lines.forEach((line, lineIndex) => {
        const wrapper = document.createElement('div');
        wrapper.style.cssText = `
          position: relative;
          display: block;
          overflow: hidden;
        `;
        line.parentNode.insertBefore(wrapper, line);
        wrapper.appendChild(line);
        gsap.set(line, {
          clipPath: "inset(0 0 100% 0)"
        });
        AnimationState.about.h1Dark.timeline.to(line, {
          duration: 1.0,
          clipPath: "inset(0 0 0% 0)",
          ease: "power2.inOut",
          onStart: () => {},
          onComplete: () => {}
        }, 0);
      });
    },
    reset() {
      if (AnimationState.about.h1Dark.timeline) {
        AnimationState.about.h1Dark.timeline.kill();
        AnimationState.about.h1Dark.timeline = null;
      }
      const wrappers = this.element.querySelectorAll('div[style*="position: relative"]');
      wrappers.forEach(wrapper => {
        if (wrapper.parentNode) {
          while (wrapper.firstChild) {
            const child = wrapper.firstChild;
            if (child.style) {
              child.style.clipPath = '';
            }
            wrapper.parentNode.insertBefore(child, wrapper);
          }
          wrapper.remove();
        }
      });
      if (window.SplitText && this.element.querySelector('.reveal-line')) {
        SplitText.revert(this.element);
      }
      const originalText = "Lorem Ipsum<br/>Dolor Sit Amet";
      this.element.innerHTML = originalText;
      gsap.set(this.element, {
        opacity: 0,
        visibility: 'hidden',
        display: 'none',
        clearProps: "all"
      });
      AnimationState.about.h1Dark.hasRevealed = false;
    },
    setupObserver() {
      const aboutContainer = document.querySelector('.about-container');
      if (!aboutContainer) return;
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
            const isVisible = (aboutContainer.style.display === 'flex' || aboutContainer.style.display === 'block') &&
                               (aboutContainer.style.opacity === '1' || parseFloat(aboutContainer.style.opacity) > 0);
            if (isVisible && !AnimationState.about.h1Dark.hasRevealed) {
              setTimeout(() => this.createAnimation(), 200);
            }
          }
        });
      });
      observer.observe(aboutContainer, {
        attributes: true,
        attributeFilter: ['style']
      });
      const isInitiallyVisible = (aboutContainer.style.display === 'flex' || aboutContainer.style.display === 'block') &&
            (aboutContainer.style.opacity === '1' || parseFloat(aboutContainer.style.opacity) > 0);
      if (isInitiallyVisible) {
        setTimeout(() => this.createAnimation(), 200);
      }
    }
  };

  const AboutPDark = {
    init() {
      const pDark = document.querySelector('.p-dark');
      if (!pDark) {
        return;
      }
      this.element = pDark;
      gsap.set(pDark, {
        opacity: 0,
        visibility: 'hidden'
      });
      this.setupObserver();
    },
    createAnimation() {
      if (AnimationState.about.pDark.hasAnimated) return;
      AnimationState.about.pDark.hasAnimated = true;
      gsap.set(this.element, { clearProps: 'height,width,maxWidth,overflow' });
      AnimationState.about.pDark.splitTextInstance = new SplitText(this.element, {
        type: "lines,words,chars",
        linesClass: "reveal-line",
        wordsClass: "reveal-word",
        charsClass: "reveal-char"
      });
      const lines = AnimationState.about.pDark.splitTextInstance.lines;
      const words = AnimationState.about.pDark.splitTextInstance.words;
      gsap.set(this.element, {
        opacity: 1,
        visibility: 'visible'
      });
      gsap.set(words, { opacity: 0 });
      AnimationState.about.pDark.timeline = gsap.timeline({
        delay: 0.7,
        onStart: () => {},
        onComplete: () => {
          gsap.set(this.element, { clearProps: 'height,width,maxWidth,overflow' });
        }
      });
      lines.forEach((line, lineIndex) => {
        const lineWords = words.filter(word => line.contains(word));
        const lineDelay = lineIndex * 0.08;
        lineWords.forEach((word, wordIndex) => {
          const wordDelay = wordIndex * 0.1;
          gsap.set(word, { position: "relative", display: "inline-block" });
          const computedStyle = window.getComputedStyle(word);
          const fontSize = parseFloat(computedStyle.fontSize);
          const lineHeight = parseFloat(computedStyle.lineHeight) || fontSize * 1.2;
          const viewportWidth = window.innerWidth;
          let maskHeightMultiplier = 1.0;
          let topOffsetMultiplier = 0.05;
          if (viewportWidth <= 479) {
            maskHeightMultiplier = 1.1;
            topOffsetMultiplier = 0.02;
          } else if (viewportWidth <= 767) {
            maskHeightMultiplier = 1.05;
            topOffsetMultiplier = 0.03;
          } else if (viewportWidth <= 991) {
            maskHeightMultiplier = 1.02;
            topOffsetMultiplier = 0.04;
          }
          const maskHeight = fontSize * maskHeightMultiplier;
          const topOffset = (lineHeight - maskHeight) / 2 + fontSize * topOffsetMultiplier;
          const wrapper = document.createElement('div');
          wrapper.style.cssText = `
            position: relative;
            display: inline-block;
          `;
          word.parentNode.insertBefore(wrapper, word);
          wrapper.appendChild(word);
          const rect = document.createElement('div');
          rect.style.cssText = `
            position: absolute;
            top: ${topOffset}px;
            left: 0;
            width: 100%;
            height: ${maskHeight}px;
            background-color: #000000;
            z-index: 2;
            pointer-events: none;
          `;
          wrapper.appendChild(rect);
          gsap.set(rect, {
            scaleX: 0,
            transformOrigin: "left center"
          });
          const totalDelay = lineDelay + wordDelay;
          AnimationState.about.pDark.timeline.to(rect, {
            duration: 0.3,
            scaleX: 1,
            ease: "power2.out"
          }, totalDelay);
          AnimationState.about.pDark.timeline.set(word, {
            opacity: 1
          }, totalDelay + 0.3);
          AnimationState.about.pDark.timeline.set(rect, {
            transformOrigin: "right center"
          }, totalDelay + 0.4)
          .to(rect, {
            duration: 0.35,
            scaleX: 0,
            ease: "power2.inOut",
            onComplete: () => rect.remove()
          }, totalDelay + 0.4);
        });
      });
    },
    reset() {
      if (AnimationState.about.pDark.timeline) {
        AnimationState.about.pDark.timeline.kill();
        AnimationState.about.pDark.timeline = null;
      }
      if (AnimationState.about.pDark.splitTextInstance) {
        AnimationState.about.pDark.splitTextInstance.revert();
        AnimationState.about.pDark.splitTextInstance = null;
      }
      const masks = this.element.querySelectorAll('[style*="background-color: #000000"]');
      masks.forEach(mask => mask.remove());
      const wrappers = this.element.querySelectorAll('div[style*="position: relative"]');
      wrappers.forEach(wrapper => {
        if (wrapper.parentNode) {
          while (wrapper.firstChild) {
            wrapper.parentNode.insertBefore(wrapper.firstChild, wrapper);
          }
          wrapper.remove();
        }
      });
      gsap.set(this.element, {
        opacity: 0,
        visibility: 'hidden',
        clearProps: "all"
      });
      AnimationState.about.pDark.hasAnimated = false;
    },
    setupObserver() {
      const aboutContainer = document.querySelector('.about-container');
      if (!aboutContainer) return;
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
            const isVisible = (aboutContainer.style.display === 'flex' || aboutContainer.style.display === 'block') &&
                               (aboutContainer.style.opacity === '1' || parseFloat(aboutContainer.style.opacity) > 0);
            if (isVisible && !AnimationState.about.pDark.hasAnimated) {
              setTimeout(() => this.createAnimation(), 200);
            }
          }
        });
      });
      observer.observe(aboutContainer, {
        attributes: true,
        attributeFilter: ['style']
      });
      const isInitiallyVisible = (aboutContainer.style.display === 'flex' || aboutContainer.style.display === 'block') &&
            (aboutContainer.style.opacity === '1' || parseFloat(aboutContainer.style.opacity) > 0);
      if (isInitiallyVisible) {
        setTimeout(() => this.createAnimation(), 200);
      }
    }
  };

  const AboutHeadlines = {
    init() {
      const headlines = document.querySelectorAll('.headline');
      if (!headlines.length) {
        return;
      }
      this.headlines = headlines;
      this.setupObserver();
    },
    createAnimations() {
      if (AnimationState.about.headlines.hasInitialized) return;
      AnimationState.about.headlines.hasInitialized = true;
      this.headlines.forEach((headline, index) => {
        const h1HeaderWrap = headline.querySelector('.h1-header-wrap');
        const h1Headline = headline.querySelector('.h1-headline');
        const line1px = headline.querySelector('.line-1px');
        if (!h1HeaderWrap || !h1Headline || !line1px) {
          return;
        }
        gsap.set(h1Headline, {
          opacity: 1,
          visibility: 'visible',
          clipPath: "inset(0 0 100% 0)"
        });
        gsap.set(line1px, {
          scaleX: 0,
          transformOrigin: "left center"
        });
        const tl = gsap.timeline({
          delay: index * 0.2
        });
        tl.to(h1Headline, {
          duration: 1.0,
          clipPath: "inset(0 0 0% 0)",
          ease: "ease.inOut",
          onStart: () => {},
          onComplete: () => {}
        });
        tl.to(line1px, {
          duration: 1.5,
          scaleX: 1,
          ease: "power2.out",
          onStart: () => {},
          onComplete: () => {}
        }, 0);
        AnimationState.about.headlines.timelines.push(tl);
      });
    },
    reset() {
      AnimationState.about.headlines.timelines.forEach(tl => tl.kill());
      AnimationState.about.headlines.timelines = [];
      this.headlines.forEach(headline => {
        const h1Headline = headline.querySelector('.h1-headline');
        const line1px = headline.querySelector('.line-1px');
        if (h1Headline) {
          gsap.set(h1Headline, {
            opacity: 1,
            visibility: 'visible',
            clipPath: "inset(0 0 100% 0)",
            clearProps: "all"
          });
        }
        if (line1px) {
          gsap.set(line1px, {
            scaleX: 0,
            clearProps: "all"
          });
        }
      });
      AnimationState.about.headlines.hasInitialized = false;
    },
    setupObserver() {
      const aboutContainer = document.querySelector('.about-container');
      if (!aboutContainer) return;
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
            const isVisible = aboutContainer.style.display !== 'none' &&
                               aboutContainer.style.opacity !== '0' &&
                               aboutContainer.style.opacity !== '';
            if (isVisible && !AnimationState.about.headlines.hasInitialized) {
              setTimeout(() => this.createAnimations(), 100);
            }
          }
        });
      });
      observer.observe(aboutContainer, {
        attributes: true,
        attributeFilter: ['style']
      });
      const isInitiallyVisible = aboutContainer.style.display !== 'none' &&
                                 aboutContainer.style.opacity !== '0' &&
                                 aboutContainer.style.opacity !== '';
      if (isInitiallyVisible) {
        setTimeout(() => this.createAnimations(), 100);
      }
    }
  };

  let resizeTimeout;
  window.addEventListener('resize', function() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(function() {
      const aboutContainer = document.querySelector('.about-container');
      if (!aboutContainer) return;
      const isVisible = aboutContainer.style.display !== 'none' &&
                         aboutContainer.style.opacity !== '0' &&
                         aboutContainer.style.opacity !== '';
      if (isVisible) {
        if (AnimationState.about.h1Dark.hasRevealed) {
          AboutH1Dark.reset();
          setTimeout(() => AboutH1Dark.createAnimation(), 300);
        }
        if (AnimationState.about.pDark.hasAnimated) {
          AboutPDark.reset();
          setTimeout(() => AboutPDark.createAnimation(), 300);
        }
      }
    }, 250);
  });

  HomepageH1Scramble.init();
  AboutH1Dark.init();
  AboutPDark.init();
  AboutHeadlines.init();
});