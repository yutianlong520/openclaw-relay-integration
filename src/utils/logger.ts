/**
 * Logger - 日志工具
 * 
 * 使用 Winston 实现，支持：
 * - 多级别日志
 * - 不同分类日志
 * - 控制台输出
 */

import winston from 'winston';
import path from 'path';

// 日志格式
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let metaStr = '';
    if (Object.keys(meta).length > 0) {
      metaStr = ' ' + JSON.stringify(meta);
    }
    return `${timestamp} [${level}] ${message}${metaStr}`;
  })
);

// 创建日志实例的缓存
const loggers: Map<string, winston.Logger> = new Map();

/**
 * 创建或获取日志实例
 */
export class Logger {
  private logger: winston.Logger;
  private category: string;
  
  constructor(category: string = 'App') {
    this.category = category;
    
    // 检查是否已存在
    if (loggers.has(category)) {
      this.logger = loggers.get(category)!;
      return;
    }
    
    // 创建新的日志实例
    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: logFormat,
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            logFormat
          )
        })
      ]
    });
    
    // 添加文件日志（可选）
    if (process.env.LOG_FILE) {
      this.logger.add(new winston.transports.File({
        filename: process.env.LOG_FILE,
        format: logFormat
      }));
    }
    
    loggers.set(category, this.logger);
  }
  
  /**
   * 获取指定分类的日志实例
   */
  static get(category: string): Logger {
    return new Logger(category);
  }
  
  /**
   * 调试日志
   */
  debug(message: string, ...meta: any[]): void {
    this.logger.debug(this.formatMessage(message), ...meta);
  }
  
  /**
   * 信息日志
   */
  info(message: string, ...meta: any[]): void {
    this.logger.info(this.formatMessage(message), ...meta);
  }
  
  /**
   * 警告日志
   */
  warn(message: string, ...meta: any[]): void {
    this.logger.warn(this.formatMessage(message), ...meta);
  }
  
  /**
   * 错误日志
   */
  error(message: string, ...meta: any[]): void {
    this.logger.error(this.formatMessage(message), ...meta);
  }
  
  /**
   * 格式化消息，添加分类前缀
   */
  private formatMessage(message: string): string {
    return `[${this.category}] ${message}`;
  }
}
