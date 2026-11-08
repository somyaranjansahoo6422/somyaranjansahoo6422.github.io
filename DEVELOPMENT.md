# Maintaining the site

Notes for whoever edits this repository. Visitors only need the [README](README.md).

## Run it locally

```bash
node dev-server.js
```

Then open http://localhost:4321.

## Publishing a change

The pages load minified files, so after editing any `.css` or `.js` file run:

```bash
node build.js
```

It rebuilds the `.min` files, versions them so visitors never get a new page with an old cached file, and refreshes the Content-Security-Policy hashes. It needs [esbuild](https://esbuild.github.io).

If the top of the page changes, regenerate its inline CSS first with `node tools/make-critical.js http://localhost:4321/`.

Phones paint from that inline CSS while the full stylesheet loads alongside. The Anton font is embedded in it by `build.js`, so the poster type is there at the first paint. Don't add font preloads: Chrome holds the whole first paint until a preloaded font arrives. `sw.js` keeps files on the device so repeat visits are fast; pages always come fresh from the network.

## Project pages

Each page in `projects/<slug>/` is generated from the case studies on the homepage, which stay the single source. After editing a case study, run:

```bash
node tools/make-projects.js
node build.js
```

To add a project, add it to the list at the top of `tools/make-projects.js`, then to `sitemap.xml` and `llms.txt`.

The smaller homepage cards (VECTOR, Face-scan & Fraud Console, MindEase, Smaller builds) carry only a short summary, so the extra detail for their pages lives in `CARD_PAGES` in the same file. Keep every line there checked against the project's README or code.

## Hosting (GitHub Pages)

The site deploys from the `main` branch, root folder. Every push to `main` updates it, and the repository must stay public on a free GitHub plan.

- GitHub Pages cannot send custom headers, so the Content-Security-Policy lives in a `<meta>` tag at the top of each page. `build.js` keeps its hashes up to date.
- To move to a custom domain: add it under **Settings > Pages > Custom domain**, follow the DNS records GitHub shows, then replace the `somyaranjansahoo6422.github.io` address in the pages, `robots.txt`, `sitemap.xml`, `llms.txt` and the resume sources.

## Contact form

With JavaScript on, the form posts to [Web3Forms](https://web3forms.com), which emails submissions to the inbox tied to the access key in `data-w3f` on `#contactForm`. Web3Forms keys are made for public pages, so it is not a secret. hCaptcha loads only when someone starts using the form.

With JavaScript off, the form posts to [FormSubmit](https://formsubmit.co) instead. To switch providers, change `data-w3f`, `action` and `data-endpoint` on `#contactForm`, and `connect-src` / `form-action` in the Content-Security-Policy.

## Search engines

The site is verified in Google Search Console (`googlea8a28d004fcb0832.html`) and Bing Webmaster Tools (the `msvalidate.01` tag). Keep both.

`040c3aa789e57448c9cb63ca82ecdfc7.txt` is the [IndexNow](https://www.indexnow.org) key. After publishing a change, tell Bing and other IndexNow engines straight away:

```bash
curl "https://api.indexnow.org/indexnow?url=https://somyaranjansahoo6422.github.io/&key=040c3aa789e57448c9cb63ca82ecdfc7"
```
