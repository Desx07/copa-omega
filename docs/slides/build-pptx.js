const pptxgen = require('pptxgenjs');
const path = require('path');
const html2pptx = require('../../.claude/skills/pptx/scripts/html2pptx');

async function buildPresentation() {
  const pptx = new pptxgen();
  pptx.layout = 'LAYOUT_16x9';
  pptx.author = 'Bladers Santa Fe';
  pptx.title = 'Sistema Economico Copa Omega Star';
  pptx.subject = 'Plan de Implementacion - Marzo 2026';

  const slidesDir = path.resolve(__dirname);

  const slideFiles = [
    'slide01-title.html',
    'slide02-estado-actual.html',
    'slide03-modelos-ref1.html',
    'slide04-modelos-ref2.html',
    'slide05-propuesta.html',
    'slide06-detalle-monedas.html',
    'slide07-ganar-estrellas.html',
    'slide08-gastar.html',
    'slide09-ganancia.html',
    'slide10-flujo.html',
    'slide11-store.html',
    'slide12-antiabuso.html',
    'slide13-fases.html',
    'slide14-comparacion.html',
    'slide15-proximos-pasos.html',
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

  const outputPath = path.resolve(__dirname, '..', 'economia-copa-omega.pptx');
  await pptx.writeFile({ fileName: outputPath });
  console.log(`\nPresentation saved to: ${outputPath}`);
}

buildPresentation().catch(err => {
  console.error('Build failed:', err.message);
  process.exit(1);
});
