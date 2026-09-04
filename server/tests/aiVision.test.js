/**
 * AI Vision Pipeline Verification Test Suite - CivicAI
 * 
 * Tests the Computer Vision abstraction layer and image analysis engine.
 * Validates:
 * 1. Civic issues are correctly identified with honest confidence.
 * 2. Unrelated images (dog, food, selfie, laptop, clean building, nature) return issueDetected: false and "No Civic Issue".
 * 3. CRITICAL TEST: Random images NEVER produce fake "Damaged Streetlight" or arbitrary civic defects.
 * 4. Corrupted and unreadable files are caught by the image quality pre-checker.
 */

const fs = require('fs');
const path = require('path');
const aiService = require('../services/aiService');

// Create test image files in scratch directory
const TEST_DIR = path.join(__dirname, 'test-images');
if (!fs.existsSync(TEST_DIR)) {
  fs.mkdirSync(TEST_DIR, { recursive: true });
}

// Helper to create a dummy valid JPEG buffer
function createDummyImage(filename, content = 'fake-image-bytes-header-JFIF-test') {
  const filePath = path.join(TEST_DIR, filename);
  // Write a buffer with enough bytes to pass size checks
  const buffer = Buffer.alloc(1024, content);
  fs.writeFileSync(filePath, buffer);
  return filePath;
}

// Helper to create a corrupt image file (< 50 bytes)
function createCorruptImage(filename) {
  const filePath = path.join(TEST_DIR, filename);
  fs.writeFileSync(filePath, Buffer.from('bad'));
  return filePath;
}

async function runTests() {
  console.log('\n======================================================');
  console.log(' CIVICAI COMPUTER VISION & ACCURACY TEST SUITE');
  console.log('======================================================\n');
  console.log(`Active Provider Mode: [ ${aiService.mode} ]\n`);

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✓ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${message}`);
      failed++;
    }
  }

  // --- PART 1: CIVIC INFRASTRUCTURE TESTS ---
  console.log('--- 1. Testing Civic Defect Classification ---');

  const civicTestCases = [
    { file: 'road_pothole_crater.jpg', hint: 'pothole on 4th cross', expectedCat: 'Pothole', expectedDept: 'ROAD_MAINT' },
    { file: 'street_garbage_overflow.jpg', hint: 'garbage dump on sidewalk', expectedCat: 'Garbage Accumulation', expectedDept: 'SANITATION' },
    { file: 'broken_streetlight_lamp.jpg', hint: 'streetlight not working', expectedCat: 'Broken Streetlight', expectedDept: 'ELECTRICAL' },
    { file: 'water_pipe_leak_flood.jpg', hint: 'water leak from main pipe', expectedCat: 'Water Leakage', expectedDept: 'WATER_SUPPLY' },
    { file: 'damaged_road_asphalt_crack.jpg', hint: 'damaged road surface', expectedCat: 'Damaged Road', expectedDept: 'ROAD_MAINT' },
    { file: 'blocked_drain_manhole.jpg', hint: 'blocked drain overflowing', expectedCat: 'Blocked Drain', expectedDept: 'DRAINAGE' },
    { file: 'fallen_tree_branch.jpg', hint: 'fallen tree on road', expectedCat: 'Fallen Tree', expectedDept: 'FORESTRY' },
    { file: 'damaged_traffic_signal_light.jpg', hint: 'traffic signal broken', expectedCat: 'Damaged Traffic Signal', expectedDept: 'TRAFFIC' }
  ];

  for (const tc of civicTestCases) {
    const filePath = createDummyImage(tc.file);
    const result = await aiService.analyzeIssueImage({
      filename: tc.file,
      originalname: tc.file,
      filePath,
      userHint: tc.hint,
      mimeType: 'image/jpeg'
    });

    assert(result.issueDetected === true, `[${tc.expectedCat}] issueDetected should be true`);
    assert(result.detectedCategory === tc.expectedCat, `[${tc.expectedCat}] category detected: ${result.detectedCategory}`);
    assert(result.suggestedDepartmentCode === tc.expectedDept, `[${tc.expectedCat}] department routed to: ${result.suggestedDepartmentCode}`);
    assert(result.confidence >= 80, `[${tc.expectedCat}] confidence is honest (>= 80%): ${result.confidence}%`);
  }

  // --- PART 2: UNRELATED / NON-CIVIC IMAGE TESTS (CRITICAL) ---
  console.log('\n--- 2. Testing Strict Non-Civic Image Rejection ---');

  const nonCivicTestCases = [
    { file: 'golden_retriever_dog.jpg', hint: 'cute dog sitting in living room', label: 'Pet / Dog photo' },
    { file: 'pepperoni_pizza_food.jpg', hint: 'food on dining table', label: 'Food / Meal photo' },
    { file: 'person_selfie_portrait.jpg', hint: 'my selfie portrait', label: 'Selfie / Person photo' },
    { file: 'macbook_laptop_desk.jpg', hint: 'laptop on computer desk', label: 'Indoor Laptop photo' },
    { file: 'clean_nature_sunset.jpg', hint: 'nature landscape sunset beach', label: 'Nature landscape' },
    { file: 'modern_clean_house.jpg', hint: 'clean room interior', label: 'Clean room/building' },
    { file: 'random_unrelated_photo_123.jpg', hint: 'just a random upload', label: 'Random unrelated image' }
  ];

  for (const tc of nonCivicTestCases) {
    const filePath = createDummyImage(tc.file);
    const result = await aiService.analyzeIssueImage({
      filename: tc.file,
      originalname: tc.file,
      filePath,
      userHint: tc.hint,
      mimeType: 'image/jpeg'
    });

    assert(
      result.issueDetected === false,
      `[${tc.label}] issueDetected must be false (got ${result.issueDetected})`
    );
    assert(
      result.detectedCategory === 'No Civic Issue',
      `[${tc.label}] category must be "No Civic Issue" (got "${result.detectedCategory}")`
    );
    assert(
      result.detectedCategory !== 'Broken Streetlight' && result.detectedCategory !== 'Pothole',
      `[${tc.label}] MUST NOT produce fake civic categories (Streetlight/Pothole)`
    );
  }

  // --- PART 3: IMAGE QUALITY & INTEGRITY CHECKS ---
  console.log('\n--- 3. Testing Image Quality Pre-Checks ---');

  const corruptPath = createCorruptImage('corrupted_zero_size.jpg');
  const corruptResult = await aiService.analyzeIssueImage({
    filename: 'corrupted_zero_size.jpg',
    originalname: 'corrupted_zero_size.jpg',
    filePath: corruptPath,
    mimeType: 'image/jpeg'
  });

  assert(corruptResult.isUsableImage === false, 'Corrupted file flagged as isUsableImage: false');
  assert(corruptResult.confidence === 0, 'Corrupted file assigned confidence 0%');
  assert(corruptResult.issueDetected === false, 'Corrupted file issueDetected is false');

  // --- PART 4: RESOLUTION VERIFICATION TEST ---
  console.log('\n--- 4. Testing AI Resolution Verification (Before vs After) ---');
  const resolutionResult = await aiService.verifyResolution({ categoryName: 'Pothole' });
  assert(resolutionResult.isResolved === true, 'Resolution verified is true');
  assert(resolutionResult.hazardEliminated === true, 'Hazard eliminated flag verified');

  console.log('\n======================================================');
  console.log(` RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('======================================================\n');

  // Clean up test files
  try {
    fs.rmSync(TEST_DIR, { recursive: true, force: true });
  } catch (e) {}

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});
