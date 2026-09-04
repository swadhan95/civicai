const { pipeline, env } = require('@xenova/transformers');
const fs = require('fs');

async function test() {
  console.log('Loading local zero-shot vision classifier...');
  // Use zero-shot-image-classification with MobileCLIP / CLIP
  const classifier = await pipeline('zero-shot-image-classification', 'Xenova/clip-vit-base-patch32');
  
  console.log('Classifier loaded! Testing on a dummy image...');
  // We test candidate labels for civic issues vs non-civic objects
  const labels = [
    'a road with a large pothole or crater',
    'a pile of street garbage or uncollected trash',
    'a broken or damaged streetlight pole',
    'a bursting water pipe or street water flood',
    'a damaged asphalt road with cracks',
    'a blocked storm drain or clogged sewer grate',
    'a fallen tree or branch blocking a road',
    'a broken or damaged traffic light signal',
    'a pet dog or cat',
    'a plate of food or meal',
    'a person or selfie',
    'a laptop computer or electronic device',
    'a normal clean street or road with no damage',
    'a normal clean house or building'
  ];

  console.log('Ready to test images!');
}

test().catch(console.error);
