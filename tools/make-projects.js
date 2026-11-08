// Builds one page per project in projects/<slug>/index.html from the case studies on the homepage.
// Usage: node tools/make-projects.js   (needs puppeteer-core and a local Chrome), then node build.js
// The homepage stays the single source: edit a case study there and run this again.
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');

const SITE = 'https://somyaranjansahoo6422.github.io';
const chrome = process.env.CHROME_PATH || process.env.LOCALAPPDATA + '/Google/Chrome/Application/chrome.exe';
const PAGES = [
  { id: 'toll', slug: 'smart-toll-plaza', title: 'Smart Toll Plaza System with Number-Plate Recognition' },
  { id: 'vantage', slug: 'vantage-zero', title: 'VANTAGE: ZERO, a Voice-Controlled 3D Flight Game' },
  { id: 'godview', slug: 'god-view', title: 'GOD VIEW, an OSINT Digital Twin on a 3D Globe' },
  { id: 'unspoken', slug: 'unspoken', title: 'UNSPOKEN, an Assistive Wearable for Blind and Non-Verbal Users' },
  { id: 'anumati', slug: 'anumati', title: 'ANUMATI, a Regulatory Clearance Engine' },
  { id: 'attendance', slug: 'student-attendance-system', title: 'Student Attendance Management System with QR Check-In' },
  { id: 'toll-analysis', slug: 'india-toll-network-analysis', title: 'India Toll Network Data Analysis with Python, SQL and Excel', data: true },
  { id: 'vector', slug: 'vector', title: 'VECTOR, an Air-Traffic-Control Simulator You Play by Voice' },
  { id: 'facescan', slug: 'face-scan-fraud-console', title: 'Face-scan Verification on Solana and a TigerGraph Fraud Console' },
  { id: 'mindease', slug: 'mindease', title: 'MindEase, a Stress Self-Check for College Students' },
  { id: 'small', slug: 'smaller-builds', title: 'Smaller Python Builds: Games and Utilities' },
];

