# 🧠 Smart Brain API

> A RESTful backend API for the **Smart Brain** face detection application — built with Node.js, Express, and PostgreSQL.

[![Node.js](https://img.shields.io/badge/Node.js-v20%2B-339933?style=flat&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-v5-000000?style=flat&logo=express&logoColor=white)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-v14%2B-4169E1?style=flat&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)

---

## 📋 Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Database Schema](#database-schema)
- [API Reference](#api-reference)
- [Project Structure](#project-structure)
- [Scripts](#scripts)
- [Related](#related)

---

## Overview

Smart Brain API is the backend server powering the [Smart Brain](https://github.com/Pranay-opsraga/Smart-Brain) face detection web app. It handles:

- User **authentication** (sign in / sign up) with bcrypt password hashing
- User **profile management**
- **Entry tracking** — counts how many images a user has submitted for face detection
- Secure connections via Helmet, CORS, and environment-based configuration

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js (ES Modules) |
| Framework | Express.js v5 |
| Database | PostgreSQL |
| Query Builder | Knex.js |
| Auth / Security | bcryptjs, Helmet, CORS |
| Logging | Morgan |
| Config | dotenv |

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v20.6 or higher
- [PostgreSQL](https://www.postgresql.org/) running locally or remotely

### 1. Clone the repository

```bash
git clone https://github.com/Pranay-opsraga/Smart-Brain-API.git
cd Smart-Brain-API
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

```bash
cp .env.example .env
```

Edit `.env` with your PostgreSQL credentials (see [Environment Variables](#environment-variables)).

### 4. Set up the database

Create the required tables in your PostgreSQL database (see [Database Schema](#database-schema)).

### 5. Start the server

```bash
# Development (with auto-restart)
npm run dev

# Production
npm start
```

The server will run at `http://localhost:3001`

---

## Environment Variables

Create a `.env` file in the root directory. **Never commit this file.**

```env
DB_HOST=127.0.0.1
DB_USER=your_postgres_username
DB_PASSWORD=your_postgres_password
DB_NAME=your_database_name
PORT=3001
```

An `.env.example` template is provided for reference.

---

## Database Schema

Run the following SQL to create the required tables:

```sql
CREATE TABLE users (
    id      SERIAL PRIMARY KEY,
    name    VARCHAR(100),
    email   VARCHAR(150) UNIQUE NOT NULL,
    entries BIGINT DEFAULT 0,
    joined  TIMESTAMP NOT NULL
);

CREATE TABLE login (
    id    SERIAL PRIMARY KEY,
    email VARCHAR(150) UNIQUE NOT NULL REFERENCES users(email),
    hash  VARCHAR(100) NOT NULL
);
```

---

## API Reference

### Health Check

```
GET /
```

Returns server status and total registered user count.

**Response**
```json
{ "status": "ok", "usersCount": 42 }
```

---

### Get User Profile

```
GET /profile/:id
```

**Parameters**

| Name | Type | Description |
|---|---|---|
| `id` | `integer` | User ID |

**Response `200`**
```json
{
  "success": true,
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "entries": 10,
    "joined": "2024-01-01T00:00:00.000Z"
  }
}
```

---

### Sign In

```
POST /signin
```

**Request Body**

```json
{
  "email": "john@example.com",
  "password": "yourpassword"
}
```

**Response `200`**
```json
{
  "success": true,
  "user": { "id": 1, "name": "John Doe", "email": "john@example.com", "entries": 10, "joined": "..." }
}
```

---

### Sign Up

```
POST /signup
```

**Request Body**

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "yourpassword"
}
```

**Response `201`**
```json
{
  "success": true,
  "user": { "id": 1, "name": "John Doe", "email": "john@example.com", "entries": 0, "joined": "..." }
}
```

---

### Update Image Entry Count

```
PUT /image
```

Increments the face detection entry count for a user by 1.

**Request Body**

```json
{ "id": 1 }
```

**Response `200`**
```json
{ "success": true, "entries": 11 }
```

---

## Project Structure

```
Smart-Brain-API/
├── server.js         # Main application — routes, middleware, DB connection
├── package.json      # Project metadata and scripts
├── package-lock.json # Locked dependency versions
├── .env              # Environment variables (not committed)
├── .env.example      # Environment variable template
└── .gitignore        # Git ignore rules
```

---

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Kills any process on port 3001, then starts server with auto-restart |
| `npm start` | Start the server in production mode (no auto-restart) |

---

## Related

- 🖥️ **Frontend**: [Smart-Brain](https://github.com/Pranay-opsraga/Smart-Brain) — React app with Clarifai face detection

---

> Built by [Pranay Sharma](https://github.com/Pranay-opsraga)
