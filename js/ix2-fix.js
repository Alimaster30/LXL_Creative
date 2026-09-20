// Fallback for Webflow IX2 intro animations
// The IX2 engine sets opacity:1 on elements that CSS hides with opacity:0
// This script replicates that behavior on pages where IX2 doesn't initialize
(function() {
  function fixHiddenElements() {
    // Fix elements hidden by [data-work-slider] CSS rule
    document.querySelectorAll('[data-work-slides], [data-work-filters]').forEach(function(el) {
      el.style.opacity = '1';
      el.style.visibility = 'inherit';
    });
    // Fix work-list_item transforms (GSAP scroll animation sets initial y offset)
    var firstItem = document.querySelector('.work-list_item.w-dyn-item');
    if (firstItem) {
      var r = firstItem.getBoundingClientRect();
      // Only fix if the item is at y=0 but should be offset (inside work-list_list)
      var list = document.querySelector('.work-list_list');
      if (list) {
        var listR = list.getBoundingClientRect();
        if (Math.round(r.y - listR.y) === 0 && r.height > 100) {
          // Item should have a y offset within the list
          // The live site positions it at the same y as the header
          var header = document.querySelector('.work-list_header_layout');
          if (header) {
            var hR = header.getBoundingClientRect();
            firstItem.style.transform = 'translateY(' + Math.round(hR.y - listR.y) + 'px)';
          }
        }
      }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      setTimeout(fixHiddenElements, 3000);
    });
  } else {
    setTimeout(fixHiddenElements, 3000);
  }
  // Also run after full load + delay
  window.addEventListener('load', function() {
    setTimeout(fixHiddenElements, 5000);
  });
})();
