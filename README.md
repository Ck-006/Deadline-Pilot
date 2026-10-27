# DeadlinePilot

**Coursework, under control.** DeadlinePilot helps college students keep assignments, courses, and due dates in one private workspace, then recommends what to work on next using deadline urgency, effort remaining, and assignment priority.

> **Deployment status:** prepared for Render + MongoDB Atlas. The Atlas URI is configured in the local, Git-ignored `server/.env`; live deployment and demo recording are still outstanding.

## Problem and users

Students often track coursework across course pages, calendars, and informal lists. That makes it hard to see what is late, what is coming up, and which task deserves attention first. DeadlinePilot is for college students managing several classes; it combines a persistent assignment planner with a transparent, deterministic focus recommendation.

## Workflows and features

- Create an account, sign in, and sign out. Passwords are hashed with bcrypt; a signed, HTTP-only cookie protects private API routes.
- Create, edit, complete/reopen, search, filter, sort, and delete assignments.
- Track course, title, notes, due date/time, estimated effort, priority, status, and timestamps.
- See total, in-progress, completed, and overdue counts; completion progress; next upcoming deadlines; and a recommended next task.
- Get a concise reason for the recommendation, including overdue state, a close deadline, high priority, or substantial effort.
- Use the responsive dashboard on desktop or mobile, with loading, empty, success, and error feedback.

Past due dates are allowed so students can record overdue work. Invalid date values are rejected. A missing or zero effort estimate receives a small neutral score and a prompt to add an estimate; completed assignments are excluded from recommendations. The ranking is implemented locally in `server/src/services/prioritization.js`, not through an AI or external API.

## Technology

- React 19, Vite, React Router, Tailwind CSS 4, Lucide React
- Node.js, Express 5, Mongoose, MongoDB Atlas
- Zod validation, bcryptjs password hashing, JWT in HTTP-only cookies
- Helmet, exact-origin credentialed CORS, sign-in rate limiting
- Node's built-in test runner

## Architecture

```text
Browser (React/Vite)
  └── /api requests with HTTP-only session cookie
        └── Express REST API
              ├── Zod validation + auth and ownership middleware
              ├── controllers and deterministic dashboard service
              └── Mongoose models → MongoDB Atlas
```

In production, Express serves the built client and API from one web service, so the browser and API share an origin. In development, Vite runs on port 5173 and the API on port 5000; credentialed CORS is limited to `CLIENT_URL`.

### Project structure

```text
client/
  src/App.jsx, api.js, pages/, components/, styles.css
  .env.example, vite.config.js
server/
  src/app.js, index.js
  src/config/          MongoDB connection
  src/controllers/     account and assignment handlers
  src/middleware/      auth, database readiness, rate limiting
  src/models/          User and Assignment schemas
  src/routes/          REST route definitions
  src/services/        prioritization and dashboard calculations
  src/validators/      request schemas
  test/                prioritization and input validation tests
  .env.example
docs/DEMO_SCRIPT.md
docs/SUBMISSION_CHECKLIST.md
END_TERM_PROJECT_GUIDELINES.md  (provided, unchanged)
render.yaml
```

## Data model

`User` stores a trimmed name, normalized unique email, bcrypt password hash, and Mongoose timestamps. The password hash is excluded from ordinary queries. `Assignment` belongs to a required `User` reference and stores title, description, course, due date/time, optional estimated hours, low/medium/high priority, pending/completed status, and timestamps. An index on owner and due date supports per-user listing. Every assignment read, update, and delete filters by both assignment ID and authenticated owner.

## API

All JSON responses use `{ "success": true, "data": ... }` or `{ "success": false, "error": { "code", "message", "details?" } }`. The auth cookie is named `deadlinepilot_token` and is HTTP-only, SameSite=Lax, Secure in production, and expires after seven days.

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/health` | API and Mongo connection status |
| POST | `/api/auth/register` | Validate, hash password, create account, set session |
| POST | `/api/auth/login` | Verify credentials and set session |
| POST | `/api/auth/logout` | Clear session cookie |
| GET | `/api/auth/me` | Return current authenticated user |
| GET | `/api/assignments` | List owner assignments; supports `search`, `status`, `priority`, and `sort=urgency` |
| GET | `/api/assignments/dashboard` | Counts, completion rate, upcoming items, top recommendations |
| POST | `/api/assignments` | Create an assignment for the current user |
| GET | `/api/assignments/:id` | Read one owned assignment |
| PATCH | `/api/assignments/:id` | Validate and update provided fields only |
| DELETE | `/api/assignments/:id` | Delete one owned assignment |

## Local setup

Requirements: Node.js 20.19+ or 22.12+, npm, and a MongoDB Atlas database. No local MongoDB daemon is needed.

1. Clone or open the repository root (the directory containing this README).
2. Install dependencies:

   ```bash
   npm install
   npm --prefix server install
   npm --prefix client install
   ```

3. Put the Atlas URI and a private random JWT secret in `server/.env`. The server reads that exact file and will not start until its required configuration is valid. Copy `client/.env.example` to `client/.env` for local development; its API URL is already suitable.
4. Start both development servers:

   ```bash
   npm run dev
   ```

5. Open [http://localhost:5173](http://localhost:5173). The API health endpoint is [http://localhost:5000/api/health](http://localhost:5000/api/health).

Or run the frontend and backend separately with `npm run dev:client` and `npm run dev:server`. The API requires a reachable Atlas database before it starts; there is no offline or mock-data mode. If Atlas disconnects after startup, health and data requests report the connection failure.

## Environment variables

### `server/.env`

| Variable | Required | Example / purpose |
|---|---|---|
| `MONGODB_URI` | Yes | Atlas connection string; use the `deadlinepilot` database path |
| `JWT_SECRET` | Yes | At least 32 random characters; generated locally, keep private |
| `CLIENT_URL` | Yes | Local: `http://localhost:5173`; production: exact deployed app origin |
| `PORT` | Optional | `5000`; hosting platforms may supply this automatically |
| `NODE_ENV` | Optional | `development` locally; `production` when deployed |

