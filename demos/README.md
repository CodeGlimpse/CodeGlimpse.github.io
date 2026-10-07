# Independent demo scenes

The six standalone Hugo 0.157.0 sites under `demos/` each provide three
independent scenes. All eighteen published instances have their own content,
identity, and presentation. The four interactive cases also use separate JSON
datasets. Layout components and business logic remain shared within each case.
Photography uses credited real photographs; the other five cases use original
fictional content and local SVG/CSS artwork.

## Scene map

| Case | `classic` | Second scene | Third scene |
| --- | --- | --- | --- |
| creator-portfolio | 岛页: narrative illustration | `editorial`: 拾度 brand design | `archive`: 回声单元 digital art |
| photo-portfolio | 目光: portrait photography | `gallery`: 野境 nature | `filmstrip`: 遥光 astronomy |
| content-dashboard | 桌边: editorial operations | `workspace`: 灯塔 communications | `report`: 第七镜 video review |
| bookstore | 纸间: literature | `catalog`: 形间 art books | `checklist`: 周末 living books |
| workshop-booking | 拾光: mixed crafts | `calendar`: 岸陶 ceramics | `agenda`: 折页 paper and print |
| trip-planner | 远山: mountain weekend | `journal`: 巷里 old-town walk | `workbench`: 岬屿 island stroll |

Existing URLs remain `demos/<case>/` and
`demos/variants/<case>/<template>/`. The bilingual catalog groups three real
screenshots under each case. Switching scenes opens the destination homepage;
filters, bags, booking selections, and itineraries reset. The compact native
`details` menu works with keyboard input and without JavaScript. Photography
labels its menu by genre; other cases label it by scene.

## Content, data, and registry

`data/demos.json` is the shared registry for the bilingual catalog, build,
output checks, deployment monitoring, and browser tests. Each case owns its
source directory and common checks; each template owns its path, preview,
copy, content/data directories, and optional check overrides.

- `contentDir` chooses the scene's Markdown and bundled artwork.
- `dataDir` chooses the scene's JSON directory for the four interactive cases.
- `differentContent: true` makes template links lead to sibling homepages.
- Template `checks` override case-level pages, assets, navigation, or required
  text; additional template `assets` are merged with the selected asset list.

For the five non-photography cases, the default scene remains in `content/`
and `data/`. Alternative scenes live outside those roots, under
`variants/<template>/content/` and `variants/<template>/data/`, so a default
Hugo build cannot accidentally collect another scene's pages or records.
The creator portfolio has Markdown bundles rather than a JSON dataset.
Photography uses its existing `content/portrait`, `content/nature`, and
`content/astronomy` directories.

The registry validates relative paths and unique published destinations and
previews. `scripts/demo-registry.cjs` expands cases into build instances.
`scripts/build-site.cjs` scopes `HUGO_CONTENTDIR` and `HUGO_DATADIR` to each
child process, along with its template, destination, base URL, and navigation.
Parent directory settings must never leak into another demo build.

Each scene owns its home/about text, brand, descriptive metadata, and data.
Headers, footers, filter options, time ranges, and map artwork must agree with
that scene. Keep filtering, sorting, integer-cent arithmetic, capacity checks,
and itinerary logic in the existing shared core modules. Do not copy business
controllers to create a scene.

## Local and standalone builds

Build the combined blog from the repository root:

```powershell
npm.cmd run build
node scripts/check-demo-builds.cjs
npm.cmd run check:output
```

Each alternate non-photography scene includes a configuration overlay that
selects its template, content directory, and data directory together. For
example, from `demos/bookstore`:

```powershell
hugo server --config 'hugo.toml,variants/catalog/config.toml'
hugo --config 'hugo.toml,variants/catalog/config.toml' --destination 'F:/agents/code/temp/art-bookstore/public' --baseURL 'https://example.github.io/art-books/' --minify --panicOnWarning
python -B -X utf8 scripts/check_build.py 'F:/agents/code/temp/art-bookstore/public' --base-url 'https://example.github.io/art-books/' --check-demo-pages
```

