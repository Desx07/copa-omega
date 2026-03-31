const pptxgen = require('pptxgenjs');
const path = require('path');
const html2pptx = require('../../.claude/skills/pptx/scripts/html2pptx');

async function buildPresentation() {
  const pptx = new pptxgen();
  pptx.layout = 'LAYOUT_16x9';
  pptx.author = 'Bladers Santa Fe';
  pptx.title = 'Estrellas y Omega Coins - Guia para Bladers';
  pptx.subject = 'Sistemas de Juego Copa Omega Star';

  const slidesDir = path.resolve(__dirname);

  const slideFiles = [
    'slide01-title.html',
    'slide02-que-son.html',
    'slide03-estrellas-vs-coins.html',
    'slide04-como-ganar.html',
    'slide05-torneo.html',
    'slide06-retos.html',
    'slide07-store.html',
    'slide08-como-empezar.html',
    'slide09-tabla-valores.html',
    'slide10-reglas.html',
    'slide11-jornada.html',
    'slide12-cuando-arranca.html',
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

  const outputPath = path.resolve(__dirname, '..', 'omega-coins-guia-bladers.pptx');
  await pptx.writeFile({ fileName: outputPath });
  console.log(`\nPresentation saved to: ${outputPath}`);
}

buildPresentation().catch(err => {
  console.error('Build failed:', err.message);
  process.exit(1);
});
