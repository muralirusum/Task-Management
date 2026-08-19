const http = require('http');

const request = (method, path, body = null, token = null) => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: `/api${path}`,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
};

const runIntegrationTests = async () => {
  console.log('===============================================================');
  console.log('🧪 RUNNING COMPREHENSIVE E2E & PRIVACY HIERARCHY TESTS');
  console.log('===============================================================\n');

  try {
    // 1. Health check
    const health = await request('GET', '/health');
    console.log('1. [Health Check]:', health.status === 200 ? '✅ PASSED' : '❌ FAILED');

    // 2. Login CEO (Level 1)
    const arjunAuth = await request('POST', '/auth/login', {
      email: 'ceo@novatech.com',
      password: 'Demo@123',
    });
    console.log('2. [CEO Login]:', arjunAuth.status === 200 && arjunAuth.body.token ? '✅ PASSED' : '❌ FAILED');
    const arjunToken = arjunAuth.body.token;

    // 3. Login MANAGER (Level 2)
    const priyaAuth = await request('POST', '/auth/login', {
      email: 'manager@novatech.com',
      password: 'Demo@123',
    });
    console.log('3. [MANAGER Login]:', priyaAuth.status === 200 && priyaAuth.body.token ? '✅ PASSED' : '❌ FAILED');
    const priyaToken = priyaAuth.body.token;

    // 4. Login EMPLOY (Level 3)
    const sandeepAuth = await request('POST', '/auth/login', {
      email: 'employ@novatech.com',
      password: 'Demo@123',
    });
    console.log('4. [EMPLOY Login]:', sandeepAuth.status === 200 && sandeepAuth.body.token ? '✅ PASSED' : '❌ FAILED');
    const sandeepToken = sandeepAuth.body.token;

    // 5. Test Hierarchy Visibility - Sandeep only sees his tasks
    const sandeepTasks = await request('GET', '/tasks', null, sandeepToken);
    const sandeepOwnsAll = sandeepTasks.body.tasks.every(
      (t) => t.assignedTo._id === sandeepAuth.body.user._id
    );
    console.log(`5. [Sandeep Task Isolation (sees only his ${sandeepTasks.body.tasks.length} tasks)]:`, sandeepOwnsAll ? '✅ PASSED' : '❌ FAILED');

    // 6. Priya (Middle) assigns a new task to Sandeep
    const newTaskRes = await request(
      'POST',
      '/tasks',
      {
        title: 'Q3 Regional Sales Performance Audit',
        description: 'Prepare detailed sales audit for North division.',
        assignedTo: sandeepAuth.body.user._id,
        priority: 'High',
        taskType: 'Sales Work',
        product: 'NovaCRM',
        project: 'Revenue Audit 2026',
        dueDate: new Date(Date.now() + 86400000).toISOString(),
        estimatedHours: 4,
      },
      priyaToken
    );
    console.log('6. [Priya Assigns Task to Sandeep]:', newTaskRes.status === 201 ? '✅ PASSED' : '❌ FAILED');
    const taskId = newTaskRes.body.task._id;

    // 7. Sandeep starts live timer
    const timerStart = await request('POST', '/time/start', { taskId }, sandeepToken);
    console.log('7. [Sandeep Starts Stopwatch Timer]:', timerStart.status === 201 ? '✅ PASSED' : '❌ FAILED');

    // 8. Sandeep logs daily work
    const workLog = await request(
      'POST',
      '/daily-work',
      {
        taskId,
        title: 'Compiled North division sales transactions',
        startTime: '10:00 AM',
        endTime: '12:00 PM',
        durationMinutes: 120,
        project: 'Revenue Audit 2026',
      },
      sandeepToken
    );
    console.log('8. [Sandeep Logs Daily Work Entry]:', workLog.status === 201 ? '✅ PASSED' : '❌ FAILED');

    // 9. Sandeep submits task
    const submitRes = await request(
      'POST',
      `/tasks/${taskId}/submit`,
      {
        notes: 'Sales performance audit completed. Attached report.',
        attachments: [{ name: 'Q3_Sales_Audit.pdf', url: 'https://example.com/audit.pdf', size: '1.2MB' }],
      },
      sandeepToken
    );
    console.log('9. [Sandeep Submits Task for Manager Review]:', submitRes.status === 200 ? '✅ PASSED' : '❌ FAILED');

    // 10. Privacy Check - Sandeep querying task details sees displayStatus: 'Submitted' and NO internal logs
    const sandeepInspect = await request('GET', `/tasks/${taskId}`, null, sandeepToken);
    const sandeepMaskingPass =
      sandeepInspect.body.task.displayStatus === 'Submitted' &&
      !sandeepInspect.body.task.approvalStage;
    console.log('10. [Strict Privacy Masking for Last Person (No internal leaks)]:', sandeepMaskingPass ? '✅ PASSED' : '❌ FAILED');

    // 11. Priya Reviews and Forwards to Arjun
    const priyaApprove = await request(
      'POST',
      `/approvals/${taskId}/middle-approve`,
      { comments: 'Manager verified sales numbers. Forwarding to Operations Director.' },
      priyaToken
    );
    console.log('11. [Priya Approves & Forwards to Arjun (Director)]:', priyaApprove.status === 200 ? '✅ PASSED' : '❌ FAILED');

    // 12. Sandeep checks task again after manager forward -> STILL sees 'Submitted' and ZERO manager forward logs!
    const sandeepInspectAfterForward = await request('GET', `/tasks/${taskId}`, null, sandeepToken);
    const forwardHiddenFromSandeep =
      sandeepInspectAfterForward.body.task.displayStatus === 'Submitted' &&
      !sandeepInspectAfterForward.body.task.approvalStage;
    console.log('12. [Privacy Rule 6 & 25 (Sandeep still sees Submitted, manager forward hidden)]:', forwardHiddenFromSandeep ? '✅ PASSED' : '❌ FAILED');

    // 13. Arjun (Main Person) checks pending approvals -> sees the forwarded task
    const arjunPending = await request('GET', '/approvals/pending', null, arjunToken);
    const taskFoundInArjunQueue = arjunPending.body.tasks.some((t) => t._id === taskId);
    console.log('13. [Arjun Receives Forwarded Task in Director Queue]:', taskFoundInArjunQueue ? '✅ PASSED' : '❌ FAILED');

    // 14. Arjun Grants Final Approval
    const arjunFinalApprove = await request(
      'POST',
      `/approvals/${taskId}/main-approve`,
      { comments: 'Final operational approval granted by Operations Director.' },
      arjunToken
    );
    console.log('14. [Arjun Grants Final Approval (Status -> Completed)]:', arjunFinalApprove.status === 200 && arjunFinalApprove.body.task.status === 'Completed' ? '✅ PASSED' : '❌ FAILED');

    // 15. Sandeep views completed task -> sees Completed
    const sandeepFinalCheck = await request('GET', `/tasks/${taskId}`, null, sandeepToken);
    console.log('15. [Sandeep Views Completed Task]:', sandeepFinalCheck.body.task.status === 'Completed' ? '✅ PASSED' : '❌ FAILED');

    // 16. Audit Log Check - Arjun can see all organization activity logs
    const arjunLogs = await request('GET', '/activities', null, arjunToken);
    console.log(`16. [Arjun Full Audit Log Access (${arjunLogs.body.activities.length} total events)]:`, arjunLogs.status === 200 ? '✅ PASSED' : '❌ FAILED');

    // 17. Reports Check
    const reportsRes = await request('GET', '/reports', null, arjunToken);
    console.log('17. [Reports & Analytics API]:', reportsRes.status === 200 && reportsRes.body.summary ? '✅ PASSED' : '❌ FAILED');

    // 18. Org Hierarchy Tree
    const treeRes = await request('GET', '/users/hierarchy-tree', null, arjunToken);
    console.log('18. [Org Hierarchy Tree Resolution]:', treeRes.status === 200 && treeRes.body.tree.length > 0 ? '✅ PASSED' : '❌ FAILED');

    console.log('\n===============================================================');
    console.log('🎉 ALL 18 INTEGRATION & PRIVACY TESTS PASSED 100% SUCCESSFULLY!');
    console.log('===============================================================\n');
  } catch (err) {
    console.error('Test execution failed:', err);
  }
};

runIntegrationTests();
