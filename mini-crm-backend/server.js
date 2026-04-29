import "dotenv/config.js"; // load .env before anything else
import express from "express";
import cors from "cors";
import connectDB from "./config/db.js";

// ── Route imports ─────────────────────────────────────────────────────────────
import authRoutes from "./routes/authRoutes.js";
import leadRoutes from "./routes/leadRoutes.js";
import companyRoutes from "./routes/companyRoutes.js";
import taskRoutes from "./routes/taskRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";

// ── Bootstrap ─────────────────────────────────────────────────────────────────
connectDB();

const app = express();

// ── Global Middleware ─────────────────────────────────────────────────────────
const allowedOrigins = [
  process.env.CLIENT_URL,
  "http://localhost:5173"
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("CORS blocked: " + origin));
    }
  },
  credentials: true
}));

app.options("*", cors());
app.use(express.json()); // parse JSON request bodies

// ── Health check ──────────────────────────────────────────────────────────────
app.get("/", (req, res) => res.json({ status: "Mini CRM API running 🚀" }));

// ── API Routes ────────────────────────────────────────────────────────────────
app.use("/api/auth",      authRoutes);
app.use("/api/leads",     leadRoutes);
app.use("/api/companies", companyRoutes);
app.use("/api/tasks",     taskRoutes);
app.use("/api/dashboard", dashboardRoutes);

// ── Global Error Handler ──────────────────────────────────────────────────────
// Catches any error thrown by controllers / middleware
app.use((err, req, res, next) => {
  console.error("Global error:", err.stack);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀  Server listening on port ${PORT} [${process.env.NODE_ENV}]`);
});
