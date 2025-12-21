import { UserService } from '../user.service';
import { Role } from '@prisma/client';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('UserService', () => {
  // Clean up test data after each test
  afterEach(async () => {
    await prisma.user.deleteMany({
      where: {
        username: {
          startsWith: 'test_',
        },
      },
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('createUser', () => {
    it('should create a new user with hashed password', async () => {
      const userData = {
        username: 'test_user_1',
        password: 'password123',
        role: Role.STAFF,
      };

      const user = await UserService.createUser(userData);

      expect(user).toBeDefined();
      expect(user.username).toBe(userData.username);
      expect(user.role).toBe(userData.role);
      expect(user.id).toBeDefined();
      expect(user.createdAt).toBeDefined();
      expect(user.updatedAt).toBeDefined();
      // Password should not be in response
      expect((user as any).password).toBeUndefined();

      // Verify password is hashed in database
      const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
      });
      expect(dbUser?.password).not.toBe(userData.password);
      expect(dbUser?.password).toMatch(/^\$2[aby]\$/); // bcrypt hash pattern
    });

    it('should throw error for duplicate username', async () => {
      const userData = {
        username: 'test_duplicate',
        password: 'password123',
        role: Role.ADMIN,
      };

      await UserService.createUser(userData);

      await expect(UserService.createUser(userData)).rejects.toThrow(
        'Username already exists'
      );
    });

    it('should throw error for missing required fields', async () => {
      await expect(
        UserService.createUser({
          username: '',
          password: 'password',
          role: Role.STAFF,
        })
      ).rejects.toThrow('Username, password, and role are required');
    });
  });

  describe('getAllUsers', () => {
    it('should return all users', async () => {
      // Create test users
      await UserService.createUser({
        username: 'test_user_2',
        password: 'password123',
        role: Role.ADMIN,
      });
      await UserService.createUser({
        username: 'test_user_3',
        password: 'password456',
        role: Role.STAFF,
      });

      const users = await UserService.getAllUsers();

      expect(users.length).toBeGreaterThanOrEqual(2);
      expect(users.every(u => !('password' in u))).toBe(true);
    });
  });

  describe('getUserById', () => {
    it('should return user by ID', async () => {
      const created = await UserService.createUser({
        username: 'test_user_4',
        password: 'password123',
        role: Role.STAFF,
      });

      const user = await UserService.getUserById(created.id);

      expect(user).toBeDefined();
      expect(user?.id).toBe(created.id);
      expect(user?.username).toBe(created.username);
      expect((user as any)?.password).toBeUndefined();
    });

    it('should return null for non-existent user', async () => {
      const user = await UserService.getUserById(999999);
      expect(user).toBeNull();
    });
  });

  describe('updateUser', () => {
    it('should update user username', async () => {
      const created = await UserService.createUser({
        username: 'test_user_5',
        password: 'password123',
        role: Role.STAFF,
      });

      const updated = await UserService.updateUser(created.id, {
        username: 'test_user_5_updated',
      });

      expect(updated.username).toBe('test_user_5_updated');
      expect(updated.role).toBe(created.role);
    });

    it('should update user password', async () => {
      const created = await UserService.createUser({
        username: 'test_user_6',
        password: 'password123',
        role: Role.STAFF,
      });

      const originalDbUser = await prisma.user.findUnique({
        where: { id: created.id },
      });

      await UserService.updateUser(created.id, {
        password: 'newpassword456',
      });

      const updatedDbUser = await prisma.user.findUnique({
        where: { id: created.id },
      });

      expect(updatedDbUser?.password).not.toBe(originalDbUser?.password);
      expect(updatedDbUser?.password).toMatch(/^\$2[aby]\$/);
    });

    it('should update user role', async () => {
      const created = await UserService.createUser({
        username: 'test_user_7',
        password: 'password123',
        role: Role.STAFF,
      });

      const updated = await UserService.updateUser(created.id, {
        role: Role.ADMIN,
      });

      expect(updated.role).toBe(Role.ADMIN);
    });

    it('should throw error for non-existent user', async () => {
      await expect(
        UserService.updateUser(999999, { username: 'test' })
      ).rejects.toThrow('User not found');
    });

    it('should throw error for duplicate username', async () => {
      await UserService.createUser({
        username: 'test_user_8',
        password: 'password123',
        role: Role.STAFF,
      });

      const user2 = await UserService.createUser({
        username: 'test_user_9',
        password: 'password123',
        role: Role.STAFF,
      });

      await expect(
        UserService.updateUser(user2.id, { username: 'test_user_8' })
      ).rejects.toThrow('Username already exists');
    });
  });

  describe('deleteUser', () => {
    it('should delete user', async () => {
      const created = await UserService.createUser({
        username: 'test_user_10',
        password: 'password123',
        role: Role.STAFF,
      });

      const deleted = await UserService.deleteUser(created.id);

      expect(deleted.id).toBe(created.id);
      expect(deleted.username).toBe(created.username);

      // Verify user is deleted
      const user = await prisma.user.findUnique({
        where: { id: created.id },
      });
      expect(user).toBeNull();
    });

    it('should throw error for non-existent user', async () => {
      await expect(UserService.deleteUser(999999)).rejects.toThrow(
        'User not found'
      );
    });
  });
});
