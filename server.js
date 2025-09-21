const express = require("express");
const cors = require("cors");
const generateReport = require("./generateReport");  // ✅ doit pointer vers ton fichier

const app = express();

app.use(cors());
app.use(express.json());

app.post("/api/pdfkit", (req, res) => {
  try {
    const data = req.body;

    const doc = generateReport(data); // ✅ retourne un doc PDFKit

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=rapport.pdf");

    doc.pipe(res);
    doc.end();
  } catch (err) {
    console.error("❌ Erreur PDF tralal :", err);
    res.status(500).json({ error: "Erreur génération PDF tralala" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Serveur sur http://localhost:${PORT}`));
