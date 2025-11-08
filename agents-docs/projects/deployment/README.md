# Deployment & Delivery Project

Centralise every build, hosting, and runtime-delivery task so we can ship the 3D campus reliably (local, staging, production).

## Objectives
- Define repeatable build pipelines (Vercel, Netlify, custom servers) with env management + secrets handling.
- Keep bundle sizes healthy (code splitting, manual chunks, tree shaking) so deployments stay performant.
- Provide runbooks for troubleshooting failed builds, quota overages, and rollback procedures.

## Scope
1. **CI/CD Strategy** – Vercel project setup, preview deployments, protected branches, custom domains.
2. **Chunking & Performance** – Rollup chunk plans, lazy-loading, asset budgets, monitoring (Lighthouse, WebPageTest).
3. **Runtime Configuration** – `.env` handling per environment, HA tokens, feature flags.
4. **Observability** – Deployment logs, status dashboards, alerts for connector failures.

## Stakeholders
- Product & Design (review preview URLs).
- Platform/Infra (secrets, custom domain DNS).
- UI/3D teams (must know chunking constraints when adding features).

## Working Agreement
- Every deployment-related task must cite the quick research performed (docs, blog posts) in `tasks.md`.
- Session logs required for each significant pipeline/config change.
