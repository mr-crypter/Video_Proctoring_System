import express from "express";
import cors from "cors";
import candidateRoutes from "./routes/candidateRoutes.js";
import { connectToDatabase } from "./config/db.js";


const app = express();

// Trust reverse proxies (Railway, etc.)
app.set('trust proxy', 1);

// CORS configuration (allow configured origins; allow Range for video streaming)
const allowedOrigins = (process.env.CORS_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
const corsOptions = {
  origin: function(origin, callback) {
    if (!origin) return callback(null, true); // same-origin/non-browser
    if (allowedOrigins.length === 0 || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Range'],
  exposedHeaders: ['Content-Range', 'Content-Length', 'Accept-Ranges', 'Content-Disposition'],
  credentials: true,
};

// Express 5: rely on cors middleware only (no app.options route)
app.use(cors(corsOptions));
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Initialize database connection
connectToDatabase();

// Routes
app.use("/api", candidateRoutes);

// Health endpoint
app.get('/healthz', (_req, res) => {
  res.send({ ok: true });
});

export default app;


