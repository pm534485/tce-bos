import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import dns from 'dns';
import authRoutes from './routes/auth.js';
import masterRoutes from './routes/master.js';
import courseRoutes from './routes/courses.js';
import programmeRoutes from './routes/programmes.js';
dotenv.config();
// Ensure SRV DNS resolution works properly on Windows environments
try {
    const currentServers = dns.getServers();
    if (!currentServers.length || currentServers.includes('127.0.0.1')) {
        dns.setServers(['8.8.8.8', '1.1.1.1']);
    }
}
catch {
    // Ignore DNS fallback error
}
const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/syllabusforge';
function getConnectOptions(uri) {
    const withoutProto = uri.split('://')[1] || '';
    const pathPart = withoutProto.split('?')[0];
    const slashIdx = pathPart.indexOf('/');
    const db = slashIdx !== -1 ? pathPart.substring(slashIdx + 1) : '';
    return db ? {} : { dbName: 'syllabusforge' };
}
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
async function startServer() {
    const primaryUri = MONGO_URI;
    const fallbackUri = 'mongodb://localhost:27017/syllabusforge';
    try {
        console.log(`Attempting connection to MongoDB at ${primaryUri}...`);
        await mongoose.connect(primaryUri, getConnectOptions(primaryUri));
        console.log(`Connected to primary MongoDB (${mongoose.connection.name}) at ${primaryUri}`);
    }
    catch (primaryErr) {
        console.error(`Primary MongoDB connection failed (${primaryErr.message}).`);
        if (primaryUri !== fallbackUri) {
            console.warn(`[RECOVERY] Attempting fallback to local MongoDB at ${fallbackUri}...`);
            try {
                await mongoose.connect(fallbackUri, getConnectOptions(fallbackUri));
                console.log(`[SUCCESS] Connected to fallback local MongoDB (${mongoose.connection.name}) at ${fallbackUri}`);
            }
            catch (fallbackErr) {
                console.error(`[FATAL] Both primary and fallback MongoDB connections failed: ${fallbackErr.message}`);
                process.exit(1);
            }
        }
        else {
            process.exit(1);
        }
    }
    app.listen(PORT, () => {
        console.log(`SyllabusForge API Server listening on http://localhost:${PORT}`);
    });
}
startServer();
export default app;
// Trigger reload for Atlas connection - 2026-10-13
