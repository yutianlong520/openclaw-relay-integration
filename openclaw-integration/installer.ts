/**
 * OpenClaw 中转插件自动安装工具
 * 
 * 功能：用户只需要给 OpenClaw 发一条消息，就能自动完成插件安装
 * 
 * 使用方式：
 * 1. 用户发送："安装中转插件" 或 "安装远程控制"
 * 2. OpenClaw 调用此工具
 * 3. 自动完成：克隆 → 安装 → 配置 → 启动
 */

import { exec } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';

const execAsync = promisify(exec);

// 安装配置
interface InstallConfig {
  // 中转服务器地址
  serverUrl: string;
  // API Key
  apiKey: string;
  // 设备名称
  deviceName?: string;
  // 安装目录
  installDir?: string;
}

// 默认配置
const DEFAULT_INSTALL_DIR = path.join(process.env.HOME || process.env.USERPROFILE || '', 'openclaw-relay-plugin');
const DEFAULT_SERVER_URL = 'ws://localhost:8080';

export class RelayInstaller {
  private config: InstallConfig;
  private installDir: string;

  constructor(config: InstallConfig) {
    this.config = config;
    this.installDir = config.installDir || DEFAULT_INSTALL_DIR;
  }

  /**
   * 执行安装
   */
  async install(): Promise<{ success: boolean; message: string; details?: any }> {
    try {
      // 1. 检查环境
      await this.checkEnvironment();

      // 2. 克隆项目
      await this.cloneProject();

      // 3. 安装依赖
      await this.installDependencies();

      // 4. 配置
      await this.configure();

      // 5. 构建
      await this.build();

      // 6. 启动
      await this.start();

      return {
        success: true,
        message: '✅ 中转插件安装成功！',
        details: {
          installDir: this.installDir,
          serverUrl: this.config.serverUrl,
          deviceName: this.config.deviceName || 'OpenClaw 设备'
        }
      };
    } catch (error: any) {
      return {
        success: false,
        message: `❌ 安装失败: ${error.message}`,
        details: { error: error.stack }
      };
    }
  }

  /**
   * 检查环境
   */
  private async checkEnvironment(): Promise<void> {
    // 检查 Node.js
    try {
      const { stdout } = await execAsync('node --version');
      const version = stdout.trim();
      const majorVersion = parseInt(version.replace('v', '').split('.')[0]);
      if (majorVersion < 18) {
        throw new Error(`Node.js 版本过低，需要 18.0.0+，当前版本: ${version}`);
      }
    } catch (error: any) {
      throw new Error('未安装 Node.js，请先安装 Node.js 18+');
    }

    // 检查 npm
    try {
      await execAsync('npm --version');
    } catch {
      throw new Error('未安装 npm');
    }
  }

  /**
   * 克隆项目
   */
  private async cloneProject(): Promise<void> {
    const gitUrl = 'https://github.com/yutianlong520/openclaw-relay-plugin.git';
    
    // 检查目录是否已存在
    if (fs.existsSync(this.installDir)) {
      // 已存在，可能是更新
      console.log('插件已存在，执行更新...');
      await execAsync('cd "' + this.installDir + '" && git pull');
      return;
    }

    console.log('正在克隆插件仓库...');
    await execAsync(`git clone ${gitUrl} "${this.installDir}"`);
  }

  /**
   * 安装依赖
   */
  private async installDependencies(): Promise<void> {
    console.log('正在安装依赖...');
    await execAsync('npm install', { cwd: this.installDir });
  }

  /**
   * 配置
   */
  private async configure(): Promise<void> {
    console.log('正在配置插件...');
    
    const envContent = `
# 中转服务器地址
RELAY_SERVER_URL=${this.config.serverUrl}

# API Key
API_KEY=${this.config.apiKey}

# 设备名称
DEVICE_NAME=${this.config.deviceName || 'OpenClaw 设备'}
`;
    
    const envPath = path.join(this.installDir, '.env');
    fs.writeFileSync(envPath, envContent);
  }

  /**
   * 构建
   */
  private async build(): Promise<void> {
    console.log('正在构建插件...');
    await execAsync('npm run build', { cwd: this.installDir });
  }

  /**
   * 启动
   */
  private async start(): Promise<void> {
    console.log('正在启动插件...');
    
    // 在后台启动
    const startCommand = process.platform === 'win32'
      ? `start /b npm start`
      : `nohup npm start &`;
    
    await execAsync(startCommand, { cwd: this.installDir });
    
    // 等待几秒后检查是否启动成功
    await new Promise(resolve => setTimeout(resolve, 3000));
  }

  /**
   * 卸载
   */
  async uninstall(): Promise<{ success: boolean; message: string }> {
    try {
      // 停止插件进程
      if (process.platform === 'win32') {
        await execAsync('taskkill /f /im node.exe /fi "WINDOWTITLE eq openclaw-relay-plugin*"', { cwd: this.installDir });
      } else {
        await execAsync('pkill -f openclaw-relay-plugin');
      }

      // 删除目录
      fs.rmSync(this.installDir, { recursive: true, force: true });

      return {
        success: true,
        message: '✅ 插件卸载成功'
      };
    } catch (error: any) {
      return {
        success: false,
        message: `❌ 卸载失败: ${error.message}`
      };
    }
  }

  /**
   * 检查状态
   */
  async status(): Promise<{ running: boolean; details?: any }> {
    try {
      // 检查进程是否运行
      const isRunning = await this.checkProcess();
      
      return {
        running: isRunning,
        details: {
          installDir: this.installDir,
          config: this.config
        }
      };
    } catch (error) {
      return { running: false };
    }
  }

  /**
   * 检查进程
   */
  private async checkProcess(): Promise<boolean> {
    try {
      if (process.platform === 'win32') {
        await execAsync('tasklist | findstr node.exe');
      } else {
        await execAsync('pgrep -f openclaw-relay-plugin');
      }
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * 导出为 OpenClaw 工具
 */
export const relayInstallerTool = {
  name: 'install_relay_plugin',
  description: '安装 OpenClaw 中转插件，让手机可以远程控制本地 OpenClaw',
  parameters: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        enum: ['install', 'uninstall', 'status'],
        description: '操作类型：install（安装）, uninstall（卸载）, status（状态）'
      },
      serverUrl: {
        type: 'string',
        description: '中转服务器地址，如 ws://localhost:8080 或 wss://your-server.com'
      },
      apiKey: {
        type: 'string',
        description: 'API Key（从服务器管理后台获取）'
      },
      deviceName: {
        type: 'string',
        description: '设备名称，可选'
      }
    },
    required: ['action']
  },
  handler: async (params: any) => {
    const installer = new RelayInstaller({
      serverUrl: params.serverUrl || DEFAULT_SERVER_URL,
      apiKey: params.apiKey || '',
      deviceName: params.deviceName
    });

    switch (params.action) {
      case 'install':
        if (!params.apiKey) {
          return { success: false, message: '❌ 安装需要提供 API Key' };
        }
        return await installer.install();

      case 'uninstall':
        return await installer.uninstall();

      case 'status':
        return await installer.status();

      default:
        return { success: false, message: '❌ 未知操作' };
    }
  }
};

// 导出默认实例
export default relayInstallerTool;
