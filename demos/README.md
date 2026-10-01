# Demo integration

The creator portfolio, photography portfolio, and content dashboard are
standalone Hugo 0.157.0 sites under their respective `demos/` directories. The blog
builds first; `scripts/build-site.cjs` then builds each site into its matching
`public/demos/` subdirectory with the published subpath as its base URL. GitHub
Pages deploys the combined `public/` artifact.

`data/demos.json` is the shared registry for the bilingual catalog, build,
published-output checks, deployment monitoring, and browser tests. Each entry
defines its ID, source directory, published path, preview dimensions/image,
bilingual copy and feature labels, expected pages, assets, and navigation.
`scripts/demo-registry.cjs` validates the registry before Node.js consumers use it.
When adding a demo, keep its `source`, `path`, and `preview.image` unique and use
relative paths. The standalone Python checkers stay inside each demo so copied
repositories do not depend on the blog registry.
CI iterates the same registry and runs `<source>/scripts/check_build.py` for
each demo. New checkers should support `--base-url`, `--check-demo-pages`, and
`--catalog-url` in addition to the output-directory argument.

The integrated build injects a root-relative `demoCatalogURL` into each demo.
Its header then displays a keyboard-accessible return link to the blog's demo
catalog, including any deployment prefix. Standalone Hugo builds do not set
this parameter and do not display the blog link. To check an integrated demo's
links, pass `--catalog-url /demos/` (or the actual prefixed catalog path) to its
Python checker; the exception applies only to that exact anchor destination.

## Refresh real page previews

Catalog previews are JPEG screenshots of the actual demo homepages, captured
at the dimensions in the registry. They are checked in under `static/img/demos/`
and are not regenerated during CI. Update them when the visible demo design
changes:

1. Build the site with `npm.cmd run build` (a custom destination is also supported).
2. In another terminal, serve that build with `node scripts/serve-public.cjs`.
   Set `SITE_ROOT` when using a custom build directory and `PORT` when needed.
3. Run `npm.cmd run demos:previews -- --base-url http://127.0.0.1:4173/`.
   The tool uses installed Playwright Chromium, waits for visible images and
   fonts, and captures the page without adding invented UI or replacing artwork.
   It accepts only a locally served build and blocks external requests.
4. Review the JPEGs, run the demo registry tests, then rebuild to copy the new
   previews into the published artifact. Stop the local server when finished.

Screenshots may differ slightly across operating systems because the demos use
system fonts. The browser tests verify valid images, dimensions, links and page
layout rather than requiring identical screenshot bytes.

## Build configuration

The build reads Hugo's effective configuration, including `--destination` /
`-d`, `--baseURL` / `-b`, configuration files, and `HUGO_*` environment overrides.
All demos follow the resulting output directory and URL prefix. For example:

```powershell
npm.cmd run build -- --destination F:/agents/code/temp/demo-preview/public --baseURL https://example.test/review/
```

This writes the demos below `demo-preview/public/demos/` with URLs beginning
`https://example.test/review/demos/`. The example does not publish anything.
Hugo environment settings take precedence over command-line flags; remove an
existing `HUGO_BASEURL` or `HUGO_PUBLISHDIR` override when switching back to CLI
configuration. The build scopes both variables to each child demo so a parent
override cannot make a demo overwrite the combined output directory.
Use `SITE_ROOT` when running the local server or output checks against a custom
directory. The blog's existing output checker assumes its production root URL;
for a changed URL prefix, use each demo's checker with the matching `--base-url`.

The integrated photography check uses
`demos/photo-portfolio/scripts/check_build.py --check-demo-pages`; that mode
requires its fictional/AI disclosures and blog preview source. A copied client
site uses the default general mode, which checks pages, local links, responsive
image candidates, and generated previews without requiring the sample content.
Production asset monitoring also follows `img` and `source` `srcset` URLs.

Edit each portfolio's Markdown and image page bundles in its own directory,
then run `npm run build` from the blog root. The creator portfolio's standalone
update guide is `creator-portfolio/docs/UPDATE_GUIDE.md`. Its nested Pages
workflow is only for a copy used as the root of its own repository; it does not
run inside the blog repository.

The creator portfolio uses original fictional content. The photography
portfolio is also fictional, and its images are AI-generated. Do not replace
either with client work or personal data. A client delivery should be copied
to a client-owned repository with its own domain and publication settings.

## Content dashboard

`content-dashboard/` demonstrates month/channel/keyword filters, linked summary
metrics and channel bars, and numerical/date sorting over 24 fictional content
records. Its source is `data/entries.json` inside the demo. Hugo renders the
complete dataset for browsers without JavaScript, and the scripts enhance that
same dataset without network requests or browser storage. Details and data
constraints are in `content-dashboard/README.md`; tests are in
`tests/content-dashboard.test.cjs` and `e2e/content-dashboard.spec.cjs` at the
blog root. Keep the real preview screenshot in sync with visible design changes.
