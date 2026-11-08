# Deploy the public frontend with Docker

The public frontend is a Next.js server, not a static site. It renders pages and proxies browser requests for `/api/v1/...` to the Go backend. This setup runs one frontend container; it does not install the backend, configure HTTPS, or provide a reverse proxy.

## 1. Prepare the server

Install Docker Engine and Docker Compose on the server. Make sure the Go API is running and reachable **from the frontend container**. Upload the entire `frontend/` directory to the server, including `public/`, `messages/`, the lockfile, and the Docker files. Do not upload local `node_modules`, `.next`, or `.env.local`.

From the uploaded `frontend/` directory:

```sh
cp .env.example .env.production
```

Edit `.env.production`:

- Set `API_BASE_URL` to the backend origin, for example `http://192.0.2.10:8080`, with no `/api/v1` path. `127.0.0.1` inside the container means the frontend container itself, not the server. If the backend runs in another container, use an address reachable from this container; a Compose service name works only when both services share a Docker network. Ensure firewall rules allow this connection.
- Add `SITE_URL=https://medcation.care` for canonical URLs, metadata, robots and sitemap links.
- Set the reviewed `CONTACT_*` values as needed. Both address languages are required to display an address. For contact form submissions, configure the public `CONTACT_CAPTCHA_SITE_KEY` and `CONTACT_CAPTCHA_ACTION`; the action must match the backend's `RECAPTCHA_LEAD_ACTION`. Backend reCAPTCHA secrets belong only on the backend. See `.env.example` for validation and optional country configuration. Do not enable the development bypass in production.

The app can render some values during the build. The Compose file passes these settings to both the image build and the running container. **After changing any of them, rebuild and recreate the container** using the command below. Build arguments are not secret storage: use only the public contact details, public CAPTCHA site key and non-secret origins described above.

## 2. Build and start

```sh
docker compose --env-file .env.production -f compose.production.yml up -d --build
```

The first build downloads dependencies and may require access to external font resources. The port is bound to `127.0.0.1:3000` on the server. Configure your existing HTTPS reverse proxy to forward the domain to `http://127.0.0.1:3000`, preserving the original host and forwarding headers. The proxy must also support Next.js streaming and allow suitable request sizes for the backend endpoints. Configure DNS and TLS for your domain separately.

## 3. Verify and operate

```sh
docker compose --env-file .env.production -f compose.production.yml ps
docker compose --env-file .env.production -f compose.production.yml logs --tail=100 frontend
curl -I http://127.0.0.1:3000/
```

Open the HTTPS domain in a browser; check the home page, `/blog`, `/gallery`, `/robots.txt`, `/sitemap.xml`, images, and the contact flow. Confirm that API requests under `/api/v1/` succeed and the backend receives them. A page response alone does not prove backend connectivity or CAPTCHA configuration.

To deploy an updated frontend, upload the updated files and run the build-and-start command again. To stop it:

```sh
docker compose --env-file .env.production -f compose.production.yml down
```

If the site loads but content or form submissions fail, inspect the frontend and backend logs and check container-to-backend connectivity, the API origin, and CAPTCHA settings. If the port is already in use, change the host side of `127.0.0.1:3000:3000` in `compose.production.yml` and update your reverse proxy.
