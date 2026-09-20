// Add work service tags after page loads (to avoid Webflow JS interference)
(function() {
  var catLabels = {
    'key-art': 'Key Art',
    'unit': 'Unit',
    'epk': 'EPK',
    'social-campaigns': 'Social Campaigns',
    'editorial': 'Editorial',
    'shoot-production': 'Shoot Production',
    'activations': 'Activations',
    'creative-direction': 'Creative Direction',
    'international': 'International',
  };

  var slideCategories = null;

  function addServiceTags() {
    var slider = document.querySelector('[data-work-slider]');
    if (!slider) return;
    var slides = slider.querySelectorAll('[data-work-slide]');
    if (!slides.length) return;

    // Load categories from embedded JSON if available
    if (!slideCategories) {
      var script = document.getElementById('work-categories-data');
      if (script) {
        try { slideCategories = JSON.parse(script.textContent); } catch(e) { return; }
      } else { return; }
    }

    slides.forEach(function(slide, i) {
      var tags = slide.querySelector('.work-list_item_tags');
      if (!tags || tags.querySelector('.work_services_list_wrap')) return;

      var cat = slideCategories[i];
      if (!cat || !cat.cats) return;

      // Add hidden data-work-category items (for odyn filter logic)
      var hiddenList = document.createElement('div');
      hiddenList.className = 'work_services_list';
      hiddenList.style.display = 'none';
      cat.cats.forEach(function(c) {
        var item = document.createElement('div');
        item.className = 'work_services_item';
        item.setAttribute('data-work-category', c);
        hiddenList.appendChild(item);
      });
      tags.appendChild(hiddenList);

      // Add visible service tags
      var wrap = document.createElement('div');
      wrap.className = 'work_services_list_wrap';
      var list = document.createElement('div');
      list.className = 'work_services_list';
      cat.cats.forEach(function(c) {
        var item = document.createElement('div');
        item.className = 'work_services_item';
        item.style.flex = 'none';
        var link = document.createElement('a');
        link.href = '/services';
        link.className = 'work_services_item_link w-inline-block';
        var text = document.createElement('div');
        text.className = 'work_services_item_text';
        text.textContent = catLabels[c] || c;
        link.appendChild(text);
        item.appendChild(link);
        list.appendChild(item);
      });
      wrap.appendChild(list);
      tags.appendChild(wrap);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      setTimeout(addServiceTags, 4000);
    });
  } else {
    setTimeout(addServiceTags, 4000);
  }
  window.addEventListener('load', function() {
    setTimeout(addServiceTags, 6000);
  });
})();
