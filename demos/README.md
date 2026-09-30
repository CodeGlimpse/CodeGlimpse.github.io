# Demo integration

The creator portfolio and photography portfolio are standalone Hugo 0.157.0
sites under `demos/creator-portfolio/` and `demos/photo-portfolio/`. The blog
builds first; `scripts/build-site.cjs` then builds each site into its matching
`public/demos/` subdirectory with the published subpath as its base URL. GitHub
Pages deploys the combined `public/` artifact.

The build reads Hugo's effective configuration, including `--destination` /
`-d`, `--baseURL` / `-b`, configuration files, and `HUGO_*` environment overrides.
Both demos follow the resulting output directory and URL prefix. For example:

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
