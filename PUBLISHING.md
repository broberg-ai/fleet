# Publishing

Two public npm packages from this repo: `@broberg/fleet-contracts` and
`@broberg/fleet-client`. Same model as `@broberg/ai-sdk` / `@broberg/db-sdk`.

## First publish of v0.1.0 — MANUAL (one-time bootstrap)

npm has **no "pending publisher"**, so the very first version of each package is
published by hand (needs an authenticated npm session + 2FA OTP). Publish
**contracts first** (the client depends on it).

```bash
pnpm install
pnpm -r build            # contracts → client (topological)
pnpm -r typecheck && pnpm -r test

# 1) contracts first
pnpm --filter @broberg/fleet-contracts publish --access public --no-git-checks --otp=<OTP>

# 2) then the client (pnpm rewrites workspace:* → ^0.1.0 in the published manifest)
pnpm --filter @broberg/fleet-client   publish --access public --no-git-checks --otp=<OTP>
```

## After bootstrap — OIDC Trusted Publishing (zero secrets)

Once v0.1.0 exists, register a **Trusted Publisher** at npmjs.com for EACH
package → `@broberg/fleet-contracts` / `@broberg/fleet-client` → Settings →
Trusted Publisher = `broberg-ai/fleet`, workflow `publish.yml`. Then every
release is just:

```bash
# bump versions, commit, then:
git tag v0.1.1 && git push origin v0.1.1     # → .github/workflows/publish.yml publishes via OIDC
```

The tag must match the package versions (the workflow guards this).
