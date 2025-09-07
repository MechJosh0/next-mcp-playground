import { User } from "@prisma/client";
import { UserRepository } from "@/repositories/UserRepository";
import { UserCreateInput, UserUpdateInput } from "@/lib/validation/user.schema";

export class UserService {
  constructor(private userRepository: UserRepository = new UserRepository()) {}

  async createUser(input: UserCreateInput): Promise<User> {
    return this.userRepository.create(input);
  }

  async getUserById(id: number): Promise<User | null> {
    return this.userRepository.findById(id);
  }

  async getUserByEmail(email: string): Promise<User | null> {
    return this.userRepository.findByEmail(email);
  }

  async getAllUsers(): Promise<User[]> {
    return this.userRepository.findAll();
  }

  async getUsersWithTaskCounts(): Promise<
    (User & { _count: { tasks: number } })[]
  > {
    return this.userRepository.getUsersWithTaskCounts();
  }

  async updateUser(id: number, input: Partial<UserCreateInput>): Promise<User> {
    const existingUser = await this.userRepository.findById(id);

    if (!existingUser) {
      throw new Error("User not found");
    }

    return this.userRepository.update(id, input);
  }

  async deleteUser(id: number): Promise<User> {
    const existingUser = await this.userRepository.findById(id);

    if (!existingUser) {
      throw new Error("User not found");
    }

    return this.userRepository.delete(id);
  }
}
