#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { AuthManager } from "./auth/authManager";
import { RedNoteTools } from "./tools/rednoteTools";
import logger, { LOGS_DIR, packLogs } from "./utils/logger";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

const tools = new RedNoteTools();

const name = "rednote";
const description =
  "A friendly tool to help you access and interact with Xiaohongshu (RedNote) content through Model Context Protocol.";
const version = "0.1.8";

// Create server instance
const server = new McpServer({
  name,
  version,
  protocolVersion: "2024-11-05",
  capabilities: {
    tools: true,
    sampling: {},
    roots: {
      listChanged: true,
    },
  },
});

// Register tools
server.tool(
  "search_notes",
  "根据关键词搜索笔记",
  {
    keywords: z.string().describe("搜索关键词"),
    limit: z.number().optional().describe("返回结果数量限制"),
  },
  async ({ keywords, limit = 10 }: { keywords: string; limit?: number }) => {
    logger.info(`Searching notes with keywords: ${keywords}, limit: ${limit}`);
    try {
      const notes = await tools.searchNotes(keywords, limit);
      logger.info(`Found ${notes.length} notes`);
      return {
        content: notes.map((note) => ({
          type: "text",
          text: `标题: ${note.title}\n作者: ${note.author}\n内容: ${note.content}\n点赞: ${note.likes}\n评论: ${note.comments}\n链接: ${note.url}\n---`,
        })),
      };
    } catch (error) {
      logger.error("Error searching notes:", error);
      throw error;
    }
  }
);

server.tool(
  "get_note_content",
  "获取笔记内容",
  {
    url: z.string().describe("笔记 URL"),
  },
  async ({ url }: { url: string }) => {
    logger.info(`Getting note content for URL: ${url}`);
    try {
      const note = await tools.getNoteContent(url);
      logger.info(`Successfully retrieved note: ${note.title}`);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(note),
          },
        ],
      };
    } catch (error) {
      logger.error("Error getting note content:", error);
      throw error;
    }
  }
);

server.tool(
  "get_note_comments",
  "获取笔记评论",
  {
    url: z.string().describe("笔记 URL"),
  },
  async ({ url }: { url: string }) => {
    logger.info(`Getting comments for URL: ${url}`);
    try {
      const comments = await tools.getNoteComments(url);
      logger.info(`Found ${comments.length} comments`);
      return {
        content: comments.map((comment) => ({
          type: "text",
          text: `作者: ${comment.author}\n内容: ${comment.content}\n点赞: ${comment.likes}\n时间: ${comment.time}\n---`,
        })),
      };
    } catch (error) {
      logger.error("Error getting note comments:", error);
      throw error;
    }
  }
);

// Add login tool
server.tool("login", "登录小红书账号", {}, async () => {
  logger.info("Starting login process");
  const authManager = new AuthManager();
  try {
    await authManager.login();
    logger.info("Login successful");
    return {
      content: [
        {
          type: "text",
          text: "登录成功！Cookie 已保存。",
        },
      ],
    };
  } catch (error) {
    logger.error("Login failed:", error);
    throw error;
  } finally {
    await authManager.cleanup();
  }
});

// Start the server
async function main() {
  logger.info("Starting RedNote MCP Server");
  const transport = new StdioServerTransport();
  await server.connect(transport);
  logger.info("RedNote MCP Server running on stdio");
}

// 检查是否在 stdio 模式下运行
if (process.argv.includes("--stdio")) {
  main().catch((error) => {
    logger.error("Fatal error in main():", error);
    process.exit(1);
  });
} else {
  const { Command } = require("commander");
  const program = new Command();

  program.name(name).description(description).version(version);

  program
    .command("init")
    .description("Initialize and login to RedNote")
    .action(async () => {
      logger.info("Starting initialization process");
      try {
        const authManager = new AuthManager();
        await authManager.login();
        await authManager.cleanup();
        logger.info("Initialization successful");
        console.log("Login successful! Cookie has been saved.");
        process.exit(0);
      } catch (error) {
        logger.error("Error during initialization:", error);
        console.error("Error during initialization:", error);
        process.exit(1);
      }
    });

  program
    .command("pack-logs")
    .description("Pack all log files into a zip file")
    .action(async () => {
      try {
        const zipPath = await packLogs();
        console.log(`日志已打包到: ${zipPath}`);
        process.exit(0);
      } catch (error) {
        console.error("打包日志失败:", error);
        process.exit(1);
      }
    });

  program
    .command("open-logs")
    .description("Open the logs directory in file explorer")
    .action(async () => {
      try {
        let command;
        switch (process.platform) {
          case "darwin": // macOS
            command = `open "${LOGS_DIR}"`;
            break;
          case "win32": // Windows
            command = `explorer "${LOGS_DIR}"`;
            break;
          case "linux": // Linux
            command = `xdg-open "${LOGS_DIR}"`;
            break;
          default:
            throw new Error(`Unsupported platform: ${process.platform}`);
        }

        await execAsync(command);
        console.log(`日志目录已打开: ${LOGS_DIR}`);
        process.exit(0);
      } catch (error) {
        console.error("打开日志目录失败:", error);
        process.exit(1);
      }
    });

  program.parse(process.argv);
}
