# tradethiopia
it team workspace

## Vercel deployment

- `vercel.json` now treats the root package as a `@vercel/static-build` project that emits `frontend/dist` and routes every `/api/*` request into the `backend/api` serverless function.
- Run `npm run build` (the script installs the frontend dependencies and runs `npm run build --prefix frontend`) before creating a release or preview deployment.
- Configure the usual backend environment variables in the Vercel dashboard so the serverless API can start:
  - `MONGO_URI`, `JWT_SECRET`, `FRONTEND_URL`
  - Appwrite credentials: `APPWRITE_ENDPOINT`, `APPWRITE_PROJECT_ID`, `APPWRITE_API_KEY`, `APPWRITE_BUCKET_ID`
  - Any SMTP or custom secrets that appear in `backend/.env` (e.g., `SMTP_USER`, `SMTP_PASS`, `SMTP_HOST`, `SMTP_PORT`).
- API health-checks live under `/api/health` and `/api/test`, and static assets live at the root URL once the frontend build completes.
