# Backend for Bulletproof Monster Stack 🔥

## API goal

Main Backend API to power Cápita UI/UX application, with custom auth system.

### Core Libraries 📚

- Express 👉 To create fully our API (routing, middlewares etc..)
- Drizzle ORM and Pg 👉 To handle DB communication, operations, migrations (we're using postgres)
- Passport and Passport-google-oauth20 👉 To handle OAUTH flow with providers such as google
- Morgan 👉 Server logging
- Jsonwebtoken 👉 To create JWT for auth
- Cors 👉 Block unknown requests from websites

### Feature based | Domain-Oriented Architecture

The API has a feature based architecture to separate specific concerns, logic, and functions in order to have files and folders with unique and specific goals

- Controller Layer 👉 Handle incoming requests, validate data input, generate appropiate responses
- Service Layer 👉 Handle all bussines logic
- Repository Layer 👉 Handle the data layer by accessing the DB

```
server/
├── cmd/                              # 🚀 Application entry point & initialization
│   ├── main.go                       # Application setup and dependency injection
│   └── api.go                        # HTTP server configuration and route setup
│
├── internal/
│   ├── auth/                         # 🔐 Authentication feature (domain)
│   │   ├── __tests__/                # Tests for auth feature
│   │   │   ├── controller_test.go    # Controller layer tests
│   │   │   ├── service_test.go       # Service layer tests & business logic
│   │   │   ├── middleware_test.go    # Middleware & authentication logic tests
│   │   │   └── mocks/                # Mock objects and test helpers
│   │   │
│   │   ├── controller.go             # HTTP request handlers & response formatting
│   │   ├── service.go                # Business logic (OAuth, token creation, user operations)
│   │   ├── middleware.go             # JWT verification & token refresh logic
│   │   └── types.go                  # Auth domain-specific types
│   │
│   ├── db/                           # 🗄️ Database layer (centralized)
│   │   ├── migrations/               # Version-controlled SQL migrations (goose format)
│   │   │   └── 00001_users_table.sql
│   │   │
│   │   ├── queries/                  # SQL query definitions (for sqlc generation)
│   │   │   └── users.sql
│   │   │
│   │   └── sqlc/                     # Auto-generated code from sqlc (don't edit manually)
│   │       ├── db.go                 # Database connection setup
│   │       ├── models.go             # Generated database models
│   │       ├── querier.go            # Generated query interface
│   │       └── users.sql.go          # Generated user queries
│   │
│   └── utils/                        # 🛠️ Shared utilities across the application
│       ├── env.go                    # Environment variables loader & type-safe access
│       ├── context.go                # Context keys for request data passing
│       ├── json.go                   # Standardized JSON response builder
│       ├── jwt.go                    # Token creation, verification & validation
│       └── errors.go                 # Application-level error definitions
│
├── .env.example                      # Environment variables template
├── .gitignore                        # Git ignore rules
├── docker-compose.yml                # PostgreSQL database setup
├── Dockerfile                        # Container image definition
├── Makefile                          # Build and database management commands
├── sqlc.yaml                         # sqlc configuration for code generation
├── go.mod                            # Go module dependencies
├── go.sum                            # Dependency checksums
├── .air.toml                         # Hot-reload configuration for development
└── README.md                         # This file
```

## Specific Features

### Feed Algorithm — Recency-Biased Randomness + Category Variety

The `GET /posts` endpoint uses a two-layer algorithm to make the feed feel alive rather than purely chronological.

**Layer 1 — SQL: Weighted random ordering**

Each post receives a score computed entirely in the DB:

```
score = RANDOM() × 0.5^(age_in_weeks)
```

`0.5^(age_in_weeks)` is an exponential decay with a **7-day half-life** — every week a post's maximum possible score halves. New posts dominate on average, but an older post that rolls a high random number can still surface.

| Post age | Max score |
| -------- | --------- |
| Today    | 1.00      |
| 1 week   | 0.50      |
| 2 weeks  | 0.25      |
| 1 month  | ~0.05     |

The query also accepts an optional `category` param. Passing an empty string returns all categories; passing `"Ropa"` returns only that category — handled in a single query with no branching.

**Layer 2 — Go: Category variety pass**

After the DB returns the scored list, a single O(n) pass ensures no two consecutive posts share the same category. It greedily picks the earliest post in the remaining list that differs from the last placed one, preserving the weighted-random order as much as possible.

```
DB output:  [Ropa, Ropa, Tec, Lib, Ropa, Tec]
After pass: [Ropa, Tec, Ropa, Lib, Ropa, Tec]  ← no two same in a row
```

This separation of concerns keeps retrieval logic in SQL and presentation logic in Go.

---
