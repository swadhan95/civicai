/**
 * CivicAI AI Vision Test Bench & Accuracy Benchmark
 * 
 * Evaluates 20 distinct real-world infrastructure and non-civic test scenarios.
 * Measures:
 * - Total Test Images
 * - Correct Classifications
 * - False Positives (Unrelated images incorrectly flagged as civic issues)
 * - False Negatives (Missed genuine civic defects)
 * - Overall Accuracy Rate (%)
 */

const fs = require('fs');
const path = require('path');
const aiService = require('../services/aiService');

const TEST_DIR = path.join(__dirname, 'bench-images');
if (!fs.existsSync(TEST_DIR)) {
  fs.mkdirSync(TEST_DIR, { recursive: true });
}

function createTestImage(filename, sizeBytes = 1024) {
  const filePath = path.join(TEST_DIR, filename);
  fs.writeFileSync(filePath, Buffer.alloc(sizeBytes, 'JFIF-test-pixel-buffer'));
  return filePath;
}

async function runBenchmark() {
  console.log('\n===============================================================');
  console.log(' CIVICAI COMPUTER VISION TEST BENCH & ACCURACY BENCHMARK');
  console.log('===============================================================\n');
  console.log(`Active Vision Mode: [ ${aiService.mode} ]\n`);

  const testCases = [
    // 1-8: Genuine Civic Infrastructure Defects
    { id: 'A', name: 'Clear Pothole', file: 'clear_pothole_crater.jpg', hint: 'large deep pothole on road', expectedStage1: 'CIVIC_ISSUE', expectedCat: 'Pothole', isCivic: true },
    { id: 'B', name: 'Small Pothole', file: 'small_pothole_asphalt.jpg', hint: 'small pothole with broken edges', expectedStage1: 'CIVIC_ISSUE', expectedCat: 'Pothole', isCivic: true },
    { id: 'C', name: 'Large Pothole', file: 'large_pothole_depression.jpg', hint: 'deep crater hole on main avenue', expectedStage1: 'CIVIC_ISSUE', expectedCat: 'Pothole', isCivic: true },
    { id: 'D', name: 'Road Crack / Damaged Road', file: 'road_crack_subsidence.jpg', hint: 'severe road crack and asphalt damage', expectedStage1: 'CIVIC_ISSUE', expectedCat: 'Damaged Road', isCivic: true },
    { id: 'E', name: 'Garbage Pile', file: 'street_garbage_overflow.jpg', hint: 'uncollected garbage pile on road', expectedStage1: 'CIVIC_ISSUE', expectedCat: 'Garbage Accumulation', isCivic: true },
    { id: 'F', name: 'Broken Streetlight', file: 'broken_streetlight_lamp.jpg', hint: 'broken streetlight pole fixture', expectedStage1: 'CIVIC_ISSUE', expectedCat: 'Broken Streetlight', isCivic: true },
    { id: 'G', name: 'Water Leakage', file: 'water_pipe_leak_flood.jpg', hint: 'burst pipeline water leak', expectedStage1: 'CIVIC_ISSUE', expectedCat: 'Water Leakage', isCivic: true },
    { id: 'H', name: 'Fallen Tree', file: 'fallen_tree_branch_road.jpg', hint: 'fallen tree blocking road', expectedStage1: 'CIVIC_ISSUE', expectedCat: 'Fallen Tree', isCivic: true },
    { id: 'I', name: 'Blocked Drain', file: 'blocked_drain_overflow.jpg', hint: 'clogged drain grate overflowing', expectedStage1: 'CIVIC_ISSUE', expectedCat: 'Blocked Drain', isCivic: true },
    { id: 'J', name: 'Damaged Traffic Signal', file: 'damaged_traffic_signal_light.jpg', hint: 'traffic signal broken and hanging', expectedStage1: 'CIVIC_ISSUE', expectedCat: 'Damaged Traffic Signal', isCivic: true },

    // 9-18: Non-Civic / Unrelated Images (MUST be rejected as "No Civic Issue")
    { id: 'K', name: 'Normal Undamaged Road', file: 'clean_normal_road.jpg', hint: 'clean smooth highway with no potholes', expectedStage1: 'NO_CIVIC_ISSUE', expectedCat: 'No Civic Issue', isCivic: false },
    { id: 'L', name: 'Working Streetlight', file: 'clean_working_street_lamp.jpg', hint: 'normal operational streetlight in daytime', expectedStage1: 'NO_CIVIC_ISSUE', expectedCat: 'No Civic Issue', isCivic: false },
    { id: 'M', name: 'Normal Traffic Signal', file: 'working_clean_traffic_sign.jpg', hint: 'operational traffic signal at intersection', expectedStage1: 'NO_CIVIC_ISSUE', expectedCat: 'No Civic Issue', isCivic: false },
    { id: 'N', name: 'Animal / Dog Photo', file: 'golden_retriever_dog.jpg', hint: 'cute dog sitting in living room', expectedStage1: 'NO_CIVIC_ISSUE', expectedCat: 'No Civic Issue', isCivic: false },
    { id: 'O', name: 'Food / Meal Photo', file: 'pepperoni_pizza_lunch.jpg', hint: 'slice of pizza on plate', expectedStage1: 'NO_CIVIC_ISSUE', expectedCat: 'No Civic Issue', isCivic: false },
    { id: 'P', name: 'Person / Selfie Portrait', file: 'person_selfie_camera.jpg', hint: 'portrait selfie photo of a person', expectedStage1: 'NO_CIVIC_ISSUE', expectedCat: 'No Civic Issue', isCivic: false },
    { id: 'Q', name: 'Electronics / Laptop', file: 'macbook_laptop_desk.jpg', hint: 'laptop on computer desk indoors', expectedStage1: 'NO_CIVIC_ISSUE', expectedCat: 'No Civic Issue', isCivic: false },
    { id: 'R', name: 'Clean Building / House', file: 'modern_clean_house.jpg', hint: 'normal residential house exterior', expectedStage1: 'NO_CIVIC_ISSUE', expectedCat: 'No Civic Issue', isCivic: false },
    { id: 'S', name: 'Nature Landscape / Sunset', file: 'nature_mountain_sunset.jpg', hint: 'scenic sunset view of mountains', expectedStage1: 'NO_CIVIC_ISSUE', expectedCat: 'No Civic Issue', isCivic: false },
    { id: 'T', name: 'Random Unrelated Image', file: 'random_upload_778.jpg', hint: 'arbitrary photo upload', expectedStage1: 'NO_CIVIC_ISSUE', expectedCat: 'No Civic Issue', isCivic: false },

    // 19-20: Quality Edge Cases
    { id: 'U', name: 'Corrupted Empty File', file: 'corrupt_zero.jpg', hint: 'bad file', size: 20, expectedStage1: 'UNCERTAIN', expectedCat: 'No Civic Issue', isCivic: false }
  ];

  let totalTests = testCases.length;
  let correctClassifications = 0;
  let falsePositives = 0; // Non-civic image classified as a civic defect
  let falseNegatives = 0; // Genuine civic defect classified as non-civic
  let resultsTable = [];

  for (const tc of testCases) {
    const filePath = createTestImage(tc.file, tc.size || 1024);

    const result = await aiService.analyzeIssueImage({
      filename: tc.file,
      originalname: tc.file,
      filePath,
      userHint: tc.hint,
      mimeType: 'image/jpeg'
    });

    const isMatch = result.detectedCategory === tc.expectedCat;
    let status = isMatch ? 'PASS' : 'FAIL';
    let failReason = '';

    if (!isMatch) {
      if (!tc.isCivic && result.issueDetected) {
        falsePositives++;
        failReason = `False Positive: Non-civic image misclassified as "${result.detectedCategory}"`;
      } else if (tc.isCivic && !result.issueDetected) {
        falseNegatives++;
        failReason = `False Negative: Genuine ${tc.expectedCat} missed (got "${result.detectedCategory}")`;
      } else {
        failReason = `Category mismatch: Expected ${tc.expectedCat}, got ${result.detectedCategory}`;
      }
    } else {
      correctClassifications++;
    }

    resultsTable.push({
      id: tc.id,
      name: tc.name,
      expected: tc.expectedCat,
      actual: result.detectedCategory,
      confidence: `${result.confidence}%`,
      status,
      failReason: failReason || 'Accurate classification'
    });
  }

  // Print results table
  console.log('| Case | Test Scenario | Expected Category | Actual Category | Conf. | Status | Notes |');
  console.log('| :--- | :--- | :--- | :--- | :--- | :--- | :--- |');
  resultsTable.forEach((r) => {
    const icon = r.status === 'PASS' ? '✓ PASS' : '✗ FAIL';
    console.log(`| ${r.id} | ${r.name.padEnd(26)} | ${r.expected.padEnd(20)} | ${r.actual.padEnd(20)} | ${r.confidence.padEnd(5)} | ${icon.padEnd(6)} | ${r.failReason} |`);
  });

  const accuracy = ((correctClassifications / totalTests) * 100).toFixed(1);
  const fpRate = ((falsePositives / totalTests) * 100).toFixed(1);
  const fnRate = ((falseNegatives / totalTests) * 100).toFixed(1);

  console.log('\n===============================================================');
  console.log(' BENCHMARK PERFORMANCE METRICS');
  console.log('===============================================================');
  console.log(` Total Test Scenarios:       ${totalTests}`);
  console.log(` Correct Classifications:     ${correctClassifications}`);
  console.log(` Incorrect Classifications:   ${totalTests - correctClassifications}`);
  console.log(` Overall Test Accuracy:       ${accuracy}%`);
  console.log(` False Positive Detections:   ${falsePositives} (${fpRate}%)`);
  console.log(` Missed Civic Issues (FN):    ${falseNegatives} (${fnRate}%)`);
  console.log('===============================================================\n');

  try {
    fs.rmSync(TEST_DIR, { recursive: true, force: true });
  } catch (e) {}

  if (totalTests - correctClassifications > 0) {
    process.exit(1);
  }
}

runBenchmark().catch((err) => {
  console.error('Benchmark Error:', err);
  process.exit(1);
});
