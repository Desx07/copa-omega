const pptxgen = require('pptxgenjs');
const path = require('path');
const html2pptx = require('../../.claude/skills/pptx/scripts/html2pptx');

async function buildPresentation() {
  const pptx = new pptxgen();
  pptx.layout = 'LAYOUT_16x9';
  pptx.author = 'Bladers Santa Fe';
  pptx.title = 'BeyGames - Modos de Juego - Copa Omega Star';
  pptx.subject = 'Nuevos modos de juego para Copa Omega Star';

  const slidesDir = path.resolve(__dirname);

  const slideFiles = [
    'slide01-title.html',
    'slide02-overview.html',
    'slide03-beypet-title.html',
    'slide04-beypet-detail.html',
    'slide05-beypet-mockup.html',
    'slide06-deck-title.html',
    'slide07-deck-detail.html',
    'slide08-deck-mockup.html',
    'slide09-gacha-title.html',
    'slide10-gacha-detail.html',
    'slide11-simulador-title.html',
    'slide12-simulador-detail.html',
    'slide13-coliseo-title.html',
    'slide14-coliseo-detail.html',
    'slide15-cartas-title.html',
    'slide16-cartas-detail.html',
    'slide17-predicciones.html',
    'slide18-closing.html',
  ];

  for (let i = 0; i < slideFiles.length; i++) {
    const filePath = path.join(slidesDir, slideFiles[i]);
    console.log(`Processing slide ${i + 1}/${slideFiles.length}: ${slideFiles[i]}`);
    try {
      await html2pptx(filePath, pptx);
      console.log(`  OK`);
    } catch (err) {
      console.error(`  ERROR on ${slideFiles[i]}:`, err.message);
      throw err;
    }
  }

  const outputPath = path.resolve(__dirname, '..', 'beygames-showcase.pptx');
  await pptx.writeFile({ fileName: outputPath });
  console.log(`\nPresentation saved to: ${outputPath}`);
}

buildPresentation().catch(err => {
  console.error('Build failed:', err.message);
  process.exit(1);
});
