import { Injectable, OnModuleDestroy, OnModuleInit, Logger } from '@nestjs/common';
import { Server as HttpServer } from 'http';
import { Server as SocketIoServer, Socket } from 'socket.io';
import { spawn, execSync } from 'child_process';
import * as os from 'os';
import * as process from 'process';
import * as path from 'path';
import osu from 'os-utils';
import { DynamoDBService } from '../dynamodb/dynamodb.service';
import { AuthService } from '../auth/auth.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('WebSocket')
@Injectable()
export class WebsocketService implements OnModuleInit, OnModuleDestroy {
  private io: SocketIoServer | null = null;
  private readonly logger = new Logger(WebsocketService.name);

  constructor(
  private readonly authService: AuthService,
  private readonly dynamoDBService: DynamoDBService,
) {}

   @ApiOperation({ summary: 'Initialize WebSocket server' })
  @ApiResponse({ status: 200, description: 'WebSocket server initialized successfully' })
  async onModuleInit() {
    this.logger.log('WebSocketService initialized.');
  }

  @ApiOperation({ summary: 'Shutdown WebSocket server' })
  @ApiResponse({ status: 200, description: 'WebSocket server shut down successfully' })
  async onModuleDestroy() {
    this.logger.log('WebSocketService shutting down.');
    if (this.io) {
      this.io.close();
    }
  }
   @ApiOperation({ summary: 'Start WebSocket server' })
  initialize(server: HttpServer) {
    this.io = new SocketIoServer(server, {
      cors: {
        origin: ['http://localhost:3000', 'https://board-dynamodb.duckdns.org'],
        methods: ['GET', 'POST'],
        credentials: true,
        allowedHeaders: ['Content-Type', 'Authorization'],
      },
    });

    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth?.token;
        if (!token) throw new Error('No token provided');

        const user = await this.authService.validateToken(token);
        if (!user) throw new Error('Unauthorized');

        (socket as any).user = user; // Attach user to socket for later use
        next();
      } catch (error) {
        this.logger.error('Authentication error:', error.message);
        next(new Error('Authentication error'));
      }
    });

    this.io.on('connection', async (socket: Socket) => {
      this.logger.log(`Client connected: ${socket.id}`);
      let currentPath = process.cwd();

      socket.emit('systemInfo', { ...this.getSystemDetails(), path: currentPath });
      socket.emit('storedCommands', await this.dynamoDBService.getStoredCommands());


      socket.removeAllListeners('command');
      socket.on('command', async (message: string) => {
        await this.handleCommand(socket, message, currentPath);
      });

      const statsInterval = setInterval(async () => {
        socket.emit('systemStats', await this.getSystemStats());
      }, 1000);

      socket.on('disconnect', () => {
        this.logger.log(`Client disconnected: ${socket.id}`);
        clearInterval(statsInterval);
      });
    });
  }

  private async handleCommand(socket: Socket, message: string, currentPath: string) {
    const command = message.trim();
    const [cmd, ...args] = command.split(' ');

    if (cmd === 'cd') {
      try {
        process.chdir(path.resolve(currentPath, args.join(' ')));
        currentPath = process.cwd();
        socket.emit('systemInfo', { ...this.getSystemDetails(), path: currentPath });
      } catch (error) {
        socket.emit('error', `Error changing directory: ${error.message}`);
      }
      return;
    }

    try {
      await this.dynamoDBService.storeCommand(command);
      const localProcess = spawn(cmd, args, { shell: true, cwd: currentPath });

      localProcess.stdout.on('data', (data) => socket.emit('output', data.toString()));
      localProcess.stderr.on('data', (data) => socket.emit('output', data.toString()));

      localProcess.on('close', async () => {
        //this.io?.emit('storedCommands', await getStoredCommands());
        this.io?.emit('storedCommands', await this.dynamoDBService.getStoredCommands());
      });
    } catch (error) {
      socket.emit('error', `Command execution failed: ${error.message}`);
    }
  }

  private getSystemStats() {
    return new Promise((resolve) => {
      osu.cpuUsage((cpuPercent) => {
        const freeMem = os.freemem();
        const totalMem = os.totalmem();
        const memUsedPercent = ((totalMem - freeMem) / totalMem) * 100;
        const load = os.loadavg();

        resolve({
          cpuUsage: `${(cpuPercent * 100).toFixed(2)}%`,
          memoryUsage: `${memUsedPercent.toFixed(2)}%`,
          loadAvg: {
            '1m': load[0].toFixed(2),
            '5m': load[1].toFixed(2),
            '15m': load[2].toFixed(2),
          },
        });
      });
    });
  }

  private getSystemDetails() {
    return {
      operatingSystem: os.type(),
      totalMemory: `${(os.totalmem() / 1e9).toFixed(2)} GB`,
      freeMemory: `${(os.freemem() / 1e9).toFixed(2)} GB`,
      cpuCount: os.cpus().length,
      privateIP: this.getPrivateIP(),
      publicIP: this.getPublicIP(),
      host: os.hostname(),
      user: os.userInfo().username,
    };
  }

  private getPrivateIP(): string {
    const interfaces = os.networkInterfaces();
    for (const iface of Object.values(interfaces)) {
      for (const config of iface || []) {
        if (config.family === 'IPv4' && !config.internal) return config.address;
      }
    }
    return 'Unknown';
  }

  private getPublicIP(): string {
    try {
      return execSync('curl -s https://checkip.amazonaws.com').toString().trim();
    } catch (error) {
      return 'Unknown';
    }
  }

  getWebSocketServer(): SocketIoServer | null {
    if (!this.io) {
      this.logger.warn('WebSocket server is not initialized yet.');
    }
    return this.io;
  }
}

