/**
 * Test script to verify authentication and authorization middleware
 * This creates a temporary test endpoint to verify middleware functionality
 */

import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { authenticate, authorize, adminOnly, adminOrStaff } from '../middleware/auth.middleware';
import { Role } from '@prisma/client';
import axios from 'axios';
import { AuthService } from '../services/auth.service';

dotenv.config();

const TEST_PORT = 3001;

async function testMiddleware() {
  console.log('Testing Authentication and Authorization Middleware...\n');

  // Create test server
  const app: Application = express();
  app.use(cors());
  app.use(express.json());

  // Test endpoints with different authorization levels
  app.get('/test/public', (_req: Request, res: Response) => {
    res.json({ message: 'Public endpoint - no auth required' });
  });

  app.get('/test/authenticated', authenticate, (req: Request, res: Response) => {
    res.json({ 
      message: 'Authenticated endpoint',
      user: req.user 
    });
  });

  app.get('/test/admin-only', authenticate, adminOnly, (req: Request, res: Response) => {
    res.json({ 
      message: 'Admin only endpoint',
      user: req.user 
    });
  });

  app.get('/test/admin-or-staff', authenticate, adminOrStaff, (req: Request, res: Response) => {
    res.json({ 
      message: 'Admin or Staff endpoint',
      user: req.user 
    });
  });

  app.get('/test/custom-role', authenticate, authorize(Role.ADMIN), (req: Request, res: Response) => {
    res.json({ 
      message: 'Custom role authorization',
      user: req.user 
    });
  });

  // Start test server
  const server = app.listen(TEST_PORT, () => {
    console.log(`Test server started on port ${TEST_PORT}\n`);
  });

  try {
    // Generate test tokens
    const adminToken = AuthService.generateToken(1, 'admin', Role.ADMIN);
    const staffToken = AuthService.generateToken(2, 'staff', Role.STAFF);

    // Test 1: Public endpoint (no auth)
    console.log('Test 1: Public Endpoint (No Auth Required)');
    const publicResponse = await axios.get(`http://localhost:${TEST_PORT}/test/public`);
    console.log(`✓ Status: ${publicResponse.status}`);
    console.log(`✓ Message: ${publicResponse.data.message}`);

    // Test 2: Authenticated endpoint with valid token
    console.log('\nTest 2: Authenticated Endpoint (Valid Token)');
    const authResponse = await axios.get(`http://localhost:${TEST_PORT}/test/authenticated`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log(`✓ Status: ${authResponse.status}`);
    console.log(`✓ User: ${authResponse.data.user.username} (${authResponse.data.user.role})`);

    // Test 3: Authenticated endpoint without token
    console.log('\nTest 3: Authenticated Endpoint (No Token)');
    try {
      await axios.get(`http://localhost:${TEST_PORT}/test/authenticated`);
      console.log('✗ Should have returned 401 error');
    } catch (error: any) {
      console.log(`✓ Status: ${error.response.status} (Unauthorized)`);
      console.log(`✓ Error: ${error.response.data.error}`);
    }

    // Test 4: Authenticated endpoint with invalid token
    console.log('\nTest 4: Authenticated Endpoint (Invalid Token)');
    try {
      await axios.get(`http://localhost:${TEST_PORT}/test/authenticated`, {
        headers: { Authorization: 'Bearer invalid.token.here' }
      });
      console.log('✗ Should have returned 401 error');
    } catch (error: any) {
      console.log(`✓ Status: ${error.response.status} (Unauthorized)`);
      console.log(`✓ Error: ${error.response.data.error}`);
    }

    // Test 5: Admin-only endpoint with admin token
    console.log('\nTest 5: Admin-Only Endpoint (Admin Token)');
    const adminOnlyResponse = await axios.get(`http://localhost:${TEST_PORT}/test/admin-only`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log(`✓ Status: ${adminOnlyResponse.status}`);
    console.log(`✓ Message: ${adminOnlyResponse.data.message}`);

    // Test 6: Admin-only endpoint with staff token
    console.log('\nTest 6: Admin-Only Endpoint (Staff Token - Should Fail)');
    try {
      await axios.get(`http://localhost:${TEST_PORT}/test/admin-only`, {
        headers: { Authorization: `Bearer ${staffToken}` }
      });
      console.log('✗ Should have returned 403 error');
    } catch (error: any) {
      console.log(`✓ Status: ${error.response.status} (Forbidden)`);
      console.log(`✓ Error: ${error.response.data.error}`);
    }

    // Test 7: Admin-or-staff endpoint with admin token
    console.log('\nTest 7: Admin-or-Staff Endpoint (Admin Token)');
    const adminOrStaffAdmin = await axios.get(`http://localhost:${TEST_PORT}/test/admin-or-staff`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log(`✓ Status: ${adminOrStaffAdmin.status}`);
    console.log(`✓ User: ${adminOrStaffAdmin.data.user.username}`);

    // Test 8: Admin-or-staff endpoint with staff token
    console.log('\nTest 8: Admin-or-Staff Endpoint (Staff Token)');
    const adminOrStaffStaff = await axios.get(`http://localhost:${TEST_PORT}/test/admin-or-staff`, {
      headers: { Authorization: `Bearer ${staffToken}` }
    });
    console.log(`✓ Status: ${adminOrStaffStaff.status}`);
    console.log(`✓ User: ${adminOrStaffStaff.data.user.username}`);

    // Test 9: Custom role authorization
    console.log('\nTest 9: Custom Role Authorization (Admin Only)');
    const customRoleResponse = await axios.get(`http://localhost:${TEST_PORT}/test/custom-role`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log(`✓ Status: ${customRoleResponse.status}`);
    console.log(`✓ Message: ${customRoleResponse.data.message}`);

    // Test 10: Invalid authorization header format
    console.log('\nTest 10: Invalid Authorization Header Format');
    try {
      await axios.get(`http://localhost:${TEST_PORT}/test/authenticated`, {
        headers: { Authorization: 'InvalidFormat' }
      });
      console.log('✗ Should have returned 401 error');
    } catch (error: any) {
      console.log(`✓ Status: ${error.response.status} (Unauthorized)`);
      console.log(`✓ Error: ${error.response.data.error}`);
    }

    console.log('\n✅ All middleware tests passed!');
  } catch (error: any) {
    console.error('\n❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
    process.exit(1);
  } finally {
    // Close test server
    server.close();
    console.log('\nTest server closed.');
  }
}

// Run tests
testMiddleware();
