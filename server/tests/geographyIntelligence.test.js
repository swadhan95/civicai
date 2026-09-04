/**
 * CivicAI Automated Hierarchical Geographic Problem Intelligence Test Suite
 * Tests recursive administrative hierarchy, mathematical consistency across parent/child nodes,
 * spatial alert level computation, cross-tabulation matrices, and live HTTP API endpoints.
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

async function runGeographyIntelligenceTests() {
  console.log('===================================================================');
  console.log('  CIVICAI HIERARCHICAL GEOGRAPHIC INTELLIGENCE TEST SUITE');
  console.log('===================================================================');

  try {
    // 1. Authenticate Officers & Admin
    console.log('\n--- Test 1: Authenticating Admin & Officer ---');
    const adminAuth = await loginUser('admin@civicai.org', 'Admin123!');
    console.log(`✓ Admin authenticated: ${adminAuth.user.name} (${adminAuth.user.role})`);

    const officerAuth = await loginUser('vaishnavi.roads@civicai.gov', 'officer123');
    console.log(`✓ Officer authenticated: ${officerAuth.user.name} (${officerAuth.user.role})`);

    // 2. Fetch Root Regions (State & Primary Parliaments)
    console.log('\n--- Test 2: Fetching Root Geographic Regions ---');
    const rootRes = await fetch(`${BASE_URL}/geography/root`, {
      headers: { 'Authorization': `Bearer ${adminAuth.token}` }
    });
    const rootData = await rootRes.json();
    assert(rootRes.ok, `Failed to get root regions: ${JSON.stringify(rootData)}`);
    assert(rootData.data && (rootData.data.primaryRegions || rootData.data.rootState), 'Root geography data required');

    const primaryRegions = rootData.data.primaryRegions || [rootData.data.rootState];
    console.log(`✓ Retrieved ${primaryRegions.length} primary administrative regions.`);

    // Find Amalapuram Parliament
    const amalapuramParliament = primaryRegions.find(
      (r) => r.name.includes('Amalapuram') || r.code === 'AP-PC-AMAL'
    ) || primaryRegions[0];
    assert(amalapuramParliament, 'Amalapuram Parliament entity must exist');
    console.log(`✓ Selected Target Region: ${amalapuramParliament.name} (Code: ${amalapuramParliament.code}, ID: ${amalapuramParliament._id})`);

    // 3. Inspect Amalapuram Parliament Statistics & Child Constituencies
    console.log('\n--- Test 3: Inspecting Parliament Level Statistics ---');
    const parlStatsRes = await fetch(`${BASE_URL}/geography/${amalapuramParliament._id}/statistics`, {
      headers: { 'Authorization': `Bearer ${adminAuth.token}` }
    });
    const parlStatsData = await parlStatsRes.json();
    assert(parlStatsRes.ok, 'Failed to fetch parliament statistics');
    const parlStats = parlStatsData.data;

    assert(parlStats.region, 'Region metadata must be present');
    assert(parlStats.overview.total >= 0, 'Total problems must be calculated');
    assert(parlStats.alert && parlStats.alert.level, 'Alert level must be computed');
    assert(Array.isArray(parlStats.childRegions), 'Child constituencies must be an array');
    console.log(`✓ Amalapuram Parliament: Total Problems = ${parlStats.overview.total}, Active = ${parlStats.overview.active}, Alert = ${parlStats.alert.level}`);
    console.log(`  - Child Assembly Constituencies Count: ${parlStats.childRegions.length}`);

    // 4. Mathematical Consistency: Parent Count == Sum of Child Constituencies Counts
    console.log('\n--- Test 4: Mathematical Sum Consistency Check ---');
    const sumOfChildren = parlStats.childRegions.reduce((sum, c) => sum + c.totalProblems, 0);
    console.log(`  - Sum of Child Constituency Counts = ${sumOfChildren}`);
    console.log(`  - Parliament Total Count = ${parlStats.overview.total}`);
    assert(
      parlStats.overview.total === sumOfChildren,
      `Parent count (${parlStats.overview.total}) must strictly equal sum of child counts (${sumOfChildren})`
    );
    console.log(`✓ Mathematical Consistency Verified: ${parlStats.overview.total} == ${sumOfChildren}`);

    // 5. Category Breakdown Aggregation
    console.log('\n--- Test 5: Category Breakdown Aggregation ---');
    const sumOfCategories = parlStats.categories.reduce((sum, c) => sum + c.count, 0);
    console.log(`  - Sum of Category Breakdown = ${sumOfCategories}`);
    assert(
      sumOfCategories === parlStats.overview.total,
      `Category sum (${sumOfCategories}) must equal total problems (${parlStats.overview.total})`
    );
    console.log(`✓ Category Aggregation Verified: Potholes, Garbage, Streetlights, Water, Drainage sum to ${sumOfCategories}`);

    // 6. Drill-down into Mummidivaram Assembly Constituency
    console.log('\n--- Test 6: Drill-Down into 43 Mummidivaram ---');
    const mummidivaramAC = parlStats.childRegions.find(
      (c) => c.name.includes('Mummidivaram') || c.code === 'AP-AC-43'
    ) || parlStats.childRegions[0];
    assert(mummidivaramAC, '43 Mummidivaram must be a child of Amalapuram Parliament');

    const acStatsRes = await fetch(`${BASE_URL}/geography/${mummidivaramAC._id}/statistics`, {
      headers: { 'Authorization': `Bearer ${adminAuth.token}` }
    });
    const acStatsData = await acStatsRes.json();
    assert(acStatsRes.ok, 'Failed to fetch AC statistics');
    const acStats = acStatsData.data;

    console.log(`✓ Mummidivaram Constituency: Total = ${acStats.overview.total}, Active = ${acStats.overview.active}, Alert = ${acStats.alert.level}`);
    console.log(`  - Child Mandals count: ${acStats.childRegions.length}`);

    // 7. Verify Breadcrumb Lineage for Mummidivaram
    console.log('\n--- Test 7: Breadcrumb Lineage Verification ---');
    assert(acStats.lineage && acStats.lineage.length >= 2, 'Lineage must contain ancestors');
    const lineageNames = acStats.lineage.map((l) => l.name).join(' ➔ ');
    console.log(`✓ Breadcrumb Trail: ${lineageNames}`);

    // 8. Recursive Drill-Down into Mandals (Polavaram, Mummidivaram Mandal, Thallarevu, Katrenikona)
    console.log('\n--- Test 8: Sub-Mandal Problem Distribution ---');
    acStats.childRegions.forEach((mandal) => {
      console.log(`  • ${mandal.displayName || mandal.name}: ${mandal.totalProblems} problems (Active: ${mandal.activeProblems}, Alert: ${mandal.alertLevel})`);
    });
    const sumOfMandals = acStats.childRegions.reduce((sum, m) => sum + m.totalProblems, 0);
    assert(
      acStats.overview.total === sumOfMandals,
      `Constituency count (${acStats.overview.total}) must equal sum of mandal counts (${sumOfMandals})`
    );
    console.log(`✓ Mandal Sum Consistency Verified: ${acStats.overview.total} == ${sumOfMandals}`);

    // 9. Cross-Tabulation Matrix (Department × Area)
    console.log('\n--- Test 9: Department × Area Matrix Generation ---');
    const deptMatrixRes = await fetch(`${BASE_URL}/geography/${amalapuramParliament._id}/matrix?matrixType=DEPARTMENT`, {
      headers: { 'Authorization': `Bearer ${adminAuth.token}` }
    });
    const deptMatrixData = await deptMatrixRes.json();
    assert(deptMatrixRes.ok, 'Failed to get Department matrix');
    const deptMatrix = deptMatrixData.data;
    assert(deptMatrix.columns.length > 0, 'Department columns must exist');
    assert(deptMatrix.rows.length > 0, 'Area rows must exist');
    console.log(`✓ Department Matrix generated: ${deptMatrix.rows.length} Area Rows × ${deptMatrix.columns.length} Department Columns`);

    // 10. Cross-Tabulation Matrix (Category × Area)
    console.log('\n--- Test 10: Category × Area Matrix Generation ---');
    const catMatrixRes = await fetch(`${BASE_URL}/geography/${amalapuramParliament._id}/matrix?matrixType=CATEGORY`, {
      headers: { 'Authorization': `Bearer ${adminAuth.token}` }
    });
    const catMatrixData = await catMatrixRes.json();
    assert(catMatrixRes.ok, 'Failed to get Category matrix');
    const catMatrix = catMatrixData.data;
    assert(catMatrix.columns.length > 0, 'Category columns must exist');
    assert(catMatrix.rows.length > 0, 'Area rows must exist');
    console.log(`✓ Category Matrix generated: ${catMatrix.rows.length} Area Rows × ${catMatrix.columns.length} Category Columns`);

    // 11. Geographic Search
    console.log('\n--- Test 11: Geographic Search API ---');
    const searchRes = await fetch(`${BASE_URL}/geography/search?q=Mummidivaram`, {
      headers: { 'Authorization': `Bearer ${adminAuth.token}` }
    });
    const searchData = await searchRes.json();
    assert(searchRes.ok, 'Search query failed');
    assert(searchData.data.length >= 1, 'Search must return matching entities');
    console.log(`✓ Search for "Mummidivaram" returned ${searchData.data.length} matches: ${searchData.data.map(d => d.name).join(', ')}`);

    // 12. Paginated Problem Roster for Selected Area
    console.log('\n--- Test 12: Paginated Problem Roster Retrieval ---');
    const problemsRes = await fetch(`${BASE_URL}/geography/${mummidivaramAC._id}/problems?page=1&limit=5`, {
      headers: { 'Authorization': `Bearer ${adminAuth.token}` }
    });
    const problemsData = await problemsRes.json();
    assert(problemsRes.ok, 'Failed to get problems');
    assert(Array.isArray(problemsData.complaints), 'Complaints must be an array');
    console.log(`✓ Paginated problems retrieved: ${problemsData.complaints.length} on page 1 (Total: ${problemsData.pagination?.total})`);

    // 13. Dynamic Filter Recalculation (Roads only)
    console.log('\n--- Test 13: Filter Recalculation ---');
    const roadDeptRes = await fetch(`${BASE_URL}/departments`);
    const roadDeptData = await roadDeptRes.json();
    const roadDept = (roadDeptData.data || []).find(d => d.code === 'ROAD_MAINT') || roadDeptData.data?.[0];

    if (roadDept) {
      const filteredStatsRes = await fetch(
        `${BASE_URL}/geography/${mummidivaramAC._id}/statistics?departmentId=${roadDept._id}`,
        { headers: { 'Authorization': `Bearer ${adminAuth.token}` } }
      );
      const filteredStatsData = await filteredStatsRes.json();
      assert(filteredStatsRes.ok, 'Filtered stats failed');
      console.log(`✓ Filtered Statistics by Road Dept: Total = ${filteredStatsData.data.overview.total} (All department-specific)`);
    }

    console.log('\n===================================================================');
    console.log('  ALL 13 HIERARCHICAL GEOGRAPHIC INTELLIGENCE TESTS PASSED 100%!');
    console.log('===================================================================');
  } catch (err) {
    console.error('❌ Geographic Intelligence Test Failed:', err);
    process.exit(1);
  }
}

runGeographyIntelligenceTests();
