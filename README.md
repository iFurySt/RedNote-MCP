[![MseeP.ai Security Assessment Badge](https://mseep.net/pr/ifuryst-rednote-mcp-badge.png)](https://mseep.ai/app/ifuryst-rednote-mcp)

# RedNote MCP

[![English](https://img.shields.io/badge/English-Click-yellow)](docs/README.en.md)
[![简体中文](https://img.shields.io/badge/简体中文-点击查看-orange)](README.md)
[![npm](https://img.shields.io/npm/v/rednote-mcp)](https://www.npmjs.com/package/rednote-mcp)

小红书内容访问的MCP服务

https://github.com/user-attachments/assets/06b2c67f-d9ed-4a30-8f1d-9743f3edaa3a

## 快速开始

开始前确保安装了 [playwright](https://github.com/microsoft/playwright) 环境：

```bash
npx playwright install
```

### NPM 全局安装

```bash
# 全局安装
npm install -g rednote-mcp

# 初始化登录，会自动记录cookie到 ~/.mcp/rednote/cookies.json
rednote-mcp init
```

### 从源码安装

```bash
# 克隆项目
git clone https://github.com/ifuryst/rednote-mcp.git
cd rednote-mcp

# 安装依赖
npm install

# 全局安装（可选，方便命令行调用）
npm install -g .

# 或者直接运行，如初始化登录
npm run dev -- init
```

## 功能特性

- 认证管理（支持 Cookie 持久化）
- 关键词搜索笔记
- 命令行初始化工具
- 通过 URL 访问笔记内容
- [ ] 通过 URL 访问评论内容

## 使用说明

### 1. 初始化登录

首次使用需要先进行登录初始化：

```bash
rednote-mcp init
# 或者直接从源码run
npm run dev -- init
# 或者mcp-client里选择login
```

执行此命令后：

1. 会自动打开浏览器窗口
2. 跳转到小红书登录页面
3. 请手动完成登录操作
4. 登录成功后会自动保存 Cookie 到 `~/.mcp/rednote/cookies.json` 文件

### 2. 在 Cursor 中配置 MCP Server

在 Cursor 的 settings.json 中添加以下配置：

```json
{
  "mcpServers": {
    "RedNote MCP": {
      "command": "rednote-mcp",
      "args": [
        "--stdio"
      ]
    }
  }
}
```

或者使用 npx 方式：

```json
{
  "mcpServers": {
    "RedNote MCP": {
      "command": "npx",
      "args": [
        "rednote-mcp",
        "--stdio"
      ]
    }
  }
}
```

配置说明：

- `command`: 可以是全局安装后的 `rednote-mcp` 命令，或使用 `npx` 直接运行
- `args`: 必须包含 `--stdio` 参数以支持 Cursor 的通信方式

## 开发指南

### 环境要求

- Node.js >= 16
- npm >= 7

### 开发流程

```bash
# 安装依赖
npm install

# 构建项目
npm run build

# 开发模式运行
npm run dev

# 运行测试
npm test
```

### 使用 MCP Inspector 进行调试

MCP Inspector 是一个用于调试 MCP 服务器的工具，可以帮助开发者检查和验证 MCP 服务器的行为。使用以下命令启动：

```bash
npx @modelcontextprotocol/inspector npx rednote-mcp --stdio
```

这个命令会：

1. 启动 MCP Inspector 工具
2. 通过 Inspector 运行 rednote-mcp 服务
3. 提供一个交互式界面来检查请求和响应
4. 帮助调试和验证 MCP 协议的实现

## 注意事项

1. 首次使用必须执行 `init` 命令进行登录
2. Cookie 文件包含敏感信息，避免泄露
3. 建议定期更新 Cookie，避免失效
4. 确保已正确安装 Node.js 环境

## 贡献指南

1. Fork 本仓库
2. 创建你的特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交你的改动 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启一个 Pull Request

## 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件 