// The homepage cards are short, so the extra detail for their pages lives here. Every line is checked
// against the project's own README, code or the homepage; keep it that way when editing.
const CARD_PAGES = {
  vector: {
    kicker: '3D flight game · Solo project · Voice-built',
    sections: [
      { h: 'Where it started', p: 'An air-traffic-control simulator played with spoken ATC commands: separation missions, gates and pilot read-backs, heard through the Web Speech API. The picture above is from that version.' },
      { h: 'What it is now', p: 'A 3D air-combat prototype: pick an F-35 or a Su-57 and one of three fictional theatres, then intercept hostile aircraft, protect a friendly asset and destroy hostile sites, with score, health and ammo on the HUD.' },
      { h: 'Built with', p: 'Python and FastAPI on the server, with a game loop that moves every aircraft every 80 ms, and a Three.js scene with terrain, shadows and a HUD in the browser.' },
      { h: 'How I built it', p: 'By voice dictation with Wispr Flow, speaking instead of typing, the same way I built <a href="/projects/vantage-zero/">VANTAGE: ZERO</a>.' },
    ],
  },
  facescan: {
    kicker: 'Team builds · Hacker House Goa 2026',
    sections: [
      { h: 'Face-scan verification, step by step', ul: [
        'Detects the face and turns it into a 128-number signature with OpenCV (YuNet and SFace).',
        'Runs a reverse image search on Google Lens and Yandex at once, and lists the social platforms the face appears on.',
        'Confirms the top match is the same person by comparing the two signatures (cosine similarity of 0.363 or more).',
        'Takes a SHA-256 fingerprint of a canonical record of that post and writes it to Solana devnet with the SPL Memo program.',
        'Reads it back, re-hashes and shows VERIFIED, then proves that changing a single character is caught as tampering.',
      ] },
      { h: 'Why SHA-256 and Solana', p: 'The same record always gives the same 64-character hash, and one changed character changes about half of it. A memo transaction costs a fraction of a cent, confirms in under a second, needs no smart contract, and anyone can check it on Solana Explorer. Only the hash goes on chain, never the personal data.' },
      { h: 'Fraud investigation console', p: 'An agentic console that investigates card transactions held in TigerGraph and lists them as fraud, uncertain or legitimate.' },
      { h: 'Team', p: 'Both are team builds from Hacker House Goa 2026, and the face-scan tool was made with my team, ASTRA-X. At the same event I built <a href="/projects/vantage-zero/">VANTAGE: ZERO</a> solo for the Wispr Flow challenge.' },
    ],
    links: [{ href: 'https://explorer.solana.com/tx/2yfT3S4YfUSbBVk1ezjapM2RipL9U9gh87aJCxPZdh58vwPFioaCNia3L1Bs6UwnAYRPFNJ4QvRRs9ZeTmPux2QK?cluster=devnet', label: 'On-chain proof on Solana Explorer' }],
    videoCaption: 'The fraud investigation console sorting card transactions',
  },
  mindease: {
    kicker: 'Hackathon project · Smart India Hackathon 2025',
    sections: [
      { h: 'Stress Analyser', ul: [
        '10 questions on stress, sleep, exercise, diet, breaks, social support, relaxation, workload, enjoyment and motivation.',
        'Each answer counts +1, 0 or −1, which gives a net score from −10 to +10 and a wellbeing percentage.',
        'Four result bands, from “very good: low stress” to “high stress: take action”, each with its own suggestions.',
        'It is a self-reflection tool, not a medical one.',
      ] },
      { h: 'Zen Memory Match', p: 'A short, calming break: 16 cards with 8 pairs of nature emoji, shuffled every game, with a live count of the pairs you have found.' },
      { h: 'Built with', p: 'Plain HTML, CSS and JavaScript, with no frameworks and nothing to install. Nothing you answer leaves your device.' },
      { h: 'Result', p: 'Shortlisted at Smart India Hackathon 2025. It was my first hackathon.' },
    ],
    links: [{ href: 'https://www.linkedin.com/feed/update/urn:li:activity:7507850443012820992/', label: 'SIH 2025 post' }],
    demo2: { src: 'assets/video/mindease-memory-match.mp4', poster: 'assets/img/proj-mindease-memory-960.webp', title: 'Watch Zen Memory Match', caption: 'Turning cards to find the 8 pairs of nature emoji' },
    demo: { src: 'assets/video/mindease-stress-quiz.mp4', poster: 'assets/img/proj-mindease-quiz-960.webp', title: 'Watch the Stress Analyser', caption: 'Answering the 10 questions and getting a wellbeing score with suggestions' },
    galleryTitle: 'Screenshots and photos',
    gallery: [
      { big: 'assets/img/proj-mindease-quiz-1280.webp', src: 'assets/img/proj-mindease-quiz-960.webp', srcset: 'assets/img/proj-mindease-quiz-480.webp 480w, assets/img/proj-mindease-quiz-960.webp 960w, assets/img/proj-mindease-quiz-1280.webp 1280w', w: 1280, h: 720, alt: 'The MindEase 10-question quiz, starting with how often you feel stressed and how well you sleep', caption: 'The Stress Analyser’s 10 questions' },
      { big: 'assets/img/proj-mindease-result-1280.webp', src: 'assets/img/proj-mindease-result-960.webp', srcset: 'assets/img/proj-mindease-result-480.webp 480w, assets/img/proj-mindease-result-960.webp 960w, assets/img/proj-mindease-result-1280.webp 1280w', w: 1280, h: 720, alt: 'A MindEase result reading good, generally balanced, with a 70 percent wellbeing score and three suggestions', caption: 'A result: score, wellbeing percentage and suggestions' },
      { big: 'assets/img/ach-sih2025-1600.webp', src: 'assets/img/ach-sih2025-960.webp', srcset: 'assets/img/ach-sih2025-480.webp 480w, assets/img/ach-sih2025-960.webp 960w, assets/img/ach-sih2025-1600.webp 1600w', w: 1600, h: 902, alt: 'Smart India Hackathon 2025 team photo', caption: 'The team at Smart India Hackathon 2025' },
      { big: 'assets/img/moment-8-1280.webp', src: 'assets/img/moment-8-1280.webp', srcset: 'assets/img/moment-8-480.webp 480w, assets/img/moment-8-1280.webp 1280w', w: 1280, h: 960, alt: 'My first hackathon: the SIH 2025 college round', caption: 'My first hackathon: the SIH 2025 college round' },
    ],
  },
  small: {
    kicker: 'Games & utilities · Python',
    lede: 'Games, desktop tools and command-line programs I wrote in Python, with demos for the ones I have recorded.',
    builds: {
      'Expense Tracker': { img: 'assets/img/proj-small-1600.webp', p: 'A command-line expense tracker that saves to a JSON file: add an expense, list them all, delete one and total your spending.' },
      'Smart Inventory Manager': {
        pic: { big: 'assets/img/proj-inventory-1400.webp', src: 'assets/img/proj-inventory-960.webp', srcset: 'assets/img/proj-inventory-480.webp 480w, assets/img/proj-inventory-960.webp 960w, assets/img/proj-inventory-1400.webp 1400w', w: 1400, h: 844, alt: 'Smart Inventory Management System dashboard with summary cards and action buttons, shown with sample products' },
        p: 'A desktop inventory manager in CustomTkinter, written as one of my internship tasks: a live dashboard with stock value in rupees, search with a price range, sortable tables, low-stock alerts at a threshold you set, a category report with a bar chart, and CSV import and export.' },
      'Pong: AI Edition': { p: 'Pong in Pygame at 60 FPS: play an AI paddle or a friend on one keyboard, set your own winning score, and aim your shots, because where the ball hits the paddle sets its angle.' },
      'Connect 4 vs AI': {
        p: 'Connect Four in Tkinter against a friend or an AI with Easy, Medium and Hard levels, with animated drops, a preview of where your piece will land, undo, save and load, and lifetime win statistics.',
        pic: { big: 'assets/img/proj-connect4-680.webp', src: 'assets/img/proj-connect4-680.webp', srcset: 'assets/img/proj-connect4-480.webp 480w, assets/img/proj-connect4-680.webp 680w', w: 680, h: 720, alt: 'Connect Four Pro mid-game against the hard AI, with red and yellow pieces on a blue board' },
      },
      'Tic Tac Toe': {
        after: 'Connect 4 vs AI', tech: 'Tkinter', href: 'https://github.com/somyaranjansahoo6422/tic-tac-toe',
        p: 'A dark-themed Tic Tac Toe whose AI uses the Minimax algorithm, so it never loses, plus a 2-player mode and a live scoreboard.',
        pic: { big: 'assets/img/proj-tictactoe-700.webp', src: 'assets/img/proj-tictactoe-700.webp', srcset: 'assets/img/proj-tictactoe-480.webp 480w, assets/img/proj-tictactoe-700.webp 700w', w: 700, h: 850, alt: 'Tic Tac Toe board ending in a draw against the Minimax AI' },
        video: { href: 'assets/video/tictactoe.mp4', caption: 'Tic Tac Toe: a draw against the Minimax AI, then a 2-player game' },
      },
      'Scientific Calculator': {
        after: 'Simple Calculator', tech: 'CustomTkinter', href: 'https://github.com/somyaranjansahoo6422/scientific-calculator',
        p: 'A dark-mode scientific calculator with trigonometry and its inverses, logarithms, powers, roots, factorials, π and e, degree and radian modes, and keyboard input. It reads each expression with Python’s ast module instead of eval, so only whitelisted maths can run.',
      },
      Snake: { img: 'assets/img/proj-snake-600.webp', p: 'The snake grows every time it eats, and hitting a wall or its own body ends the run. The score resets, but the high score stays.' },
      'Simple Calculator': { img: 'assets/img/proj-calc-1600.webp', p: 'Add, subtract, multiply and divide in a loop, with clear handling of division by zero and of letters typed instead of numbers. It also ships as a Windows .exe.' },
      'Toll Plaza Manager': { img: 'assets/img/proj-tollcli-1600.webp', p: 'My Class 12 project at Sainik School Bhubaneswar, built with my classmate, bench mate and best friend Suman Kumar Behera in about a month of spare moments between classes and evening study. A console app to add, update and remove toll plazas, with toll rates by vehicle type, a duplicate-name check and a table with a rupee total.' },
    },
  },
};

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const abs = (u) => (/^(https?:|mailto:|#)/.test(u) ? u : '/' + u.replace(/^\.?\//, ''));
// Homepage links that only work on the homepage: point them at the right page instead.
const SECTION_PAGES = { 'toll-analysis': '/projects/india-toll-network-analysis/', 'toll-dashboard': '/projects/india-toll-network-analysis/' };
const resolveHref = (u) => {
  if (/^#project\//.test(u)) { const id = u.slice(9); const p = PAGES.find((x) => x.id === id); return p ? `/projects/${p.slug}/` : '/' + u; }
  if (/^#/.test(u)) return SECTION_PAGES[u.slice(1)] || '/' + u;
  return abs(u);
};
const fixHtml = (h) => h
  .replace(/(href|src)="(?!https?:|mailto:|#|\/)([^"]+)"/g, (m, a, u) => `${a}="/${u}"`)
  .replace(/href="(#[\w\/-]+)"/g, (m, u) => `href="${resolveHref(u)}"`);
const cut = (s, n) => (s.length <= n ? s : s.slice(0, s.lastIndexOf(' ', n - 1)).replace(/[,;:]$/, '') + '…');

function extract(ids) {
  const doc = new DOMParser().parseFromString(window.__src, 'text/html');
  const text = (el) => (el ? el.textContent.replace(/\s+/g, ' ').trim() : '');
  const out = {};
  for (const id of ids) {
    const c = doc.getElementById(id);
    if (!c) continue;
    if (c.classList.contains('case')) {
      const media = c.querySelector('.case__media');
      const img = media && media.querySelector('img');
      const desc = [...c.querySelectorAll('.case__body > p')].filter((p) => !p.className).map((p) => p.innerHTML.trim());
      out[id] = {
        kind: 'case',
        kicker: text(c.querySelector('.case__kicker')),
        name: text(c.querySelector('h3')),
        purpose: text(c.querySelector('.case__purpose')),
        desc,
        chips: [...c.querySelectorAll('.case__body > .chips li')].map(text),
        badge: text(media && media.querySelector('.badge')),
        image: img && { srcset: img.getAttribute('srcset') || '', src: img.getAttribute('src'), big: media.getAttribute('href'), alt: img.getAttribute('alt'), w: img.getAttribute('width'), h: img.getAttribute('height') },
        study: [...c.querySelectorAll('.study__grid > div')].map((d) => ({ dt: text(d.querySelector('dt')), dd: d.querySelector('dd').innerHTML.trim() })),
        gallery: [...c.querySelectorAll('.study__gallery a')].map((a) => { const i = a.querySelector('img'); return { srcset: i.getAttribute('srcset') || '', big: a.getAttribute('href'), src: i.getAttribute('src'), alt: i.getAttribute('alt'), caption: a.getAttribute('data-caption') || '', w: i.getAttribute('width'), h: i.getAttribute('height') }; }),
        links: [...c.querySelectorAll('.case__links a')].filter((a) => !a.getAttribute('href').startsWith('/projects/')).map((a) => ({ href: a.getAttribute('href'), label: text(a), play: a.hasAttribute('data-play'), caption: a.getAttribute('data-caption') || '' })),
        loop: media && media.getAttribute('data-video'),
      };
    } else if (c.classList.contains('card')) {
      const pic = (i, a) => i && { srcset: i.getAttribute('srcset') || '', src: i.getAttribute('src'), big: a ? a.getAttribute('href') : '', alt: i.getAttribute('alt'), w: i.getAttribute('width'), h: i.getAttribute('height') };
      const top = c.querySelector('.card__img');
      const first = top && (top.tagName === 'A' ? top : top.querySelector('a'));
      const tag = c.querySelector('.tag');
      out[id] = {
        kind: 'card',
        name: text(c.querySelector('h3')),
        badge: text(tag && tag.querySelector('.badge')),
        tag: tag && !tag.querySelector('.badge') ? text(tag) : '',
        purpose: text(c.querySelector('p:not(.tag)')),
        chips: [...c.querySelectorAll('.chips li')].map(text),
        image: first && pic(first.querySelector('img'), first),
        logo: !!(top && top.classList.contains('card__img--logo')),
        video: top && top.getAttribute('data-video'),
        links: [...c.querySelectorAll(':scope > a.link, .card__links a')].filter((a) => !a.getAttribute('href').startsWith('/projects/')).map((a) => ({ href: a.getAttribute('href'), label: text(a) })),
        pics: [...c.querySelectorAll('.card__mosaic a')].map((a) => pic(a.querySelector('img'), a)),
        items: [...c.querySelectorAll('.mini li')].map((li) => {
          const name = li.querySelector(':scope > a');
          const play = li.querySelector('[data-play]');
          const span = li.querySelector('span').cloneNode(true);
          span.querySelectorAll('a').forEach((a) => a.remove());
          return { name: text(name), href: name.hasAttribute('data-play') ? '' : name.getAttribute('href'), tech: text(span), video: play && { href: play.getAttribute('href'), caption: play.getAttribute('data-caption') || '' } };
        }),
      };
    } else {
      const dash = doc.getElementById('toll-dashboard');
      const shot = dash.querySelector('.dl-shot img');
      out[id] = {
        kind: 'data',
        name: text(c.querySelector('.dl-h')),
        lede: c.querySelector('.dl-lede').innerHTML.trim(),
        findings: [...c.querySelectorAll('.dl-finding')].map((p) => p.innerHTML.trim()),
        stats: [...c.querySelectorAll('.dl-stats > div')].map((d) => ({ dt: text(d.querySelector('dt')), dd: text(d.querySelector('dd')) })),
        lists: [...c.querySelectorAll('h4')].map((h) => ({ h: text(h), ul: h.nextElementSibling.innerHTML.trim() })),
        links: [...c.querySelectorAll('.dl-links a')].filter((a) => !a.getAttribute('href').startsWith('/projects/')).map((a) => ({ href: a.getAttribute('href'), label: text(a) })),
        dash: { lede: dash.querySelector('.dl-lede').innerHTML.trim(), finding: dash.querySelector('.dl-finding').innerHTML.trim(), img: { srcset: shot.getAttribute('srcset') || '', src: shot.getAttribute('src'), big: dash.querySelector('.dl-shot').getAttribute('href'), alt: shot.getAttribute('alt'), w: shot.getAttribute('width'), h: shot.getAttribute('height') }, link: [...dash.querySelectorAll('.dl-links a')].map((a) => ({ href: a.getAttribute('href'), label: text(a) })) },
      };
    }
  }
  return out;
}

function page(p, d, all, shell) {
  const url = `${SITE}/projects/${p.slug}/`;
  const name = d.name;
  const isData = d.kind === 'data';
  const lead = d.kind === 'case' ? d.purpose : d.kind === 'card' ? (CARD_PAGES[p.id].lede || d.purpose) : d.lede.replace(/<[^>]+>/g, '');
  const firstNote = d.kind === 'card' ? (((CARD_PAGES[p.id].sections || [])[0] || {}).p || '') : '';
  const more = (d.kind === 'case' ? (d.desc[0] || '') : firstNote).replace(/<[^>]+>/g, '');
  // Short descriptions get a line about who made it, so every page has a full search snippet.
  const base = `${lead} ${more}`.trim();
  const description = cut(base.length < 120 ? `${base} A project by Somya Ranjan Sahoo.` : base, 158);
  const tags = d.kind === 'data' ? ['Python', 'pandas', 'SQL', 'Excel', 'data analysis'] : d.chips && d.chips.length ? d.chips : ['Python', 'Tkinter', 'CustomTkinter', 'Pygame', 'Python games', 'command-line apps'];
  const keywords = [name, ...tags, 'Somya Ranjan Sahoo', 'portfolio'].join(', ');
  const image = isData ? d.dash.img : d.image;
  const ogImage = SITE + abs(image.big || image.src);
  const repo = (d.links || []).map((l) => l.href).find((h) => /github\.com/.test(h));
  const ld = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': isData ? 'Article' : 'SoftwareSourceCode',
        name, headline: p.title, description, url, image: ogImage,
        author: { '@type': 'Person', name: 'Somya Ranjan Sahoo', url: SITE + '/' },
        ...(repo ? { codeRepository: repo } : {}),
        ...(d.chips && d.chips.length ? { keywords: d.chips.join(', ') } : { keywords: 'data analysis, pandas, SQL, Excel, data cleaning, India toll plazas' }),
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Somya Ranjan Sahoo', item: SITE + '/' },
          { '@type': 'ListItem', position: 2, name: isData ? 'Data lab' : 'Projects', item: SITE + (isData ? '/#data' : '/#work') },
          { '@type': 'ListItem', position: 3, name, item: url },
        ],
      },
    ],
  };
  const widest = (i) => Math.max(0, ...(i.srcset || '').split(',').map((s) => parseInt((s.trim().split(/\s+/)[1] || '0'), 10) || 0));
  const img = (i, extra, sizes) => {
    const set = (i.srcset || '').split(',').map((s) => s.trim()).filter(Boolean).map((s) => { const [u, w] = s.split(/\s+/); return abs(u) + ' ' + w; }).join(', ');
    const max = widest(i);
    const sz = sizes || (max ? `(max-width: ${max + 32}px) calc(100vw - 32px), ${max}px` : '');
    return `<img src="${abs(i.src)}"${set ? ` srcset="${set}" sizes="${sz}"` : ''} alt="${esc(i.alt || '')}" width="${i.w}" height="${i.h}"${extra || ''}>`;
  };
  const linkBtn = (l, first) => {
    const ext = /^https?:/.test(l.href);
    return `<a class="btn ${first ? 'btn--primary' : 'btn--ghost'} btn--sm" href="${esc(resolveHref(l.href))}"${ext ? ' target="_blank" rel="noopener noreferrer"' : ''}>${esc(l.label.replace(/\s*↗$/, ''))}${ext ? ' ↗' : ''}</a>`;
  };
  let body = '';
  if (d.kind === 'case') {
    const reel = d.links.find((l) => l.play);
    const actions = d.links.filter((l) => !l.play);
    body += `<p class="proj__kicker mono">${esc(d.kicker)}</p>
      <h1>${esc(name)}</h1>
      <p class="proj__lede">${esc(d.purpose)}</p>
      ${d.desc.map((h) => `<p class="proj__desc">${fixHtml(h)}</p>`).join('\n      ')}
      ${d.badge ? `<p class="proj__badge"><span class="badge">${esc(d.badge)}</span></p>` : ''}
      <ul class="chips chips--sm proj__chips" aria-label="Technologies">${d.chips.map((c) => `<li>${esc(c)}</li>`).join('')}</ul>
      ${actions.length ? `<p class="proj__actions">${actions.map((l, i) => linkBtn(l, i === 0)).join(' ')}</p>` : ''}
      <figure class="proj__media proj__media--fit">${img(d.image, ' fetchpriority="high"')}</figure>
      <div class="proj__grid">
        ${d.study.map((s) => `<section class="proj__block"><h2>${esc(s.dt)}</h2><p>${fixHtml(s.dd)}</p></section>`).join('\n        ')}
      </div>`;
    if (reel) body += `
      <h2 class="proj__h2">Watch the demo</h2>
      <figure class="proj__media proj__video"><video controls preload="none" playsinline poster="${abs(d.image.src)}" src="${esc(abs(reel.href))}"></video>${reel.caption ? `<figcaption>${esc(reel.caption)}</figcaption>` : ''}</figure>`;
    if (d.gallery.length) body += `
      <h2 class="proj__h2">Screenshots</h2>
      <div class="proj__gallery">
        ${d.gallery.map((g) => `<figure><a href="${abs(g.big)}">${img(g, ' loading="lazy" decoding="async"', '(max-width: 760px) calc(100vw - 32px), 380px')}</a><figcaption>${esc(g.caption)}</figcaption></figure>`).join('\n        ')}
      </div>`;
  } else if (d.kind === 'card') {
    const x = CARD_PAGES[p.id];
    const block = (s) => `<section class="proj__block"><h2>${esc(s.h)}</h2>${s.ul ? `<ul>${s.ul.map((li) => `<li>${esc(li)}</li>`).join('')}</ul>` : `<p>${fixHtml(s.p)}</p>`}</section>`;
    const actions = d.links.concat(x.links || []);
    body += `<p class="proj__kicker mono">${esc(x.kicker || d.tag)}</p>
      <h1>${esc(name)}</h1>
      <p class="proj__lede">${esc(x.lede || d.purpose)}</p>
      ${d.badge ? `<p class="proj__badge"><span class="badge">${esc(d.badge)}</span></p>` : ''}
      ${d.chips.length ? `<ul class="chips chips--sm proj__chips" aria-label="Technologies">${d.chips.map((c) => `<li>${esc(c)}</li>`).join('')}</ul>` : ''}
      ${actions.length ? `<p class="proj__actions">${actions.map((l, i) => linkBtn(l, i === 0)).join(' ')}</p>` : ''}`;
    // A card with a clip shows the clip as its main picture; a logo is kept to a sensible size.
    if (!x.builds) body += d.video ? `
      <figure class="proj__media proj__video"><video controls preload="none" playsinline muted loop poster="${abs(d.image.src)}" src="${esc(abs(d.video))}"></video>${x.videoCaption ? `<figcaption>${esc(x.videoCaption)}</figcaption>` : ''}</figure>` : `
      <figure class="proj__media proj__media--fit${d.logo ? ' proj__media--logo' : ''}">${img(d.image, ' fetchpriority="high"', d.logo ? '(max-width: 412px) calc(100vw - 32px), 380px' : '')}</figure>`;
    if (x.sections) body += `
      <div class="proj__grid${x.sections.length === 4 ? ' proj__grid--pair' : ''}">
        ${x.sections.map(block).join('\n        ')}
      </div>`;
    if (x.demo) body += `
      <h2 class="proj__h2">${esc(x.demo.title)}</h2>
      <figure class="proj__media proj__video"><video controls preload="none" playsinline poster="${abs(x.demo.poster)}" src="${esc(abs(x.demo.src))}"></video><figcaption>${esc(x.demo.caption)}</figcaption></figure>`;
    if (x.demo2) body += `
      <h2 class="proj__h2">${esc(x.demo2.title)}</h2>
      <figure class="proj__media proj__video"><video controls preload="none" playsinline poster="${abs(x.demo2.poster)}" src="${esc(abs(x.demo2.src))}"></video><figcaption>${esc(x.demo2.caption)}</figcaption></figure>`;
    if (x.gallery) body += `
      <h2 class="proj__h2">${esc(x.galleryTitle || 'Photos')}</h2>
      <div class="proj__gallery">
        ${x.gallery.map((g) => `<figure><a href="${abs(g.big)}">${img(g, ' loading="lazy" decoding="async"', '(max-width: 760px) calc(100vw - 32px), 380px')}</a><figcaption>${esc(g.caption)}</figcaption></figure>`).join('\n        ')}
      </div>`;
    if (x.builds) {
      const items = [];
      d.items.forEach((it) => {
        items.push(it);
        Object.keys(x.builds).filter((k) => x.builds[k].after === it.name).forEach((k) => items.push({ name: k, href: x.builds[k].href || '', tech: x.builds[k].tech, video: x.builds[k].video }));
      });
      const missing = items.filter((it) => !x.builds[it.name]).map((it) => it.name);
      if (missing.length) throw new Error('add these builds to CARD_PAGES.small: ' + missing.join(', '));
      body += `
      <div class="proj__builds">
        ${items.map((it, n) => {
          const b = x.builds[it.name];
          const shot = b.pic || (b.img && d.pics.find((q) => q.big === b.img));
          if (b.img && !shot) throw new Error('no homepage picture for ' + it.name);
          const lazy = n ? ' loading="lazy" decoding="async"' : ' fetchpriority="high"';
          const media = it.video
            ? `<figure class="proj__media proj__video"><video controls preload="none" playsinline poster="${abs(shot ? shot.src : '')}" src="${esc(abs(it.video.href))}"></video><figcaption>${esc(it.video.caption)}</figcaption></figure>`
            : shot ? `<figure class="proj__media"><a href="${abs(shot.big)}">${img(shot, lazy, '(max-width: 900px) calc(100vw - 72px), 520px')}</a></figure>` : '';
          const links = [it.href && { href: it.href, label: /github\.com/.test(it.href) ? 'Source code' : 'Open' }].filter(Boolean);
          return `<section class="proj__build${media ? ' proj__build--media' : ''}">
          <div>
            <h2>${esc(it.name)}</h2>
            <p class="proj__tech mono">${esc(it.tech)}</p>
            <p>${esc(b.p)}</p>
            ${links.length ? `<p class="proj__actions">${links.map((l) => linkBtn(l, false)).join(' ')}</p>` : ''}
          </div>
          ${media}
        </section>`;
        }).join('\n        ')}
      </div>`;
    }
  } else {
    body += `<p class="proj__kicker mono">Data analysis · Solo project</p>
      <h1>${esc(name)}</h1>
      <p class="proj__lede">${fixHtml(d.lede)}</p>
      <div class="proj__grid proj__grid--2">${d.findings.map((f) => `<p class="dl-finding">${fixHtml(f)}</p>`).join('')}</div>
      <dl class="dl-stats proj__stats">${d.stats.map((s) => `<div><dt>${esc(s.dt)}</dt><dd>${esc(s.dd)}</dd></div>`).join('')}</dl>
      <div class="proj__grid proj__grid--2">
        ${d.lists.map((l) => `<section class="proj__block"><h2>${esc(l.h)}</h2><ul>${fixHtml(l.ul)}</ul></section>`).join('\n        ')}
      </div>
      <p class="proj__actions">${d.links.map((l, i) => linkBtn(l, i === 0)).join(' ')}</p>
      <h2 class="proj__h2">The same data as an Excel dashboard</h2>
      <p class="proj__desc">${fixHtml(d.dash.lede)}</p>
      <p class="dl-finding">${fixHtml(d.dash.finding)}</p>
      <figure class="proj__media proj__media--fit"><a href="${abs(d.dash.img.big)}">${img(d.dash.img, ' loading="lazy" decoding="async"')}</a></figure>
      <p class="proj__actions">${d.dash.link.map((l, i) => linkBtn(l, i === 0)).join(' ')} <a class="btn btn--ghost btn--sm" href="/#data">See the charts and live SQL database</a></p>`;
  }
  const others = PAGES.filter((o) => o.slug !== p.slug).map((o) => `<li><a href="/projects/${o.slug}/"><strong>${esc(all[o.id].name)}</strong><span>${esc(all[o.id].kind === 'data' ? 'Data analysis of 2,003 Indian toll plazas with Python, SQL and Excel.' : (CARD_PAGES[o.id] && CARD_PAGES[o.id].lede) || all[o.id].purpose)}</span></a></li>`).join('\n          ');
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  ${shell.csp}
  <meta name="referrer" content="strict-origin-when-cross-origin">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(p.title)} | Somya Ranjan Sahoo</title>
  <meta name="description" content="${esc(description)}">
  <meta name="keywords" content="${esc(keywords)}">
  <meta name="author" content="Somya Ranjan Sahoo">
  <meta name="theme-color" content="#0b0d12">
  <link rel="canonical" href="${url}">
  <meta property="og:type" content="article">
  <meta property="og:site_name" content="Somya Ranjan Sahoo">
  <meta property="og:title" content="${esc(p.title)}">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:url" content="${url}">
  <meta property="og:image" content="${ogImage}">
  <meta property="og:image:alt" content="${esc(image.alt || name)}">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="icon" href="/favicon.ico" sizes="48x48">
  <link rel="icon" href="/assets/icon-192.png" type="image/png" sizes="192x192">
  <link rel="apple-touch-icon" href="/assets/apple-touch-icon.png">
  <link rel="stylesheet" href="../../styles.min.css">
  ${shell.headScript}
  <script type="application/ld+json">${JSON.stringify(ld)}</script>
