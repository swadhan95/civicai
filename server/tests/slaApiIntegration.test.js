/**
 * CivicAI End-to-End SLA Timeline & Citizen Escalation API Test Suite
 * Performs comprehensive HTTP integration testing against the live CivicAI API server.
 */
const assert = require('assert');

const BASE_URL = 'http://localhost:5001/api';

async function loginUser(email, password) {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(`Login failed for ${email}: ${JSON.stringify(data)}`);
  }
  return { token: data.token, user: data.user };
}

async function runApiIntegrationTests() {
  console.log('===============================================================');
  console.log('  CIVICAI SLA & ESCALATION LIVE HTTP API TEST SUITE');
  console.log('===============================================================');

  try {
    // 1. Authenticate Actors
    console.log('\n--- Step 1: Authenticating Citizen, Officer, and Admin ---');
    const citizenAuth = await loginUser('citizen@civicai.org', 'Citizen123!');
    console.log(`✓ Citizen authenticated: ${citizenAuth.user.name} (${citizenAuth.user.email})`);

    const officerAuth = await loginUser('vaishnavi.roads@civicai.gov', 'officer123');
    console.log(`✓ Officer authenticated: ${officerAuth.user.name} (${officerAuth.user.email})`);

    let adminAuth;
    try {
      adminAuth = await loginUser('admin@civicai.org', 'Admin123!');
    } catch {
      adminAuth = await loginUser('admin@civicai.org', 'Admin@2026!');
    }
    console.log(`✓ Admin authenticated: ${adminAuth.user.name} (${adminAuth.user.email})`);

    // 2. Fetch Issue Categories to get Pothole
    console.log('\n--- Step 2: Fetching Issue Categories & Departments ---');
    const catRes = await fetch(`${BASE_URL}/categories`);
    const catJson = await catRes.json();
    const categories = catJson.data || [];
    const potholeCat = categories.find(c => c.slug === 'pothole') || categories[0];
    assert(potholeCat, 'Pothole category must be returned');
    console.log(`✓ Retrieved Category: ${potholeCat.name} (ID: ${potholeCat._id})`);

    // 3. Citizen Submits Complaint -> Verify Dynamic SLA Deadline Assigned
    console.log('\n--- Step 3: Citizen Submits Complaint with Dynamic SLA Calculation ---');
    const createRes = await fetch(`${BASE_URL}/complaints`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${citizenAuth.token}`
      },
      body: JSON.stringify({
        categoryId: potholeCat._id,
        latitude: 12.9716,
        longitude: 77.5946,
        address: 'MG Road Metro Station, Ward 12',
        description: 'Large dangerous pothole causing traffic jam and bike skidding.',
        imageUrl: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=600&q=80',
        aiAnalysis: {
          detectedCategory: 'Pothole',
          confidence: 94,
          suggestedPriority: 'HIGH'
        }
      })
    });
    const createData = await createRes.json();
    assert(createRes.ok, `Failed to create complaint: ${JSON.stringify(createData)}`);
    const createdComplaint = createData.complaint;
    assert(createdComplaint && createdComplaint._id, 'Complaint must have _id');
    assert(createdComplaint.slaDuration >= 4, `SLA duration should be assigned, got ${createdComplaint.slaDuration}`);
    assert(createdComplaint.expectedResolutionAt, 'expectedResolutionAt must be calculated');
    assert(createdComplaint.slaStatus === 'ON_TRACK' || createdComplaint.slaStatus === 'DUE_SOON', 'Initial SLA status must be ON_TRACK');
    console.log(`✓ Complaint created: ${createdComplaint.complaintId}`);
    console.log(`  - SLA Duration: ${createdComplaint.slaDuration} hours`);
    console.log(`  - Expected Resolution: ${createdComplaint.expectedResolutionAt}`);
    console.log(`  - SLA Status: ${createdComplaint.slaStatus}`);

    // 4. Fetch Complaint Detail & Verify Vertical Timeline Data
    console.log('\n--- Step 4: Fetch Complaint Detail & Verify Milestones ---');
    const detailRes = await fetch(`${BASE_URL}/complaints/${createdComplaint._id}`, {
      headers: { 'Authorization': `Bearer ${citizenAuth.token}` }
    });
    const detailData = await detailRes.json();
    assert(detailRes.ok, 'Failed to fetch complaint detail');
    const detail = detailData.data || detailData.complaint || detailData;
    assert(detail.timeline && detail.timeline.length >= 1, 'Complaint must have timeline events');
    console.log(`✓ Timeline has ${detail.timeline.length} milestone events.`);

    // 5. Verify SLA Window Protection: Citizen cannot escalate while ON_TRACK
    console.log('\n--- Step 5: SLA Window Protection Gatekeeper ---');
    const earlyEscRes = await fetch(`${BASE_URL}/complaints/${createdComplaint._id}/escalate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${citizenAuth.token}`
      },
      body: JSON.stringify({
        reason: 'Attempting to escalate before SLA window has expired.'
      })
    });
    assert(earlyEscRes.status === 400, 'Escalation during active SLA window must return 400 Bad Request');
    const earlyEscData = await earlyEscRes.json();
    console.log(`✓ Premature escalation correctly blocked: "${earlyEscData.message}"`);

    // 6. Admin Escalates or Overdue Complaint is Escalated
    console.log('\n--- Step 6: Authorized Escalation Generation ---');
    const escRes = await fetch(`${BASE_URL}/complaints/${createdComplaint._id}/escalate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminAuth.token}`
      },
      body: JSON.stringify({
        reason: 'Citizen reported recurring accidents near metro stairs; administrative priority escalation.',
        evidence: ['https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=600&q=80']
      })
    });
    const escData = await escRes.json();
    assert(escRes.ok, `Failed to escalate: ${JSON.stringify(escData)}`);
    assert(escData.escalation && escData.escalation.escalationId, 'Escalation ID must be generated');
    assert(escData.escalation.escalationLevel === 1, 'First escalation must be Level 1');
    const escalationId = escData.escalation._id;
    console.log(`✓ Escalation submitted: ${escData.escalation.escalationId} at Level ${escData.escalation.escalationLevel} (Status: ${escData.escalation.status})`);

    // 7. Anti-Abuse Test: Duplicate Active Escalation Attempt
    console.log('\n--- Step 7: Anti-Abuse Guard Verification ---');
    const duplicateEscRes = await fetch(`${BASE_URL}/complaints/${createdComplaint._id}/escalate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminAuth.token}`
      },
      body: JSON.stringify({
        reason: 'Duplicate escalation attempt while first is still pending.'
      })
    });
    assert(duplicateEscRes.status === 400, 'Duplicate active escalation must return 400 Bad Request');
    console.log('✓ Anti-abuse gatekeeper successfully blocked duplicate active escalation.');

    // 8. Admin Queries Escalation Command Center
    console.log('\n--- Step 8: Admin Escalation Center Telemetry & Queries ---');
    const adminEscListRes = await fetch(`${BASE_URL}/escalations`, {
      headers: { 'Authorization': `Bearer ${adminAuth.token}` }
    });
    const escListData = await adminEscListRes.json();
    assert(adminEscListRes.ok, 'Admin should be able to fetch escalations');
    const escalations = escListData.data || escListData.escalations || [];
    assert(Array.isArray(escalations), 'Escalations should be an array');
    console.log(`✓ Admin fetched ${escalations.length} total escalations (Telemetry: ${JSON.stringify(escListData.telemetry || {})})`);

    const metricsRes = await fetch(`${BASE_URL}/escalations/metrics`, {
      headers: { 'Authorization': `Bearer ${adminAuth.token}` }
    });
    const metricsData = await metricsRes.json();
    assert(metricsRes.ok, 'Admin should be able to fetch SLA metrics');
    const metrics = metricsData.data || metricsData.metrics || {};
    console.log(`✓ SLA Metrics retrieved: Total=${metrics.totalActive + metrics.totalResolved}, Overdue=${metrics.totalOverdue}, Compliance=${metrics.overallComplianceRate}%`);

    // 9. Admin Reviews & Updates Escalation Status to ACTION_REQUIRED
    console.log('\n--- Step 9: Admin Updates Escalation to ACTION_REQUIRED ---');
    const updateEscRes = await fetch(`${BASE_URL}/escalations/${escalationId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminAuth.token}`
      },
      body: JSON.stringify({
        status: 'ACTION_REQUIRED',
        adminNotes: 'Instruction issued to Road Maintenance team to dispatch asphalt patching truck immediately.',
        escalationLevel: 2
      })
    });
    const updateEscData = await updateEscRes.json();
    assert(updateEscRes.ok, `Admin should be able to update escalation status: ${JSON.stringify(updateEscData)}`);
    const updatedEsc = updateEscData.data || updateEscData.escalation;
    assert(updatedEsc.status === 'ACTION_REQUIRED', 'Status should be ACTION_REQUIRED');
    assert(updatedEsc.escalationLevel === 2, 'Escalation level should be updated to Level 2');
    console.log(`✓ Escalation updated to Level 2 (Status: ${updatedEsc.status}, Notes: "${updatedEsc.adminNotes}")`);

    // 10. Officer Records Delay Reason
    console.log('\n--- Step 10: Officer Records Field Crew Delay Reason ---');
    const delayRes = await fetch(`${BASE_URL}/complaints/${createdComplaint._id}/delay-reason`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${officerAuth.token}`
      },
      body: JSON.stringify({
        category: 'WEATHER_CONDITIONS',
        reason: 'Heavy rain during afternoon prevented road hot-mix asphalt from sticking. Rescheduled for dry morning.'
      })
    });
    const delayData = await delayRes.json();
    assert(delayRes.ok, `Officer failed to record delay reason: ${JSON.stringify(delayData)}`);
    console.log(`✓ Field crew delay reason recorded: [WEATHER_CONDITIONS] ${delayData.complaint?.delayReasons?.[0]?.reason || 'Logged'}`);

    // 11. Admin Authorizes SLA Extension (+24 Hours)
    console.log('\n--- Step 11: Admin Authorizes SLA Extension ---');
    const extRes = await fetch(`${BASE_URL}/complaints/${createdComplaint._id}/extend-sla`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminAuth.token}`
      },
      body: JSON.stringify({
        additionalHours: 24,
        reason: 'Weather delay acknowledged: Bitumen requires dry conditions. SLA extended by 24 hours.'
      })
    });
    const extData = await extRes.json();
    assert(extRes.ok, `Admin SLA extension failed: ${JSON.stringify(extData)}`);
    assert(extData.complaint?.slaExtensions?.length >= 1, 'SLA extension record must be saved');
    console.log(`✓ SLA Extension granted: +24h. New Expected Resolution: ${extData.complaint?.expectedResolutionAt}`);

    // 12. Officer Resolves Complaint with After Image & Verification
    console.log('\n--- Step 12: Officer Resolves Complaint ---');
    const resolveRes = await fetch(`${BASE_URL}/complaints/${createdComplaint._id}/resolve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${officerAuth.token}`
      },
      body: JSON.stringify({
        notes: 'Road pothole filled with cold asphalt mix, vibratory rolled and cleared for traffic.',
        afterImageUrl: 'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?auto=format&fit=crop&w=600&q=80',
        verifiedByAI: true,
        aiConfidence: 96
      })
    });
    const resolveData = await resolveRes.json();
    assert(resolveRes.ok, `Officer failed to resolve complaint: ${JSON.stringify(resolveData)}`);
    const resolvedComp = resolveData.data || resolveData.complaint;
    assert(resolvedComp.status === 'RESOLVED', 'Complaint status must be RESOLVED');
    console.log(`✓ Complaint marked RESOLVED with resolution proof.`);

    // 13. Verify Complaint Final State & Escalation Auto-Resolution
    console.log('\n--- Step 13: Final State & Auto-Resolution Verification ---');
    const finalCompRes = await fetch(`${BASE_URL}/complaints/${createdComplaint._id}`, {
      headers: { 'Authorization': `Bearer ${citizenAuth.token}` }
    });
    const finalCompData = await finalCompRes.json();
    const finalComp = finalCompData.data || finalCompData.complaint;
    assert(finalComp.resolvedAt, 'resolvedAt timestamp must be recorded');
    assert(finalComp.slaStatus === 'RESOLVED_ON_TIME' || finalComp.slaStatus === 'RESOLVED_LATE', 'SLA status must be marked as RESOLVED_ON_TIME or RESOLVED_LATE');
    console.log(`✓ Final SLA Status: ${finalComp.slaStatus}, Resolved At: ${finalComp.resolvedAt}`);

    const finalEscRes = await fetch(`${BASE_URL}/escalations/${escalationId}`, {
      headers: { 'Authorization': `Bearer ${adminAuth.token}` }
    });
    const finalEsc = await finalEscRes.json();
    assert(finalEsc.escalation.status === 'RESOLVED', 'Escalation must be auto-resolved when complaint is resolved');
    console.log(`✓ Escalation auto-resolved: Status=${finalEsc.escalation.status}, ResolvedAt=${finalEsc.escalation.resolvedAt}`);

    console.log('\n===============================================================');
    console.log('  ALL 13 SLA & CITIZEN ESCALATION API TESTS PASSED 100%!');
    console.log('===============================================================');
  } catch (err) {
    console.error('❌ API Integration Test Failed:', err);
    process.exit(1);
  }
}

runApiIntegrationTests();
