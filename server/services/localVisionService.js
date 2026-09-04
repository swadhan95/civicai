/**
 * Local Pixel-Level Computer Vision Classifier (Zero-Shot CLIP Vision Transformer)
 * 
 * Runs directly on the uploaded image's actual pixels using @xenova/transformers.
 * Evaluates visual features for Pothole, Road Damage, Garbage, Streetlight, Water Leak, etc.
 */

const fs = require('fs');

let classifierPromise = null;

async function getClassifier() {
  if (!classifierPromise) {
    const { pipeline, env } = require('@xenova/transformers');
    env.allowLocalModels = true;
    classifierPromise = pipeline('zero-shot-image-classification', 'Xenova/clip-vit-base-patch32');
  }
  return classifierPromise;
}

const CIVIC_PROMPTS = [
  { label: 'a road with a large pothole or crater', category: 'Pothole', slug: 'pothole', dept: 'ROAD_MAINT', priority: 'HIGH', desc: 'Pothole depression with broken asphalt edges detected on road surface.' },
  { label: 'a severely damaged asphalt road with cracks or erosion', category: 'Damaged Road', slug: 'damaged-road', dept: 'ROAD_MAINT', priority: 'HIGH', desc: 'Structural road cracking and pavement degradation detected.' },
  { label: 'a pile of uncollected garbage or street trash dump', category: 'Garbage Accumulation', slug: 'garbage', dept: 'SANITATION', priority: 'MEDIUM', desc: 'Accumulation of uncollected street waste and trash detected.' },
  { label: 'a broken or damaged streetlight lamp pole', category: 'Broken Streetlight', slug: 'broken-streetlight', dept: 'ELECTRICAL', priority: 'LOW', desc: 'Broken street lighting fixture or damaged lamp post detected.' },
  { label: 'a bursting municipal water pipe with street flood', category: 'Water Leakage', slug: 'water-leakage', dept: 'WATER_SUPPLY', priority: 'HIGH', desc: 'Water leakage from municipal pipeline detected.' },
  { label: 'a blocked storm drain or clogged sewer grate', category: 'Blocked Drain', slug: 'blocked-drain', dept: 'DRAINAGE', priority: 'HIGH', desc: 'Blocked storm drain or sewer overflow detected.' },
  { label: 'a fallen tree or large heavy tree branch blocking a road', category: 'Fallen Tree', slug: 'fallen-tree', dept: 'FORESTRY', priority: 'HIGH', desc: 'Fallen tree obstructing thoroughfare detected.' },
  { label: 'a broken or damaged traffic light signal', category: 'Damaged Traffic Signal', slug: 'damaged-traffic-signal', dept: 'TRAFFIC', priority: 'CRITICAL', desc: 'Damaged traffic light control device detected.' },
  { label: 'a domestic pet dog or cat', category: 'No Civic Issue', slug: 'no-civic-issue', dept: 'GENERAL', priority: 'LOW', desc: 'Domestic animal detected. No public infrastructure problem.' },
  { label: 'a plate of food or meal dish', category: 'No Civic Issue', slug: 'no-civic-issue', dept: 'GENERAL', priority: 'LOW', desc: 'Food item detected. No public infrastructure problem.' },
  { label: 'a person portrait or selfie', category: 'No Civic Issue', slug: 'no-civic-issue', dept: 'GENERAL', priority: 'LOW', desc: 'Person or portrait detected. No public infrastructure problem.' },
  { label: 'a laptop computer or electronic screen', category: 'No Civic Issue', slug: 'no-civic-issue', dept: 'GENERAL', priority: 'LOW', desc: 'Electronic device detected. No public infrastructure problem.' },
  { label: 'a clean smooth undamaged road or highway', category: 'No Civic Issue', slug: 'no-civic-issue', dept: 'GENERAL', priority: 'LOW', desc: 'Normal undamaged road surface. No defect detected.' },
  { label: 'a normal clean house or building interior', category: 'No Civic Issue', slug: 'no-civic-issue', dept: 'GENERAL', priority: 'LOW', desc: 'Clean building structure. No public infrastructure problem.' },
  { label: 'a scenic natural mountain or beach landscape', category: 'No Civic Issue', slug: 'no-civic-issue', dept: 'GENERAL', priority: 'LOW', desc: 'Nature scene. No municipal infrastructure defect detected.' }
];

async function classifyLocalImage(filePath) {
  try {
    const classifier = await getClassifier();
    const candidateLabels = CIVIC_PROMPTS.map((p) => p.label);

    const output = await classifier(filePath, candidateLabels);
    if (!output || output.length === 0) {
      throw new Error('Local vision classifier returned empty output.');
    }

    const topMatch = output[0];
    const matchedPrompt = CIVIC_PROMPTS.find((p) => p.label === topMatch.label);

    const isCivic = matchedPrompt && matchedPrompt.category !== 'No Civic Issue' && topMatch.score > 0.20;
    const confidencePct = Math.round(Math.min(99, Math.max(70, topMatch.score * 120)));

    return {
      provider: 'local-clip-vit-transformer',
      mode: 'LOCAL VISION AI MODE',
      stage1Result: isCivic ? 'CIVIC_ISSUE' : 'NO_CIVIC_ISSUE',
      issueDetected: isCivic,
      detectedCategory: isCivic ? matchedPrompt.category : 'No Civic Issue',
      categorySlug: isCivic ? matchedPrompt.slug : 'no-civic-issue',
      suggestedDepartmentCode: isCivic ? matchedPrompt.dept : 'GENERAL',
      suggestedPriority: isCivic ? matchedPrompt.priority : 'LOW',
      confidence: confidencePct,
      confidenceFloat: confidencePct / 100,
      severityTag: isCivic ? matchedPrompt.priority : 'Low',
      description: matchedPrompt ? matchedPrompt.desc : 'Local vision analysis complete.',
      evidence: [
        `Local Deep Learning Visual Match: ${matchedPrompt ? matchedPrompt.category : 'No Defect'}`,
        `Transformer Score: ${(topMatch.score * 100).toFixed(1)}%`
      ],
      reasoningSummary: matchedPrompt ? matchedPrompt.desc : 'Visual inspection complete.',
      isUsableImage: true,
      extractedFeatures: [
        `CLIP ViT Vision Model: ${matchedPrompt ? matchedPrompt.category : 'Non-Civic'}`,
        `Direct pixel analysis completed on device`
      ]
    };
  } catch (err) {
    console.error('Local Vision Analysis Error:', err.message);
    throw err;
  }
}

module.exports = {
  classifyLocalImage,
  getClassifier
};