These URLs are examples, not deployments. Run the default scene with
`hugo server`. See each README for the correct overlay and data schema;
photography documents its separate content/template selection. Selecting only
`HUGO_PARAMS_DEMOTEMPLATE` does not select an independent scene's content.
Hugo environment overrides take precedence over CLI/config values; clear
stale task-specific overrides before a standalone build.

Integrated builds inject `demoCatalogURL` and sibling links. Standalone builds
leave these unset and have no blog return or switching toolbar. Copy a demo
as a complete source directory, then set the intended scene and customer URL
in that repository's build configuration. Nested portfolio Pages workflows
only run when the demo is the root of its own repository. A customer's build,
account, domain, and online deployment need their own verification.

## Validation

Run only affected tests during development. Integration checks cover:

- Registry paths, per-child environment isolation, all eighteen destinations,
  template links, and the configured source commit.
- Complete static content and inline JSON for each scene, plus evidence that
  sibling content and artwork differ. A data change must update its fixture
  expectations without dropping amount, date, capacity, or time tests.
- Actual filtering, quantities, sorting, selection, reset behavior, keyboard
  focus, and complete read-only content with JavaScript disabled.
- Home and representative inner pages at 320, 390, and 1280 pixels, plus fresh
  visual review on desktop and mobile after structural checks pass.

`scripts/check-demo-builds.cjs` runs each demo's standalone Python checker with
its exact base URL, catalog allowance, and sibling homepage allowances. These
checkers remain inside the demo source so a copied site does not depend on the
blog. They validate links, images, and applicable static/embedded data without
accessing the network. Only explicitly marked and permitted anchors may cross
a demo boundary. The deployed-site checker also follows local `img`/`source`
`srcset` resources.

For a deployment-prefix check, use an isolated output directory:

```powershell
npm.cmd run build -- --destination F:/agents/code/temp/scene-prefix/public --baseURL https://example.test/review/
$env:SITE_ROOT = 'F:/agents/code/temp/scene-prefix/public'
$env:SITE_URL = 'https://example.test/review/'
node scripts/check-demo-builds.cjs
```

Use a fresh shell or restore the task variables afterward. `SITE_ROOT` also
selects the directory served by `scripts/serve-public.cjs`; `PORT` selects its
local port. The main output checker normally expects the production root URL.

## Real page previews

Preview JPEGs are screenshots of actual homepages, stored in
`static/img/demos/`. CI does not regenerate them. After a visible change:

1. Build and serve the combined output locally.
2. Run `npm.cmd run demos:previews -- --base-url http://127.0.0.1:4173/` to
   refresh all eighteen previews, or capture only the changed instances at
   their registered 1280×960 dimensions.
3. Review desktop and mobile pages. Previews show the real content without
   invented UI or substituted artwork. The capture tool blocks external
   requests and waits for visible images and fonts.
4. Check each JPEG remains between 1 and 300 KiB, rebuild to include it in the
   artifact, and repeat affected catalog checks. Stop the local server.

Screenshots can differ across operating systems because the demos use system
fonts; tests verify working images, dimensions, layout, and navigation rather
than identical screenshot bytes.

## Demonstration boundaries

All interactive state stays in page memory and resets on reload. There is no
login, backend, checkout, real booking, location service, or persistent storage.
Dashboard records are fictional; book bags do not create orders; workshop
capacity is a fixed sample; trip coordinates and travel times are illustrative.

Creator artwork and the five non-photography datasets are original fictional
examples. Photography credits, sources, license conditions, and processing
records are documented in `photo-portfolio/docs/PHOTO_SOURCES.json` and its
README. A source-code delivery agreement does not replace media permissions.
For customer delivery, replace sample identity and content, verify rights,
and record customer acceptance separately from automated/local test results.
