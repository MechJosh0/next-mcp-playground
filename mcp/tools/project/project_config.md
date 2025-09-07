# Next.js MCP Playground

A Next.js application with MCP (Model Context Protocol) integration for managing users and tasks with AI-assisted development tools.

**Version:** 0.1.0

## Tech Stack

- Next.js 15.5.2
- React 19.1.0  
- TypeScript 5.x
- Prisma ORM 6.15.0
- PostgreSQL
- Tailwind CSS 4.x
- MCP SDK 1.17.4

## Architecture

Full-stack monorepo with MCP integration

## Current Goals

- Build user and task management interface
- Assign tasks to users
- Integrate MCP server for AI-assisted development
- Implement CRUD operations for users and tasks
- Create responsive UI with Tailwind CSS
- Enable real-time development with MCP tools

## Coding Standards

- Default ESLint and Prettier configurations
- CRUD and SOLID principles
- camelCase naming convention
- ESLint + Next.js + TypeScript strict mode
- Next.js App Router conventions
- React functional components with TypeScript
- Tailwind CSS utility-first approach

## Project Structure

- `src/` - Next.js App Router application
- Follows the folder structure of App Router Structure from Next.js 13+
- `prisma/` - Database schema and migrations
- `mcp/` - Model Context Protocol server and tools
- MCP tools in `./mcp/tools/`, resources in `./mcp/resources/`, and prompts in `./mcp/prompts/`

## Development Workflow

- **Package Manager:** pnpm
- **Dev Server:** next dev --turbopack
- **Build Tool:** Next.js with Turbopack
- **Database:** Prisma with PostgreSQL
- **MCP Integration:** Real-time AI development assistance

## Key Features

- User and task management with CRUD operations
- MCP-powered AI development tools
- Real-time file structure analysis
- Automated code generation and refactoring
- Database operations through Prisma

## Automatic Behavior Guidelines

When working on this project:

- Follow established coding standards and conventions
- Place components in appropriate directories per Next.js App Router
- Reference current goals when suggesting features
- Use project's established patterns and tech stack
- Maintain consistency with existing codebase structure
- Leverage MCP tools for development assistance
- Follow CRUD and SOLID principles
- Use Tailwind CSS for styling
- Implement TypeScript strict mode
