/* "Want us to fix this?" box under every tool result, linking to the homepage audit form with the
   checked site pre-filled. Also remembers where a visitor first came from (utm_source) so the audit
   form can say so. Loaded on every tool page; styles live in mc2-tool.css. */
(function () {
  var params = new URLSearchParams(location.search);

  // First touch wins: keep the earliest utm_source this browser arrived with.
  try {
    if (params.get('utm_source') && !localStorage.getItem('mc2seo_src')) {
      localStorage.setItem('mc2seo_src', JSON.stringify({
        source: params.get('utm_source'), campaign: params.get('utm_campaign') || '', page: location.pathname, date: new Date().toISOString().slice(0, 10)
      }));
    }
  } catch (e) {}

  var slug = (location.pathname.match(/^\/tools\/([^/]+)/) || [])[1];
  // Not result-style tools: generators, checklists, history, submit-and-email flows.
  var SKIP = ['history', 'llms-txt', 'schema-builder', 'migration-checklist', 'drupal-migration-checklist',
    'optimizely-to-webflow-migration-checklist', 'indexnow', 'review-link', 'brand-builder', 'state-of-the-union'];
  if (!slug || SKIP.indexOf(slug) !== -1) return;

  var host = document.getElementById('result') || document.getElementById('results') || document.getElementById('out');
  if (!host) return;

  function checkedSite() {
    var ids = ['domain', 'url', 'website', 'site', 'homepage'];
    for (var i = 0; i < ids.length; i++) {
      var el = document.getElementById(ids[i]);
      var v = el && el.value ? el.value.trim() : '';
      if (v && v !== 'https://' && v !== 'http://') return v;
    }
    return params.get('u') || params.get('url') || '';
  }

  function auditHref() {
    var q = new URLSearchParams();
    var site = checkedSite();
    if (site) q.set('site', site);
    q.set('from', slug);
    return '/?' + q.toString() + '#contact';
  }

  function box() {
    var d = document.createElement('div');
    d.className = 'mc2-fixit';
    d.innerHTML =
      '<div class="mc2-fixit-text">' +
        '<p class="mc2-fixit-k">Free audit</p>' +
        '<p class="mc2-fixit-h">Want us to fix what this found?</p>' +
        '<p class="mc2-fixit-p">We’ll look at this and everything around it, on Google and in ChatGPT, Claude, Gemini and Perplexity, and send you a plan. Free, and we reply within one business day.</p>' +
      '</div>' +
      '<a class="mc2-fixit-btn" target="_top" href="/#contact">Get a free audit →</a>';
    // Built at click time, so it carries whatever site was checked last.
    d.querySelector('a').addEventListener('click', function () { this.href = auditHref(); });
    return d;
  }

  function visible(el) { return el.offsetParent !== null || getComputedStyle(el).position === 'fixed'; }

  var busy = false;
  function place() {
    if (busy) return;
    var has = host.querySelector('.mc2-fixit');
    // A real result: shown and with some substance (loading lines and errors are short).
    var ready = visible(host) && host.textContent.replace(/\s+/g, ' ').length > 300;
    busy = true;
    if (ready && !has) {
      var nav = host.querySelector(':scope > .sidenav');
      if (nav) host.insertBefore(box(), nav); else host.appendChild(box());
    } else if (!ready && has) {
      has.remove();
    }
    busy = false;
  }

  new MutationObserver(place).observe(host, { childList: true, subtree: true, attributes: true, attributeFilter: ['style', 'class', 'hidden'] });
  // Containers shown by toggling a parent's display are caught here too.
  new MutationObserver(place).observe(document.body, { attributes: true, subtree: true, attributeFilter: ['style', 'class', 'hidden'] });
  place();
})();
