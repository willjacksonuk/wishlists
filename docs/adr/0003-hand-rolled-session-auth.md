# Hand-rolled session login instead of an auth framework

Logins are username and password only, Users are created by Admins, and no email is ever sent, so there is no sign-up, verification or password-reset-by-email flow to support. We store Argon2-hashed passwords and a sessions table in SQLite, with the session ID in an HTTP-only cookie, rather than adding a full auth framework whose features this site would not use.

## Consequences

- If email, OAuth or self-service sign-up are ever wanted, revisit this and consider adopting a framework.
