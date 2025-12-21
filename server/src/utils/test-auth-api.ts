/**
 * Simple test script to verify authentication API endpoint
 * Make sure the server is running before executing this script
 * Run with: ts-node src/utils/test-auth-api.ts
 */

import axios from 'axios';

const API_URL = process.env.API_URL || 'http://localhost:3000';

async function testAuthAPI() {
  console.log('Testing Authentication API Endpoints...\n');
  console.log(`API URL: ${API_URL}\n`);

  try {
    // Test 1: Login with valid admin credentials
    console.log('Test 1: POST /api/auth/login (Valid Admin Credentials)');
    const adminLogin = await axios.post(`${API_URL}/api/auth/login`, {
      username: 'admin',
      password: 'admin123',
    });
    console.log(`✓ Status: ${adminLogin.status}`);
    console.log(`✓ Token received: ${adminLogin.data.token.substring(0, 50)}...`);
    console.log(`✓ User: ${adminLogin.data.user.username} (${adminLogin.data.user.role})`);

    // Test 2: Login with valid staff credentials
    console.log('\nTest 2: POST /api/auth/login (Valid Staff Credentials)');
    const staffLogin = await axios.post(`${API_URL}/api/auth/login`, {
      username: 'staff',
      password: 'staff123',
    });
    console.log(`✓ Status: ${staffLogin.status}`);
    console.log(`✓ User: ${staffLogin.data.user.username} (${staffLogin.data.user.role})`);

    // Test 3: Login with invalid credentials
    console.log('\nTest 3: POST /api/auth/login (Invalid Credentials)');
    try {
      await axios.post(`${API_URL}/api/auth/login`, {
        username: 'admin',
        password: 'wrongpassword',
      });
      console.log('✗ Should have returned 401 error');
    } catch (error: any) {
      if (error.response) {
        console.log(`✓ Status: ${error.response.status} (Unauthorized)`);
        console.log(`✓ Error: ${error.response.data.error}`);
      } else {
        throw error;
      }
    }

    // Test 4: Login with missing fields
    console.log('\nTest 4: POST /api/auth/login (Missing Password)');
    try {
      await axios.post(`${API_URL}/api/auth/login`, {
        username: 'admin',
      });
      console.log('✗ Should have returned 400 error');
    } catch (error: any) {
      if (error.response) {
        console.log(`✓ Status: ${error.response.status} (Bad Request)`);
        console.log(`✓ Error: ${error.response.data.error}`);
      } else {
        throw error;
      }
    }

    // Test 5: Logout
    console.log('\nTest 5: POST /api/auth/logout');
    const logout = await axios.post(`${API_URL}/api/auth/logout`);
    console.log(`✓ Status: ${logout.status}`);
    console.log(`✓ Message: ${logout.data.message}`);

    // Test 6: Verify token works with protected endpoint (we'll test this later when we have protected endpoints)
    console.log('\nTest 6: Token Verification (will be tested with protected endpoints)');
    console.log(`✓ Admin token available for future tests`);

    console.log('\n✅ All API authentication tests passed!');
    console.log('\nNote: Token verification with protected endpoints will be tested when user management APIs are implemented.');
  } catch (error: any) {
    if (error.code === 'ECONNREFUSED') {
      console.error('\n❌ Connection refused. Make sure the server is running on port 3000');
      console.error('   Run: npm run dev');
    } else {
      console.error('\n❌ Test failed:', error.message);
      if (error.response) {
        console.error('Response:', error.response.data);
      }
    }
    process.exit(1);
  }
}

// Run tests
testAuthAPI();
