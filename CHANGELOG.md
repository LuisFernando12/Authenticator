# [2.4.0](https://github.com/LuisFernando12/Authenticator/compare/v2.3.0...v2.4.0) (2026-10-20)

### Features

- **auth:** enhance AuthGuard to include user retrieval from repository ([addf53d](https://github.com/LuisFernando12/Authenticator/commit/addf53d335f74a5a78a1ff68e42367b40d771e5d))
- **auth:** implement AuthGuard and user retrieval endpoint; add request decorator ([f41ff9c](https://github.com/LuisFernando12/Authenticator/commit/f41ff9c4eecebba48e18eb1e64a45ae0e94df1e0))
- **auth:** improve token validation and user retrieval in AuthGuard ([4a18d78](https://github.com/LuisFernando12/Authenticator/commit/4a18d783aea6543e525ab3b763d293c258bbf588))
- **user:** include user ID in the User object returned by findByEmail ([9af07e6](https://github.com/LuisFernando12/Authenticator/commit/9af07e6ea5a2a46443a2544f150f32e7ec7da34c))

# [2.4.0-beta.4](https://github.com/LuisFernando12/Authenticator/compare/v2.4.0-beta.3...v2.4.0-beta.4) (2026-10-23)

### Bug Fixes

- **auth:** improve token validation for email verification and MFA routes ([3cc3484](https://github.com/LuisFernando12/Authenticator/commit/3cc3484ceeb491c28d6d32683c1e54ac9ce573ff))
- **mfa:** correct oauthRequestId getter to return the proper value ([31d59a5](https://github.com/LuisFernando12/Authenticator/commit/31d59a52b0c9c83fe1b1888be3480d22103d67e5))

### Features

- **mfa:** add MFA and TOTP entities to the test application configuration ([1911876](https://github.com/LuisFernando12/Authenticator/commit/19118767cd0c50e922072df1cae864b58864de5a))
- **mfa:** add TOTP use cases and OAuth TOTP verification tests ([cc0732a](https://github.com/LuisFernando12/Authenticator/commit/cc0732a245bb7707990f4566705ad0aca69d61f4))
- **mfa:** implement MFA token handling with Redis integration ([cd03147](https://github.com/LuisFernando12/Authenticator/commit/cd0314798141104278b525146e1760818e74a042))
- **mfa:** implement TOTP functionality with MFA challenge handling ([ef6bdca](https://github.com/LuisFernando12/Authenticator/commit/ef6bdca8c9a4e7e8bdeff6449ba38d4ae1fd7341))
- **mfa:** implement TOTP-based multi-factor authentication ([5ab75e9](https://github.com/LuisFernando12/Authenticator/commit/5ab75e9399b15c4c8a79818303c67d0c948ba703))

# [2.4.0-beta.3](https://github.com/LuisFernando12/Authenticator/compare/v2.4.0-beta.2...v2.4.0-beta.3) (2026-09-10)

### Features

- **auth:** improve token validation and user retrieval in AuthGuard ([4a18d78](https://github.com/LuisFernando12/Authenticator/commit/4a18d783aea6543e525ab3b763d293c258bbf588))
- **user:** include user ID in the User object returned by findByEmail ([9af07e6](https://github.com/LuisFernando12/Authenticator/commit/9af07e6ea5a2a46443a2544f150f32e7ec7da34c))

# [2.4.0-beta.2](https://github.com/LuisFernando12/Authenticator/compare/v2.4.0-beta.1...v2.4.0-beta.2) (2026-09-10)

### Features

- **auth:** enhance AuthGuard to include user retrieval from repository ([addf53d](https://github.com/LuisFernando12/Authenticator/commit/addf53d335f74a5a78a1ff68e42367b40d771e5d))

# [2.4.0-beta.1](https://github.com/LuisFernando12/Authenticator/compare/v2.3.0...v2.4.0-beta.1) (2026-09-09)

### Features

- **auth:** implement AuthGuard and user retrieval endpoint; add request decorator ([f41ff9c](https://github.com/LuisFernando12/Authenticator/commit/f41ff9c4eecebba48e18eb1e64a45ae0e94df1e0))

# [2.3.0-beta.5](https://github.com/LuisFernando12/Authenticator/compare/v2.3.0-beta.4...v2.3.0-beta.5) (2026-09-05)

### Features

- **auth:** implement AuthGuard and user retrieval endpoint; add request decorator ([f41ff9c](https://github.com/LuisFernando12/Authenticator/commit/f41ff9c4eecebba48e18eb1e64a45ae0e94df1e0))

# [2.3.0-beta.4](https://github.com/LuisFernando12/Authenticator/compare/v2.3.0-beta.3...v2.3.0-beta.4) (2026-08-21)

### Features

- **docs:** update email notification section and add account unblock endpoint in README ([2079c50](https://github.com/LuisFernando12/Authenticator/commit/2079c5075c968579f100be36a8260c9e1d31160c))

# [2.3.0-beta.3](https://github.com/LuisFernando12/Authenticator/compare/v2.3.0-beta.2...v2.3.0-beta.3) (2026-08-10)

### Features

- **env:** update service URLs in .env.template for account management ([d2f3356](https://github.com/LuisFernando12/Authenticator/commit/d2f3356ce8d7eb3b03866c1208bb4ed3ed7ce4f6))

# [2.3.0-beta.2](https://github.com/LuisFernando12/Authenticator/compare/v2.3.0-beta.1...v2.3.0-beta.2) (2026-08-08)

### Bug Fixes

- **email:** fixed start log on sendBlockAccountEmailUseCase ([dfb2f0a](https://github.com/LuisFernando12/Authenticator/commit/dfb2f0a593e45fa999a7d1fe904cf370633628ed))
- **email:** update subject line for unblock account email notification ([b2a98b7](https://github.com/LuisFernando12/Authenticator/commit/b2a98b7a9772f79088313ea7971353c660a0c72f))

### Features

- **account:** implement account blocking and reactivation features with email notifications ([6bdb273](https://github.com/LuisFernando12/Authenticator/commit/6bdb273b2f41de007fb3be0f454ba1916a6e116c))
- add account unblock functionality ([e5c7f2b](https://github.com/LuisFernando12/Authenticator/commit/e5c7f2b3c61bda4ecb66d1de8adee9fd9d8760d6))

# [2.3.0-beta.1](https://github.com/LuisFernando12/Authenticator/compare/v2.2.0...v2.3.0-beta.1) (2026-08-04)

### Features

- **auth:** add failed login attempt tracking and security event logging ([31fd351](https://github.com/LuisFernando12/Authenticator/commit/31fd351081352e109c9547ea4cb2466f3a52d5f0))
- **security:** implement security event logging and add reason for logins ([5d7a055](https://github.com/LuisFernando12/Authenticator/commit/5d7a0551df5b56269b7f8f7e90e645fe00742d15))
- **test:** resolved tests errors and add new use-case suite security-event ([9ed5532](https://github.com/LuisFernando12/Authenticator/commit/9ed5532a11c56a589499b6f0ad15b1cc130fbfde))

# [2.2.0](https://github.com/LuisFernando12/Authenticator/compare/v2.1.0...v2.2.0) (2026-07-27)

### Features

- **session:** add deleteOldestSessionByUserId method and update session creation logic ([1e02e82](https://github.com/LuisFernando12/Authenticator/commit/1e02e82cf55aaa3a77f4667a9ab23b7922d8ec4e))
- **session:** update deleteOldestSessionByUserId to filter and sort sessions ([718d513](https://github.com/LuisFernando12/Authenticator/commit/718d513ab23006057d1c0681ed2ce6a2b858df8f))

# [2.1.0](https://github.com/LuisFernando12/Authenticator/compare/v2.0.0...v2.1.0) (2026-07-16)

### Bug Fixes

- add SMTP connection check in EmailWorker constructor ro debug in hml ([a98fa54](https://github.com/LuisFernando12/Authenticator/commit/a98fa543bc3b0eab3fa258245bb57fda785cc665))
- **config:** update docker-compose service dependencies and template path ([078f9ce](https://github.com/LuisFernando12/Authenticator/commit/078f9ce3e96c14e97f752bc97bf556c5869e1ab9))
- correct typos and naming inconsistencies across codebase ([c72ff87](https://github.com/LuisFernando12/Authenticator/commit/c72ff878c69e661d4f7b07be660b136ccfa2034a))
- **email:** add error logging in sendActivationEmail method ([0677dfd](https://github.com/LuisFernando12/Authenticator/commit/0677dfd86f154ea6805301ae996f754a0329e44c))
- **email:** add inline style for button color in active account email template ([197f9c8](https://github.com/LuisFernando12/Authenticator/commit/197f9c83c06c1a5a9be8e0ac0b36b506c1e1ca28))
- remove unused error variable in catch blocks across multiple services ([3db9424](https://github.com/LuisFernando12/Authenticator/commit/3db9424969644edfa8b0abfe891c22ea7be49dc2))
- update Dockerfile to use pnpm for package management and build process ([0c3723e](https://github.com/LuisFernando12/Authenticator/commit/0c3723ecc829d53232a3b19c452f89c607cff8f5))
- update pre-commit script to use default Node version and set default port in main.ts ([94f8d4a](https://github.com/LuisFernando12/Authenticator/commit/94f8d4a420ece47231d1fbc2823b029b39a21cfb))

### Features

- add EmailLoggerPort provider to TestEmailModule for enhanced logging capabilities ([4ad680b](https://github.com/LuisFernando12/Authenticator/commit/4ad680bfd6d2420675d0827f842ce19968091dc0))
- add SMTP address to configuration and update email sending methods ([70dfb92](https://github.com/LuisFernando12/Authenticator/commit/70dfb9213c71689b730bb82f8f4cc7dc6b08e8d2))
- **consent:** add scopes property to OauthConsent and related services ([bd93c53](https://github.com/LuisFernando12/Authenticator/commit/bd93c53a2315410ba9831ce113ed93140ff63260))
- **email:** refactor GmailProvide to implement OnModuleInit for OAuth2 client initialization ([5412a4b](https://github.com/LuisFernando12/Authenticator/commit/5412a4b29f97c1518873d8d7969190f307ee72bc))
- **env:** add PORT variable and update database host configuration ([6ed1ce8](https://github.com/LuisFernando12/Authenticator/commit/6ed1ce80be2eeba63037d6b67ce76d9cf5bbc456))
- migrate from SMTP to Gmail API for email sending ([25c4668](https://github.com/LuisFernando12/Authenticator/commit/25c4668439952a569f67fbadfbc6e0fe034b7252))
- **token and session:** enhance token entity and repository for token family management ([9de698b](https://github.com/LuisFernando12/Authenticator/commit/9de698b88e87f73e453b8f80f7e23b6a369a46a4))

# [2.1.0-beta.8](https://github.com/LuisFernando12/Authenticator/compare/v2.1.0-beta.7...v2.1.0-beta.8) (2026-07-15)

### Bug Fixes

- **email:** add inline style for button color in active account email template ([197f9c8](https://github.com/LuisFernando12/Authenticator/commit/197f9c83c06c1a5a9be8e0ac0b36b506c1e1ca28))

# [2.1.0-beta.7](https://github.com/LuisFernando12/Authenticator/compare/v2.1.0-beta.6...v2.1.0-beta.7) (2026-07-15)

### Features

- **email:** refactor GmailProvide to implement OnModuleInit for OAuth2 client initialization ([5412a4b](https://github.com/LuisFernando12/Authenticator/commit/5412a4b29f97c1518873d8d7969190f307ee72bc))
- migrate from SMTP to Gmail API for email sending ([25c4668](https://github.com/LuisFernando12/Authenticator/commit/25c4668439952a569f67fbadfbc6e0fe034b7252))

# [2.1.0-beta.6](https://github.com/LuisFernando12/Authenticator/compare/v2.1.0-beta.5...v2.1.0-beta.6) (2026-07-13)

### Bug Fixes

- add SMTP connection check in EmailWorker constructor ro debug in hml ([a98fa54](https://github.com/LuisFernando12/Authenticator/commit/a98fa543bc3b0eab3fa258245bb57fda785cc665))

### Features

- add EmailLoggerPort provider to TestEmailModule for enhanced logging capabilities ([4ad680b](https://github.com/LuisFernando12/Authenticator/commit/4ad680bfd6d2420675d0827f842ce19968091dc0))
- add SMTP address to configuration and update email sending methods ([70dfb92](https://github.com/LuisFernando12/Authenticator/commit/70dfb9213c71689b730bb82f8f4cc7dc6b08e8d2))

# [2.1.0-beta.5](https://github.com/LuisFernando12/Authenticator/compare/v2.1.0-beta.4...v2.1.0-beta.5) (2026-07-08)

### Bug Fixes

- remove unused error variable in catch blocks across multiple services ([3db9424](https://github.com/LuisFernando12/Authenticator/commit/3db9424969644edfa8b0abfe891c22ea7be49dc2))

# [2.1.0-beta.4](https://github.com/LuisFernando12/Authenticator/compare/v2.1.0-beta.3...v2.1.0-beta.4) (2026-07-08)

### Bug Fixes

- update Dockerfile to use pnpm for package management and build process ([0c3723e](https://github.com/LuisFernando12/Authenticator/commit/0c3723ecc829d53232a3b19c452f89c607cff8f5))

# [2.1.0-beta.3](https://github.com/LuisFernando12/Authenticator/compare/v2.1.0-beta.2...v2.1.0-beta.3) (2026-06-30)

### Bug Fixes

- update pre-commit script to use default Node version and set default port in main.ts ([94f8d4a](https://github.com/LuisFernando12/Authenticator/commit/94f8d4a420ece47231d1fbc2823b029b39a21cfb))

# [2.1.0-beta.2](https://github.com/LuisFernando12/Authenticator/compare/v2.1.0-beta.1...v2.1.0-beta.2) (2026-06-30)

### Bug Fixes

- correct typos and naming inconsistencies across codebase ([c72ff87](https://github.com/LuisFernando12/Authenticator/commit/c72ff878c69e661d4f7b07be660b136ccfa2034a))

# [2.1.0-beta.1](https://github.com/LuisFernando12/Authenticator/compare/v2.0.0...v2.1.0-beta.1) (2026-06-30)

### Bug Fixes

- **config:** update docker-compose service dependencies and template path ([078f9ce](https://github.com/LuisFernando12/Authenticator/commit/078f9ce3e96c14e97f752bc97bf556c5869e1ab9))
- **email:** add error logging in sendActivationEmail method ([0677dfd](https://github.com/LuisFernando12/Authenticator/commit/0677dfd86f154ea6805301ae996f754a0329e44c))

### Features

- **consent:** add scopes property to OauthConsent and related services ([bd93c53](https://github.com/LuisFernando12/Authenticator/commit/bd93c53a2315410ba9831ce113ed93140ff63260))
- **env:** add PORT variable and update database host configuration ([6ed1ce8](https://github.com/LuisFernando12/Authenticator/commit/6ed1ce80be2eeba63037d6b67ce76d9cf5bbc456))
- **token and session:** enhance token entity and repository for token family management ([9de698b](https://github.com/LuisFernando12/Authenticator/commit/9de698b88e87f73e453b8f80f7e23b6a369a46a4))

# [2.0.0-beta.6](https://github.com/LuisFernando12/Authenticator/compare/v2.0.0-beta.5...v2.0.0-beta.6) (2026-06-14)

### Features

- **consent:** add scopes property to OauthConsent and related services ([bd93c53](https://github.com/LuisFernando12/Authenticator/commit/bd93c53a2315410ba9831ce113ed93140ff63260))

# [2.0.0-beta.5](https://github.com/LuisFernando12/Authenticator/compare/v2.0.0-beta.4...v2.0.0-beta.5) (2026-06-14)

### Bug Fixes

- **email:** add error logging in sendActivationEmail method ([0677dfd](https://github.com/LuisFernando12/Authenticator/commit/0677dfd86f154ea6805301ae996f754a0329e44c))

# [2.0.0-beta.4](https://github.com/LuisFernando12/Authenticator/compare/v2.0.0-beta.3...v2.0.0-beta.4) (2026-06-13)

### Bug Fixes

- **config:** update docker-compose service dependencies and template path ([078f9ce](https://github.com/LuisFernando12/Authenticator/commit/078f9ce3e96c14e97f752bc97bf556c5869e1ab9))

# [2.0.0-beta.3](https://github.com/LuisFernando12/Authenticator/compare/v2.0.0-beta.2...v2.0.0-beta.3) (2026-06-10)

### Bug Fixes

- **tests:** correct typos in variable names and improve response handling in Oauth E2E tests ([ca4de04](https://github.com/LuisFernando12/Authenticator/commit/ca4de04c33e782f649b18412a13551938003841d))

# [2.0.0-beta.2](https://github.com/LuisFernando12/Authenticator/compare/v2.0.0-beta.1...v2.0.0-beta.2) (2026-06-09)

### Bug Fixes

- **docs:** correct spelling of 'refresh-token' in API documentation ([4e4bcc8](https://github.com/LuisFernando12/Authenticator/commit/4e4bcc8bcc1621fa67ae6709834882e5e28cd915))

# [2.0.0-beta.1](https://github.com/LuisFernando12/Authenticator/compare/v1.5.0...v2.0.0-beta.1) (2026-06-06)

### Bug Fixes

- add escape to status in OauthDomainError ([42fb754](https://github.com/LuisFernando12/Authenticator/commit/42fb754ea0c67b14abec5e57dfd0ad5c7143a8f2))
- **controller:** fix import UserDTO to true path ([8223aeb](https://github.com/LuisFernando12/Authenticator/commit/8223aeb5ac3d0c770ba645bc420ce664fefe947a))
- some adjuts ([77460f5](https://github.com/LuisFernando12/Authenticator/commit/77460f5074fec17be159f9e81feb5b954d4798a8))
- **user:** fixed throw erro on entity ([f3f7d41](https://github.com/LuisFernando12/Authenticator/commit/f3f7d41e382f7019de4e8bbea293cc40122c6ff8))

### Code Refactoring

- **oauth:** adopt domain-driven design architecture ([206884b](https://github.com/LuisFernando12/Authenticator/commit/206884bf9363fafbed6318d33a63a68d08a54f41))

### Features

- **token:** implement token management features ([4cdffb8](https://github.com/LuisFernando12/Authenticator/commit/4cdffb8b1abcd228e86ae4cf648fe0dd2144cc54))

### BREAKING CHANGES

- **oauth:** OauthService is deprecated; migrate to use cases.

# [1.5.0](https://github.com/LuisFernando12/Authenticator/compare/v1.4.0...v1.5.0) (2026-05-08)

### Bug Fixes

- **config:** add updated pnpm-lock file ([e1aabd6](https://github.com/LuisFernando12/Authenticator/commit/e1aabd675449bef37519837fd552f8474eaba05f))
- **config:** move mailer to dependencies ([64acedb](https://github.com/LuisFernando12/Authenticator/commit/64acedb3f4938285966320a080491fcab7a7866c))
- hash client secret using bcrypt on database.setup to fix e2e test ([2ee988d](https://github.com/LuisFernando12/Authenticator/commit/2ee988d311eb32e8dfce6482ec4cfb3e6b4e06b4))
- remove required validation for access token expiration and refresh token days ([578c0d1](https://github.com/LuisFernando12/Authenticator/commit/578c0d1699274426e15f317e710c08bcb4e1bbef))
- update database field names and types for consistency ([6840177](https://github.com/LuisFernando12/Authenticator/commit/6840177ce1aebd5904427767c309ad21e1d244e3))

### Features

- add token expiration configuration ([7396152](https://github.com/LuisFernando12/Authenticator/commit/7396152fc090f657d51c4e73e0aa183746c3c13d))

# [1.5.0-beta.1](https://github.com/LuisFernando12/Authenticator/compare/v1.4.1-beta.2...v1.5.0-beta.1) (2026-05-06)

### Bug Fixes

- remove required validation for access token expiration and refresh token days ([578c0d1](https://github.com/LuisFernando12/Authenticator/commit/578c0d1699274426e15f317e710c08bcb4e1bbef))

### Features

- add token expiration configuration ([7396152](https://github.com/LuisFernando12/Authenticator/commit/7396152fc090f657d51c4e73e0aa183746c3c13d))

## [1.4.1-beta.2](https://github.com/LuisFernando12/Authenticator/compare/v1.4.1-beta.1...v1.4.1-beta.2) (2026-05-06)

### Bug Fixes

- hash client secret using bcrypt on database.setup to fix e2e test ([2ee988d](https://github.com/LuisFernando12/Authenticator/commit/2ee988d311eb32e8dfce6482ec4cfb3e6b4e06b4))

## [1.4.1-beta.1](https://github.com/LuisFernando12/Authenticator/compare/v1.4.0...v1.4.1-beta.1) (2026-05-02)

### Bug Fixes

- **config:** add updated pnpm-lock file ([e1aabd6](https://github.com/LuisFernando12/Authenticator/commit/e1aabd675449bef37519837fd552f8474eaba05f))
- **config:** move mailer to dependencies ([64acedb](https://github.com/LuisFernando12/Authenticator/commit/64acedb3f4938285966320a080491fcab7a7866c))
- update database field names and types for consistency ([6840177](https://github.com/LuisFernando12/Authenticator/commit/6840177ce1aebd5904427767c309ad21e1d244e3))

# [1.4.0](https://github.com/LuisFernando12/Authenticator/compare/v1.3.0...v1.4.0) (2026-04-30)

### Bug Fixes

- update token expiration handling in tests refresh token and revoke token to use dynamic dates ([9602361](https://github.com/LuisFernando12/Authenticator/commit/96023613f3dd4ab772c8e0d73b283ddc49b716ba))

### Features

- add global setup for e2e tests ([48c7768](https://github.com/LuisFernando12/Authenticator/commit/48c7768844687f1ddb9e281a5a14c5541689fba2))

# [1.4.0-beta.3](https://github.com/LuisFernando12/Authenticator/compare/v1.4.0-beta.2...v1.4.0-beta.3) (2026-05-02)

### Bug Fixes

- update database field names and types for consistency ([6840177](https://github.com/LuisFernando12/Authenticator/commit/6840177ce1aebd5904427767c309ad21e1d244e3))

# [1.4.0-beta.2](https://github.com/LuisFernando12/Authenticator/compare/v1.4.0-beta.1...v1.4.0-beta.2) (2026-05-01)

### Bug Fixes

- **config:** add updated pnpm-lock file ([e1aabd6](https://github.com/LuisFernando12/Authenticator/commit/e1aabd675449bef37519837fd552f8474eaba05f))
- **config:** move mailer to dependencies ([64acedb](https://github.com/LuisFernando12/Authenticator/commit/64acedb3f4938285966320a080491fcab7a7866c))

# [1.4.0-beta.1](https://github.com/LuisFernando12/Authenticator/compare/v1.3.1-beta.1...v1.4.0-beta.1) (2026-04-30)

### Features

- add global setup for e2e tests ([48c7768](https://github.com/LuisFernando12/Authenticator/commit/48c7768844687f1ddb9e281a5a14c5541689fba2))

## [1.3.1-beta.1](https://github.com/LuisFernando12/Authenticator/compare/v1.3.0...v1.3.1-beta.1) (2026-04-24)

### Bug Fixes

- update token expiration handling in tests refresh token and revoke token to use dynamic dates ([9602361](https://github.com/LuisFernando12/Authenticator/commit/96023613f3dd4ab772c8e0d73b283ddc49b716ba))

# [1.3.0](https://github.com/LuisFernando12/Authenticator/compare/v1.2.0...v1.3.0) (2026-04-01)

### Features

- enhance password reset flow with improved security and UX ([6086d2f](https://github.com/LuisFernando12/Authenticator/commit/6086d2f0d835e4c8162787efe2253e6ec0082d9a))

# [1.3.0-beta.1](https://github.com/LuisFernando12/Authenticator/compare/v1.2.0...v1.3.0-beta.1) (2026-04-01)

### Features

- enhance password reset flow with improved security and UX ([6086d2f](https://github.com/LuisFernando12/Authenticator/commit/6086d2f0d835e4c8162787efe2253e6ec0082d9a))

# [1.2.0](https://github.com/LuisFernando12/Authenticator/compare/v1.1.1...v1.2.0) (2026-03-30)

### Features

- implement multi-token support and opaque refresh tokens ([9927989](https://github.com/LuisFernando12/Authenticator/commit/992798916fb998aa475509aa9f8f3ed37042b692))

# [1.2.0-beta.1](https://github.com/LuisFernando12/Authenticator/compare/v1.1.1-beta.1...v1.2.0-beta.1) (2026-03-30)

### Features

- implement multi-token support and opaque refresh tokens ([9927989](https://github.com/LuisFernando12/Authenticator/commit/992798916fb998aa475509aa9f8f3ed37042b692))

## [1.1.1](https://github.com/LuisFernando12/Authenticator/compare/v1.1.0...v1.1.1) (2026-03-25)

### Bug Fixes

- **release:** rename realease.config.js to release.config.js ([45e7fa4](https://github.com/LuisFernando12/Authenticator/commit/45e7fa49b7dbbaf841fcdb752c03eb0802fa7c6d))

## [1.1.1-beta.1](https://github.com/LuisFernando12/Authenticator/compare/v1.1.0...v1.1.1-beta.1) (2026-03-25)

### Bug Fixes

- **release:** rename realease.config.js to release.config.js ([45e7fa4](https://github.com/LuisFernando12/Authenticator/commit/45e7fa49b7dbbaf841fcdb752c03eb0802fa7c6d))

# [1.1.0-beta.1](https://github.com/LuisFernando12/Authenticator/compare/v1.0.0...v1.1.0-beta.1) (2026-03-25)

### Bug Fixes

- **release:** rename realease.config.js to release.config.js ([45e7fa4](https://github.com/LuisFernando12/Authenticator/commit/45e7fa49b7dbbaf841fcdb752c03eb0802fa7c6d))

### Features

- add Husky, Commitlint, and ESLint flat config ([7d72c5c](https://github.com/LuisFernando12/Authenticator/commit/7d72c5c518c5e366f339fa974abdc86e19c97b1c))
