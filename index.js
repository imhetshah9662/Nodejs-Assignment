import express from 'express';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';
import cors from 'cors';
import path from 'path';
import authRoutes from './routes/authRoutes.js';
import seatRoutes from './routes/seatRoutes.js';
import authMiddleware from './middleware/authMiddleware.js';

dotenv.config();
const app = express();
const corsOptions = {
    origin: "http://localhost:3000", // frontend URL
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"]
  };
  app.use(cors(corsOptions));

// Middleware
//app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(process.cwd(), 'public')));

// Routes
app.use('/auth', authRoutes);
app.use('/seats', authMiddleware, seatRoutes);

// Server port
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
