import request from 'supertest';
import express, { Application } from 'express';
import { PrismaClient, Role } from '@prisma/client';
import userRoutes from '../../routes/user.routes';
import { AuthService } from '../../services/auth.service';

const prisma = new PrismaClient();

// Create test app
const app: Application = express();
app.use(express.json());
app.use('/api/users', userRoutes);

describe('User Controller - API Endpoints', () => {
  let adminToken: string;
  let staffToken: string;
  let adminUserId: number;
  let staffUserId: number;

  beforeAll(async () => {
    // Create test admin user
    const adminUser = await prisma.user.create({
      data: {
        username: 'test_admin_api',
        password: await AuthService.hashPassword('admin123'),
        role: Role.ADMIN,
      },
    });
    adminUserId = adminUser.id;
    adminToken = AuthService.generateToken(adminUser.id, adminUser.username, adminUser.role);

    // Create test staff user
    const staffUser = await prisma.user.create({
      data: {
        username: 'test_staff_api',
        password: await AuthService.hashPassword('staff123'),
        role: Role.STAFF,
      },
    });
    staffUserId = staffUser.id;
    staffToken = AuthService.generateToken(staffUser.id, staffUser.username, staffUser.role);
  });

  afterAll(async () => {
    // Clean up test users
    await prisma.user.deleteMany({
      where: {
        username: {
          startsWith: 'test_',
        },
      },
    });
    await prisma.$disconnect();
  });

  describe('POST /api/users', () => {
    it('should create user with admin token', async () => {
      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          username: 'test_new_user',
          password: 'password123',
          role: 'STAFF',
        });

      expect(response.status).toBe(201);
      expect(response.body.username).toBe('test_new_user');
      expect(response.body.role).toBe('STAFF');
      expect(response.body.password).toBeUndefined();
    });

    it('should reject request without token', async () => {
      const response = await request(app)
        .post('/api/users')
        .send({
          username: 'test_no_token',
          password: 'password123',
          role: 'STAFF',
        });

      expect(response.status).toBe(401);
    });

    it('should reject request with staff token', async () => {
      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          username: 'test_staff_attempt',
          password: 'password123',
          role: 'STAFF',
        });

      expect(response.status).toBe(403);
      expect(response.body.error.message).toContain('Insufficient permissions');
    });

    it('should reject duplicate username', async () => {
      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          username: 'test_admin_api',
          password: 'password123',
          role: 'STAFF',
        });

      expect(response.status).toBe(409);
      expect(response.body.message).toBe('Username already exists');
    });
  });

  describe('GET /api/users', () => {
    it('should get all users with admin token', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body.every((u: any) => !u.password)).toBe(true);
    });

    it('should reject request with staff token', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${staffToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe('GET /api/users/:id', () => {
    it('should get user by ID with admin token', async () => {
      const response = await request(app)
        .get(`/api/users/${adminUserId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(adminUserId);
      expect(response.body.username).toBe('test_admin_api');
      expect(response.body.password).toBeUndefined();
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .get('/api/users/999999')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('PUT /api/users/:id', () => {
    it('should update user with admin token', async () => {
      const response = await request(app)
        .put(`/api/users/${staffUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          role: 'ADMIN',
        });

      expect(response.status).toBe(200);
      expect(response.body.role).toBe('ADMIN');

      // Revert back to STAFF
      await request(app)
        .put(`/api/users/${staffUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          role: 'STAFF',
        });
    });

    it('should reject request with staff token', async () => {
      const response = await request(app)
        .put(`/api/users/${staffUserId}`)
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          username: 'new_username',
        });

      expect(response.status).toBe(403);
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .put('/api/users/999999')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          username: 'test',
        });

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/users/:id', () => {
    it('should delete user with admin token', async () => {
      // Create a user to delete
      const userToDelete = await prisma.user.create({
        data: {
          username: 'test_delete_user',
          password: await AuthService.hashPassword('password123'),
          role: Role.STAFF,
        },
      });

      const response = await request(app)
        .delete(`/api/users/${userToDelete.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('User deleted successfully');

      // Verify user is deleted
      const deletedUser = await prisma.user.findUnique({
        where: { id: userToDelete.id },
      });
      expect(deletedUser).toBeNull();
    });

    it('should reject request with staff token', async () => {
      const response = await request(app)
        .delete(`/api/users/${staffUserId}`)
        .set('Authorization', `Bearer ${staffToken}`);

      expect(response.status).toBe(403);
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .delete('/api/users/999999')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
    });
  });
});
