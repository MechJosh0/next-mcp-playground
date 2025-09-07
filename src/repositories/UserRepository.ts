import { PrismaClient, User } from "@prisma/client";
import { UserCreateInput } from "@/lib/validation/user.schema";
import { db } from "@/lib/server/prisma";

export class UserRepository {
  constructor(private prisma: PrismaClient = db) {}

  async create(input: UserCreateInput): Promise<User> {
    return this.prisma.user.create({
      data: input,
    });
  }

  async findById(id: number): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
      include: {
        tasks: {
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
      include: {
        tasks: {
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });
  }

  async findAll(): Promise<User[]> {
    return this.prisma.user.findMany({
      include: {
        tasks: {
          orderBy: {
            createdAt: "desc",
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  async update(id: number, input: Partial<UserCreateInput>): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data: input,
    });
  }

  async delete(id: number): Promise<User> {
    return this.prisma.user.delete({
      where: { id },
    });
  }

  async getUsersWithTaskCounts(): Promise<
    (User & { _count: { tasks: number } })[]
  > {
    return this.prisma.user.findMany({
      include: {
        _count: {
          select: {
            tasks: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }
}
