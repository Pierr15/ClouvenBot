# ClouvenTwo Integration Audit (Read-only)

This document records an initial source review only. It does not modify the ClouvenTwo repository, database, or deployment.

## Findings from the current ClouvenTwo source

- `api/_lib/supabaseAdmin.js` exposes `verifyRequest()` and `verifyPermission()`. The first validates a human user's Supabase access token and profile; it is not bot-to-service authentication.
- `assets/js/permissions.js` defines a client-side role matrix. API routes must continue to enforce permissions server-side; browser-side checks are not an authorization boundary.
- Existing admin routes include `api/admin/update-user.js`, `api/admin/delete-user.js`, and `api/admin/reset-password.js`. These perform sensitive actions and must not be exposed to Discord users by forwarding bot credentials or accepting arbitrary operation names.
- `api/drive/manage.js` uses permission checks and registered resource validation. A Drive mutation can succeed before its Supabase bookkeeping fails, so a timeout or partial failure must be reconciled before retrying.
- `api/_lib/driveResource.js` includes registered-resource and class-root validation that should be retained for any future bot-accessible file operation.
- `tests/api-access.mjs` is a useful starting point for existing API authorization tests.

## Recommended service boundary

Create a dedicated ClouvenTwo bot-facing API namespace only after its maintainers approve the contract. Each route should have a fixed operation, input schema, authorization policy, audit event, and idempotency behavior. Do not create a generic SQL, arbitrary endpoint proxy, or arbitrary function-execution endpoint.

The service boundary should:
1. Authenticate ClouvenBot server-to-server over HTTPS using a dedicated credential stored only in server environment variables.
2. Fail closed when credentials, scope, input validation, or authorization checks fail.
3. Re-check operation-specific permissions on the server and protect the last Developer account.
4. Use idempotency keys and operation records for mutations. Check actual downstream state before retrying an unknown outcome.
5. Log operation IDs and outcomes without credentials or unnecessary private payloads.
6. Keep Discord signature validation separate from service authentication. A valid Discord signature proves Discord signed the interaction, not that the user is allowed to administer the website.

## Initial route mapping

| Capability | Current state | Bot integration decision |
| --- | --- | --- |
| Health | ClouvenBot has its own non-sensitive health route | Do not proxy website secrets or database diagnostics |
| Public schedule / approved class information | Needs endpoint-by-endpoint review | Read-only wrapper after data visibility rules are confirmed |
| Member/private data | Existing role and API rules apply | Deny by default; expose only fields needed for an approved use case |
| Role changes, account deletion, password reset | Existing administrative routes | Do not expose directly; require dedicated service route, owner authorization, one-time action-bound confirmation, and audit |
| Drive/file management | Existing permission and ancestry validation | Reuse the security checks only through an explicit service route; reconcile partial outcomes before retry |

## Open items before enabling integration

- Confirm the exact supported API routes and their deployment version.
- Agree the service token format, rotation plan, rate limits, and request size limits.
- Decide which Discord commands may access which data.
- Add service-authentication, owner-authorization, duplicate-request, and partial-failure tests.
- Keep Vercel Preview credentials and test Discord application separate from Production.
