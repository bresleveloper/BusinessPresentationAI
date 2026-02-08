const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');

// Reverse Hebrew text for PDF (PDFKit doesn't support RTL natively)
function reverseHebrewForPDF(text) {
  if (!text) return '';

  // Split into lines
  const lines = text.split('\n');

  return lines.map(line => {
    if (!line.trim()) return line;

    // Split line into tokens (words, spaces, punctuation)
    const tokens = line.match(/[\u0590-\u05FF]+|[a-zA-Z0-9]+|[.,!?:;()"\-]+|\s+/g) || [line];

    // Simply reverse the token order for RTL
    // DON'T reverse the characters themselves!
    return tokens.reverse().join('');
  }).join('\n');
}

async function generatePresentationPDF(presentations, style = 'all') {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 50, bottom: 50, left: 50, right: 50 }
      });

      const chunks = [];
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Try to register Arial font (supports Hebrew on Windows)
      try {
        const arialPath = 'C:\\Windows\\Fonts\\arial.ttf';
        doc.registerFont('Arial', arialPath);
        doc.font('Arial');
      } catch (fontError) {
        console.log('Could not load Arial font, using default');
      }

      // Generate QR code for the website
      const qrCodeDataUrl = await QRCode.toDataURL('https://bizprez.bresleveloper.ai/', {
        width: 150,
        margin: 1
      });

      // Convert data URL to buffer
      const qrBuffer = Buffer.from(qrCodeDataUrl.split(',')[1], 'base64');

      // Add title
      const title = reverseHebrewForPDF('BizPrez - המצגות העסקיות שלך');
      doc.fontSize(24).text(title, { align: 'center' });
      doc.moveDown(0.5);

      const subtitle = reverseHebrewForPDF('נוצר על ידי בינה מלאכותית');
      doc.fontSize(12).text(subtitle, { align: 'center' });
      doc.moveDown(1);

      // Filter presentations by style if specified
      let filteredPresentations = presentations;
      if (style !== 'all') {
        filteredPresentations = presentations.filter(p => p.era === style);
      }

      // Add each presentation
      filteredPresentations.forEach((pres, index) => {
        if (index > 0) {
          doc.addPage();
        }

        // Era title
        let eraTitle = '';
        let eraDescription = '';

        if (pres.era === '80s') {
          eraTitle = reverseHebrewForPDF('גישת שנות ה-80');
          eraDescription = reverseHebrewForPDF('המומחה הכי גדול');
        } else if (pres.era === '2000s') {
          eraTitle = reverseHebrewForPDF('גישת שנות ה-2000');
          eraDescription = reverseHebrewForPDF('זול ואמין');
        } else if (pres.era === '2020s') {
          eraTitle = reverseHebrewForPDF('גישת שנות ה-2020-2030');
          eraDescription = reverseHebrewForPDF('אחריות על תוצאה (מומלץ)');
        }

        doc.fontSize(18).text(eraTitle, { align: 'right' });
        doc.fontSize(12).fillColor('#666').text(eraDescription, { align: 'right' });
        doc.fillColor('#000');
        doc.moveDown(1);

        // Presentation content
        const processedContent = reverseHebrewForPDF(pres.content);
        doc.fontSize(11).text(processedContent, {
          align: 'right',
          lineGap: 3
        });
      });

      // Add QR code on last page
      doc.moveDown(2);
      const qrText = reverseHebrewForPDF('סרוק כדי ליצור מצגת משלך:');
      doc.fontSize(10).text(qrText, { align: 'center' });
      doc.moveDown(0.5);
      doc.image(qrBuffer, doc.page.width / 2 - 75, doc.y, { width: 150, height: 150 });

      // Add footer
      doc.moveDown(10);
      const footerText = reverseHebrewForPDF('מופעל על ידי בינה מלאכותית | נבנה על ידי Bresleveloper AI');
      doc.fontSize(8).fillColor('#666').text(footerText, { align: 'center' });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = { generatePresentationPDF };
