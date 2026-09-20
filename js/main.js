/* ============================================================
   LxL Creative — Our Work  |  interactions
   Stack mirrors the live site: Lenis + GSAP/ScrollTrigger
   + nav dropdowns, draw-line, mobile menu, HLS player,
     mini-showreel, page transition
   ============================================================ */
(function () {
  'use strict';

  /* ---------------- Load dependencies from CDN ---------------- */
  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = src;
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }
  function loadCSS(href) {
    const l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = href;
    document.head.appendChild(l);
  }

  const DEPS = [
    'https://cdn.jsdelivr.net/npm/lenis@1.3.17/dist/lenis.min.js',
    'https://cdn.jsdelivr.net/npm/gsap@3.15/dist/gsap.min.js',
    'https://cdn.jsdelivr.net/npm/gsap@3.15/dist/ScrollTrigger.min.js',
    'https://cdn.jsdelivr.net/npm/gsap@3.15/dist/ScrollToPlugin.min.js',
    'https://cdn.jsdelivr.net/npm/gsap@3.15/dist/CustomEase.min.js',
    'https://cdn.jsdelivr.net/npm/gsap@3.15/dist/Draggable.min.js',
    'https://cdn.jsdelivr.net/npm/gsap@3.15/dist/InertiaPlugin.min.js',
    'https://cdn.jsdelivr.net/npm/gsap@3.15/dist/Flip.min.js',
    'https://cdn.jsdelivr.net/npm/gsap@3.15/dist/SplitText.min.js',
  ];
  const HLS_SRC = 'https://cdn.jsdelivr.net/npm/hls.js@1.5.17/dist/hls.min.js';

  async function boot() {
    for (const src of DEPS) {
      try { await loadScript(src); } catch (_) { /* skip */ }
    }
    try { await loadScript(HLS_SRC); } catch (_) { /* skip */ }

    if (typeof gsap === 'undefined') {
      document.documentElement.classList.remove('js');
      return;
    }

    gsap.registerPlugin(ScrollTrigger, CustomEase, ScrollToPlugin, InertiaPlugin, Draggable, Flip, SplitText);

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isDesktop = () => window.matchMedia('(min-width: 992px)').matches;

    /* ============================================================
       HEADING max-width: calc(var(--number) * 1ch)
       Webflow sets --number from data-number attributes
       ============================================================ */
    document.querySelectorAll('[data-number]').forEach((el) => {
      el.style.setProperty('--number', el.getAttribute('data-number'));
    });

    /* ============================================================
       LENIS SMOOTH SCROLL
       ============================================================ */
    let lenis = null;
    if (typeof Lenis !== 'undefined' && !reduce) {
      lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 1, smoothWheel: true });
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add((time) => lenis.raf(time * 1000));
      gsap.ticker.lagSmoothing(0);
    }

    /* ============================================================
       INTRO
       ============================================================ */
    function playIntro() {
      if (reduce) {
        document.documentElement.classList.remove('js');
        return;
      }
      // Gate the nav entrance inside rAF: if rAF is throttled the nav
      // simply stays visible (default). Only hide once a frame is guaranteed.
      requestAnimationFrame(() => {
        document.documentElement.classList.add('is-animating');
        requestAnimationFrame(() => {
          document.documentElement.classList.remove('is-animating');
          document.documentElement.classList.add('is-ready');
        });
      });
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
      tl.to('.work-list_title .line', { yPercent: 0, duration: 1.1, stagger: 0.09, ease: 'power4.out' }, 0)
        .to('.work-filter_btn', { opacity: 1, y: 0, duration: 0.5, stagger: 0.035 }, 0.2)
        .to('.work-list_item_card', { opacity: 1, duration: 0.6, stagger: 0.05 }, 0.4)
        .to('.footer_content', { opacity: 1, duration: 0.6 }, 0.4)
        .to('.footer_top .button_main_wrap', { opacity: 1, y: 0, duration: 0.6 }, 0.3);
    }
    playIntro();

    /* ============================================================
       PINNED WORK LIST (desktop)
       ============================================================ */
    const section = document.querySelector('[data-work-slider]');
    const wrap = document.querySelector('[data-work-slides]');
    const list = document.querySelector('[data-work-list]');
    const items = Array.from(document.querySelectorAll('.work-list_item'));

    let pinST = null;
    let draggable = null;
    let maxScroll = 0;
    let centerOffset = 0;
    let isDragging = false;

    function recalc() {
      if (!section || !wrap || !list) return;
      maxScroll = Math.max(0, list.scrollHeight - wrap.clientHeight);
      centerOffset = Math.max(0, (wrap.clientHeight - firstCardH()) / 2);
      if (draggable) {
        draggable.bounds = { minY: -(maxScroll + centerOffset), maxY: centerOffset };
        draggable.update();
      }
    }

    function firstCardH() {
      const first = list.querySelector('.work-list_item');
      return first ? first.getBoundingClientRect().height : 0;
    }

    function syncScrollFromDrag(y) {
      if (!lenis || maxScroll <= 0 || !pinST) return;
      const progress = gsap.utils.clamp(0, 1, (centerOffset - y) / maxScroll);
      const target = pinST.start + maxScroll * progress;
      lenis.scrollTo(target, { immediate: true });
    }

    function initDesktopPin() {
      if (!section || !wrap || !list) return;
      recalc();

      pinST = ScrollTrigger.create({
        trigger: section,
        start: 'top top',
        end: () => '+=' + maxScroll,
        pin: true,
        pinSpacing: true,
        scrub: 1,
        invalidateOnRefresh: true,
        onUpdate(self) {
          if (isDragging) return;
          const y = centerOffset - maxScroll * self.progress;
          gsap.set(list, { y });
          parallaxImages();
        },
        onLeaveBack() {
          gsap.set(list, { y: centerOffset });
        },
        onRefresh(self) {
          gsap.set(list, { y: centerOffset - maxScroll * (self.progress || 0) });
        }
      });

      gsap.set(list, { y: centerOffset });

      if (typeof Draggable !== 'undefined' && maxScroll > 0) {
        draggable = Draggable.create(list, {
          type: 'y',
          inertia: true,
          dragClickables: true,
          bounds: { minY: -maxScroll, maxY: 0 },
          onDragStart() { isDragging = true; },
          onDrag() { syncScrollFromDrag(this.y); },
          onThrowUpdate() { syncScrollFromDrag(this.y); },
          onDragEnd() { isDragging = false; },
          onThrowComplete() { isDragging = false; }
        })[0];
      }

      window.addEventListener('load', () => { recalc(); ScrollTrigger.refresh(); });
    }

    function parallaxImages() {
      if (reduce) return;
      const wr = wrap.getBoundingClientRect();
      const center = wr.top + wr.height / 2;
      for (let i = 0; i < items.length; i++) {
        const it = items[i];
        if (it.classList.contains('is-hidden')) continue;
        const r = it.getBoundingClientRect();
        const dist = (r.top + r.height / 2 - center) / wr.height;
        const img = it.querySelector('.u-image');
        if (img) gsap.set(img, { y: gsap.utils.clamp(-1, 1, dist) * 26 });
      }
    }

    const mm = gsap.matchMedia();
    mm.add('(min-width: 992px) and (prefers-reduced-motion: no-preference)', () => {
      initDesktopPin();
      return () => {
        if (pinST) { pinST.kill(); pinST = null; }
        if (draggable) { draggable.kill(); draggable = null; }
        gsap.set(list, { y: 0 });
      };
    });

    /* ============================================================
       FILTERS (FLIP)
       ============================================================ */
    const filterBtns = Array.from(document.querySelectorAll('[data-work-filter]'));
    filterBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const filter = btn.getAttribute('data-work-filter');
        filterBtns.forEach((b) => {
          const on = b === btn;
          b.classList.toggle('is-active', on);
          b.setAttribute('aria-pressed', on ? 'true' : 'false');
        });

        const state = Flip.getState(items);
        items.forEach((it) => {
          const cats = (it.getAttribute('data-category') || '').split(' ');
          const show = filter === 'all' || cats.indexOf(filter) !== -1;
          it.classList.toggle('is-hidden', !show);
        });

        Flip.from(state, {
          duration: 0.55,
          ease: 'power3.out',
          stagger: 0.04,
          absolute: true,
          onEnter: (els) => gsap.fromTo(els, { opacity: 0, scale: 0.94 }, { opacity: 1, scale: 1, duration: 0.5, ease: 'power3.out' }),
          onComplete() {
            recalc();
            ScrollTrigger.refresh();
          }
        });
      });
    });

    /* ============================================================
       WIGGLE HOVER
       ============================================================ */
    if (!reduce) {
      items.forEach((item) => {
        const target = item.querySelector('.work-list_item_content');
        if (!target) return;
        let wtl = null;
        const enter = () => {
          wtl = gsap.timeline({ repeat: -1, yoyo: true, defaults: { ease: 'sine.inOut' } })
            .to(target, { rotation: 1.4, duration: 0.7 })
            .to(target, { rotation: -1.4, duration: 0.7 });
        };
        const leave = () => { if (wtl) wtl.kill(); gsap.to(target, { rotation: 0, duration: 0.4, ease: 'power2.out' }); };
        item.addEventListener('mouseenter', enter);
        item.addEventListener('mouseleave', leave);
      });
    }

    /* ============================================================
       NAV DROPDOWN HOVER SYSTEM
       ============================================================ */
    const navDropdowns = document.querySelector('[data-nav-dropdowns]');
    if (navDropdowns && isDesktop()) {
      const triggers = navDropdowns.querySelectorAll('[data-nav-dropdown-trigger]');
      let activeDropdown = null;
      let leaveTimeout = null;

      function openDropdown(name) {
        clearTimeout(leaveTimeout);
        if (activeDropdown === name) return;
        activeDropdown = name;
        navDropdowns.setAttribute('data-nav-active-dropdown', name);

        // animate dropdown items stagger
        const panel = navDropdowns.querySelector(`[data-nav-dropdown="${name}"]`);
        if (panel) {
          const dropdownItems = panel.querySelectorAll('[data-nav-dropdown-item]');
          gsap.fromTo(dropdownItems,
            { opacity: 0, y: 12 },
            { opacity: 1, y: 0, duration: 0.4, stagger: 0.04, ease: 'power3.out', delay: 0.05 }
          );
          // animate bg
          const bg = panel.querySelector('.nav_dropdown_bg');
          if (bg) {
            gsap.fromTo(bg,
              { scaleX: 1.02, scaleY: 0.98 },
              { scaleX: 1, scaleY: 1, duration: 0.5, ease: 'power3.out' }
            );
          }
        }
      }

      function closeDropdown() {
        leaveTimeout = setTimeout(() => {
          activeDropdown = null;
          navDropdowns.removeAttribute('data-nav-active-dropdown');
        }, 200);
      }

      triggers.forEach((trigger) => {
        const name = trigger.getAttribute('data-nav-dropdown-trigger');
        const item = trigger.closest('.nav_link_item');

        if (item) {
          item.addEventListener('mouseenter', () => openDropdown(name));
          item.addEventListener('mouseleave', closeDropdown);
        }
      });

      // keep open when hovering dropdown panel itself
      const dropdownPanels = navDropdowns.querySelectorAll('[data-nav-dropdown]');
      dropdownPanels.forEach((panel) => {
        panel.addEventListener('mouseenter', () => clearTimeout(leaveTimeout));
        panel.addEventListener('mouseleave', closeDropdown);
      });
    }

    /* ============================================================
       DRAW-LINE SVG UNDERLINES
       ============================================================ */
    function initDrawLines() {
      const boxes = document.querySelectorAll('[data-draw-line-box]');
      boxes.forEach((box) => {
        const parent = box.closest('a') || box.closest('[data-draw-line]') || box.parentElement;
        if (!parent) return;

        // create SVG with line path
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('viewBox', '0 0 100 4');
        svg.setAttribute('preserveAspectRatio', 'none');
        svg.style.cssText = 'width:100%;height:100%;position:absolute;top:0;left:0;overflow:visible;';

        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', 'M0 2 Q 25 0, 50 2 T 100 2');
        path.setAttribute('fill', 'none');
        path.setAttribute('stroke', 'currentColor');
        path.setAttribute('stroke-width', '0.4');
        path.setAttribute('stroke-linecap', 'round');
        svg.appendChild(path);
        box.appendChild(svg);

        // set up for animation
        const len = path.getTotalLength();
        gsap.set(path, { strokeDasharray: len, strokeDashoffset: len });
      });

      // animate on hover / focus
      if (!reduce) {
        document.querySelectorAll('[data-draw-line]').forEach((el) => {
          const box = el.querySelector('[data-draw-line-box]');
          if (!box) return;
          const path = box.querySelector('path');
          if (!path) return;

          el.addEventListener('mouseenter', () => {
            gsap.to(path, { strokeDashoffset: 0, duration: 0.5, ease: 'power2.out' });
          });
          el.addEventListener('mouseleave', () => {
            const len = path.getTotalLength();
            gsap.to(path, { strokeDashoffset: len, duration: 0.4, ease: 'power2.in' });
          });
          el.addEventListener('focus', () => {
            gsap.to(path, { strokeDashoffset: 0, duration: 0.5, ease: 'power2.out' });
          });
          el.addEventListener('blur', () => {
            const len = path.getTotalLength();
            gsap.to(path, { strokeDashoffset: len, duration: 0.4, ease: 'power2.in' });
          });
        });
      }
    }
    initDrawLines();

    /* ============================================================
       MOBILE MENU (toggle + accordion)
       ============================================================ */
    const menuToggle = document.querySelector('[data-nav-toggle]');
    const mobileMenu = document.querySelector('[data-nav-mobile]');
    const menuOverlay = document.querySelector('.menu_overlay');

    if (menuToggle && mobileMenu) {
      const toggleLines = menuToggle.querySelectorAll('.nav_toggle_line');

      function openMobileMenu() {
        menuToggle.setAttribute('aria-expanded', 'true');
        mobileMenu.classList.add('is-open');
        if (lenis) lenis.stop();
        document.documentElement.style.overflow = 'hidden';

        // animate lines to X
        if (!reduce) {
          gsap.to(toggleLines[0], { rotation: 45, y: 0, duration: 0.35, ease: 'power2.out' });
          gsap.to(toggleLines[1], { rotation: -45, y: 0, duration: 0.35, ease: 'power2.out' });
        }

        // animate panel content
        if (!reduce) {
          const panelContent = mobileMenu.querySelector('.menu_mobile_content');
          if (panelContent) {
            const links = panelContent.querySelectorAll('.menu_mobile_link, .menu_mobile_accordion_trigger');
            gsap.fromTo(links,
              { opacity: 0, x: -20 },
              { opacity: 1, x: 0, duration: 0.4, stagger: 0.04, ease: 'power3.out', delay: 0.15 }
            );
          }
        }
      }

      function closeMobileMenu() {
        menuToggle.setAttribute('aria-expanded', 'false');
        mobileMenu.classList.remove('is-open');
        if (lenis) lenis.start();
        document.documentElement.style.overflow = '';

        if (!reduce) {
          gsap.to(toggleLines[0], { rotation: 0, y: 0, duration: 0.35, ease: 'power2.out' });
          gsap.to(toggleLines[1], { rotation: 0, y: 0, duration: 0.35, ease: 'power2.out' });
        }
      }

      menuToggle.addEventListener('click', () => {
        const isOpen = menuToggle.getAttribute('aria-expanded') === 'true';
        isOpen ? closeMobileMenu() : openMobileMenu();
      });

      if (menuOverlay) {
        menuOverlay.addEventListener('click', closeMobileMenu);
      }

      // close on link click
      mobileMenu.querySelectorAll('.menu_mobile_link, .menu_mobile_accordion_link').forEach((link) => {
        link.addEventListener('click', closeMobileMenu);
      });

      // accordion
      const accordionTriggers = mobileMenu.querySelectorAll('[data-nav-mobile-accordion]');
      accordionTriggers.forEach((trigger) => {
        trigger.addEventListener('click', () => {
          const expanded = trigger.getAttribute('aria-expanded') === 'true';
          const panel = trigger.nextElementSibling;
          if (panel) {
            trigger.setAttribute('aria-expanded', expanded ? 'false' : 'true');
            if (expanded) {
              panel.classList.remove('is-open');
            } else {
              panel.classList.add('is-open');
            }
          }
        });
      });
    }

    /* ============================================================
       BUNNY PLAYER (HLS.js)
       ============================================================ */
    function initBunnyPlayers() {
      const players = document.querySelectorAll('[data-bunny-player-init]');
      players.forEach((el) => {
        const src = el.getAttribute('data-player-src');
        const video = el.querySelector('video');
        if (!video || !src) return;

        let hls = null;

        function setStatus(s) { el.setAttribute('data-player-status', s); }
        function setActivated(v) { el.setAttribute('data-player-activated', v); }

        function initHLS() {
          if (typeof Hls !== 'undefined' && Hls.isSupported()) {
            hls = new Hls();
            hls.loadSource(src);
            hls.attachMedia(video);
            hls.on(Hls.Events.MANIFEST_PARSED, () => {
              setStatus('ready');
            });
            hls.on(Hls.Events.ERROR, (_, data) => {
              if (data.fatal) {
                if (data.type === Hls.ErrorTypes.NETWORK_ERROR) hls.startLoad();
                else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) hls.recoverMediaError();
              }
            });
          } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            video.src = src;
            video.addEventListener('loadedmetadata', () => setStatus('ready'));
          }
        }

        function togglePlay() {
          if (video.paused) {
            setActivated('true');
            setStatus('playing');
            video.play().catch(() => setStatus('paused'));
          } else {
            video.pause();
            setStatus('paused');
          }
        }

        function toggleMute() {
          video.muted = !video.muted;
          el.setAttribute('data-player-muted', video.muted ? 'true' : 'false');
        }

        function toggleFullscreen() {
          const wrapper = el.closest('.mini-showreel__card') || el;
          if (!document.fullscreenElement) {
            wrapper.requestFullscreen().then(() => {
              el.setAttribute('data-player-fullscreen', 'true');
            }).catch(() => {});
          } else {
            document.exitFullscreen().then(() => {
              el.setAttribute('data-player-fullscreen', 'false');
            }).catch(() => {});
          }
        }

        // play/pause buttons
        el.querySelectorAll('[data-player-control="playpause"]').forEach((btn) => {
          btn.addEventListener('click', togglePlay);
        });

        // mute button
        el.querySelectorAll('[data-player-control="mute"]').forEach((btn) => {
          btn.addEventListener('click', toggleMute);
        });

        // fullscreen button
        el.querySelectorAll('[data-player-control="fullscreen"]').forEach((btn) => {
          btn.addEventListener('click', toggleFullscreen);
        });

        // timeline
        const timeline = el.querySelector('[data-player-timeline]');
        const progressBar = el.querySelector('[data-player-progress]');
        const bufferedBar = el.querySelector('[data-player-buffered]');
        const handle = el.querySelector('[data-player-timeline-handle]');
        const timeProgress = el.querySelector('[data-player-time-progress]');
        const timeDuration = el.querySelector('[data-player-time-duration]');
        let isDraggingTimeline = false;

        function formatTime(sec) {
          if (!sec || !isFinite(sec)) return '00:00';
          const m = Math.floor(sec / 60);
          const s = Math.floor(sec % 60);
          return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
        }

        function updateTimeline() {
          if (!video.duration) return;
          const pct = (video.currentTime / video.duration) * 100;
          if (progressBar) progressBar.style.transform = `translate(-${100 - pct}%)`;
          if (handle) handle.style.left = pct + '%';
          if (timeProgress) timeProgress.textContent = formatTime(video.currentTime);
          if (timeDuration) timeDuration.textContent = formatTime(video.duration);

          // buffered
          if (bufferedBar && video.buffered.length > 0) {
            const bufEnd = video.buffered.end(video.buffered.length - 1);
            const bufPct = (bufEnd / video.duration) * 100;
            bufferedBar.style.transform = `translate(-${100 - bufPct}%)`;
          }
        }

        video.addEventListener('timeupdate', () => { if (!isDraggingTimeline) updateTimeline(); });
        video.addEventListener('progress', updateTimeline);
        video.addEventListener('loadedmetadata', () => {
          if (timeDuration) timeDuration.textContent = formatTime(video.duration);
        });

        if (timeline) {
          function seekTo(e) {
            const rect = timeline.getBoundingClientRect();
            const pct = gsap.utils.clamp(0, 1, (e.clientX - rect.left) / rect.width);
            video.currentTime = pct * video.duration;
            updateTimeline();
          }

          timeline.addEventListener('mousedown', (e) => {
            isDraggingTimeline = true;
            el.setAttribute('data-timeline-drag', 'true');
            seekTo(e);
          });
          document.addEventListener('mousemove', (e) => { if (isDraggingTimeline) seekTo(e); });
          document.addEventListener('mouseup', () => {
            if (isDraggingTimeline) {
              isDraggingTimeline = false;
              el.removeAttribute('data-timeline-drag');
            }
          });
        }

        // hover state
        el.addEventListener('mouseenter', () => el.setAttribute('data-player-hover', 'active'));
        el.addEventListener('mouseleave', () => el.setAttribute('data-player-hover', 'idle'));

        // video events
        video.addEventListener('play', () => setStatus('playing'));
        video.addEventListener('pause', () => {
          if (!video.ended) setStatus('paused');
        });
        video.addEventListener('ended', () => {
          setStatus('ended');
          setActivated('false');
        });
        video.addEventListener('waiting', () => setStatus('loading'));
        video.addEventListener('playing', () => setStatus('playing'));

        // lazy init
        const lazyMode = el.getAttribute('data-player-lazy');
        if (lazyMode === 'meta') {
          setStatus('idle');
        } else {
          initHLS();
        }

        // store init fn for showreel open
        el._initHLS = initHLS;
        el._video = video;
      });
    }
    initBunnyPlayers();

    /* ============================================================
       MINI SHOWREEL LIGHTBOX
       ============================================================ */
    function initShowreel() {
      const lightbox = document.querySelector('[data-mini-showreel-lightbox]');
      if (!lightbox) return;

      const openTrigger = lightbox.querySelector('[data-mini-showreel-open]');
      const safeArea = lightbox.querySelector('[data-mini-showreel-safearea]');
      const player = lightbox.querySelector('[data-bunny-player-init]');

      function openShowreel() {
        lightbox.setAttribute('data-mini-showreel-status', 'active');
        if (lenis) lenis.stop();
        document.documentElement.style.overflow = 'hidden';

        // init HLS if not yet
        if (player && player._initHLS && !player._video.src) {
          player._initHLS();
        }
      }

      function closeShowreel() {
        lightbox.setAttribute('data-mini-showreel-status', 'not-active');
        if (lenis) lenis.start();
        document.documentElement.style.overflow = '';

        // pause video
        if (player && player._video) {
          player._video.pause();
          player._video.currentTime = 0;
          player.setAttribute('data-player-status', 'ready');
          player.setAttribute('data-player-activated', 'false');
        }
      }

      if (openTrigger) openTrigger.addEventListener('click', openShowreel);

      // close on dark overlay click
      const dark = lightbox.querySelector('.mini-showreel-lightbox__dark');
      if (dark) dark.addEventListener('click', closeShowreel);

      // close on escape
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && lightbox.getAttribute('data-mini-showreel-status') === 'active') {
          closeShowreel();
        }
      });
    }
    initShowreel();

    /* ============================================================
       PAGE TRANSITION (Barba-like shape)
       ============================================================ */
    function initPageTransition() {
      const transition = document.querySelector('[data-transition]');
      if (!transition) return;

      const path = transition.querySelector('path');
      if (!path) return;

      // shape morph states (simplified)
      const closedPath = 'M0 0 Q50 0, 100 0 T 100 0 L 100 100 Q 50 100, 0 100 T 0 100 Z';
      const openPath = 'M20.002 787.914C41.7003 820.073 100.527 881.496 162.246 869.918C239.396 855.447 258.683 763.796 203.232 669.732C147.781 575.669 65.8095 404.425 162.246 361.011C258.683 317.597 292.436 397.189 294.847 553.962C297.258 710.734 444.324 739.677 463.611 640.789C482.898 541.902 249.039 414.072 323.778 283.831C398.516 153.589 675.772 218.71 656.484 464.722C637.197 710.734 579.335 925.392 745.688 922.98C912.042 920.568 928.918 797.562 875.878 686.615C822.838 575.669 731.223 500.9 890.343 430.955C1049.46 361.011 1080.81 262.124 996.424 194.591C912.042 127.058 733.634 346.54 656.484 225.945C579.335 105.351 400.927 35.4064 224.93 180.119';

      function transitionIn() {
        if (reduce) return Promise.resolve();
        return new Promise((resolve) => {
          const tl = gsap.timeline({ onComplete: resolve });
          tl.set(transition, { visibility: 'visible' })
            .set(path, { attr: { d: closedPath } })
            .to(path, { attr: { d: openPath }, duration: 0.8, ease: 'power3.inOut' })
            .set(transition, { visibility: 'hidden', delay: 0.1 });
        });
      }

      function transitionOut() {
        if (reduce) return Promise.resolve();
        return new Promise((resolve) => {
          const tl = gsap.timeline({ onComplete: resolve });
          tl.set(transition, { visibility: 'visible' })
            .set(path, { attr: { d: openPath } })
            .to(path, { attr: { d: closedPath }, duration: 0.8, ease: 'power3.inOut' })
            .set(transition, { visibility: 'hidden', delay: 0.1 });
        });
      }

      // expose for nav links
      window.__lxlTransition = { transitionIn, transitionOut };
    }
    initPageTransition();

    /* ============================================================
       FOOTER SQUIGGLE DRAW
       ============================================================ */
    const squiggle = document.querySelector('[data-squiggle]');
    if (squiggle && !reduce) {
      const path = squiggle.querySelector('path');
      if (path) {
        const len = path.getTotalLength();
        gsap.set(path, { strokeDasharray: len, strokeDashoffset: len });
        gsap.to(path, {
          strokeDashoffset: 0,
          duration: 2,
          ease: 'power2.inOut',
          scrollTrigger: { trigger: squiggle, start: 'top 90%', once: true }
        });
      }
    }

    /* ============================================================
       FOOTER HEADING MASK REVEAL
       ============================================================ */
    const heading = document.querySelector('[data-split-reveal]');
    if (heading && !reduce && typeof SplitText !== 'undefined') {
      const split = new SplitText(heading, { type: 'words', wordsClass: 'split-word' });
      split.words.forEach((w) => {
        const mask = document.createElement('span');
        mask.className = 'split-mask';
        w.parentNode.insertBefore(mask, w);
        mask.appendChild(w);
      });
      gsap.set('.split-mask', { display: 'inline-block', overflow: 'hidden', verticalAlign: 'top' });
      gsap.set('.split-word', { display: 'inline-block', willChange: 'transform' });
      gsap.from(split.words, {
        yPercent: 115,
        opacity: 0,
        duration: 0.9,
        ease: 'power4.out',
        stagger: 0.055,
        scrollTrigger: { trigger: heading, start: 'top 82%', once: true }
      });
    }

    /* ============================================================
       WORK SLIDER READY (data-work-ready)
       ============================================================ */
    if (section) {
      section.setAttribute('data-work-ready', 'true');
    }

    /* ============================================================
       RESIZE
       ============================================================ */
    let rT = null;
    window.addEventListener('resize', () => {
      clearTimeout(rT);
      rT = setTimeout(() => { recalc(); ScrollTrigger.refresh(); }, 150);
    });

    /* ============================================================
       NAV DROPDOWN — close on outside click (mobile/desktop)
       ============================================================ */
    document.addEventListener('click', (e) => {
      if (!navDropdowns) return;
      if (activeDropdown && !e.target.closest('.nav_link_item') && !e.target.closest('[data-nav-dropdown]')) {
        closeDropdown();
      }
    });

    /* ============================================================
       WORK ITEM HOVER PARALLAX (image scale on card hover)
       ============================================================ */
    if (!reduce) {
      items.forEach((item) => {
        const img = item.querySelector('.u-image');
        if (!img) return;
        item.addEventListener('mouseenter', () => {
          gsap.to(img, { scale: 1.04, duration: 0.6, ease: 'power2.out' });
        });
        item.addEventListener('mouseleave', () => {
          gsap.to(img, { scale: 1, duration: 0.6, ease: 'power2.out' });
        });
      });
    }

    /* ============================================================
       HOMEPAGE — HERO IMAGE SWAP
       ============================================================ */
    const heroSwap = document.querySelector('[data-hero-swap]');
    if (heroSwap && !reduce) {
      const heroImages = Array.from(heroSwap.querySelectorAll('[data-hero-swap-image]'));
      if (heroImages.length > 1) {
        let heroIdx = 0;
        // never leave all hidden: first child is visible via CSS
        heroImages.forEach((img, i) => img.classList.toggle('is-active', i === 0));
        setInterval(() => {
          heroImages[heroIdx].classList.remove('is-active');
          heroIdx = (heroIdx + 1) % heroImages.length;
          heroImages[heroIdx].classList.add('is-active');
        }, 3000);
      }
    }

    /* ============================================================
       HOMEPAGE — VIDEO SCROLL (bg zoom showreel)
       ============================================================ */
    const videoScroll = document.querySelector('.video-scroll_wrap');
    if (videoScroll) {
      const bgZoom = videoScroll.querySelector('[data-bg-zoom-init]');
      const video = videoScroll.querySelector('video');
      const muteToggle = videoScroll.querySelector('[data-mute-toggle]');
      const src = bgZoom ? bgZoom.getAttribute('data-player-src') : null;

      function initBgVideo() {
        if (!video || !src || video.src) return;
        if (typeof Hls !== 'undefined' && Hls.isSupported()) {
          const hls = new Hls();
          hls.loadSource(src);
          hls.attachMedia(video);
          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            bgZoom.setAttribute('data-player-status', 'ready');
            video.play().catch(() => {});
          });
          hls.on(Hls.Events.ERROR, (_, data) => {
            if (data.fatal) {
              if (data.type === Hls.ErrorTypes.NETWORK_ERROR) hls.startLoad();
              else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) hls.recoverMediaError();
            }
          });
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = src;
          video.addEventListener('loadedmetadata', () => {
            bgZoom.setAttribute('data-player-status', 'ready');
            video.play().catch(() => {});
          });
        }
      }

      // lazy init when scrolled near
      const vObserver = new IntersectionObserver((entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) { initBgVideo(); vObserver.disconnect(); }
        });
      }, { rootMargin: '200px' });
      vObserver.observe(videoScroll);

      // mute toggle
      if (muteToggle) {
        muteToggle.addEventListener('click', () => {
          if (!video) return;
          video.muted = !video.muted;
          muteToggle.setAttribute('aria-checked', video.muted ? 'true' : 'false');
        });
      }

      // scroll-driven scale/zoom on the video content
      if (!reduce) {
        const zoomImg = videoScroll.querySelector('.bunny-bg');
        const overlay = videoScroll.querySelector('[data-bg-zoom-dark]');

        ScrollTrigger.create({
          trigger: videoScroll,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 1,
          onUpdate(self) {
            const p = self.progress;
            if (zoomImg) gsap.set(zoomImg, { scale: 1 + p * 0.35 });
            if (overlay) gsap.set(overlay, { opacity: p * 0.6 });
          }
        });
      }
    }

    /* ============================================================
       HOMEPAGE — CARD STACK (services, pinned)
       ============================================================ */
    const cardStack = document.querySelector('[data-media-stack]');
    if (cardStack && !reduce) {
      const pin = cardStack.querySelector('[data-media-stack-pin]');
      const container = cardStack.querySelector('[data-media-stack-container]');
      const stackItems = Array.from(cardStack.querySelectorAll('[data-media-stack-item]'));
      const gap = parseInt(cardStack.getAttribute('data-media-stack-gap') || '30', 10);

      if (pin && stackItems.length > 0) {
        // position cards in a stacked pile
        stackItems.forEach((item, i) => {
          gsap.set(item, {
            y: i * gap,
            zIndex: i,
            scale: 1 - i * 0.02,
            opacity: i === 0 ? 1 : 0
          });
        });

        ScrollTrigger.create({
          trigger: pin,
          start: 'top top',
          end: () => '+=' + (stackItems.length * 60) + '%',
          pin: container,
          pinSpacing: true,
          scrub: 1,
          onUpdate(self) {
            const total = stackItems.length;
            const seg = 1 / total;
            stackItems.forEach((item, i) => {
              if (i === 0) {
                const cp = gsap.utils.clamp(0, 1, self.progress / seg);
                gsap.set(item, { opacity: 1 - cp * 0.3, scale: 1 - cp * 0.02, y: -cp * (gap * 0.3) });
              } else {
                const start = i * seg;
                const pp = gsap.utils.clamp(0, 1, (self.progress - start + seg) / seg);
                const np = gsap.utils.clamp(0, 1, (self.progress - start) / seg);
                gsap.set(item, {
                  y: i * gap - np * gap * 0.5,
                  opacity: pp,
                  scale: 1 - i * 0.02 + np * 0.02,
                  zIndex: i
                });
              }
            });
          }
        });
      }
    }

    /* ============================================================
       HOMEPAGE — IMG CYCLE (about)
       ============================================================ */
    const imgCycle = document.querySelector('[data-image-cycle]');
    if (imgCycle && !reduce) {
      const cycleItems = Array.from(imgCycle.querySelectorAll('[data-image-cycle-item]'));
      if (cycleItems.length > 1) {
        let cycleIdx = 0;
        cycleItems[0].classList.add('is-active');
        setInterval(() => {
          cycleItems[cycleIdx].classList.remove('is-active');
          cycleIdx = (cycleIdx + 1) % cycleItems.length;
          cycleItems[cycleIdx].classList.add('is-active');
        }, 4000);
      }
    }

    /* ============================================================
       HOMEPAGE — FEATURED PROJECTS slider
       ============================================================ */
    const ftProjects = document.querySelector('[data-featured]');
    if (ftProjects) {
      const cardsWrap = ftProjects.querySelector('[data-featured-cards]');
      const bgItems = Array.from(ftProjects.querySelectorAll('[data-featured-bg] .ft-projects_bg_item'));
      const progressBar = ftProjects.querySelector('[data-featured-progress-bar]');
      const nav = ftProjects.querySelector('.ft-projects_nav');
      let activeIdx = 0;

      function setActive(idx) {
        const isInit = activeIdx === idx && !bgItems.some(b => b.style.opacity);
        activeIdx = gsap.utils.clamp(0, cardsWrap.children.length - 1, idx);
        bgItems.forEach((b, i) => {
          b.classList.toggle('is-active', i === activeIdx);
          if (isInit) {
            gsap.set(b, { opacity: 1, zIndex: i === activeIdx ? 2 : 1 });
          } else if (i === activeIdx) {
            gsap.set(b, { zIndex: 2 });
            gsap.to(b, { opacity: 1, duration: 0.8, ease: 'power2.out' });
          } else {
            gsap.set(b, { zIndex: 1 });
            gsap.to(b, { opacity: 0, duration: 0.8, ease: 'power2.out' });
          }
        });
        if (progressBar) {
          const pct = cardsWrap.children.length > 1 ? (activeIdx / (cardsWrap.children.length - 1)) * 100 : 100;
          gsap.set(progressBar, { scaleX: (activeIdx + 1) / cardsWrap.children.length });
        }
        if (cardsWrap && !reduce) {
          const card = cardsWrap.children[activeIdx];
          if (card) {
            const wrapWidth = cardsWrap.parentElement.clientWidth;
            const target = Math.min(0, wrapWidth / 2 - card.offsetLeft - card.offsetWidth / 2);
            gsap.to(cardsWrap, { x: target, duration: 0.7, ease: 'power3.out' });
          }
        }
      }

      // build nav arrows
      if (nav) {
        const mkBtn = (label) => {
          const b = document.createElement('button');
          b.setAttribute('aria-label', label);
          b.className = 'button_main_wrap';
          b.style.cssText = 'width:2.5rem;height:2.5rem;';
          b.innerHTML = '<div class="button_main_element" style="padding:.5rem;"><svg viewBox="0 0 24 24" fill="none" style="width:1rem;height:1rem;"><path d="' + (label === 'Previous' ? 'M15 6L9 12L15 18' : 'M9 6L15 12L9 18') + '" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></div>';
          b.addEventListener('click', () => setActive(activeIdx + (label === 'Previous' ? -1 : 1)));
          return b;
        };
        nav.appendChild(mkBtn('Previous'));
        nav.appendChild(mkBtn('Next'));
      }

      // wheel / drag on the card list
      if (cardsWrap && !reduce) {
        let wheelT = null;
        cardsWrap.parentElement.addEventListener('wheel', (e) => {
          if (Math.abs(e.deltaY) < 8 && Math.abs(e.deltaX) < 8) return;
          clearTimeout(wheelT);
          wheelT = setTimeout(() => {
            const dir = (Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY) > 0 ? 1 : -1;
            setActive(activeIdx + dir);
          }, 120);
        }, { passive: true });
      }

      // initial state: all bg items visible, last one on top (matches live)
      bgItems.forEach((b, i) => {
        gsap.set(b, { opacity: 1, zIndex: i + 1 });
      });

      // scroll trigger to activate cards
      if (!reduce) {
        const cardEls = Array.from(cardsWrap ? cardsWrap.children : []);
        cardEls.forEach((card, i) => {
          ScrollTrigger.create({
            trigger: card,
            start: 'left 60%',
            end: 'right 40%',
            horizontal: false,
            onEnter: () => setActive(i),
            onEnterBack: () => setActive(i)
          });
        });
      }

      setActive(0);
    }

    /* ============================================================
       HOMEPAGE — FEATURE PILLS (Why LxL)
       ============================================================ */
    const pills = document.querySelector('[data-feature-pills-init]');
    if (pills) {
      const list = pills.querySelector('[data-feature-pills-list]');
      const pillItems = Array.from(pills.querySelectorAll('[data-feature-pills-item]'));
      const visuals = Array.from(pills.querySelectorAll('[data-feature-pills-visual]'));
      const closeBtn = pills.querySelector('[data-feature-pills-close]');

      function activatePill(idx) {
        pillItems.forEach((p, i) => {
          const on = i === idx;
          p.setAttribute('data-active', on ? 'true' : 'false');
          const btn = p.querySelector('[data-feature-pills-button]');
          if (btn) btn.setAttribute('aria-expanded', on ? 'true' : 'false');
        });
        visuals.forEach((v, i) => v.classList.toggle('is-active', i === idx));
        pills.setAttribute('data-feature-pills-active', idx >= 0 ? 'true' : 'false');
      }

      pillItems.forEach((p, i) => {
        const btn = p.querySelector('[data-feature-pills-button]');
        if (btn) {
          btn.addEventListener('click', () => {
            const isOpen = p.getAttribute('data-active') === 'true';
            activatePill(isOpen ? -1 : i);
          });
        }
      });

      if (closeBtn) closeBtn.addEventListener('click', () => activatePill(-1));
      activatePill(0);
    }

    /* ============================================================
       HOMEPAGE — TESTIMONIALS
       ============================================================ */
    const testimonialWrap = document.querySelector('[data-testimonial-wrap]');
    if (testimonialWrap) {
      const items = Array.from(testimonialWrap.querySelectorAll('[data-testimonial-item]'));
      const pagBtns = Array.from(testimonialWrap.querySelectorAll('[data-testimonial-pagination-item]'));
      const autoplay = testimonialWrap.getAttribute('data-testimonial-autoplay') === 'true';
      const duration = parseInt(testimonialWrap.getAttribute('data-testimonial-duration') || '8000', 10);

      function showTestimonial(idx) {
        items.forEach((it, i) => it.classList.toggle('is-active', i === idx));
        pagBtns.forEach((b, i) => b.classList.toggle('is-active', i === idx));
      }

      pagBtns.forEach((btn, i) => {
        btn.addEventListener('click', () => { showTestimonial(i); restart(); });
      });

      let tTimer = null;
      let tIdx = 0;
      function restart() {
        clearInterval(tTimer);
        if (autoplay && !reduce) {
          tTimer = setInterval(() => {
            tIdx = (tIdx + 1) % items.length;
            showTestimonial(tIdx);
          }, duration);
        }
      }
      showTestimonial(0);
      restart();
    }

    /* ============================================================
       HOMEPAGE — DRAW SVG (squiggles)
       ============================================================ */
    if (!reduce) {
      document.querySelectorAll('[data-draw-svg]').forEach((el) => {
        const path = el.querySelector('path');
        if (!path) return;
        const reverse = el.hasAttribute('data-draw-svg-reverse');
        const dur = parseFloat(el.getAttribute('data-draw-svg-duration') || '2');
        const start = el.getAttribute('data-draw-svg-start') || 'top 80%';
        const len = path.getTotalLength();
        gsap.set(path, { strokeDasharray: len, strokeDashoffset: reverse ? 0 : len });
        gsap.to(path, {
          strokeDashoffset: reverse ? len : 0,
          duration: dur,
          ease: 'power2.inOut',
          scrollTrigger: { trigger: el, start, once: true }
        });
      });
    }

    /* ============================================================
       HOMEPAGE — SECTION THEME SWITCHING
       ============================================================ */
    const themedSections = document.querySelectorAll('[data-animate-theme-to]');
    if (themedSections.length && !reduce) {
      themedSections.forEach((sec) => {
        const to = sec.getAttribute('data-animate-theme-to');
        ScrollTrigger.create({
          trigger: sec,
          start: 'top 30%',
          end: 'bottom 30%',
          onToggle(self) {
            if (self.isActive) {
              document.body.setAttribute('data-page-theme', to);
            }
          }
        });
      });
    }

    /* ============================================================
       SERVICES — STACKING CARDS
       ============================================================ */
    function getViewportTier() {
      const w = window.innerWidth;
      if (w <= 479) return 'mobile-portrait';
      if (w <= 767) return 'mobile-landscape';
      if (w <= 991) return 'tablet';
      return 'desktop';
    }
    function parseListAttr(el, attr, fallback) {
      const raw = el.getAttribute(attr);
      if (!raw) return fallback;
      const parts = raw.split(',').map(v => v.trim()).filter(v => v !== '');
      return parts.length ? parts : fallback;
    }
    function bounceCard(el) {
      const w = el.offsetWidth;
      const h = el.offsetHeight;
      const fs = 1.5 * parseFloat(getComputedStyle(el).fontSize);
      const sx = (w + fs) / w;
      const sy = (h - fs * 0.33) / h;
      gsap.timeline()
        .to(el, { scaleX: sx, scaleY: sy, duration: 0.1, ease: 'power1.out' })
        .to(el, { scaleX: 1, scaleY: 1, duration: 1, ease: 'elastic.out(0.5, 0.3)' });
    }
    function initStackingCards() {
      const stacks = document.querySelectorAll('[data-stacking-cards-init]');
      const tier = getViewportTier();
      stacks.forEach(stack => {
        const enabled =
          (tier === 'desktop' && stack.dataset.stackingCardsDesktop === 'true') ||
          (tier === 'tablet' && stack.dataset.stackingCardsTablet === 'true') ||
          ((tier === 'mobile-portrait' || tier === 'mobile-landscape') && stack.dataset.stackingCardsMobile === 'true');
        if (!enabled) return;
        const cards = Array.from(stack.querySelectorAll('[data-stacking-card]'));
        if (!cards.length) return;
        const topOffset = parseFloat(getComputedStyle(cards[0]).top) || 0;
        const rotations = parseListAttr(stack, 'data-stacking-cards-desktop-rotate', [0, 4, -4]);
        const xValues = parseListAttr(stack, 'data-stacking-cards-desktop-x', ['0em', '0em', '0em']);
        const yValues = parseListAttr(stack, 'data-stacking-cards-desktop-y', ['0em', '0em', '0em']);
        cards.forEach((card, idx) => {
          const target = card.querySelector('[data-stacking-card-target]');
          if (!target) return;
          const rot = parseFloat(rotations[idx % rotations.length]) || 0;
          const xVal = xValues[idx % xValues.length];
          const yVal = yValues[idx % yValues.length];
          gsap.set(target, { rotate: 0, x: 0, y: 0, scale: 1, zIndex: cards.length - idx });
          gsap.to(target, {
            rotate: rot, x: xVal, y: yVal,
            ease: 'power1.in',
            overwrite: 'auto',
            scrollTrigger: {
              id: `stacking-rotate-${idx}`,
              trigger: card,
              start: 'top 75%',
              end: `top-=${topOffset} top`,
              scrub: true
            }
          });
          ScrollTrigger.create({
            id: `stacking-bounce-${idx}`,
            trigger: card,
            start: `top-=${topOffset} top`,
            onEnter: () => bounceCard(target)
          });
        });
      });
    }
    if (!reduce) initStackingCards();

    /* ============================================================
       HOMEPAGE — ENTER ITEM reveal
       ============================================================ */
    if (!reduce) {
      document.querySelectorAll('[data-enter-item]').forEach((el) => {
        gsap.to(el, {
          opacity: 1,
          duration: 1,
          ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 85%', once: true }
        });
      });
    }

  } // end boot()

  boot();
})();
