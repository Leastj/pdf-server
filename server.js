const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const generateReport = require("./generateReport");

const app = express();

// Middleware général
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// ==========================
// 📸 1. Upload endpoint pour les photos
// ==========================
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
});

const upload = multer({ storage });

// Route pour uploader une photo
app.post("/api/upload", upload.single("photo"), (req, res) => {
  try {
    const fileUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
    console.log("✅ Photo enregistrée :", fileUrl);
    res.json({ url: fileUrl });
  } catch (err) {
    console.error("❌ Erreur upload :", err);
    res.status(500).json({ error: err.message });
  }
});

// Permet d’accéder aux fichiers uploadés depuis le navigateur
app.use("/uploads", express.static("uploads"));

// ==========================
// 🧾 2. Endpoint de génération PDF
// ==========================
app.post("/api/pdfkit", async (req, res) => {
  try {
    const data = req.body;
    console.log("📥 Données reçues:", data);

    const doc = await generateReport(data); // ✅ await ici

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=rapport.pdf");

    doc.pipe(res);
    doc.end();
  } catch (err) {
    console.error("❌ Erreur PDF:", err);
    res.status(500).json({ error: err.message, stack: err.stack });
  }
});

// ==========================
// 🚀 3. Lancement du serveur
// ==========================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Serveur sur http://localhost:${PORT}`));
