import { PrismaClient, Role, User } from '@prisma/client';
import { AuthService } from './auth.service';

const prisma = new PrismaClient();

export interface CreateUserInput {
  username: string;
  password: string;
  role: Role;
}

export interface UpdateUserInput {
  username?: string;
  password?: string;
  role?: Role;
}

export interface UserResponse {
  id: number;
  username: string;
  role: Role;
  createdAt: Date;
  updatedAt: Date;
}

export class UserService {
  /**
   * Convert User model to UserResponse (exclude password)
   */
  private static toUserResponse(user: User): UserResponse {
    return {
      id: user.id,
      username: user.username,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  /**
   * Create a new user
   * @param data - User creation data
   * @returns Created user (without password)
   */
  static async createUser(data: CreateUserInput): Promise<UserResponse> {
    // Validate input
    if (!data.username || !data.password || !data.role) {
      throw new Error('Username, password, and role are required');
    }

    // Check if username already exists
    const existingUser = await prisma.user.findUnique({
      where: { username: data.username },
    });

    if (existingUser) {
      throw new Error('Username already exists');
    }

    // Hash password
    const hashedPassword = await AuthService.hashPassword(data.password);

    // Create user
    const user = await prisma.user.create({
      data: {
        username: data.username,
        password: hashedPassword,
        role: data.role,
      },
    });

    return this.toUserResponse(user);
  }

  /**
   * Get all users
   * @returns Array of users (without passwords)
   */
  static async getAllUsers(): Promise<UserResponse[]> {
    const users = await prisma.user.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });

    return users.map(user => this.toUserResponse(user));
  }

  /**
   * Get user by ID
   * @param id - User ID
   * @returns User (without password) or null if not found
   */
  static async getUserById(id: number): Promise<UserResponse | null> {
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return null;
    }

    return this.toUserResponse(user);
  }

  /**
   * Update user
   * @param id - User ID
   * @param data - Update data
   * @returns Updated user (without password)
   */
  static async updateUser(id: number, data: UpdateUserInput): Promise<UserResponse> {
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      throw new Error('User not found');
    }

    // Check if username is being changed and if it's already taken
    if (data.username && data.username !== existingUser.username) {
      const userWithSameUsername = await prisma.user.findUnique({
        where: { username: data.username },
      });

      if (userWithSameUsername) {
        throw new Error('Username already exists');
      }
    }

    // Prepare update data
    const updateData: any = {};

    if (data.username) {
      updateData.username = data.username;
    }

    if (data.password) {
      updateData.password = await AuthService.hashPassword(data.password);
    }

    if (data.role) {
      updateData.role = data.role;
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
    });

    return this.toUserResponse(updatedUser);
  }

  /**
   * Delete user
   * @param id - User ID
   * @returns Deleted user (without password)
   */
  static async deleteUser(id: number): Promise<UserResponse> {
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      throw new Error('User not found');
    }

    // Delete user
    const deletedUser = await prisma.user.delete({
      where: { id },
    });

    return this.toUserResponse(deletedUser);
  }
}
