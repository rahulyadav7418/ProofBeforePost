# ProofBeforePost

### Evidence-first brand governance for safer content publishing

**Audit marketing copy against brand rules, compare claims with supporting evidence, review explainable findings, and keep a record of human decisions — before content goes live.**

[![Live Demo](https://img.shields.io/badge/Live-Demo-0A7B83?style=for-the-badge)](https://proof-before-post-ten.vercel.app)
[![Source Code](https://img.shields.io/badge/Source-GitHub-181717?style=for-the-badge\&logo=github)](https://github.com/rahulyadav7418/ProofBeforePost)

---

## The Problem

Marketing content can accidentally include prohibited wording or claims that do not match a company's policies. Catching these issues manually can be inconsistent, especially when teams need to explain who reviewed a draft, what evidence was considered, and what decision was made.

## The Solution

**ProofBeforePost** is an evidence-first content auditing platform that helps teams review marketing content against configured brand rules and available supporting evidence before publication.

It identifies configured wording violations, highlights potential claim-to-evidence matches and conflicts, and provides explanations and suggested actions.

The platform also introduces authentication, role-based permissions, evidence management, and human review workflows.

It supports human review — not automatic publishing or replacement of legal, compliance, or subject-matter experts.

## Live Demo

**Try it:** https://proof-before-post-ten.vercel.app

1. Sign in to the application.
2. Open the Brand Rulebook and review configured rules.
3. Enter sample marketing content in the audit area.
4. Run the audit to identify potential issues.
5. Examine findings and their supporting evidence.
6. Submit or review evidence according to your assigned role.
7. Record review decisions and notes.
8. Open Review History to see saved review records.

## Example Rulebook

The current demo includes example rules such as:

* **Prohibited wording:** `guaranteed success`, `100% guaranteed results`
* **Required phrase:** `Terms and conditions apply`
* **Approved policy fact:** `Free delivery is available only on orders above ₹399.`

These are demonstration rules, not universal legal or business requirements.

## Features Implemented

### 1. Brand Rulebook

* View configured brand rules.
* Restrict brand rule creation to authorized administrators.

### 2. Pre-publication Content Audit

* Scan draft text against supported brand rules.
* Identify configured wording violations.
* Display relevant findings and explanations.

### 3. Claim-to-Evidence Consistency Checks

* Compare draft claims against approved evidence records.
* Identify potential claim matches.
* Detect missing numerical conditions.
* Flag possible conflicts between draft claims and approved evidence.
* Display severity, explanations, and suggested actions.

### 4. Authentication and Role-Based Access

* User registration and login.
* Password hashing using bcrypt.
* JWT-based authentication.
* Admin, Reviewer, and Viewer roles.
* Backend-enforced permissions for protected operations.
* Admin-controlled user role management.

### 5. Evidence Management

* Submit supporting evidence.
* Track evidence review status.
* Allow authorized users to review submitted evidence.
* Approve, reject, or return evidence to pending status.

### 6. Human Review and Review History

* Review audit findings before making decisions.
* Record human review decisions.
* View saved review activity.

### 7. Deployed Full-Stack Application

* React frontend.
* Express and Node.js backend.
* MongoDB persistence.
* Frontend hosted on Vercel and backend hosted on Render.

## User Roles

| Role     | Access                                                                        |
| -------- | ----------------------------------------------------------------------------- |
| Admin    | Manage user roles, create brand rules, and access authorized review features  |
| Reviewer | Submit evidence and make review decisions                                     |
| Viewer   | View available information and run audits without modifying protected records |

Permissions are checked by the backend, not only by hiding frontend controls.

## How It Works

```text
             User Login
                 |
                 v
          Role Verification
                 |
                 v
           Draft Content
                 |
                 v
       Run Configured Checks
                 |
                 v
      Compare Available Evidence
                 |
                 v
        Display Audit Findings
                 |
                 v
       Human Reviewer Examines
                 |
                 v
       Decision + Review Note
                 |
                 v
         Saved Review History
```

The current checks are deterministic and depend on the rules and evidence comparison logic implemented in the application.

A finding is a review signal, not a definitive legal or factual conclusion.

## Technology Stack

| Layer            | Technology              |
| ---------------- | ----------------------- |
| Frontend         | React, Vite, JavaScript |
| Backend          | Node.js, Express.js     |
| Database         | MongoDB Atlas, Mongoose |
| Authentication   | JWT, bcryptjs           |
| Frontend Hosting | Vercel                  |
| Backend Hosting  | Render                  |

## Architecture

* The React/Vite client provides the authentication, rulebook, audit, evidence, review, and history interfaces.
* The Express API handles application requests and protected operations.
* JWT middleware authenticates users.
* Role-based middleware enforces permissions.
* Mongoose connects the backend to MongoDB.
* The deployed frontend communicates with the deployed backend API.

## Run Locally

### Prerequisites

* Node.js and npm
* Git
* MongoDB connection string, such as MongoDB Atlas

### 1. Clone the Repository

```bash
git clone https://github.com/rahulyadav7418/ProofBeforePost.git

cd ProofBeforePost
```

### 2. Start the Backend

```bash
cd server

npm install
```

Create a `.env` file inside the `server` directory:

```env
PORT=8080
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
ADMIN_NAME=Your Admin Name
ADMIN_EMAIL=your_admin_email
ADMIN_PASSWORD=your_admin_password
```

Start the backend:

```bash
npm run dev
```

The backend runs on:

```text
http://localhost:8080
```

### 3. Start the Frontend

Open a second terminal:

```bash
cd client

npm install

npm run dev
```

Vite will display the frontend development URL in the terminal. Usually:

```text
http://localhost:5173
```

Ensure the frontend API configuration points to your local backend when running locally.

**Important:** Never commit `.env` files, database credentials, JWT secrets, or administrative passwords to GitHub.

## Improvements After Round 2

### 1. Claim-to-Evidence Consistency Checks — Implemented

Added deterministic checks to compare draft claims against approved evidence records.

The system identifies potential matches, missing numerical conditions, and possible conflicts. Findings include explanations and suggested actions to support human review.

### 2. Authentication and Role-Based Access — Implemented

Introduced user authentication, password hashing, JWT authorization, and Admin, Reviewer, and Viewer roles.

Protected backend operations enforce role permissions. Administrative user-role management is also available.

### 3. Explainable AI-Assisted Review — Not Completed

External AI model integration was not completed during this round.

The current platform provides explainable deterministic audit findings and keeps final decisions under human control. External AI-assisted analysis remains a future enhancement.

## Testing

The application was tested in local and deployed environments.

| Test Scenario                                       | Result |
| --------------------------------------------------- | ------ |
| User login and authentication                       | Passed |
| Admin-only brand rule creation restriction          | Passed |
| Reviewer evidence submission                        | Passed |
| Viewer restriction on protected evidence submission | Passed |
| Protected API access using JWT                      | Tested |
| Approved claim matching                             | Passed |
| Conflicting numerical condition detection           | Passed |
| Missing numerical condition detection               | Passed |
| Production reviewer-role verification               | Passed |

## Current Limitations

This is a working prototype, and its boundaries matter:

* **Deterministic detection:** Audit checks depend on supported rules, keywords, and numerical conditions.
* **Limited semantic understanding:** The application does not understand every claim or context.
* **No independent source verification:** It does not independently validate external sources, source freshness, or whether evidence is authoritative.
* **No external AI model integration:** The current audit is not an LLM-powered semantic or tone review.
* **Human decision required:** Findings need human interpretation. The application does not automatically publish or approve content.
* **Prototype scope:** Further automated testing and security hardening are needed before production use in high-stakes publishing workflows.

Use the demo with sample content. Do not rely on it as the sole control for legal, regulatory, or high-stakes publishing decisions.

## Roadmap — Planned Improvements

These are future development goals, not currently implemented features:

1. **AI-assisted claim analysis:** Explore optional AI-based contextual analysis while keeping human approval in control.
2. **Improved semantic matching:** Strengthen claim-to-evidence matching beyond keyword and numerical-condition checks.
3. **Evidence-source validation:** Improve source references, traceability, and evidence freshness checks.
4. **Advanced governance reporting:** Expand audit reporting and accountability features.
5. **Automated testing:** Add broader backend and frontend test coverage.

## Project Status

ProofBeforePost was developed as a hackathon project to demonstrate a practical pre-publication brand governance workflow.

The Round 3 version extends the original rule-based auditing prototype with claim-to-evidence consistency checks, authentication, role-based permissions, and evidence review capabilities.

The platform focuses on transparent findings, accountable human decisions, and responsible content publishing.

## Author

**Rahul Yadav**

B.Tech CSE (AI)
Dr. M.G.R. Educational and Research Institute

* **GitHub:** https://github.com/rahulyadav7418
* **Project Repository:** https://github.com/rahulyadav7418/ProofBeforePost
