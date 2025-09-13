const express = require('express');
const cors = require('cors');
const PDFDocument = require('pdfkit');

const app = express();

// ✅ Middleware CORS global
app.use(cors({
  origin: '*', // ← en prod, remplace * par l'URL de ton front (ex: https://figma.make...)
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type']
}));



const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.post('/api/pdfkit', (req, res) => {
  const data = req.body;

  const doc = new PDFDocument({ size: 'A4', margin: 40 });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename=rapport.pdf');

  doc.pipe(res);

  // 💡 Style de base
  doc.font('Helvetica');
  const orange = '#F26B00';
  const blue = '#164194';

  // 🔹 Logo / en-tête (à compléter si tu veux intégrer des images)
  doc
    .fontSize(22)
    .fillColor(blue)
    .text('ECI', 40, 40);

  doc
    .fontSize(10)
    .fillColor('black')
    .text("Expertises, Conseils, Ingénierie\nMaîtrise d'œuvre...", 40, 70);

  // 🔸 Données client
  doc
    .fontSize(12)
    .fillColor('black')
    .text(`Client : ${data.client_name || ''}`, 350, 40)
    .text(`Adresse : ${data.client_address || ''}`, 350, 60)
    .text(`Représenté par : ${data.representative || ''}`, 350, 80);

  // 🔹 Infos installation
  doc
    .fontSize(12)
    .text(`Adresse installation : ${data.installation_address || ''}`, 40, 150)
    .fillColor(orange)
    .text(`${(data.service_titles || []).join(', ')}`, { align: 'center' })
    .fillColor('black')
    .text(`Référence : ${data.installation_ref || ''}`, { align: 'center' });

  // 🔹 Section 1 - Préambule
  doc
    .moveDown(2)
    .fontSize(14)
    .fillColor(orange)
    .text('1 – Préambule', { underline: true });

  doc
    .moveDown(0.5)
    .fillColor('black')
    .fontSize(12)
    .text(`Date de l'audit : ${data.audit_date || ''}`)
    .text(`Commentaire : ${data.audit_date_note || ''}`)
    .text(`Date du rapport : ${data.report_date || ''}`)
    .text(`Objet : ${data.report_objects || ''}`);

  // 🔹 Section 2 - Prestataire
  doc
    .moveDown(1.5)
    .fontSize(14)
    .fillColor(orange)
    .text('2 – Prestataire de maintenance & identification');

  doc
    .moveDown(0.5)
    .fontSize(12)
    .fillColor('black')
    .text(`Prestataire : ${data.maintenance_provider || ''}`)
    .text(`Identifiant : ${data.maintenance_provider_id || ''}`);

  doc.end();
});

app.listen(port, () => {
  console.log(`✅ Serveur PDFKit en ligne sur http://localhost:${port}`);
});

app.options('/api/pdfkit', cors());