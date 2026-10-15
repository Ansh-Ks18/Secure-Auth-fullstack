# SecureAuth — Full-Stack JWT Authentication System

> **Build it. Understand it. Secure it. Explain it.**
>
> A full-stack authentication project built with React, Spring Boot, Spring Security, and MySQL. This repository is both a working application and a practical revision handbook covering authentication flows, backend architecture, security decisions, debugging, and interview questions.

## Table of Contents

- [Project Overview](#project-overview)
- [Why This Project Is Different](#why-this-project-is-different)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Authentication Flow](#authentication-flow)
- [Access Token vs Refresh Token](#access-token-vs-refresh-token)
- [Backend Request Lifecycle](#backend-request-lifecycle)
- [API Reference](#api-reference)
- [Database and Password Security](#database-and-password-security)
- [Important Design Decisions: Why and Why Not](#important-design-decisions-why-and-why-not)
- [Security Considerations](#security-considerations)
- [Project Structure](#project-structure)
- [Local Setup](#local-setup)
- [Testing Checklist](#testing-checklist)
- [Common Problems and Debugging](#common-problems-and-debugging)
- [Interview Revision Handbook](#interview-revision-handbook)
- [Future Improvements](#future-improvements)
- [Learning Philosophy](#learning-philosophy)

---

## Project Overview

SecureAuth is a full-stack authentication system in which a React frontend communicates with a Spring Boot backend through HTTP APIs.

The application demonstrates how a user can register, log in, receive an access token, access protected resources, renew an expired access token, and log out.

The purpose is not just to make authentication work. It is to understand **what happens at every step, why each component exists, where credentials are stored, and what can go wrong.**

### Core Features

- User registration and login.
- Backend-side password hashing with BCrypt.
- JWT-based authentication.
- Protected backend endpoints.
- Short-lived access tokens.
- Refresh-token-based session renewal.
- HttpOnly refresh-token cookie.
- Refresh-token rotation and revocation.
- React frontend and Spring Boot REST APIs.
- MySQL persistence.
- CORS configuration for frontend-backend communication.
- Practical debugging notes and interview revision questions.

> Feature checklist: confirm each feature against the current implementation before treating this list as a verified description of the published code.

## Why This Project Is Different

Many beginner projects stop after generating a JWT and displaying a dashboard. This project aims to explain the complete lifecycle of an authenticated request.

It focuses on five questions:

1. **Communication:** How does React send a request to Spring Boot, and how does the response return?
2. **Authentication:** How does the backend verify the user's credentials?
3. **Authorization:** How does the server decide whether a request can access a protected resource?
4. **Session continuity:** What happens when the access token expires?
5. **Engineering decisions:** Why choose one storage strategy, endpoint design, or security configuration over another?

### What I want to demonstrate

- Understanding the complete request-response lifecycle.
- Separating frontend responsibilities from backend responsibilities.
- Understanding the difference between authentication and authorization.
- Knowing why a security decision is made, not just which annotation to use.
- Debugging real integration problems instead of copying code without understanding it.
- Explaining trade-offs and limitations honestly.

## Tech Stack

| Technology | Responsibility |
|---|---|
| Java | Backend programming language |
| Spring Boot | Application configuration and REST API development |
| Spring Security | Authentication and endpoint protection |
| JWT | Signed access-token representation |
| BCrypt | Password hashing |
| Spring Data JPA / Hibernate | Database persistence, if used by the implementation |
| MySQL | Persistent user and authentication data |
| React | Frontend UI and application state |
| Vite | Frontend development server and build tooling |
| Fetch API | HTTP communication between frontend and backend |
| Maven | Backend dependency and build management |
| Git and GitHub | Version control and project documentation |

## Architecture

```text
                    USER
                     |
                     v
              React Frontend
              Registration/Login
                     |
                     | HTTP requests
                     v
             Spring Boot REST API
                     |
                     v
              Controller Layer
                     |
                     v
               Service Layer
          Business Logic and Validation
                     |
                     v
             Repository Layer
                     |
                     v
                  MySQL

Authentication support:
- PasswordEncoder / BCrypt
- JWT service
- Spring Security filter chain
- Refresh-token validation and rotation
- HttpOnly cookie handling
```

### Responsibility of each layer

**React frontend**
- Collects registration and login information.
- Sends API requests.
- Displays success and error messages.
- Keeps the access token in application memory in the current implementation.
- Sends the access token when calling protected APIs.

**Controller**
- Receives HTTP requests.
- Reads request data.
- Invokes the appropriate service.
- Returns HTTP responses.

**Service**
- Contains business logic.
- Coordinates registration, login, token generation, and refresh operations.
- Applies relevant validation and security rules.

**Repository**
- Communicates with the database through the persistence layer.
- Finds users and stores application data.

**Spring Security and JWT components**
- Define which endpoints require authentication.
- Validate presented access tokens through the configured authentication flow.
- Establish the authenticated security context for protected requests.

**MySQL**
- Stores persistent application data, such as user records.
- May store refresh-token records when database-backed refresh-token management is configured.

The exact responsibilities and persistence strategy should match the actual source code.

## Authentication Flow

### 1. Registration

```text
User fills registration form
          |
          v
React sends POST /api/auth/register
          |
          v
Spring Boot receives registration data
          |
          v
Validate input and check duplicate email
          |
          v
Hash password using BCrypt
          |
          v
Save user through repository
          |
          v
Return an HTTP response
          |
          v
React displays result / navigates to login
```

Important: the password should be hashed on the backend before persistence. The original password must never be stored as plain text.

A successful registration response does not automatically mean the user has been logged in. Registration and authentication are separate operations unless the application explicitly combines them.

### 2. Login

```text
User submits email and password
          |
          v
React sends POST /api/auth/login
          |
          v
Backend finds user by email
          |
          v
BCrypt verifies submitted password
          |
          +---- Invalid credentials --> Error response
          |
          v
Generate signed access token
          |
          v
Issue refresh token / set cookie
          |
          v
Return access-token response
          |
          v
React keeps access token in memory
          |
          v
Navigate to protected dashboard
```

The backend must validate the credentials. Hiding the dashboard in React is not a substitute for protecting the API.

### 3. Accessing the dashboard

```text
React calls protected profile endpoint
          |
          v
Authorization: Bearer <access-token>
          |
          v
Spring Security processes the request
          |
          v
JWT signature, expiry and claims are checked
          |
          +---- Invalid/expired --> 401 Unauthorized
          |
          v
Authenticated request reaches controller
          |
          v
Backend returns permitted data
          |
          v
React renders dashboard
```

The backend must perform the authorization checks. A user must not gain access simply by changing the frontend URL.

### 4. Refreshing an expired access token

```text
Access token expires
          |
          v
Protected request fails authentication
          |
          v
Frontend calls POST /api/auth/refresh
          |
          v
Browser sends eligible refresh-token cookie
          |
          v
Backend validates refresh token
          |
          v
Backend rotates refresh token if configured
          |
          v
New access token returned
          |
          v
Frontend retries the protected request
```

A refresh request should not blindly trust a token just because it arrived in a cookie. The backend must validate its authenticity, expiry, revocation status, and other applicable rules.

The frontend should retry only in a controlled way. Otherwise, refresh failures can produce repeated requests or infinite retry loops.

### 5. Logout

```text
User clicks Logout
          |
          v
React sends POST /api/auth/logout
          |
          v
Backend revokes refresh-token session
          |
          v
Backend clears refresh-token cookie
          |
          v
Frontend clears access token from memory
          |
          v
User returns to login
```

Clearing a browser cookie alone does not necessarily invalidate a copied refresh token. Server-side revocation is important when the application supports it.

## Access Token vs Refresh Token

| Property | Access Token | Refresh Token |
|---|---|---|
| Main purpose | Access protected APIs | Obtain a new access token |
| Lifetime | Short | Longer |
| Sent with | `Authorization: Bearer ...` | HttpOnly cookie in this implementation |
| Used on every protected request | Typically | No |
| Should be revoked/validated | Signature, expiry, claims and applicable policy | Expiry, validity, revocation and applicable policy |
| Exposure impact | Can allow access until invalid or expired | Can allow session renewal until invalidated or expired |

### Current project settings

The development configuration discussed for this project uses:

- Access-token lifetime: approximately **1 minute**.
- Refresh-token lifetime: approximately **7 days**.
- Password hashing: BCrypt.
- Refresh cookie: HttpOnly, `SameSite=Strict`, and `Secure=false` for local HTTP development.

These are configuration values, not universal recommendations. Verify the current source before relying on them.

A one-minute access-token lifetime is useful for learning and testing refresh behavior. It may be inconvenient for normal users. Production lifetimes should be selected based on the threat model and application requirements.

## Backend Request Lifecycle

A useful way to understand Spring Boot is to trace a single request from beginning to end.

1. The browser creates an HTTP request.
2. The request reaches the Spring Boot server.
3. The Spring Security filter chain processes it.
4. Authentication filters validate credentials or a bearer token, as applicable.
5. Security rules determine whether the request may proceed.
6. The dispatcher routes the request to the matching controller.
7. The controller calls the service.
8. The service performs business logic and invokes the repository when needed.
9. The repository interacts with the database.
10. The controller returns a response, which Spring serializes into JSON when appropriate.
11. React receives the response and updates the UI.

**Revision question:** Where should authentication logic live?

Answer: the frontend can manage user interaction and attach credentials, but the backend must enforce authentication and authorization. Security decisions must not depend only on React.

## API Reference

The following describes the endpoint contract used during project development. Verify the current controllers and DTOs before publishing this table as final API documentation.

| Method | Endpoint | Purpose | Expected access |
|---|---|---|---|
| POST | `/api/auth/register` | Register a user | Public |
| POST | `/api/auth/login` | Authenticate a user | Public |
| GET | `/api/auth/profile` | Return protected profile data | Authenticated |
| POST | `/api/auth/refresh` | Renew the access token | Valid refresh session |
| POST | `/api/auth/logout` | End the refresh-token session | Follow the implemented session policy |

### Example registration request

```json
{
  "name": "Example User",
  "email": "user@example.com",
  "password": "Use-A-Strong-Password"
}
```

Use fake example data in documentation. Never include real credentials.

### Example login request

```json
{
  "email": "user@example.com",
  "password": "Use-A-Strong-Password"
}
```

### Example protected request

```http
GET /api/auth/profile
Authorization: Bearer <access-token>
```

### Important HTTP status codes

| Status | Meaning | Typical use |
|---|---|---|
| 200 OK | Request succeeded | Login, profile, refresh, logout where appropriate |
| 201 Created | Resource created | Registration if implemented this way |
| 400 Bad Request | Invalid request data | Validation errors |
| 401 Unauthorized | Authentication is missing or invalid | Missing, expired, or invalid access token |
| 403 Forbidden | Authenticated caller lacks permission | Authorization failure |
| 409 Conflict | Request conflicts with existing state | Duplicate email if designed this way |
| 500 Internal Server Error | Unexpected server failure | Unhandled server error |

The actual response status depends on the controller and exception-handling configuration. A duplicate email may produce 400 or 409 depending on the API contract.

## Database and Password Security

### Why hash passwords?

Passwords are high-value secrets. If the database is leaked, storing plain-text passwords exposes users immediately.

BCrypt is a password-hashing algorithm designed for this purpose. Verification compares a submitted password against the stored hash.

```text
Submitted password
        |
        v
PasswordEncoder.matches(...)
        |
        v
Stored BCrypt hash
        |
        v
Match / no match
```

A password hash is not an encrypted password that can simply be decrypted to recover the original. Password hashing and encryption are different concepts.

### What should be stored?

- User identity and application data required by the application.
- Password hashes, never plain-text passwords.
- Refresh-token metadata or hashes when required by the chosen refresh-session design.

Avoid storing sensitive values without a clear requirement.

## Important Design Decisions: Why and Why Not

### 1. Why JWT instead of server-side sessions?

**Why JWT can be useful**
- The backend can validate a signed access token without loading a session record for every request.
- It works naturally with REST APIs and multiple clients.
- It can carry limited claims needed by the server.

**Why not use JWT for everything?**
- A signed JWT is not automatically encrypted; its claims may be readable.
- Revocation is more difficult for self-contained access tokens.
- Long-lived tokens increase the impact of token theft.
- Key rotation, claim validation, expiry, and secure storage require careful implementation.

Traditional server-side sessions may be simpler when immediate session revocation and centralized session state are priorities.

### 2. Why short-lived access tokens?

Shorter lifetimes reduce the period in which a stolen access token may remain usable.

**Trade-off:** users may need to refresh more often. A refresh mechanism introduces additional security and implementation complexity.

### 3. Why a separate refresh token?

The access token can be short-lived while the refresh credential supports session continuity.

**Trade-off:** refresh-token theft can be serious. The backend needs strong validation, secure storage, expiry, and revocation or rotation controls appropriate to the design.

### 4. Why use an HttpOnly cookie for the refresh token?

JavaScript cannot directly read an HttpOnly cookie. This reduces direct token theft through certain cross-site scripting attacks.

**Why not assume this solves XSS or CSRF?**
- HttpOnly does not prevent malicious JavaScript from making authenticated requests from a compromised page.
- Cookies are sent automatically when their scope and browser policies allow it, so CSRF protections still need careful consideration.
- `SameSite=Strict` can limit some cross-site cookie sending, but it is not a complete security strategy for every deployment.

### 5. Why keep the access token in memory?

In-memory storage avoids persisting the token across browser restarts and avoids direct retrieval through `localStorage`.

**Trade-off:** a page reload clears the in-memory token. The application may need to call the refresh endpoint to obtain a new access token.

No browser storage strategy eliminates every risk. The right choice depends on the application's threat model.

### 6. Why BCrypt instead of plain-text passwords?

BCrypt is designed for password hashing and supports a configurable work factor.

**Never do this:**
- Store the original password.
- Log passwords.
- Return password hashes to React.
- Treat Base64 encoding as password protection.

### 7. Why use a service layer?

A service layer keeps business logic out of controllers and supports separation of concerns.

**Why not put everything in a controller?**

Controllers become difficult to test and maintain when they handle request parsing, business rules, persistence, token generation, and error handling together.

### 8. Why use a repository layer?

The repository separates persistence operations from business logic.

**Why not write database operations everywhere?**

Repeated persistence code makes testing, maintenance, and future changes more difficult.

### 9. Why configure CORS?

The browser treats different origins as different security origins. For example, `http://localhost:5175` and `http://localhost:8085` have different ports and therefore different origins.

The backend must allow the intended frontend origin and the necessary methods, headers, and credentials.

**Why not allow every origin in production?**

Broad CORS policies can expose APIs to unintended browser-based origins. When credentialed requests are used, configure explicit trusted origins.

CORS is a browser access policy, not authentication or authorization.

### 10. Why not disable security to make errors disappear?

Permitting every request can help isolate a configuration issue temporarily in a local experiment, but it removes endpoint protection if left in place.

A working server is not necessarily a secure server. Restore the intended authentication and authorization rules and verify them with tests.

## Security Considerations

Before treating this project as production-ready, verify:

- [ ] Passwords are hashed using a suitable password encoder.
- [ ] Database credentials and JWT signing keys are not committed to Git.
- [ ] JWT signature, expiry, and required claims are validated.
- [ ] Protected endpoints reject missing or invalid access tokens.
- [ ] Refresh tokens are validated and can be revoked as designed.
- [ ] Refresh-token rotation handles reuse and concurrent requests appropriately.
- [ ] Refresh cookies use HttpOnly and an appropriate SameSite policy.
- [ ] Production cookies use Secure over HTTPS.
- [ ] CSRF defenses match the cookie and authentication architecture.
- [ ] CORS allows only intended production origins.
- [ ] Validation errors do not expose internal implementation details.
- [ ] Sensitive credentials and tokens are not written to logs.
- [ ] Authentication and authorization are tested independently of the frontend.

A project demonstrating JWT authentication is not automatically production-ready. These checks identify areas that need evidence from configuration, code, and tests.

## Project Structure

Suggested combined repository layout:

```text
secure-auth-fullstack/
├── backend/
│   ├── src/
│   │   ├── main/
│   │   └── test/
│   ├── pom.xml
│   └── README.md                 # Optional backend-specific guide
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── services/
│   ├── package.json
│   └── vite.config.js
├── .gitignore
└── README.md                     # Main project + revision guide
```

Folder names may differ in the actual repository. Keep the existing source structure intact when combining the projects.

## Local Setup

### Prerequisites

- A compatible JDK version for the backend.
- Maven, or the project's Maven wrapper if provided.
- Node.js and npm.
- MySQL.
- Git.

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/secure-auth-fullstack.git
cd secure-auth-fullstack
```

### 2. Configure the database

Create the MySQL database:

```sql
CREATE DATABASE secureauth_db;
```

Configure the backend's datasource URL, username, and password using local environment variables or an untracked local configuration file.

Example URL:

```text
jdbc:mysql://localhost:3306/secureauth_db
```

Use the actual database name configured by your application. Do not commit real database passwords or signing secrets.

### 3. Start the backend

```bash
cd backend
```

If the project includes the Maven wrapper, use the command appropriate for your operating system. Otherwise, with Maven installed:

```bash
mvn spring-boot:run
```

Verify the configured port in `application.properties` or the active environment configuration. The development backend previously used port `8085`, but your current configuration may differ.

### 4. Start the frontend

Open a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open the local URL printed by Vite. Verify that the frontend's API configuration matches the actual backend port and that the backend CORS configuration allows the frontend origin.

### 5. Environment and secret handling

Keep local credentials outside version control. Commit an example configuration containing placeholders if it helps other developers reproduce the setup.

For production, use managed secrets or environment variables, HTTPS, and production-specific security settings.

## Testing Checklist

Use this checklist after running both applications.

### Registration
- [ ] A valid registration creates a user.
- [ ] Invalid input is rejected.
- [ ] Duplicate email is handled consistently.
- [ ] The stored password is a hash, not the original password.

### Login
- [ ] Correct credentials succeed.
- [ ] Incorrect credentials are rejected.
- [ ] The response matches the documented API contract.
- [ ] The refresh cookie is issued with the expected attributes, where applicable.

### Protected APIs
- [ ] A valid access token allows the intended request.
- [ ] A missing token is rejected.
- [ ] An invalid token is rejected.
- [ ] An expired access token cannot access protected resources.

### Refresh and logout
- [ ] A valid refresh session can obtain a new access token.
- [ ] Invalid, expired, or revoked refresh tokens are rejected.
- [ ] Refresh-token rotation works as designed.
- [ ] Logout clears the cookie and revokes the session where supported.
- [ ] A revoked refresh token cannot be reused.

### Integration
- [ ] React calls the correct backend URL.
- [ ] CORS works with the intended local origin.
- [ ] API errors are handled without infinite retries.
- [ ] A page reload behaves as expected with in-memory access-token storage.

## Common Problems and Debugging

| Problem | What to inspect |
|---|---|
| Port already in use | Find the process occupying the configured port or stop the previous application instance. |
| CORS error | Check exact frontend origin, backend CORS rules, credentials, and allowed headers. |
| `ERR_CONNECTION_REFUSED` | Confirm the backend is running at the URL and port used by React. |
| `401 Unauthorized` | Check access-token presence, expiry, signature validation, and request headers. |
| `403 Forbidden` | Inspect authorization rules, roles, CSRF behavior, and security configuration. |
| `409 Conflict` | Inspect the response body and duplicate-resource handling. |
| Database connection failure | Check MySQL status, JDBC URL, database name, driver, credentials, and datasource configuration. |
| Missing Spring bean | Check component scanning, annotations, constructor dependencies, and package structure. |
| Vite import error | Check file paths, filename capitalization, and whether the imported export actually exists. |
| Refresh request fails | Check cookie attributes, request credentials, refresh-token validity, and server-side session state. |

**Debugging rule:** Read the first meaningful exception in the backend logs and inspect the HTTP response in the browser's Network panel. Avoid changing several unrelated settings at once.

## Interview Revision Handbook

Use these questions to check whether you understand the project well enough to explain it without reading the source code.

### Authentication fundamentals

1. What is the difference between authentication and authorization?
2. What happens when a user clicks Login?
3. Why should password verification happen on the backend?
4. What is a JWT, and what are its typical parts?
5. What does a JWT signature prove, and what does it not prove?
6. What is the difference between a JWT and a session ID?
7. Why should passwords be hashed instead of encrypted for storage?

### Spring Boot and architecture

8. What does `@RestController` do?
9. What is the difference between a controller and a service?
10. What responsibility belongs in the repository layer?
11. What is dependency injection?
12. What is a Spring bean?
13. What happens when Spring cannot find a required bean?
14. How does Spring convert a Java response object to JSON?
15. How would you handle validation errors consistently?

### Spring Security and JWT

16. What is the Spring Security filter chain?
17. How does a bearer token reach the backend?
18. How should the backend validate a JWT?
19. What happens when a token expires?
20. Why should protected endpoints not rely on React route guards?
21. What is the difference between 401 and 403?
22. What are the consequences of a leaked JWT signing key?

### Refresh tokens and browser security

23. Why use separate access and refresh tokens?
24. Why keep access tokens short-lived?
25. What does HttpOnly prevent, and what does it not prevent?
26. Why can cookies introduce CSRF considerations?
27. Why is CORS not an authentication mechanism?
28. What is refresh-token rotation?
29. How should logout affect refresh-token validity?
30. What happens to an access token already issued when a refresh token is revoked?

### React and API integration

31. What happens when React calls a Spring Boot endpoint?
32. What is the role of the `Authorization` header?
33. Why does `credentials: "include"` matter for cookie-based requests?
34. Why does an in-memory token disappear after a page reload?
35. How can an automatic refresh mechanism accidentally create an infinite retry loop?
36. How would you debug a request that works in an API client but fails in the browser?

### Engineering trade-offs

37. Why choose JWT instead of a traditional session?
38. When might server-side sessions be a better choice?
39. Why use a service layer rather than putting everything in controllers?
40. What would you change before deploying this application publicly?

**Practice method:** Answer each question aloud in three parts: what it is, why the project uses it, and what trade-off or limitation it has.

## Future Improvements

Potential improvements, depending on project goals:

- Add automated unit and integration tests.
- Add centralized JSON exception handling and request validation.
- Add roles and role-based authorization.
- Add account verification and password-reset flows.
- Add rate limiting and protection against repeated login attempts.
- Add stronger refresh-session management and reuse detection.
- Add API documentation with OpenAPI.
- Add Docker Compose for reproducible local development.
- Add a CI workflow for tests and builds.
- Add frontend and backend screenshots or a short demo.
- Add a deployment guide and production security checklist.

These are future enhancements, not claims about features already implemented.

## Learning Philosophy

This project follows a practical learning loop:

1. Build a working feature.
2. Trace the request from React to the database and back.
3. Identify the responsibility of each layer.
4. Test success cases and failure cases.
5. Investigate the root cause of errors.
6. Explain the design decision and its trade-offs.
7. Record the lesson for future revision.

The goal is not just to memorize Spring Boot annotations or JWT terminology. It is to understand the system well enough to design, debug, explain, and extend it independently.

---

**Project status:** Learning project. Review the code, configuration, and tests before describing it as production-ready.

**Maintainer:** Anshu Kumar

**Repository:** https://github.com/YOUR_USERNAME/secure-auth-fullstack
