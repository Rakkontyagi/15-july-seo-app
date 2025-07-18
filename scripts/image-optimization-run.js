
const fs = require('fs');
const path = require('path');
const { ImageApi } = require('../src/lib/image-optimization/image-api');

const imageApi = new ImageApi();

async function run() {
  const imagePath = process.argv[2];
  if (!imagePath) {
    console.error('Please provide a path to an image.');
    process.exit(1);
  }

  const buffer = fs.readFileSync(imagePath);

  const result = await imageApi.processAndUpload(buffer, {
    cdnOptions: {
      provider: process.env.CDN_PROVIDER || 'aws',
      path: `images/${path.basename(imagePath)}`,
    },
  });

  console.log('Image processed and uploaded:', result);
}

run();
