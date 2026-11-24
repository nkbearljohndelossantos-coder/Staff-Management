/**
 * ==============================================================================
 * NKB MANUFACTURING SYSTEM -- BACKEND REST API VERIFICATION SUITE
 * Mode: Automated Integration & Health Validation
 * Port: Default http://127.0.0.1:39102
 * ==============================================================================
 */

const http = require('http');

const API_BASE = process.env.API_BASE || 'http://127.0.0.1:39102';

function request(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, API_BASE);
    const reqHeaders = {
      'Content-Type': 'application/json',
      ...headers
    };

    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: reqHeaders,
      timeout: 5000
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        let parsed = null;
        try {
          parsed = JSON.parse(data);
        } catch {
          parsed = data;
        }
        resolve({ status: res.statusCode, data: parsed });
      });
    });

    req.on('error', (err) => reject(err));
    req.on('timeout', () => {
      req.destroy();
      reject(new Error(`Request timeout: ${method} ${path}`));
    });

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('=================================================================');
  console.log(' NKB MANUFACTURING -- REST API ENDPOINT VERIFICATION');
  console.log(` Target Server: ${API_BASE}`);
  console.log('=================================================================\n');

  let passed = 0;
  let failed = 0;

  async function testCase(name, fn) {
    try {
      const res = await fn();
      if (res) {
        console.log(`  [PASS] ${name}`);
        passed++;
      } else {
        console.log(`  [FAIL] ${name}`);
        failed++;
      }
    } catch (err) {
      console.log(`  [ERROR] ${name}: ${err.message}`);
      failed++;
    }
  }

  // 1. Health check
  await testCase('GET /api/health -- Service status & uptime', async () => {
    const res = await request('GET', '/api/health');
    return res.status === 200 || res.status === 503;
  });

  // 2. Auth: Bad login check
  await testCase('POST /api/auth/login -- Validation rejection for empty username', async () => {
    const res = await request('POST', '/api/auth/login', {});
    return res.status === 400 && res.data.success === false;
  });

  // 3. Auth: Unauthenticated route check
  await testCase('GET /api/staff -- Rejection with 401 without JWT', async () => {
    const res = await request('GET', '/api/staff');
    return res.status === 401 && res.data.success === false;
  });

  // 4. Canteen: Unauthenticated route check
  await testCase('GET /api/canteen/inventory -- Rejection with 401 without JWT', async () => {
    const res = await request('GET', '/api/canteen/inventory');
    return res.status === 401 && res.data.success === false;
  });

  // 5. 404 Route Check
  await testCase('GET /api/unknown_route -- Proper 404 handling', async () => {
    const res = await request('GET', '/api/unknown_route');
    return res.status === 404 && res.data.success === false;
  });

  console.log('\n=================================================================');
  console.log(` TEST SUMMARY: ${passed} Passed, ${failed} Failed`);
  console.log('=================================================================');
}

runTests();
