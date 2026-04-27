import express from 'express';
import http from 'http';
import cors from 'cors';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';

// Load environment config
dotenv.config({ path: '../.env' });

const app = express();
const server = http.createServer(app);

// Configure Socket.IO
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(morgan('dev'));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // limit each IP to 500 requests per windowMs
});
app.use(limiter);

// API routes
import apiRoutes from './routes/api.js';
import csvRoutes from './routes/csvAnalysis.js';
import chatRoutes from './routes/chat.js';
import autofixRoutes from './routes/autofix.js';
import insightsRoutes from './routes/insights.js';
import bigqueryRoutes from './routes/bigquery.js';
import voiceRoutes from './routes/voice.js';

app.use('/api', apiRoutes);
app.use('/api', csvRoutes);
app.use('/api', chatRoutes);
app.use('/api', autofixRoutes);
app.use('/api', insightsRoutes);
app.use('/api', bigqueryRoutes);
app.use('/api', voiceRoutes);

// Socket.io Connection Logic
io.on('connection', (socket) => {
  console.log('Client connected to Socket.IO UI:', socket.id);

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Pass io to routes if needed
app.set('io', io);

// GCP Service imports (initializes connections on startup)
import { firestoreService } from './services/firestoreService.js';
import { bigqueryService } from './services/bigqueryService.js';
import { pubsubService } from './services/pubsubService.js';

// Default Route
app.get('/', (req, res) => {
  res.send('FairAI Guardian API is running.');
});

// API Root Route — provides status instead of 'Cannot GET /api'
app.get('/api', (req, res) => {
  res.json({
    status: 'online',
    message: 'FairAI Guardian API is active. Use /api/health for system status.',
    version: '2.5.0'
  });
});

// GCP Health Check — shows real connection status of all services
app.get('/api/health', (req, res) => {
  res.json({
    status: 'running',
    project: process.env.GCP_PROJECT_ID || 'fairai-494213-f8',
    services: {
      firestore: { connected: firestoreService.isConnected() },
      bigquery: { connected: bigqueryService.isConnected() },
      pubsub: { connected: pubsubService.isConnected() },
      vertexAI: { configured: true, project: process.env.VERTEX_PROJECT_ID || 'fairai-494213-f8' },
    },
    timestamp: new Date().toISOString(),
  });
});

// Start Server
const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`FairAI Guardian server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});
