# Movo Media

Static marketing site for Movo Media — mobile LED car-top advertising in Cairo.

## Structure

```
index.html        # page markup
style.css         # all styles
script.js         # all behaviour (nav, reveal, counters, FAQ)
robots.txt        # crawler rules
sitemap.xml       # sitemap
assets/           # images
  fleet/          # fleet photos
partials/         # sections kept out of the live page
  pricing.html    #   pricing — parked, restore instructions inside
                  #   (not copied into the image; restoring it means pasting it into index.html
                  #   and re-adding its CSS to style.css)
dev/              # local development stack
scripts/          # deploy tooling (runs on the server)
```

No build step, no backend. External dependencies are Google Fonts only.

## Local development

```bash
docker compose -f dev/docker-compose.yml up
# then open http://localhost:8080
```

Serves the site through the **same `nginx.conf` production uses**, so gzip,
security headers, cache policy and `/healthz` all behave exactly as they will
once deployed — unlike a bare static server.

`index.html`, `style.css`, `script.js`, `robots.txt`, `sitemap.xml`, `assets/` and `nginx.conf` should all be bind-mounted in `dev/docker-compose.yml`, so editing a file and
refreshing the browser is the entire loop. No rebuild, no restart. `index.html`
is served with `expires -1` and `style.css`/`script.js` with a 1-hour cache, so hard-refresh after editing them; `/assets/`
carries a 30-day cache, so hard-refresh (<kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>R</kbd>)
after swapping an image.

Override the port with `DEV_PORT=3000 docker compose -f dev/docker-compose.yml up`.

### Verifying the production image

The dev service skips the `Dockerfile` entirely. To check the image that
actually ships:

```bash
docker compose -f dev/docker-compose.yml --profile build up --build prod-check
# then open http://localhost:8081
```

This one bakes files in with `COPY`, so it does **not** reflect source edits —
rebuild to see changes. That is the point: it verifies the deployable artifact.

### Without Docker

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

Fine for a quick look, but it applies none of the nginx config — no gzip, no
security headers, no cache rules, and `/healthz` returns 404.

## Deployment

Hosted on `nour-server` at `/hosting/movo`, as an nginx container on the shared
`tunnel-network`. No host port is published: cloudflared sits on the same network
and reaches the site directly as `http://movo:80`, which is how the other
services on that box are wired.

### Updating

```bash
/scripts/update-movo.sh          # deploy origin/main if it moved
/scripts/update-movo.sh --force  # rebuild even if already up to date
```

The script fetches `origin/main`, hard-resets to it, rebuilds, and waits for the
container healthcheck. If the new build does not come up healthy it restores the
previous commit, so a bad push cannot leave the site down. `/scripts/update-movo.sh`
is a symlink to `scripts/update-movo.sh` in this repo, so the script updates itself
along with the site.

### After deploying: checks

```bash
curl -I https://yourdomain/README.md     # expect 404
curl -I https://yourdomain/scripts/      # expect 404
curl -I https://yourdomain/dev/          # expect 404
curl -I https://yourdomain/              # expect Content-Security-Policy header
```

Then run the site through securityheaders.com. Line endings are forced to LF by
`.gitattributes`, so `scripts/update-movo.sh` will not fail with `bash\r: not found`.

The server is a pure deploy target — edits made directly on it are discarded on
the next update. Change things here and push.

### Cloudflare

The tunnel is token-managed, so routes live in the Cloudflare dashboard. Point the
hostname at `http://movo:80`.

`GET /healthz` returns `ok` and backs the container healthcheck.
