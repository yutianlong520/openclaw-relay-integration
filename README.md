# OpenClaw 中转插件 🦞

> 安装在本地 OpenClaw 上的插件，让手机可以远程控制

[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D18.0.0-green)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-yellowgreen)](LICENSE)

## ⭐ 特性

- 📡 **WebSocket 连接** - 实时与中转服务器保持连接
- 🔐 **安全认证** - API Key 认证，确保通信安全
- 🔄 **自动重连** - 网络断开后自动重连
- 💓 **心跳保活** - 定期心跳检测连接状态
- 📱 **远程控制** - 接收手机 App 发送的消息和命令

## 📖 文档

- [部署指南](./docs/部署指南.md) - 插件部署步骤
- [配置说明](./docs/配置说明.md) - 配置文件详解
- [API 参考](./docs/API参考.md) - 消息格式和接口

## 🚀 快速开始

### 环境要求

- Node.js >= 18.0.0

### 安装步骤

```bash
# 1. 克隆项目
git clone https://github.com/yutianlong520/openclaw-relay-plugin.git
cd openclaw-relay-plugin

# 2. 安装依赖
npm install

# 3. 配置环境变量
cp .env.example .env
# 编辑 .env 文件，填入服务器地址和 API Key

# 4. 构建项目
npm run build

# 5. 启动插件
npm start
```

### Docker 部署

```bash
# 构建镜像
docker build -t openclaw-relay-plugin .

# 运行容器
docker run -d \
  --name openclaw-relay-plugin \
  -e RELAY_SERVER_URL=wss://your-server.com \
  -e API_KEY=your_api_key \
  -e DEVICE_NAME="我的 OpenClaw" \
  openclaw-relay-plugin
```

## ⚙️ 配置说明

| 环境变量 | 必填 | 默认值 | 说明 |
|---------|------|--------|------|
| `RELAY_SERVER_URL` | ✅ | ws://localhost:8080 | 中转服务器地址 |
| `API_KEY` | ✅ | - | API Key（从服务器获取） |
| `DEVICE_ID` | ❌ | 自动生成 | 设备唯一 ID |
| `DEVICE_NAME` | ❌ | OpenClaw 本地设备 | 设备显示名称 |
| `LOG_LEVEL` | ❌ | info | 日志级别 |
| `LOG_FILE` | ❌ | - | 日志文件路径 |

## 📁 项目结构

```
openclaw-relay-plugin/
├── src/
│   ├── index.ts              # 入口文件
│   ├── client.ts             # WebSocket 客户端
│   ├── utils/
│   │   └── logger.ts         # 日志工具
│   └── types/
│       └── index.ts          # 类型定义
├── .env.example              # 环境变量示例
├── package.json
├── tsconfig.json
├── docker-compose.yml
└── README.md
```

## 🔌 与 OpenClaw 集成

### 消息流程

```
手机 App ──发送消息──► 中转服务器 ──转发消息──► 本地 OpenClaw
                    ▲                              │
                    │                              ▼
                    └────────── 响应 ─────────────┘
```

### 处理消息类型

插件目前支持以下消息类型：

| 类型 | 说明 | 处理方式 |
|------|------|---------|
| `chat_message` | 聊天消息 | 转发给 OpenClaw 处理 |
| `command` | 命令消息 | 执行对应命令 |
| `ping` | 心跳检测 | 自动响应 |

### TODO: 与 OpenClaw 集成

当前版本需要手动集成，以下是集成方式：

1. **命令行集成**：通过执行命令行与 OpenClaw 通信
2. **HTTP API**：如果 OpenClaw 提供 HTTP API，可以直接调用
3. **IPC 通信**：如果 OpenClaw 支持进程间通信

## 🔧 技术栈

- **运行时**: Node.js 18+
- **语言**: TypeScript 5.3
- **WebSocket**: ws
- **日志**: Winston

## 📝 更新日志

### v1.0.0 (2026-03-13)

- ✅ 初始版本
- ✅ WebSocket 客户端实现
- ✅ 自动重连机制
- ✅ 心跳保活
- ✅ 消息收发

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## 📞 联系

- GitHub: [https://github.com/yutianlong520/openclaw-relay-plugin](https://github.com/yutianlong520/openclaw-relay-plugin)
- 问题反馈: [https://github.com/yutianlong520/openclaw-relay-plugin/issues](https://github.com/yutianlong520/openclaw-relay-plugin/issues)

---

Made with ❤️ by 牛三 (后端开发)
