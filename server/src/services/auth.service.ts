import bcrypt from 'bcrypt';
import jwt, { SignOptions } from 'jsonwebtoken';
import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

export interface AuthPayload {
  userId: number;
  username: string;
  role: Role;
}

export interface LoginResponse {
  token: string;
  user: {
    id: number;
    username: string;
    role: Role;
  };
}

export class AuthService {
  /**
   * Hash a password using bcrypt
   * @param password - Plain text password
   * @returns Hashed password
   */
  static async hashPassword(password: string): Promise<string> {
    const rounds = parseInt(process.env.BCRYPT_ROUNDS || '10', 10);
    return bcrypt.hash(password, rounds);
  }

  /**
   * Compare a plain text password with a hashed password
   * @param password - Plain text password
   * @param hashedPassword - Hashed password from database
   * @returns True if passwords match, false otherwise
   */
  static async comparePassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  /**
   * Generate a JWT token for a user
   * @param userId - User ID
   * @param username - Username
   * @param role - User role
   * @returns JWT token
   */
  static generateToken(userId: number, username: string, role: Role): string {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET is not defined in environment variables');
    }

    const payload: AuthPayload = {
      userId,
      username,
      role,
    };
    
    return jwt.sign(payload, secret, { 
      expiresIn: process.env.JWT_EXPIRES_IN || '24h' 
    } as SignOptions);
  }

  /**
   * Verify and decode a JWT token
   * @param token - JWT token
   * @returns Decoded payload
   */
  static verifyToken(token: string): AuthPayload {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET is not defined in environment variables');
    }

    try {
      const decoded = jwt.verify(token, secret) as AuthPayload;
      return decoded;
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  /**
   * Authenticate a user with username and password
   * @param username - Username
   * @param password - Plain text password
   * @returns Login response with token and user info
   */
  static async authenticate(username: string, password: string): Promise<LoginResponse> {
    // Find user by username
    const user = await prisma.user.findUnique({
      where: { username },
    });

    // Check if user exists
    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await this.comparePassword(password, user.password);
    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    // Generate token
    const token = this.generateToken(user.id, user.username, user.role);

    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
      },
    };
  }
}
