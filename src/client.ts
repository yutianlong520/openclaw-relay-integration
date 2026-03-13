/**
 * RelayClient - 中转服务器客户端
 * 
 * 负责：
 * 1. 与中转服务器建立 WebSocket 连接
 * 2. 处理认证
 * 3. 发送和接收消息
 * 4. 心跳保活
 * 5. 自动重连
 */

import WebSocket from 'ws';
import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import { Logger } from '../utils/logger';

export interface ClientConfig {
  serverUrl: string;
  apiKey: string;
  deviceId: string;
  deviceName: string;
}

export interface RelayMessage {
  type: string;
  payload: any;
  timestamp: number;
}

export class RelayClient extends EventEmitter {
  private config: ClientConfig;
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectDelay = 1000;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private messageHandlers: Map<string, (payload: any) => void> = new Map();
  private logger: Logger;
  
  // 连接状态
  private _isConnected = false;
  private _connectionId: string | null = null;
  
  constructor(config: ClientConfig) {
    super();
    this.config = config;
    this.logger = new Logger('RelayClient');
  }
  
  /**
   * 是否已连接
   */
  get isConnected(): boolean {
    return this._isConnected;
  }
  
  /**
   * 获取连接 ID
   */
  get connectionId(): string | null {
    return this._connectionId;
  }
  
  /**
   * 连接到中转服务器
   */
  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.logger.info(`正在连接到 ${this.config.serverUrl}...`);
      
      try {
        this.ws = new WebSocket(this.config.serverUrl);
      } catch (error) {
        this.logger.error('创建 WebSocket 失败:', error);
        this.scheduleReconnect();
        reject(error);
        return;
      }
      
      this.ws.on('open', () => {
        this.logger.info('WebSocket 连接已建立');
        this._isConnected = true;
        this.reconnectAttempts = 0;
        
        // 发送认证请求
        this.sendAuthRequest();
        
        // 启动心跳
        this.startHeartbeat();
        
        // 触发连接事件
        this.emit('connected');
        resolve();
      });
      
      this.ws.on('message', (data) => {
        try {
          const message: RelayMessage = JSON.parse(data.toString());
          this.handleMessage(message);
        } catch (error) {
          this.logger.error('解析消息失败:', error);
        }
      });
      
      this.ws.on('close', (code, reason) => {
        this._isConnected = false;
        this._connectionId = null;
        this.stopHeartbeat();
        
        const reasonStr = reason.toString() || `code: ${code}`;
        this.logger.warn(`WebSocket 关闭: ${reasonStr}`);
        
        this.emit('disconnected', reasonStr);
        this.scheduleReconnect();
      });
      
      this.ws.on('error', (error) => {
        this.logger.error('WebSocket 错误:', error);
        this.emit('error', error.message);
      });
    });
  }
  
  /**
   * 断开连接
   */
  async disconnect(): Promise<void> {
    this.stopHeartbeat();
    
    if (this.ws) {
      this.ws.close(1000, '客户端主动断开');
      this.ws = null;
    }
    
    this._isConnected = false;
    this._connectionId = null;
  }
  
  /**
   * 发送认证请求
   */
  private sendAuthRequest(): void {
    const authRequest: RelayMessage = {
      type: 'auth_request',
      payload: {
        key: this.config.apiKey,
        deviceId: this.config.deviceId,
        clientType: 'claw',
        deviceInfo: {
          name: this.config.deviceName,
          platform: 'OpenClaw Plugin',
          version: '1.0.0'
        }
      },
      timestamp: Date.now()
    };
    
    this.send(authRequest);
    this.logger.info('已发送认证请求');
  }
  
  /**
   * 处理接收到的消息
   */
  private handleMessage(message: RelayMessage): void {
    const { type, payload } = message;
    
    this.logger.debug(`收到消息: ${type}`, payload);
    
    // 触发通用消息事件
    this.emit('message', message);
    
    // 触发特定类型事件
    this.emit(type, payload);
    
    // 调用注册的消息处理器
    const handler = this.messageHandlers.get(type);
    if (handler) {
      handler(payload);
    }
    
    // 处理认证响应
    if (type === 'auth_response' && payload.success) {
      this._connectionId = payload.connectionId;
    }
  }
  
  /**
   * 发送消息
   */
  send(message: RelayMessage): boolean {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      this.logger.warn('WebSocket 未连接，无法发送消息');
      return false;
    }
    
    try {
      this.ws.send(JSON.stringify(message));
      return true;
    } catch (error) {
      this.logger.error('发送消息失败:', error);
      return false;
    }
  }
  
  /**
   * 发送聊天消息
   */
  sendChatMessage(content: string, targetDeviceId?: string): boolean {
    const message: RelayMessage = {
      type: 'chat_message',
      payload: {
        messageId: uuidv4(),
        content,
        type: 'text',
        metadata: {
          targetDeviceId
        }
      },
      timestamp: Date.now()
    };
    
    return this.send(message);
  }
  
  /**
   * 发送命令
   */
  sendCommand(command: string, args: any = {}): boolean {
    const message: RelayMessage = {
      type: 'command',
      payload: {
        command,
        args,
        fromDeviceId: this.config.deviceId
      },
      timestamp: Date.now()
    };
    
    return this.send(message);
  }
  
  /**
   * 注册消息处理器
   */
  onMessage(type: string, handler: (payload: any) => void): void {
    this.messageHandlers.set(type, handler);
  }
  
  /**
   * 移除消息处理器
   */
  offMessage(type: string): void {
    this.messageHandlers.delete(type);
  }
  
  /**
   * 启动心跳
   */
  private startHeartbeat(): void {
    this.stopHeartbeat();
    
    // 每 30 秒发送一次心跳
    this.heartbeatInterval = setInterval(() => {
      this.sendHeartbeat();
    }, 30000);
    
    this.logger.debug('心跳已启动');
  }
  
  /**
   * 停止心跳
   */
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
      this.logger.debug('心跳已停止');
    }
  }
  
  /**
   * 发送心跳
   */
  private sendHeartbeat(): void {
    const ping: RelayMessage = {
      type: 'ping',
      payload: {
        timestamp: Date.now()
      },
      timestamp: Date.now()
    };
    
    this.send(ping);
    this.logger.debug('已发送心跳');
  }
  
  /**
   * 安排重连
   */
  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.logger.error('已达到最大重连次数，停止重连');
      this.emit('error', '最大重连次数已超出');
      return;
    }
    
    this.reconnectAttempts++;
    const delay = Math.min(this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1), 60000);
    
    this.logger.info(`${delay / 1000} 秒后尝试重连 (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
    
    setTimeout(() => {
      this.connect().catch((error) => {
        this.logger.error('重连失败:', error);
      });
    }, delay);
  }
}
