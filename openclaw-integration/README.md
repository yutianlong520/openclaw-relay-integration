# OpenClaw 中转插件 - 自动安装指南

> 用户只需要给 OpenClaw 发一条消息，就能自动完成安装！

---

## 🚀 快速安装

用户只需要发送以下消息给 OpenClaw：

```
安装中转插件，服务器地址是 wss://your-server.com，API Key 是 xxx
```

或者更简单：

```
安装远程控制
```

OpenClaw 会自动：
1. ✅ 检查环境（Node.js）
2. ✅ 克隆插件代码
3. ✅ 安装依赖
4. ✅ 配置插件
5. ✅ 构建并启动

---

## 📝 支持的命令

### 安装插件

```
安装中转插件
```

或带参数：

```
安装中转插件，服务器是 wss://example.com，Key 是 oc_xxx
```

### 卸载插件

```
卸载中转插件
```

### 查看状态

```
中转插件状态
```

---

## 🔧 手动使用

如果需要手动安装，可以在终端运行：

```bash
# 安装
npx openclaw-relay-installer install --serverUrl wss://your-server.com --apiKey your-api-key

# 卸载
npx openclaw-relay-installer uninstall

# 状态
npx openclaw-relay-installer status
```

---

## 📋 OpenClaw 工具定义

将以下内容添加到 OpenClaw 的工具配置中：

```json
{
  "name": "relay_plugin",
  "description": "管理 OpenClaw 中转插件",
  "parameters": {
    "type": "object",
    "properties": {
      "action": {
        "type": "string",
        "enum": ["install", "uninstall", "status"]
      },
      "serverUrl": {
        "type": "string"
      },
      "apiKey": {
        "type": "string"
      }
    }
  }
}
```

---

## ❓ 常见问题

### Q: 需要提前安装什么？
A: 只需要 Node.js 18+ 和 Git

### Q: 安装目录在哪里？
A: 默认安装在用户主目录下的 `openclaw-relay-plugin`

### Q: 如何查看日志？
A: 查看插件目录下的日志文件，或使用 `docker logs`（如果使用 Docker）

---

*有问题随时联系！*
