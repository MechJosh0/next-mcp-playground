# MCP Database POC

## 🚀 Project Overview

A full-stack prototype demonstrating Model Context Protocol integration with a PostgreSQL database using Next.js, Prisma, and TypeScript.

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 + React + TypeScript + Tailwind CSS
- **Backend**: Next.js API Routes + Prisma ORM
- **Database**: PostgreSQL
- **MCP**: Model Context Protocol Server (stdio transport)

## 📊 Database

- **Name**: `mcp_poc_db`
- **Type**: PostgreSQL
- **ORM**: Prisma
- **Port**: 5432 (default)

## 🔧 Available Tools

- `create_user` - Create a new user in the database

## 🎯 Features

- [x] User Management
- [x] MCP Integration
- [x] Real-time UI
- [ ] Task Management (planned)
- [ ] Bulk Operations (planned)

## 🌐 Endpoints

- **Web UI**: http://localhost:3000
- **Web API**: http://localhost:3000/api
- **MCP Server**: stdio transport

## 🏗️ Development

- **Hot Reload**: Enabled
- **TypeScript**: Strict mode
- **Prisma Studio**: http://localhost:5555
- **Environment**: `.env.local`

## 📁 Project Structure

```
project/
├── src/app/          # Next.js App Router
├── src/lib/          # Shared utilities & services
├── mcp/              # MCP server & content
├── prisma/           # Database schema & migrations
└── package.json      # Dependencies & scripts
```
