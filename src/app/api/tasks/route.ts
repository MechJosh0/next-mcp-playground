import { NextRequest, NextResponse } from "next/server";
import { TaskService } from "@/services/TaskService";
import { taskCreateSchema } from "@/lib/validation/task.schema";
import { ZodError } from "zod";

const taskService = new TaskService();

// GET /api/tasks - List all tasks or tasks for a specific user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    let tasks;
    if (userId) {
      const userIdNum = parseInt(userId, 10);
      if (isNaN(userIdNum)) {
        return NextResponse.json(
          { error: "Invalid user ID" },
          { status: 400 }
        );
      }
      tasks = await taskService.getTasksByUserId(userIdNum);
    } else {
      tasks = await taskService.getAllTasks();
    }

    return NextResponse.json({
      success: true,
      tasks,
      count: tasks.length,
    });
  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/tasks - Create a new task
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body with Zod
    const validatedInput = taskCreateSchema.parse(body);

    const task = await taskService.createTask(validatedInput);

    return NextResponse.json({
      success: true,
      message: "Task created successfully",
      task,
    }, { status: 201 });
  } catch (error: any) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: error.errors,
        },
        { status: 400 }
      );
    }

    console.error("API Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
