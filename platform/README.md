# ChargeWise 3.0 — Bengaluru EV mobility platform

Full-stack web application. Node.js 24 LTS (Node 22.16 worked for tests with experimental built-in SQLite), SQLite, and a dependency-free browser UI. MapLibre GL is loaded on demand for street mapping; no API key required for the default OpenFreeMap style. No npm dependencies or build step.

## Run locally (Windows/macOS/Linux)
1. Install Node.js 24 LTS from https://nodejs.org/.
2. Extract this ZIP. Open a terminal in the `chargewise-platform` folder.
3. Run `npm start` (Windows users can double-click `start-windows.bat`).
4. Visit http://localhost:8080 in Chrome or Edge. Register an account, or use guest mode.
5. To grant a trusted existing account administrator access, run `node server.mjs promote YOUR_EMAIL` in a second terminal, then refresh the website. No public endpoint grants admin access.

Data is stored in `data/chargewise.sqlite`; preserve it between deployments. New accounts do not automatically copy guest data. Guests cannot submit public contributions. In guest mode saved data uses browser storage; in account mode it syncs to the database. Account deletion cascades through personal data and contributions.

## Map fix
The old application's direct requests to the volunteer OpenStreetMap raster-tile endpoint returned policy-block images. This code removes that endpoint, and uses MapLibre with OpenFreeMap's vector basemap https://tiles.openfreemap.org/styles/liberty. Attribution remains visible. Street maps need network access and WebGL. If library, style, or vector tiles fail, only the coordinate grid and labelled points are displayed. The grid is explicitly not a street map. The map's patterned button switches/retries street mapping. Never infer road geometry from the fallback. For independent hosting, set MAP_STYLE_URL to a compatible MapLibre style (including sprites, fonts and vector tile sources); use a provider whose terms cover your use. Default provider has no guaranteed SLA. See https://openfreemap.org/quick_start/ and https://operations.osmfoundation.org/policies/tiles/.

## Road routing and address lookup
A street basemap is not a routing engine. Real road routes require a separately configured OSRM-compatible routing service; the default has no routing backend and displays explicitly provisional straight-line estimates using a 1.45 multiplier. It does not silently call the public OSRM demo. Geocoding defaults to the bundled Bengaluru locality list and numeric coordinates. For full address search configure a Nominatim-compatible geocoder you operate or are authorized to use. Both services are accessed through fixed server-side endpoints and have timeouts and Bengaluru input validation. Road routing uses driving profile by default; configure an appropriate legal two-wheeler profile and validate road access before launch. The app does not provide turn-by-turn navigation.

Environment variables (set in shell before start, not automatically read from a .env file):
- `PORT` default 8080; `HOST` default 127.0.0.1; `DB_PATH` default ./data/chargewise.sqlite
- `MAP_STYLE_URL` default OpenFreeMap Liberty vector style; HTTPS recommended
- `OSRM_URL` e.g. your contracted or self-hosted OSRM server base URL (no trailing route path)
- `GEOCODER_URL` full authorized Nominatim search URL (e.g. https://your-geocoder.example/search)
- `NODE_ENV=production` enables secure cookies and HSTS; only use behind HTTPS.
- `APP_ORIGIN` public HTTPS origin, no trailing slash (e.g. https://chargewise.example.com), required behind a reverse proxy in production.

PowerShell example: `$env:OSRM_URL='https://YOUR-ROUTING-HOST'; $env:GEOCODER_URL='https://YOUR-GEOCODER/search'; npm start`. These are placeholders, not working providers.

## Features and data provenance
- EV trip planner: 14 original model variants, SOC, reserve, health, driving-condition factor, round trip, compatible charging candidates, arrival SOC, cost and time estimates. Existing manufacturer range and charging-rate assumptions need reconfirmation for commercial use. No verified safe-route guarantee.
- Interactive street/fallback map; click to set coordinates, zoom, pan, range radius, station popups, Google Maps links.
- Station directory: eight historical Open Charge Map starter listings, local CSV import/export, manual Overpass import, compatibility filters and nearby results. Community submissions require evidence URL and moderation. Starter data is not live and not comprehensive; TVS/Ola/Bajaj coverage is limited until more reliable listings are collected. Confirm exact vehicle/connector compatibility, power, operator access, hours and status with the operator. No invented live availability.
- Account, personal scooter garage, saved trips, favourite stations, dated charging sessions and expenditure, EV/petrol cost calculator, charging calculator, research zone analysis and notebook.
- Community reports and admin review. Approved reports are observations, not telemetry; moderation does not certify station reliability.
- Privacy: export account workspace, delete account, logout, private account state. User data is stored in SQLite; map requests go to an external service, which receives normal network/request information. No live payments, bookings, or operator APIs.

## Deployment
Docker build: `docker build -t chargewise .` then `docker run --rm -p 8080:8080 -v chargewise-data:/app/data chargewise`. This runs in local mode. For public deployment, use a TLS reverse proxy, set NODE_ENV and APP_ORIGIN, configure routing/geocoding and map hosting as above, keep persistent volumes, and back up SQLite with its online backup facility (or stop the service and back up the DB). Keep a single application instance with SQLite on a local persistent filesystem; migrate to a managed DB if scaling horizontally.

Security baseline: salted scrypt password hashes, hashed expiring session tokens, HttpOnly SameSite cookies, production Secure cookies, SQL parameterization, auth and admin guards, origin checks, body limits, basic per-IP rate limits, response security headers. Production hardening still required: email verification/password recovery, abuse prevention at reverse proxy, per-account quotas, monitoring, privacy policy and retention, dependency/penetration review, disaster recovery, accessibility and browser QA, operator data contracts. In-memory rate limiting is per process; reverse-proxy limits are required for public hosting. Third-party map script pinned to version 4.7.1; consider self-hosting a reviewed current version. There is no deployment, domain, or operator account included.

## Tests
`npm test` runs a real server against a disposable SQLite database and checks register/login/logout, persistence, role isolation, cross-origin rejection, moderation, account deletion, and disabled routing. JS syntax checked. The standalone preview was tested in Chromium with network blocked for map fallback, trip estimation, map point picking, favourites, garage, charging log. Full live-provider and hosted browser tests could not be performed in the restricted environment. Run end-to-end tests on your target device after configuring providers. Do not treat this as a certified production launch.
