# Fronted - Bulletproof Monster Stack 🔥

## Libraries

- Tanstck Router 👉 To handle routing, layouts, protected routes
- Tanstack Query 👉 To handle profesionally all HTTP logic
- TailwindCSS 👉 Main library for styling
- ShadcnUI (not an actual dependencie) 👉 To create beautiful system designs
- Zustand 👉 Global management store
- Sonner 👉 To handle toast notifications
- Lucide 👉 Main library for icons

**What to Test**

✅ User interactions <br/>
✅ API calls and responses <br/>
✅ State management <br/>
✅ Error handling <br/>
✅ Edge cases

❌ Implementation details <br/>
❌ Third-party libraries <br/>
❌ Styling <br/>

Write tests for business logic!!!

## Architecture - Feature (Domain Oriented) Based Layers

Architecture - Feature-Based (Domain-Oriented) Layers
This codebase follows a feature-based architecture, where each feature is self-contained with its own components, hooks, services, types, and utilities. This approach promotes:

Scalability - Easy to add new features without affecting existing ones <br/>
Maintainability - Related code lives together <br/>
Reusability - Shared code is clearly separated <br/>
Testability - Each feature can be tested in isolation <br/>

```
src/
├── features/                    # Feature modules (domain-oriented)
│   ├── auth/                    # Authentication feature
│   │   ├── components/          # Auth-specific components
│   │   │   ├── LoginForm.tsx
│   │   │   └── RegisterForm.tsx
│   │   ├── hooks/               # Auth-specific hooks
│   │   │   ├── useAuth.ts
│   │   │   └── useLogin.ts
│   │   ├── services/            # Auth API calls
│   │   │   └── authService.ts
│   │   ├── store/               # Auth state management
│   │   │   └── authStore.ts
│   │   ├── types/               # Auth TypeScript types
│   │   │   └── auth.types.ts
│   │   ├── utils/               # Auth utility functions
│   │   │   └── authUtils.ts
│   │   └── index.ts             # Public API - exports only what's needed
│   │
│   ├── dashboard/               # Dashboard feature (example)
│   │   ├── components/
│   │   ├── hooks/
│   │   └── ...
│   │
│   └── products/                # Products feature (example)
│       ├── components/
│       ├── hooks/
│       └── ...
│
├── components/                  # Shared/common components
│   ├── ui/                      # Shadcn UI components
│   │   ├── button.tsx
│   │   ├── alert.tsx
│   │   ├── aurora-text.tsx
│   │   ├── sparkles-text.tsx
│   │   └── sonner.tsx
│   ├── layout/                  # Layout components (coming soon)
│   │   ├── Header.tsx
│   │   ├── Sidebar.tsx
│   │   └── Footer.tsx
│   └── common/                  # Common reusable components (coming soon)
│       ├── DataTable.tsx
│       ├── ErrorBoundary.tsx
│       └── LoadingSpinner.tsx
│
├── hooks/                       # Global custom hooks
│   ├── use-me.ts                # Current user hook
│   ├── use-mutation.ts          # Global mutation hook
│   ├── use-query.ts             # Global query hook
│   └── index.ts
│
├── lib/                         # Library configurations & utilities
│   ├── api/
│   │   ├── client.ts            # HTTP client (fetch wrapper)
│   │   └── query-client.tsx     # TanStack Query configuration
│   └── utils/
│       ├── constants.ts         # App constants
│       ├── helpers.ts           # cn() utility and helpers
│       ├── validators.ts        # Validation utilities
│       └── index.ts
│
├── routes/                      # TanStack Router routes
│   ├── __root.tsx               # Root route
│   ├── _authenticated.tsx       # Protected routes layout
│   ├── _authenticated/
│   │   └── index.tsx            # Home page (protected)
│   └── login.tsx                # Login page (public)
│
├── store/                       # Zustand global stores
│   ├── store.ts                 # Main store (user state)
│   └── index.ts
│
├── types/                       # Global TypeScript types
│   ├── common.types.ts          # Common types (User, ApiRsp)
│   └── index.ts
│
├── styles/                      # Global styles
│   └── index.css                # TailwindCSS + custom styles
│
├── main.tsx                     # Application entry point
└── routeTree.gen.ts             # Auto-generated routes (DO NOT EDIT)
```
