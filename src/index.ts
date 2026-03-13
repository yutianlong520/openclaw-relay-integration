/**
 * OpenClaw 中转插件入口
 * 
 * 功能：
 * 1. 通过 WebSocket 连接到中转服务器
 * 2. 接收手机 App 发送的消息
 * 3. 将消息转发给本地 OpenClaw
 * 4. 将本地 OpenClaw 的响应发送回手机 App
 */

import { RelayClient } from './client';
import { Logger } from './utils/logger';
import * as dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

const logger = new Logger('Main');

/**
 * 插件配置
 */
interface PluginConfig {
  // 中转服务器地址
  serverUrl: string;
  // API Key（用于连接中转服务器）
  apiKey: string;
  // 设备 ID
  deviceId: string;
  // 设备名称
  deviceName: string;
}

/**
 * 获取插件配置
 */
function getConfig(): PluginConfig {
  return {
    serverUrl: process.env.RELAY_SERVER_URL || 'ws://localhost:8080',
    apiKey: process.env.API_KEY || '',
    deviceId: process.env.DEVICE_ID || `claw-${Date.now()}`,
    deviceName: process.env.DEVICE_NAME || 'OpenClaw 本地设备'
  };
}

/**
 * 主函数
 */
async function main() {
  const config = getConfig();
  
  // 验证配置
  if (!config.apiKey) {
    logger.error('请在 .env 文件中配置 API_KEY');
    process.exit(1);
  }
  
  logger.info('='.repeat(50));
  logger.info('OpenClaw 中转插件启动中...');
  logger.info(`服务器地址: ${config.serverUrl}`);
  logger.info(`设备ID: ${config.deviceId}`);
  logger.info('='.repeat(50));
  
  // 创建 RelayClient 实例
  const client = new RelayClient(config);
  
  // 监听连接事件
  client.on('connected', () => {
    logger.info('✅ 已连接到中转服务器');
  });
  
  client.on('disconnected', (reason) => {
    logger.warn(`⚠️ 与中转服务器断开: ${reason}`);
  });
  
  client.on('error', (error) => {
    logger.error(`❌ 错误: ${error}`);
  });
  
  // 监听消息事件
  client.on('message', (message) => {
    logger.info(`📥 收到消息: ${JSON.stringify(message)}`);
    
    // TODO: 在这里处理消息，转发给本地 OpenClaw
    handleIncomingMessage(message);
  });
  
  // 监听认证响应
  client.on('auth_response', (response) => {
    if (response.success) {
      logger.info('✅ 认证成功');
    } else {
      logger.error(`❌ 认证失败: ${response.message}`);
    }
  });
  
  // 启动客户端
  await client.connect();
  
  // 优雅退出
  const shutdown = async () => {
    logger.info('正在关闭插件...');
    await client.disconnect();
    process.exit(0);
  };
  
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

/**
 * 处理接收到的消息
 * 
 * TODO: 这里需要实现与本地 OpenClaw 的集成
 * 可以通过以下方式：
 * 1. IPC 通信（如果 OpenClaw 支持）
 * 2. HTTP API 调用
 * 3. 命令行执行
 */
function handleIncomingMessage(message: any) {
  const { type, payload } = message;
  
  switch (type) {
    case 'chat_message':
      // 处理聊天消息
      handleChatMessage(payload);
      break;
      
    case 'command':
      // 处理命令
      handleCommand(payload);
      break;
      
    default:
      Logger.get('MessageHandler').warn(`未知消息类型: ${type}`);
  }
}

/**
 * 处理聊天消息
 */
function handleChatMessage(payload: any) {
  const { content, fromDeviceId, messageId } = payload;
  const logger = Logger.get('ChatHandler');
  
  logger.info(`收到来自 ${fromDeviceId} 的消息: ${content}`);
  
  // TODO: 将消息发送给本地 OpenClaw 处理
  // 这里是一个占位实现
  const response = {
    messageId: `resp-${Date.now()}`,
    content: `收到消息: ${content}`,
    type: 'text'
  };
  
  // 发送响应（如果需要）
  // client.sendMessage(response);
}

/**
 * 处理命令
 */
function handleCommand(payload: any) {
  const logger = Logger.get('CommandHandler');
  const { command, args } = payload;
  
  logger.info(`执行命令: ${command}`, { args });
  
  // TODO: 实现命令执行逻辑
}

// 启动插件
main().catch((error) => {
  logger.error('插件启动失败:', error);
  process.exit(1);
});
