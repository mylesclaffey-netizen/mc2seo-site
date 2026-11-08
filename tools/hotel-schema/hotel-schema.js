// Hotel schema builder: a staged form a hotel manager fills in, producing schema.org JSON-LD for the hotel's own
// website. Shared, identical, by two sites: Prague Directory (/for-business/hotel-schema/, assets/tools/hotel-schema.js)
// and mc2seo.com (/tools/hotel-schema/, tools/hotel-schema/hotel-schema.js). Keep the two copies the same.
//
// Mount: <div id="hs-app" data-city="Prague" data-country="CZ" data-prefill="listing" data-audit=""></div>
//   data-city / data-country  default address values (empty on mc2seo)
//   data-prefill="listing"    Prague Directory only: ?listing=/stays/<id>/ fills the form from that listing's JSON
//   data-audit                optional URL of a page checker to suggest after installing the code
//
// Honest by design: only what the hotel enters goes in, nothing is defaulted, and it never produces ratings or reviews
// the hotel gives itself, or prices marked as available without live availability behind them.
(() => {
  const app = document.getElementById('hs-app');
  if (!app) return;
  const cfg = app.dataset;
  const DRAFT = 'hs_draft_v1';
  const el = (tag, attrs = {}, ...kids) => {
    const e = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (k === 'class') e.className = v; else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
      else if (v === true) e.setAttribute(k, ''); else if (v != null && v !== false) e.setAttribute(k, v);
    }
    for (const k of kids.flat()) if (k != null) e.append(k instanceof Node ? k : String(k));
    return e;
  };

  // ---- the form, in sections; only the first is open
  const LANGS = ['English', 'Czech', 'German', 'French', 'Spanish', 'Italian', 'Polish', 'Ukrainian', 'Russian', 'Chinese', 'Japanese', 'Korean'];
  const PAY = ['Cash', 'Credit card', 'Debit card', 'Apple Pay', 'Google Pay', 'Bank transfer'];
  const AMENITIES = ['Free Wi-Fi', 'Air conditioning in all rooms', 'Air conditioning in some rooms', 'Lift', 'Step-free entrance', 'Accessible rooms',
    'Breakfast available', 'Restaurant', 'Bar', 'Room service', 'Fitness centre', 'Spa', 'Sauna', 'Indoor pool', 'Outdoor pool', 'Parking on site',
    'Electric vehicle charging', 'Airport transfer', 'Laundry service', 'Luggage storage', 'Family rooms', 'Kitchen or kitchenette', 'Meeting rooms',
    'Non-smoking rooms', 'Garden or terrace'];
  const ROOM_AMENITIES = ['Air conditioning', 'Kitchenette', 'Balcony', 'Bathtub', 'Work desk', 'Safe'];
  const CZ = cfg.country === 'CZ'; // Prague Directory; mc2seo leaves the country empty and gets generic examples
  // Form choices with no schema.org type of their own. A pension (a small, often family-run guesthouse, common across
  // Central Europe) has none, so it is the general LodgingBusiness; it keeps its own choice so the form shows
  // "Pension" again when a saved draft is reopened, instead of the aparthotel option that shares the type.
  const TYPE_OUT = { Pension: 'LodgingBusiness' };
  const SECTIONS = [
    { title: 'The essentials', open: true, hint: 'About two minutes. The rest is optional: open a section only if you want it.', fields: [
      ['name', 'Hotel name', 'text', { required: true }],
      ['type', 'Type', 'select', { options: [['Hotel', 'Hotel'], ['LodgingBusiness', 'Aparthotel or serviced apartments'], ['Pension', 'Pension or guesthouse'], ['Hostel', 'Hostel'], ['BedAndBreakfast', 'Bed and breakfast'], ['Resort', 'Resort'], ['Motel', 'Motel']] }],
      ['url', 'Website', 'url', { required: true, placeholder: 'https://' }],
      ['telephone', 'Phone', 'tel', { placeholder: CZ ? '+420 …' : 'With the country code, e.g. +44 …' }],
      ['email', 'Email for guests', 'email'],
      ['street', 'Street address', 'text', { required: true }],
      ['postcode', 'Postcode', 'text', { required: true, half: true }],
      ['city', 'City', 'text', { required: true, half: true }],
      ['country', 'Country (two-letter code)', 'text', { required: true, half: true, placeholder: CZ ? 'CZ' : 'e.g. GB, DE, US' }],
      ['checkin', 'Check-in from', 'time', { half: true }],
      ['checkout', 'Check-out by', 'time', { half: true }],
      ['languages', 'Languages your staff speak', 'checks', { options: LANGS }],
      ['languagesOther', 'Other languages', 'text', { placeholder: 'Comma-separated' }]
    ] },
    { title: 'Star rating', hint: `Only an official classification, with the body that gave it (${CZ ? 'in Czechia, the Hotelstars Union register' : 'e.g. Hotelstars Union in much of Europe, the AA or VisitEngland in England'}).`, fields: [
      ['stars', 'Stars', 'select', { options: [['', 'No official rating'], ['1', '1 star'], ['2', '2 stars'], ['3', '3 stars'], ['4', '4 stars'], ['5', '5 stars']] }],
      ['starsBody', 'Classified by', 'text', { placeholder: 'e.g. Hotelstars Union' }]
    ] },
    { title: 'Location', hint: 'Map position from Google Maps (right-click the pin to copy it). Leave both empty rather than guess.', fields: [
      ['lat', 'Latitude', 'text', { half: true, placeholder: '50.0875' }],
      ['lng', 'Longitude', 'text', { half: true, placeholder: '14.4213' }],
      ['hasMap', 'Google Maps link', 'url']
    ] },
    { title: 'About the hotel and images', fields: [
      ['alternateName', 'Other name the hotel is known by', 'text'],
      ['legalName', 'Company name', 'text'],
      ['description', 'Short description', 'textarea', { max: 400, placeholder: 'What the hotel is, where, and who it suits. Plain facts, as on your website.' }],
      ['logo', 'Logo (image address)', 'url'],
      ['images', 'Photos (image addresses)', 'list', { placeholder: 'https://…/photo.jpg' }],
      ['sameAs', 'Your profiles elsewhere (Instagram, Facebook, Tripadvisor…)', 'list', { placeholder: 'https://' }]
    ] },
    { title: 'Reception and booking', fields: [
      ['reception24h', '24-hour reception', 'check'],
      ['receptionHours', 'Otherwise, reception hours', 'text', { placeholder: '07:00-23:00' }],
      ['bookingUrl', 'Direct booking page', 'url'],
      ['priceRange', 'Typical price range', 'text', { placeholder: CZ ? 'e.g. CZK 2,500–6,000 a night' : 'e.g. €120–€300 a night' }],
      ['currencies', 'Currencies accepted', 'text', { placeholder: CZ ? 'CZK, EUR' : 'e.g. EUR, GBP' }],
      ['payment', 'Payment accepted', 'checks', { options: PAY }]
    ] },
    { title: 'Amenities', hint: 'Tick only what every guest can use, or say "some rooms" where it varies.', fields: [['amenities', '', 'checks', { options: AMENITIES }]] },
    { title: 'Policies', fields: [
      ['pets', 'Pets', 'select', { options: [['', 'Not stated'], ['yes', 'Allowed'], ['no', 'Not allowed'], ['request', 'On request']] }],
      ['smoking', 'Smoking', 'select', { options: [['', 'Not stated'], ['no', 'Not allowed anywhere'], ['yes', 'Allowed in some areas']] }],
      ['rooms', 'Number of rooms', 'number', { half: true }]
    ] },
    { title: 'Room types', hint: 'One block per room type: beds, how many guests, size and view.', fields: [['roomTypes', '', 'rooms']] },
    { title: 'Awards', fields: [['awards', 'Awards and recognitions', 'list', { text: true, placeholder: 'e.g. MICHELIN Key 2025' }]] }
  ];

  const state = load() || { languages: [], payment: [], amenities: [], images: [], sameAs: [], awards: [], roomTypes: [] };
  for (const k of ['city', 'country']) if (state[k] == null && cfg[k]) state[k] = cfg[k];
  function load() { try { return JSON.parse(localStorage.getItem(DRAFT) || 'null'); } catch { return null; } }
  function save() { try { localStorage.setItem(DRAFT, JSON.stringify(state)); } catch { /* private window: the draft just isn't kept */ } }

  const form = el('form', { class: 'hs-form', novalidate: true, onsubmit: (e) => e.preventDefault() });
  const out = el('pre', { class: 'hs-code' });
  const warnBox = el('ul', { class: 'hs-warn' });
  const changed = () => { save(); render(); };

  function field([key, label, type, o = {}]) {
    const wrap = el('div', { class: `hs-field${o.half ? ' hs-half' : ''}` });
    const lab = label ? el('label', { for: `hs-${key}` }, label, o.required ? el('span', { class: 'hs-req' }, ' *') : null) : null;
    if (type === 'checks') {
      const box = el('div', { class: 'hs-checks' }, o.options.map((opt) => el('label', { class: 'hs-check' },
        el('input', { type: 'checkbox', checked: (state[key] || []).includes(opt), onchange: (e) => { const s = new Set(state[key] || []); e.target.checked ? s.add(opt) : s.delete(opt); state[key] = [...s]; changed(); } }), ' ', opt)));
      return el('fieldset', { class: 'hs-field hs-group' }, label ? el('legend', {}, label) : null, box);
    }
    if (type === 'check') {
      wrap.append(el('label', { class: 'hs-check' }, el('input', { type: 'checkbox', checked: !!state[key], onchange: (e) => { state[key] = e.target.checked; changed(); } }), ' ', label));
      return wrap;
    }
    if (type === 'list') {
      const rows = el('div', { class: 'hs-list' });
      const draw = () => rows.replaceChildren(...(state[key] || []).map((v, i) => el('div', { class: 'hs-listrow' },
        el('input', { type: o.text ? 'text' : 'url', value: v, placeholder: o.placeholder || '', 'aria-label': `${label} ${i + 1}`, oninput: (e) => { state[key][i] = e.target.value.trim(); changed(); } }),
        el('button', { type: 'button', class: 'hs-x', 'aria-label': 'Remove', onclick: () => { state[key].splice(i, 1); draw(); changed(); } }, '×'))));
      draw();
      return el('fieldset', { class: 'hs-field hs-group' }, el('legend', {}, label), rows,
        el('button', { type: 'button', class: 'hs-add', onclick: () => { (state[key] ||= []).push(''); draw(); changed(); rows.lastElementChild?.querySelector('input')?.focus(); } }, '+ Add'));
    }
    if (type === 'rooms') {
      const rows = el('div');
      const draw = () => rows.replaceChildren(...state.roomTypes.map((r, i) => {
        const inp = (k, t, ph) => el('input', { type: t, value: r[k] ?? '', placeholder: ph, oninput: (e) => { r[k] = e.target.value; changed(); } });
        return el('div', { class: 'hs-room' },
          el('button', { type: 'button', class: 'hs-x hs-roomx', 'aria-label': 'Remove room type', onclick: () => { state.roomTypes.splice(i, 1); draw(); changed(); } }, '×'),
          el('label', {}, 'Room type name', inp('name', 'text', 'e.g. Superior Double')),
          el('div', { class: 'hs-row' },
            el('label', {}, 'Kind', el('select', { onchange: (e) => { r.kind = e.target.value; changed(); } }, [['HotelRoom', 'Room'], ['Suite', 'Suite'], ['Apartment', 'Apartment']].map(([v, t]) => el('option', { value: v, selected: r.kind === v }, t)))),
            el('label', {}, 'Bed', el('select', { onchange: (e) => { r.bed = e.target.value; changed(); } }, ['', 'Single', 'Double', 'Twin', 'Queen', 'King', 'Sofa bed'].map((v) => el('option', { value: v, selected: r.bed === v }, v || 'Not stated')))),
            el('label', {}, 'Beds', inp('beds', 'number', '1'))),
          el('div', { class: 'hs-row' },
            el('label', {}, 'Guests (max)', inp('guests', 'number', '2')),
            el('label', {}, 'Size (m²)', inp('size', 'number', '22')),
            el('label', {}, 'View', inp('view', 'text', 'e.g. Courtyard'))),
          el('div', { class: 'hs-checks' }, ROOM_AMENITIES.map((a) => el('label', { class: 'hs-check' },
            el('input', { type: 'checkbox', checked: (r.amenities || []).includes(a), onchange: (e) => { const s = new Set(r.amenities || []); e.target.checked ? s.add(a) : s.delete(a); r.amenities = [...s]; changed(); } }), ' ', a))));
      }));
      draw();
      wrap.append(rows, el('button', { type: 'button', class: 'hs-add', onclick: () => { state.roomTypes.push({ kind: 'HotelRoom', amenities: [] }); draw(); changed(); } }, '+ Add a room type'));
      return wrap;
    }
    let input;
    if (type === 'select') input = el('select', { id: `hs-${key}`, onchange: (e) => { state[key] = e.target.value; changed(); } }, o.options.map(([v, t]) => el('option', { value: v, selected: (state[key] ?? o.options[0][0]) === v }, t)));
    else if (type === 'textarea') input = el('textarea', { id: `hs-${key}`, maxlength: o.max, placeholder: o.placeholder || '', oninput: (e) => { state[key] = e.target.value; changed(); } }, state[key] || '');
    else input = el('input', { id: `hs-${key}`, type, value: state[key] ?? '', placeholder: o.placeholder || '', oninput: (e) => { state[key] = e.target.value; changed(); } });
    wrap.append(lab, input);
    return wrap;
  }

  const sectionEls = SECTIONS.map((s) => el('details', { class: 'hs-section', open: s.open },
    el('summary', {}, s.title), s.hint ? el('p', { class: 'hs-hint' }, s.hint) : null, el('div', { class: 'hs-grid' }, s.fields.map(field))));
  form.append(...sectionEls, el('p', { class: 'hs-hint' }, 'Never added, on purpose: reviews or an average rating you give yourself, and prices marked as available. Google doesn\'t show the first, and the second needs live availability behind it.'));

  // ---- the markup
  const s = (v) => (typeof v === 'string' ? v.trim() : v);
  const https = (u) => /^https:\/\/[^\s"'<>]+\.[^\s"'<>]+/.test(s(u) || '');
  const time = (t) => (/^\d{2}:\d{2}$/.test(t || '') ? t : null);
  const feature = (name, value = true) => ({ '@type': 'LocationFeatureSpecification', name, value });
  function build() {
    const warn = [];
    const st = state;
    if (!s(st.name)) warn.push('Add the hotel name.');
    if (!https(st.url)) warn.push('Add the website address, starting with https://.');
    if (!s(st.street) || !s(st.postcode) || !s(st.city) || !s(st.country)) warn.push('Complete the address (street, postcode, city and country).');
    const lat = parseFloat(st.lat), lng = parseFloat(st.lng);
    const hasGeo = Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
    if ((s(st.lat) || s(st.lng)) && !hasGeo) warn.push('The map position needs both a latitude and a longitude, as numbers; or leave both empty.');
    if (st.stars && !s(st.starsBody)) warn.push('Say who gave the star rating (e.g. Hotelstars Union), or leave the rating out.');
    for (const [k, label] of [['logo', 'logo'], ['bookingUrl', 'booking page'], ['hasMap', 'Google Maps link']]) if (s(st[k]) && !https(st[k])) warn.push(`The ${label} must start with https://.`);
    const bad = [...(st.images || []), ...(st.sameAs || [])].filter((u) => s(u) && !https(u));
    if (bad.length) warn.push(`${bad.length} link${bad.length === 1 ? '' : 's'} in photos or profiles ${bad.length === 1 ? "doesn't" : "don't"} start with https:// and ${bad.length === 1 ? 'is' : 'are'} left out.`);

    const langs = [...(st.languages || []), ...String(st.languagesOther || '').split(',').map((x) => x.trim()).filter(Boolean)];
    const amen = [...(st.amenities || [])];
    if (st.reception24h) amen.unshift('24-hour reception');
    const receptionHours = !st.reception24h && s(st.receptionHours) ? s(st.receptionHours) : null;
    const ld = {
      '@context': 'https://schema.org',
      '@type': (TYPE_OUT[st.type] || st.type) || 'Hotel',
      name: s(st.name) || undefined,
      alternateName: s(st.alternateName) || undefined,
      legalName: s(st.legalName) || undefined,
      description: s(st.description) || undefined,
      url: https(st.url) ? s(st.url) : undefined,
      logo: https(st.logo) ? s(st.logo) : undefined,
      image: (st.images || []).filter(https).length ? (st.images || []).filter(https) : undefined,
      telephone: s(st.telephone) || undefined,
      email: s(st.email) || undefined,
      address: s(st.street) ? { '@type': 'PostalAddress', streetAddress: s(st.street), postalCode: s(st.postcode) || undefined, addressLocality: s(st.city) || undefined, addressCountry: s(st.country)?.toUpperCase() || undefined } : undefined,
      geo: hasGeo ? { '@type': 'GeoCoordinates', latitude: lat, longitude: lng } : undefined,
      hasMap: https(st.hasMap) ? s(st.hasMap) : undefined,
      sameAs: (st.sameAs || []).filter(https).length ? (st.sameAs || []).filter(https) : undefined,
      starRating: st.stars && s(st.starsBody) ? { '@type': 'Rating', ratingValue: Number(st.stars), author: { '@type': 'Organization', name: s(st.starsBody) } } : undefined,
      checkinTime: time(st.checkin) || undefined,
      checkoutTime: time(st.checkout) || undefined,
      availableLanguage: langs.length ? langs : undefined,
      priceRange: s(st.priceRange) || undefined,
      currenciesAccepted: s(st.currencies) || undefined,
      paymentAccepted: (st.payment || []).length ? st.payment.join(', ') : undefined,
      petsAllowed: st.pets === 'yes' ? true : st.pets === 'no' ? false : st.pets === 'request' ? 'On request' : undefined,
      smokingAllowed: st.smoking === 'yes' ? true : st.smoking === 'no' ? false : undefined,
      numberOfRooms: Number.isInteger(Number(st.rooms)) && Number(st.rooms) > 0 ? Number(st.rooms) : undefined,
      amenityFeature: amen.length || receptionHours ? [...amen.map((a) => feature(a)), ...(receptionHours ? [feature('Reception hours', receptionHours)] : [])] : undefined,
      award: (st.awards || []).filter((x) => s(x)).length ? (st.awards || []).filter((x) => s(x)) : undefined,
      potentialAction: https(st.bookingUrl) ? { '@type': 'ReserveAction', target: { '@type': 'EntryPoint', urlTemplate: s(st.bookingUrl) } } : undefined,
      containsPlace: (st.roomTypes || []).filter((r) => s(r.name)).length ? st.roomTypes.filter((r) => s(r.name)).map((r) => ({
        '@type': r.kind || 'HotelRoom', name: s(r.name),
        bed: r.bed ? { '@type': 'BedDetails', typeOfBed: r.bed, numberOfBeds: Number(r.beds) > 0 ? Number(r.beds) : 1 } : undefined,
        occupancy: Number(r.guests) > 0 ? { '@type': 'QuantitativeValue', maxValue: Number(r.guests), unitCode: 'C62' } : undefined,
        floorSize: Number(r.size) > 0 ? { '@type': 'QuantitativeValue', value: Number(r.size), unitCode: 'MTK' } : undefined,
        amenityFeature: [...(r.amenities || []).map((a) => feature(a)), ...(s(r.view) ? [feature('View', s(r.view))] : [])].length ? [...(r.amenities || []).map((a) => feature(a)), ...(s(r.view) ? [feature('View', s(r.view))] : [])] : undefined
      })) : undefined
    };
    return { ld: JSON.parse(JSON.stringify(ld)), warn };
  }

  function render() {
    const { ld, warn } = build();
    out.textContent = `<script type="application/ld+json">\n${JSON.stringify(ld, null, 2)}\n</script>`;
    warnBox.replaceChildren(...(warn.length ? warn.map((w) => el('li', {}, w)) : [el('li', { class: 'hs-ok' }, 'The essentials are complete.')]));
  }

  const copyBtn = el('button', { type: 'button', class: 'hs-copy', onclick: async () => {
    try { await navigator.clipboard.writeText(out.textContent); copyBtn.textContent = 'Copied'; } catch { copyBtn.textContent = 'Select the code and copy it'; }
    setTimeout(() => { copyBtn.textContent = 'Copy the code'; }, 2500);
  } }, 'Copy the code');
  const resetBtn = el('button', { type: 'button', class: 'hs-reset', onclick: () => { if (!confirm('Clear the form?')) return; try { localStorage.removeItem(DRAFT); } catch { /* nothing kept */ } location.href = location.pathname; } }, 'Start again');
  const result = el('div', { class: 'hs-result' },
    el('h2', {}, 'Your hotel markup'),
    warnBox, out,
    el('div', { class: 'hs-actions' }, copyBtn, resetBtn),
    el('p', { class: 'hs-hint' }, 'Paste it into the <head> of your homepage (or the page about the hotel). Everything in it must also be visible on that page.'),
    el('p', { class: 'hs-hint' }, 'Then test it: ', el('a', { href: 'https://validator.schema.org/', target: '_blank', rel: 'noopener' }, 'Schema.org validator'), ' · ',
      el('a', { href: 'https://search.google.com/test/rich-results', target: '_blank', rel: 'noopener' }, 'Google Rich Results Test'),
      cfg.audit ? [' · ', el('a', { href: cfg.audit, target: '_blank', rel: 'noopener' }, 'check it on your live page')] : null));
  app.append(form, result);
  render();

  // ---- Prague Directory: a picker of our hotel listings; choosing one reloads with ?listing=
  if (cfg.prefill === 'listing') {
    const pick = el('select', { id: 'hs-listing', onchange: (e) => { if (e.target.value) location.href = `${location.pathname}?listing=${encodeURIComponent(e.target.value)}`; } }, el('option', { value: '' }, 'Choose your hotel…'));
    const box = el('div', { class: 'hs-prefill', hidden: true }, el('label', { for: 'hs-listing' }, 'Listed on Prague Directory? Fill in what we already have'), pick,
      el('p', { class: 'hs-hint' }, 'Only empty fields are filled, and you can change everything.'));
    form.prepend(box);
    fetch('/data/businesses.json').then((r) => (r.ok ? r.json() : null)).then((d) => {
      const hotels = (d?.businesses || []).filter((b) => b.category === 'stays').sort((x, y) => x.name.localeCompare(y.name));
      if (!hotels.length) return;
      pick.append(...hotels.map((h) => el('option', { value: h.path }, h.name)));
      box.hidden = false;
    }).catch(() => {});
  }

  // ---- Prague Directory: ?listing=/stays/<id>/ fills the form from the listing's JSON (only empty fields)
  const listing = new URLSearchParams(location.search).get('listing');
  if (cfg.prefill === 'listing' && listing && /^\/[a-z0-9-]+\/[a-z0-9-]+\/$/.test(listing)) {
    fetch(`${listing}index.json`).then((r) => (r.ok ? r.json() : null)).then((l) => {
      if (!l) return;
      const f = l.facts || {};
      const fill = (k, v) => { if (v != null && v !== '' && (state[k] == null || state[k] === '' || (Array.isArray(state[k]) && !state[k].length))) state[k] = v; };
      fill('name', l.name); fill('url', l.website); fill('telephone', l.phone); fill('street', l.address?.street); fill('postcode', l.address?.postcode);
      fill('lat', l.geo?.lat != null ? String(l.geo.lat) : null); fill('lng', l.geo?.lng != null ? String(l.geo.lng) : null);
      fill('stars', f.starRating ? String(f.starRating) : null); fill('checkin', f.checkInFrom); fill('checkout', f.checkOutBy);
      fill('rooms', f.roomCount ? String(f.roomCount) : null); fill('bookingUrl', l.bookingUrl); fill('sameAs', l.sameAs?.length ? l.sameAs : null);
      if (state.pets == null || state.pets === '') state.pets = f.petsAllowed === true ? 'yes' : f.petsAllowed === false ? 'no' : '';
      if (f.reception24h === true) state.reception24h = true;
      const map = { airConditioning: 'Air conditioning in all rooms', lift: 'Lift', wheelchairAccessible: 'Step-free entrance', kitchenette: 'Kitchen or kitchenette', airportTransfer: 'Airport transfer' };
      const a = new Set(state.amenities || []);
      for (const [k, name] of Object.entries(map)) if (f[k] === true) a.add(name);
      state.amenities = [...a];
      save();
      location.replace(location.pathname); // redraw from the saved draft, without the parameter
    }).catch(() => {});
  }
})();
