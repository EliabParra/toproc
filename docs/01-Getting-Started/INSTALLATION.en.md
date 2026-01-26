# Installation

Follow these steps to set up your development environment.

## 1. Prerequisites

Before starting, make sure you have installed:

1.  **Node.js** (Version 20 or higher)
    - [Download Node.js](https://nodejs.org/)
    - Verify with: `node -v`

2.  **PostgreSQL** (Version 14 or higher)
    - [Download PostgreSQL](https://www.postgresql.org/download/)
    - Make sure you have your credentials (user/password) handy.

3.  **Git**
    - [Download Git](https://git-scm.com/)

## 2. Clone the Repository

Open your terminal and run:

```bash
git clone <repo-url>
cd nodejs-backend-architecture
```

## 3. Install Dependencies

This project uses `npm` to manage dependencies.

```bash
npm install
```

> **Note**: If you see vulnerability warnings, you can run `npm audit fix`, but be careful not to break versions.

## Next Step

Once everything is installed, proceed to configure [Environment Variables](ENVIRONMENT.en.md).
