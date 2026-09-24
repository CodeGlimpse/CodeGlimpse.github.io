# Demo integration

The creator portfolio and photography portfolio are standalone Hugo 0.157.0
sites under `demos/creator-portfolio/` and `demos/photo-portfolio/`. The blog
builds first; `scripts/build-site.cjs` then builds each site into its matching
`public/demos/` subdirectory with the published subpath as its base URL. GitHub
Pages deploys the combined `public/` artifact.

Edit each portfolio's Markdown and image page bundles in its own directory,
then run `npm run build` from the blog root. The creator portfolio's standalone
update guide is `creator-portfolio/docs/UPDATE_GUIDE.md`. Its nested Pages
workflow is only for a copy used as the root of its own repository; it does not
run inside the blog repository.

The creator portfolio uses original fictional content. The photography
portfolio is also fictional, and its images are AI-generated. Do not replace
either with client work or personal data. A client delivery should be copied
to a client-owned repository with its own domain and publication settings.
