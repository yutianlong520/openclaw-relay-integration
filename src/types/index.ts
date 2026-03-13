/**
 * 类型定义
 */

// 插件配置
export interface PluginConfig {
  serverUrl: string;
  apiKey: string;
  deviceId: string;
  deviceName: string;
}

// 中转消息格式
export interface RelayMessage {
  type: string;
  payload: any;
  timestamp: number;
}

// 认证请求
export interface AuthRequest {
  key: string;
  deviceId: string;
  clientType: 'app' | 'claw';
  deviceInfo: DeviceInfo;
}

// 设备信息
export interface DeviceInfo {
  name: string;
  platform: string;
  version: string;
}

// 认证响应
export interface AuthResponse {
  success: boolean;
  connectionId?: string;
  userId?: string;
  token?: string;
  expiresAt?: number;
  message?: string;
}

// 聊天消息
export interface ChatMessage {
  messageId: string;
  content: string;
  type: 'text' | 'image' | 'voice';
  metadata?: Record<string, any>;
}

// 命令消息
export interface CommandMessage {
  command: string;
  args: Record<string, any>;
  fromDeviceId: string;
}

// 消息确认
export interface MessageAck {
  messageId: string;
  status: 'delivered' | 'read' | 'failed';
}

// 连接状态
export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';
