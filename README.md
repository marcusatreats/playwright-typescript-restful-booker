# Playwright TypeScript API Testing Framework — Restful Booker

A production-style API test automation framework built with TypeScript and Playwright's native `APIRequestContext`. Tests cover full CRUD operations, authentication, negative cases, and test data lifecycle management against the [Restful Booker API](https://restful-booker.herokuapp.com).

![CI](https://github.com/marcusatreats/playwright-typescript-restful-booker/actions/workflows/playwright.yml/badge.svg)

---

## Project Setup

Install dependencies:

```bash
npm install
```

---

## Running Tests

Run all tests:

```bash
npx playwright test
```

Run in headed mode:

```bash
npx playwright test --headed
```

Run in debug mode:

```bash
npx playwright test --debug
```

View HTML report:

```bash
npx playwright show-report
```

View trace files:

```bash
npx playwright show-trace trace.zip
```

---

## Project Structure

```
project-root/
├── helpers/
│   └── auth.ts              # Auth token helper
├── tests/
│   └── book.spec.ts         # Booking API test scenarios
├── .github/
│   └── workflows/
│       └── playwright.yml   # GitHub Actions CI pipeline
├── playwright.config.ts     # Playwright configuration
├── tsconfig.json            # TypeScript configuration
├── package.json
└── README.md
```

---

## Test Coverage

### Happy Path
- **GET** all bookings
- **GET** booking by ID
- **POST** create a booking
- **PUT** full update of a booking
- **PATCH** partial update of a booking
- **DELETE** a booking and verify 404

### Negative Cases
- **404** booking not found
- **403** unauthorized request with invalid token
- **Invalid date format** — bug raised [#55](https://github.com/mwinteringham/restful-booker/issues/55)

---

## Framework Design

### Test Data Lifecycle
Bookings are created in `beforeAll`, shared across tests via a stored `bookingId`, and cleaned up in `afterAll`. This ensures tests are independent of shared public data and don't interfere with other users of the API.

### Authentication
A reusable `getAuthToken()` helper in `helpers/auth.ts` handles token generation. The token is stored at the describe block level and reused across all protected requests.

### No External Libraries
All API requests use Playwright's built-in `APIRequestContext` — no REST Assured, Axios, or Postman required. Same framework, same config, same reports as UI tests.

---

## CI/CD

Tests run automatically on every push and pull request to `main` via GitHub Actions. The HTML report is uploaded as an artifact on every run and retained for 30 days.

---

## Bug Reports

Issues found and raised against the Restful Booker API during testing:

| Issue | Description | Status |
|-------|-------------|--------|
| [#55](https://github.com/mwinteringham/restful-booker/issues/55) | POST /booking accepts invalid date formats and returns 200 instead of 400 | Open |

---

## Tech Stack

- [Playwright](https://playwright.dev/) — Test framework and API client
- [TypeScript](https://www.typescriptlang.org/) — Language
- [Node.js](https://nodejs.org/) — Runtime
- [GitHub Actions](https://github.com/features/actions) — CI/CD
