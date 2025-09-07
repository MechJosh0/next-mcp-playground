import { Server } from "@modelcontextprotocol/sdk/server";
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import { log } from "./../utils/log";

// User tools
import { userCreate, userCreateMeta } from "./user/userCreate";
import { updateUser, updateUserMeta } from "./user/updateUser";
import { deleteUser, deleteUserMeta } from "./user/deleteUser";
import { getUser, getUserMeta } from "./user/getUser";
import { listUsers, listUsersMeta } from "./user/listUsers";

// Task tools
import { createTask, createTaskMeta } from "./task/createTask";
import { updateTask, updateTaskMeta } from "./task/updateTask";
import { deleteTask, deleteTaskMeta } from "./task/deleteTask";
import { getTask, getTaskMeta } from "./task/getTask";
import { listTasks, listTasksMeta } from "./task/listTasks";

// Codebase tools
import { readFile, readFileMeta } from "./codebase/readFile";
import { writeFile, writeFileMeta } from "./codebase/writeFile";
import { deleteFile, deleteFileMeta } from "./codebase/deleteFile";
import { analyseFile, analyseFileMeta } from "./codebase/analyseFile";
import {
  getFileStructure,
  getFileStructureMeta,
} from "./codebase/getFileStructure";
import { searchCodebase, searchCodebaseMeta } from "./codebase/searchCodebase";

// Project tools
import {
  getProjectContext,
  getProjectContextMeta,
} from "./project/getProjectContext";
import {
  getCodingStandards,
  getCodingStandardsMeta,
} from "./project/getCodingStandards";

export class Tools {
  private server: Server;
  private tools: { [key: string]: [Tool, Function] } = {};

  constructor(server: Server) {
    this.server = server;

    this.addTools();
    this.listSchema();
    this.callSchema();
  }

  private addTools() {
    this.tools = {
      // User CRUD tools
      create_user: [userCreateMeta, userCreate],
      update_user: [updateUserMeta, updateUser],
      delete_user: [deleteUserMeta, deleteUser],
      get_user: [getUserMeta, getUser],
      list_users: [listUsersMeta, listUsers],
      
      // Task CRUD tools
      create_task: [createTaskMeta, createTask],
      update_task: [updateTaskMeta, updateTask],
      delete_task: [deleteTaskMeta, deleteTask],
      get_task: [getTaskMeta, getTask],
      list_tasks: [listTasksMeta, listTasks],
      
      // Codebase tools
      read_file: [readFileMeta, readFile],
      write_file: [writeFileMeta, writeFile],
      delete_file: [deleteFileMeta, deleteFile],
      analyse_file: [analyseFileMeta, analyseFile],
      get_file_structure: [getFileStructureMeta, getFileStructure],
      search_codebase: [searchCodebaseMeta, searchCodebase],
      
      // Project tools
      get_project_context: [getProjectContextMeta, getProjectContext],
      get_coding_standards: [getCodingStandardsMeta, getCodingStandards],
    };
  }

  private listSchema(): void {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      const tools = Object.values(this.tools).map(([toolMeta]) => toolMeta);

      return { tools };
    });
  }

  private callSchema(): void {
    this.server.setRequestHandler(
      CallToolRequestSchema,
      async (request: any) => {
        const startTime = Date.now();

        try {
          const { name, arguments: args } = request.params;

          log("info", `Executing tool: ${name}`, args);

          // Find the tool in our tools registry
          const toolEntry = this.tools[name];
          if (!toolEntry) {
            throw new McpError(
              ErrorCode.MethodNotFound,
              `Unknown tool: ${name}`
            );
          }

          const [, toolFunction] = toolEntry;

          // Add timeout wrapper for all operations
          const result = await Promise.race([
            toolFunction(args || {}),
            new Promise<never>((_, reject) =>
              setTimeout(() => reject(new Error("Operation timed out")), 30000)
            ),
          ]);

          const duration = Date.now() - startTime;
          log("info", `Tool ${name} completed in ${duration}ms`);

          return result;
        } catch (error: any) {
          const duration = Date.now() - startTime;
          log("error", `Tool ${name} failed after ${duration}ms:`, {
            error: error.message,
          });

          return {
            content: [{ type: "text", text: error.message }],
          };
        }
      }
    );
  }
}
