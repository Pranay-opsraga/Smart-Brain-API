import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import bcrypt from "bcryptjs";
import knex from 'knex';

const db = knex({
    client: 'pg',
    connection: {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT || 5432,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    }
});

// ─── App Setup ──────────────────────────────────────────────
const app = express();
const PORT = process.env.PORT || 3001;

// ─── Middleware ─────────────────────────────────────────────
app.use(helmet());                         // Security headers
app.use(cors());                           // Cross-origin requests
app.use(morgan("dev"));                    // Request logging
app.use(express.json({ limit: "1mb" }));   // JSON body parser with size limit

// ─── Routes ─────────────────────────────────────────────────

// Health check
app.get("/", async (_req, res) => {
    try {
        const [{ count }] = await db('users').count('id as count');
        res.json({ status: "ok", usersCount: Number(count) });
    } catch (err) {
        console.error("Health check error:", err);
        res.status(500).json({ success: false, message: "Database error" });
    }
});

// GET all users (development only)
app.get("/users", async (_req, res) => {
    try {
        const users = await db('users').select('id', 'name', 'email', 'entries', 'joined');
        res.json(users);
    } catch (err) {
        console.error("Get users error:", err);
        res.status(500).json({ success: false, message: "Database error" });
    }
});

// GET /profile/:id
app.get("/profile/:id", async (req, res) => {
    const { id } = req.params;
    try {
        const user = await db('users')
            .select('id', 'name', 'email', 'entries', 'joined')
            .where({ id: Number(id) })
            .first();

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        return res.json({ success: true, user });
    } catch (err) {
        console.error("Profile error:", err);
        return res.status(500).json({ success: false, message: "Database error" });
    }
});

// POST /signin
app.post("/signin", async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ success: false, message: "Email and password are required" });
    }

    try {
        // Password is stored in the login table, not the users table
        const loginData = await db('login').where({ email }).first();

        if (!loginData) {
            return res.status(401).json({ success: false, message: "Invalid email or password" });
        }

        const isPasswordValid = bcrypt.compareSync(password, loginData.hash);
        if (!isPasswordValid) {
            return res.status(401).json({ success: false, message: "Invalid email or password" });
        }

        // Get user profile (no password column in users table)
        const user = await db('users').where({ email }).first();
        return res.json({ success: true, user });
    } catch (err) {
        console.error("Signin error:", err);
        return res.status(500).json({ success: false, message: "Database error" });
    }
});

// POST /signup
app.post("/signup", async (req, res) => {
    const { email, password, name } = req.body;

    if (!email || !password) {
        return res.status(400).json({ success: false, message: "Email and password are required" });
    }

    try {
        const existingUser = await db('users').where({ email }).first();
        if (existingUser) {
            return res.status(409).json({ success: false, message: "Account already exists" });
        }

        const salt = bcrypt.genSaltSync(10);
        const hashedPassword = bcrypt.hashSync(password, salt);

        // Use a transaction so both inserts succeed or both fail together
        const newUser = await db.transaction(async trx => {
            // 1. Insert into users table (no password here)
            const [user] = await trx('users')
                .insert({
                    name: name || "",
                    email,
                    entries: 0,
                    joined: new Date(),
                })
                .returning(['id', 'name', 'email', 'entries', 'joined']);

            // 2. Insert hashed password into login table
            await trx('login').insert({ email, hash: hashedPassword });

            return user;
        });

        return res.status(201).json({ success: true, user: newUser });
    } catch (err) {
        console.error("Signup error:", err);
        return res.status(500).json({ success: false, message: "Database error" });
    }
});

// PUT /image — Increment face detection entries
app.put("/image", async (req, res) => {
    const { id } = req.body;

    if (!id) {
        return res.status(400).json({ success: false, message: "User id is required" });
    }

    try {
        const [updated] = await db('users')
            .where({ id: Number(id) })
            .increment('entries', 1)
            .returning('entries');

        if (!updated) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        return res.json({ success: true, entries: updated.entries });
    } catch (err) {
        console.error("Image update error:", err);
        return res.status(500).json({ success: false, message: "Database error" });
    }
});

// ─── 404 Handler ────────────────────────────────────────────
app.use((_req, res) => {
    res.status(404).json({ success: false, message: "Route not found" });
});

// ─── Global Error Handler ───────────────────────────────────
app.use((err, _req, res, _next) => {
    console.error("❌ Unhandled Error:", err.stack);
    res.status(500).json({ success: false, message: "Internal server error" });
});

// ─── Start Server ───────────────────────────────────────────
const server = app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});

// ─── Graceful Shutdown ──────────────────────────────────────
const shutdown = (signal) => {
    console.log(`\n🛑 ${signal} received. Shutting down gracefully...`);
    server.close(async () => {
        await db.destroy();
        console.log("✅ Server closed.");
        process.exit(0);
    });
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