Put the Atlas connection string only in `server/.env` as `MONGODB_URI=...`. It is a MongoDB connection URI, not an API key. `JWT_SECRET` is a separate server-only session secret. No AI or other third-party API key is used. Never put secrets in the client environment. `client/.env` only uses `VITE_API_BASE_URL`, which is browser-visible and should contain the local API URL, never a secret.

## MongoDB Atlas setup

1. Create or sign in to a MongoDB Atlas account and create a deployment on an available free/low-cost plan.
2. Create a dedicated database user with a strong, unique password and the minimum read/write permissions needed for the `deadlinepilot` database.
3. In **Network Access**, allow your current development IP. For Render, open the service dashboard's **Connect → Outbound** view and add its outbound IP ranges to Atlas. Render may use any IP in the listed ranges; Atlas accepts connections only from allowlisted sources. Use the smallest practical range and a database user scoped to this application. See [Render outbound IP ranges](https://render.com/docs/outbound-ip-addresses) and [Atlas network security guidance](https://www.mongodb.com/docs/atlas/architecture/current/network-security/).
4. In **Connect → Drivers**, copy the Node.js connection string. Replace `<user>` and `<password>` with the database user's URL-encoded credentials, `<cluster-host>` with your cluster hostname, and the path database name with `deadlinepilot`.
5. Paste the URI in `server/.env` as `MONGODB_URI=...`. Do not share it in chat or commit it.
6. Keep the generated `JWT_SECRET` in `server/.env`, set `CLIENT_URL=http://localhost:5173`, then run `npm run dev`.
7. Check `http://localhost:5000/api/health`; it should show `"database":"connected"`. Register an account, create an assignment, refresh, then sign out and back in to verify persistence.

## Tests and production build

```bash
npm test
npm run build
```

The tests cover ordering of overdue and future tasks, completed-task exclusion, missing/invalid dates, priority and effort, dashboard totals, validation, overdue-date acceptance, and partial updates. The account and persistence flows need verification against the configured Atlas service. Do not treat a successful production build as a successful database or deployment test.

## Deployment: Render + Atlas

`render.yaml` prepares a single Render web service that installs the two app workspaces, builds the client, and runs Express to serve both the client and API.

1. Push this repository to your Git hosting account, then create a Render web service from the repository using the included Blueprint file.
2. Set `MONGODB_URI` to the Atlas URI as a secret environment value. Use a unique production `JWT_SECRET` (Render can generate one from the Blueprint).
3. Set `CLIENT_URL` to the exact HTTPS Render service origin (for example `https://deadlinepilot.onrender.com`) to match credentialed CORS. The app uses a Secure cookie in production.
4. Configure Atlas network access for the Render service's outbound IP ranges, using **Connect → Outbound** in its dashboard and the narrowest practical Atlas allowlist entries. See [Render outbound IP ranges](https://render.com/docs/outbound-ip-addresses).
5. Deploy. Verify `/api/health` reports `connected`; register and exercise create/edit/complete/delete, filtering, and a second user isolation check. Render documents Blueprint fields and generated secrets in its [Blueprint YAML reference](https://render.com/docs/blueprint-spec).
6. Record the final app URL here after deployment. No public deployment URL has been created by this project run.

Build command: `npm ci && npm --prefix server ci && npm --prefix client ci && npm run build`  
Start command: `npm start`

The Blueprint selects Render's free web-service plan to keep the initial setup low-cost. Free web services spin down after 15 minutes without traffic and may take about a minute to wake on the next request; warm the app before a live demo or select a plan that stays running if you need consistent availability. See [Render's free service limits](https://render.com/docs/free).

## Demo and submission

Follow [docs/DEMO_SCRIPT.md](docs/DEMO_SCRIPT.md) for a concise 3–5 minute product walkthrough. A video has **not** been recorded. Upload your recording and add its accessible link here, then complete the official form: https://forms.gle/sBy4sfqyiRG2Zpom9 . The supplied deadline is **27 October 2026, 11:59 PM IST**.

## Known limitations and remaining manual work

- Atlas connectivity is verified. Account ownership and user-data persistence still need an end-to-end check with a demo account.
- A live deployment and demo video are not available; no public app URL or recording is claimed.
- The actual Atlas persistence, auth, and cross-account isolation flows require a follow-up verification.
- The GitHub repository has not yet received the local commits.
- Completing the final submission form, checking public links privately, and uploading the demo remain student actions.

See [docs/SUBMISSION_CHECKLIST.md](docs/SUBMISSION_CHECKLIST.md) for the handoff items.
