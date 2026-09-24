# Demo integration

The creator portfolio is a standalone Hugo 0.157.0 site kept under
`demos/creator-portfolio/`. The blog builds first; `scripts/build-site.cjs`
then builds the portfolio into `public/demos/creator-portfolio/` with the
published subpath as its base URL. GitHub Pages deploys the combined `public/`
artifact.

Edit the portfolio Markdown and image page bundles in this directory, then run
`npm run build` from the blog root. The standalone update guide is
`creator-portfolio/docs/UPDATE_GUIDE.md`. The nested Pages workflow is only
for a copy of this demo used as the root of its own repository; it does not
run inside the blog repository.

The public example uses original fictional content. Do not replace it with
client work or personal data. A client delivery should be copied to a
client-owned repository with its own domain and publication settings.
