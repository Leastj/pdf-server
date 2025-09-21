const express = require("express");
const cors = require("cors");
const generateReport = require("./generateReport");

const app = express();

app.use(cors());
app.use(express.json());

// ============================
// Endpoint : Génération du PDF
// ============================
app.post("/api/pdfkit", (req, res) => {
  try {
    const data = req.body;

    // appelle generateReport avec les données du front
    const doc = generateReport(data);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=rapporttest.pdf");

    doc.pipe(res);
    doc.end();
  } catch (err) {
    console.error("❌ Erreur PDF:", err);
    res.status(500).json({ error: "Erreur génération PDF" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Serveur sur http://localhost:${PORT}`);
});
