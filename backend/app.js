import express from "express";
import cors from "cors";
import candidateRoutes from "./routes/candidateRoutes.js";
import { connectToDatabase } from "./config/db.js";


const app = express();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Initialize database connection
connectToDatabase();

// Routes
app.use("/api", candidateRoutes);

export default app;


