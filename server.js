const express = require('express');
const cors = require('cors');
const PDFDocument = require('pdfkit');

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.post('/api/pdfkit', (req, res) => {
  const doc = new PDFDocument();
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename=rapport.pdf');
  doc.pipe(res);

  doc.fontSize(20).text('Rapport d\'expertise', { align: 'center' });
  doc.moveDown();
  doc.fontSize(12).text(`Client: ${req.body.clientName}`);
  doc.text(`Adresse: ${req.body.address}`);

  doc.end();
});

app.get('/', (req, res) => {
  res.send('PDFKit API is running 🎉');
});

app.listen(port, () => {
  console.log(`✅ Serveur PDF en ligne sur http://localhost:${port}`);
});
