import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import authRoutes from './routes/auth.js';
import masterRoutes from './routes/master.js';
import courseRoutes from './routes/courses.js';
import programmeRoutes from './routes/programmes.js';
dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/syllabusforge';
app.use(cors());
app.use(express.json({ limit: '10mb' }));
// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        service: 'SyllabusForge API',
        version: '1.0.0',
        regulation: 2026,
    });
});
// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/master', masterRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/programmes', programmeRoutes);
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientDist = path.resolve(__dirname, '../../client/dist');
if (fs.existsSync(clientDist)) {
    app.use(express.static(clientDist));
    app.get('*', (req, res, next) => {
        if (req.path.startsWith('/api'))
            return next();
        res.sendFile(path.join(clientDist, 'index.html'));
    });
}
// Connect to MongoDB and start listening
mongoose
    .connect(MONGO_URI)
    .then(() => {
    console.log(`Connected to MongoDB at ${MONGO_URI}`);
    app.listen(PORT, () => {
        console.log(`SyllabusForge API Server listening on http://localhost:${PORT}`);
    });
})
    .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
});
export default app;
// Trigger reload
