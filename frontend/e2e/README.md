# Browser E2E

These tests target the HTTPS staging topology or the local container rehearsal.

```powershell
Copy-Item ..\rehearsal.env.example ..\rehearsal.env
docker compose --env-file ..\rehearsal.env -f ..\compose.rehearsal.yml up --build
npx playwright install chromium webkit
$env:E2E_BASE_URL='http://localhost:8081'
$env:E2E_MAILPIT_URL='http://localhost:8025'
$env:E2E_ADMIN_EMAIL='admin@cgfoodtour.local'
$env:E2E_ADMIN_PASSWORD='<rehearsal-only password>'
npm run test:e2e
```

Optional data-dependent scenarios:

- `E2E_APPROVED_STORE_ID`: an approved store used for deep-link reload coverage.
- `E2E_BASE_URL`: HTTPS staging origin when testing secure cookies and OAuth.
- `E2E_MAILPIT_URL`: isolated Mailpit origin (for example `http://localhost:8025`) used by the full register/verify/login/refresh/logout test.
- `E2E_ADMIN_EMAIL` and `E2E_ADMIN_PASSWORD`: isolated admin account used to create, edit, upload, approve and reload a store. Never use production credentials.

Provider login and real mobile checks remain explicit staging release gates. Never
store OAuth passwords, OTP values, access tokens, refresh cookies, Playwright
storage state, traces containing credentials, or production data in Git.
