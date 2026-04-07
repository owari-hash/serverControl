const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const apiRoutes = require("./api");
const config = require("../config");
const { fail } = require("./shared/http/response");

const app = express();

// Middleware
const configuredOrigins = (config.CORS_ORIGINS || "*")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const allowAnyOrigin = configuredOrigins.includes("*");

const corsOptions = {
  origin(origin, callback) {
    // Server-side permissive CORS to avoid frontend auth blocking.
    if (!origin || allowAnyOrigin) return callback(null, true);
    if (configuredOrigins.includes(origin)) return callback(null, true);
    return callback(null, true);
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  credentials: true,
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
app.use(cookieParser());
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ limit: "20mb", extended: true }));

// Main API Routes
app.use("/api", apiRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json(fail("Route not found"));
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("Unhandled Error:", err);
  res
    .status(500)
    .json(fail("An unexpected error occurred", err.message));
});

module.exports = app;
