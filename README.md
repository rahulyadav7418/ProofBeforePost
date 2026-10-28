# ProofBeforePost

### Evidence-first brand governance for safer content publishing

**Audit marketing copy against brand rules, review explainable findings,
and keep a record of human decisions --- before content goes live.**

[![Live
Demo](https://img.shields.io/badge/Live-Demo-0A7B83?style=for-the-badge)](https://proof-before-post-ten.vercel.app)
[![Source
Code](https://img.shields.io/badge/Source-GitHub-181717?style=for-the-badge&logo=github)](https://github.com/rahulyadav7418/ProofBeforePost)
:::

------------------------------------------------------------------------

## The problem

Marketing content can accidentally include prohibited wording or claims
that do not match a company's policies. Catching these issues manually
can be inconsistent, especially when teams need to explain who reviewed
a draft and what decision was made.

## The solution

**ProofBeforePost** is a text-first content auditing prototype that
helps a reviewer check a draft against a configurable brand rulebook
before publication. It flags configured wording violations, explains the
detected matches, and lets a human reviewer record a decision and note.

It is designed to support human review---not to publish content
automatically or replace a legal, compliance, or subject-matter expert.

## Live demo

**Try it:** https://proof-before-post-ten.vercel.app

1.  Open the **Brand Rulebook** and review the configured rules.
2.  Enter a sample draft in the audit area.
3.  Run the audit to see any detected rule violations.
4.  Review the findings and record a decision with a note.
5.  Open **Review History** to see saved review records.

### Example rulebook

The current demo includes example rules such as:

-   **Prohibited wording:** `guaranteed success`,
    `100% guaranteed results`
-   **Required phrase:** `Terms and conditions apply`
-   **Approved policy fact:**
    `Free delivery is available only on orders above ₹399.`

These are demonstration rules, not universal legal or business
requirements.

## Features implemented

-   **Brand Rulebook** --- view the rules currently configured for the
    demo.
-   **Pre-publication text audit** --- scan draft text for supported
    rule matches.
-   **Explainable findings** --- show the detected wording and the
    relevant rule.
-   **Human review workflow** --- record a review decision and reviewer
    note.
-   **Review history** --- retrieve saved review decisions from the
    backend.
-   **Deployed full-stack demo** --- React frontend with an Express API
    and MongoDB persistence.

## How it works

``` text
Draft content
     |
     v
Run configured text checks
     |
     v
Review detected findings
     |
     v
Human reviewer records decision + note
     |
     v
Decision saved and visible in review history
```

The current checks are deterministic and depend on the rules implemented
in the application. A finding is a review signal, not a definitive legal
conclusion.

## Technology stack

  Layer              Technology
  ------------------ -------------------------
  Frontend           React, Vite
  Backend            Node.js, Express
  Database           MongoDB Atlas, Mongoose
  Frontend hosting   Vercel
  Backend hosting    Render

## Architecture

-   The React/Vite client provides the rulebook, audit, review, and
    history interface.
-   The Express API handles backend requests.
-   Mongoose connects the backend to MongoDB for persisted review data.
-   The deployed frontend communicates with the deployed backend API.

## Run locally

### Prerequisites

-   Node.js and npm
-   A MongoDB connection string (for example, a MongoDB Atlas connection
    string)

### 1. Clone the repository

``` bash
git clone https://github.com/rahulyadav7418/ProofBeforePost.git
cd ProofBeforePost
```

### 2. Start the backend

``` bash
cd server
npm install
```

Create a `.env` file in the `server` directory using the variable names
expected by the backend code. At minimum, configure the MongoDB
connection string and the port if the application requires it. **Check
the server source for the exact environment-variable names; do not
commit secrets.**

Then start the server using the script defined in `server/package.json`,
for example:

``` bash
npm start
```

If `npm start` is not defined, use the development script available in
that package.

### 3. Start the frontend

Open a second terminal:

``` bash
cd client
npm install
npm run dev
```

Vite will print the local development URL in the terminal. Ensure the
frontend API base URL points to your local backend when developing
locally; the deployed build currently uses the hosted API.

> **Configuration note:** Local setup may require adjusting the frontend
> API base URL and backend environment variables to match your local
> environment.

## Current limitations

This is a working prototype, and its boundaries matter:

-   **Rule-based detection:** the audit only detects patterns and rules
    supported by the current implementation. It does not understand
    every claim or context.
-   **No guaranteed semantic fact-checking:** a statement that
    contradicts an approved policy fact may not be flagged unless a
    corresponding check is implemented.
-   **No evidence verification:** the current demo does not
    independently validate external sources, source freshness, or
    whether evidence is authoritative.
-   **No AI-based review claim:** do not treat the current audit as an
    AI-powered semantic or tone review.
-   **Human decision required:** findings need human interpretation; the
    app does not automatically publish or approve content.
-   **Prototype security:** authentication, role-based permissions, and
    a production-grade reviewer identity/audit trail are not currently
    implemented.

Use the demo with sample content. Do not rely on it as the sole control
for legal, regulatory, or high-stakes publishing decisions.

## Roadmap --- planned improvements

These are **planned**, not implemented features:

1.  **Claim-to-evidence consistency checks** --- connect claims to
    supporting evidence and highlight unsupported or conflicting
    statements.
2.  **Authentication and reviewer roles** --- introduce sign-in and
    role-based access with accountable review records.
3.  **Explainable AI-assisted review** --- explore contextual checks
    while keeping human approval in control.

## Project status

Built as a hackathon prototype to demonstrate a practical
pre-publication review workflow. The focus is on transparent rule checks
and human accountability, with more advanced evidence and governance
capabilities planned for future iterations.

## Author

**Rahul Yadav**
B.Tech CSE (AI), Dr. M.G.R. Educational and Research Institute

-   GitHub: https://github.com/rahulyadav7418
-   Project repository:
    https://github.com/rahulyadav7418/ProofBeforePost
