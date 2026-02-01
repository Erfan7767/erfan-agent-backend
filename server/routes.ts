import type { Express } from "express";
import { createServer, type Server } from "http";
import { createProxyMiddleware } from 'http-proxy-middleware';
import { spawn } from 'child_process';

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Start Python Backend
  console.log('Starting Python backend on port 8000...');
  
  // We use spawn to run the python server. 
  // In a real production setup, this would be a separate service (e.g. in docker-compose or separate process).
  // For this dev environment, we run it as a child process.
  const pythonProcess = spawn('python3', ['-m', 'uvicorn', 'server.main:app', '--host', '0.0.0.0', '--port', '8000'], {
    stdio: 'inherit',
    shell: false
  });

  pythonProcess.on('error', (err) => {
    console.error('Failed to start Python backend:', err);
  });
  
  pythonProcess.on('exit', (code, signal) => {
    if (code !== 0 && signal !== 'SIGTERM') {
        console.error(`Python backend exited with code ${code} and signal ${signal}`);
    }
  });

  // Ensure python process is killed when node process exits
  process.on('exit', () => {
    pythonProcess.kill();
  });

  // Proxy WebSocket and API requests to the Python backend on port 8000
  const pythonProxy = createProxyMiddleware({
    target: 'http://127.0.0.1:8000',
    changeOrigin: true,
    ws: true,
    logLevel: 'silent' # Reduce noise
  });

  app.use('/ws', pythonProxy);
  app.use('/api', pythonProxy);

  return httpServer;
}
