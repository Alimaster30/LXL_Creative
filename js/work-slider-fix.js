// Work slider initial state fix
// The odyn bundle's work slider uses gsap.matchMedia() which may not
// initialize properly on localhost. This script replicates the initial state.
(function() {
  function initWorkSlider() {
    var slider = document.querySelector('[data-work-slider]');
    if (!slider) return;
    var slides = Array.from(slider.querySelectorAll('[data-work-slide]'));
    if (!slides.length) return;

    // Only initialize if the slider hasn't been set up yet
    if (slider.getAttribute('data-work-ready') !== 'true') return;
    if (typeof slider._getWorkSliderState === 'function') return; // already initialized

    // Hide overflow on the document (the work slider is a scroll-jacking component)
    document.documentElement.style.overflow = 'hidden';

    // Position work items using GSAP to match the live site's initial state
    // The live site uses a GSAP timeline with yPercent transforms
    // At initial state, the first item is at ~48% of its height
    if (typeof gsap !== 'undefined') {
      // Kill any existing tweens on the slides
      gsap.killTweensOf(slides);

      // Set initial positions - items are stacked with yPercent offsets
      // The first visible item is centered at ~48% of its height
      var viewportH = window.innerHeight;
      slides.forEach(function(slide, i) {
        var slideH = slide.getBoundingClientRect().height;
        // Calculate the yPercent to center the first item
        // The live site positions the first item at yPercent ~= 48%
        if (i === 0) {
          gsap.set(slide, { yPercent: 48, autoAlpha: 1 });
        } else {
          gsap.set(slide, { yPercent: 48 + i * 100, autoAlpha: 1 });
        }
      });

      // Set up wheel event handling for the slider
      var currentIndex = 0;
      var isAnimating = false;
      var visibleSlides = slides.filter(function(s) { return !s.hasAttribute('hidden'); });

      function goToIndex(index) {
        if (isAnimating) return;
        index = Math.max(0, Math.min(visibleSlides.length - 1, index));
        if (index === currentIndex) return;
        isAnimating = true;
        currentIndex = index;

        visibleSlides.forEach(function(slide, i) {
          gsap.to(slide, {
            yPercent: 48 + (i - index) * 100,
            autoAlpha: i === index ? 1 : 0.3,
            duration: 0.5,
            ease: 'power2.out',
            overwrite: 'auto',
            onComplete: function() { isAnimating = false; }
          });
        });
      }

      window.addEventListener('wheel', function(e) {
        e.preventDefault();
        if (Math.abs(e.deltaY) < 2) return;
        goToIndex(currentIndex + (e.deltaY > 0 ? 1 : -1));
      }, { passive: false });
    }
  }

  // Wait for everything to load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      setTimeout(initWorkSlider, 3000);
    });
  } else {
    setTimeout(initWorkSlider, 3000);
  }
  window.addEventListener('load', function() {
    setTimeout(initWorkSlider, 5000);
  });
})();