</head>
<body>
  <a class="skip" href="#main">Skip to content</a>
  <header class="nav scrolled">
    <div class="wrap nav__inner">
      <a class="brand" href="/">
        <span class="brand__mark" aria-hidden="true">S</span>
        <span class="brand__name">Somya Ranjan Sahoo</span><span class="sr-only">, home</span>
      </a>
      <div class="nav__tools">
        <a class="btn btn--ghost btn--sm" href="/#work">All projects</a>
        ${shell.themeBtn}
      </div>
    </div>
  </header>

  <main id="main" class="proj">
    <div class="wrap">
      <nav class="proj__crumbs" aria-label="Breadcrumb"><a href="/">Home</a><span aria-hidden="true">/</span><a href="${isData ? '/#data' : '/#work'}">${isData ? 'Data lab' : 'Projects'}</a><span aria-hidden="true">/</span><span aria-current="page">${esc(name)}</span></nav>
      ${body}

      <section class="proj__cta">
        <h2>Want to talk about this project?</h2>
        <p>I'm open to data internships, projects and hackathon teams.</p>
        <p class="proj__actions"><a class="btn btn--primary btn--sm" href="/#contact">Contact me</a> <a class="btn btn--ghost btn--sm" href="/">See the full portfolio</a></p>
      </section>

      <section class="proj__more" aria-labelledby="more-title">
        <h2 id="more-title">More projects</h2>
        <ul>
          ${others}
        </ul>
      </section>
    </div>
  </main>

  <footer class="footer">
    <div class="wrap footer__inner">
      <p>© 2026 Somya Ranjan Sahoo</p>
      <nav class="footer__links" aria-label="Footer">
        <a href="/">Portfolio</a>
        <a href="/#contact">Contact</a>
        <a href="https://github.com/somyaranjansahoo6422" target="_blank" rel="noopener noreferrer">GitHub</a>
        <a href="https://www.linkedin.com/in/somya-ranjan-sahoo-109599312/" target="_blank" rel="noopener noreferrer">LinkedIn</a>
        <a href="/privacy.html">Privacy</a>
      </nav>
    </div>
  </footer>
  <script src="../../script.min.js" defer></script>
</body>
</html>
`;
}

(async () => {
  const src = fs.readFileSync('index.html', 'utf8');
  const privacy = fs.readFileSync('privacy.html', 'utf8');
  const shell = {
    csp: privacy.match(/<meta http-equiv="Content-Security-Policy"[^>]*>/)[0],
    headScript: privacy.match(/<script>[\s\S]*?<\/script>/)[0],
    themeBtn: privacy.match(/<button class="icon-btn" id="themeToggle"[\s\S]*?<\/button>/)[0],
  };
  const browser = await puppeteer.launch({ executablePath: chrome, headless: 'new' });
  const tab = await browser.newPage();
  await tab.goto('about:blank');
  await tab.evaluate((s) => { window.__src = s; }, src);
  const data = await tab.evaluate(extract, PAGES.map((p) => p.id));
  await browser.close();
  for (const p of PAGES) {
    if (!data[p.id]) throw new Error('missing on the homepage: ' + p.id);
    const dir = path.join('projects', p.slug);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'index.html'), page(p, data[p.id], data, shell));
    console.log('projects/' + p.slug + '/');
  }
})().catch((e) => { console.error(e); process.exit(1); });
