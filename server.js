const express = require("express");
const cors = require("cors");
const generateReport = require("./generateReport");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const sharp = require("sharp"); // ✅ import Sharp

const app = express();

// ==========================
// ⚙️ Middleware général
// ==========================
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// ==========================
// 📁 Vérifie que le dossier "uploads" existe sinon le crée
// ==========================
if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}

// ==========================
// 📸 1. Configuration Multer
// ==========================
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // max 5 Mo
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error("Format de fichier non supporté. Seules les images JPG, PNG et WEBP sont autorisées."));
    }
    cb(null, true);
  },
});

// ==========================
// 📦 2. Route Upload + Compression Sharp
// ==========================
app.post("/api/upload", upload.single("photo"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "Aucun fichier reçu" });

    const inputPath = req.file.path;
    const outputPath = `uploads/compressed-${Date.now()}.jpg`;

    // Compression via Sharp
    await sharp(inputPath)
      .resize({ width: 1600, withoutEnlargement: true }) // redimensionne si trop grand
      .jpeg({ quality: 70 }) // compression sans perte visible
      .toFile(outputPath);

    // Supprime le fichier original
    fs.unlinkSync(inputPath);

    // Génère l’URL publique
    const fileUrl = `${req.protocol}://${req.get("host")}/${outputPath}`;
    console.log("✅ Photo compressée et enregistrée :", fileUrl);

    res.json({ url: fileUrl });
  } catch (err) {
    console.error("❌ Erreur upload :", err);
    res.status(500).json({ error: err.message });
  }
});

// Permet d’accéder aux fichiers uploadés depuis le navigateur
app.use("/uploads", express.static("uploads"));

// ==========================
// 🧾 3. Endpoint de génération PDF
// ==========================
app.post("/api/pdfkit", async (req, res) => {
  try {
    const data = req.body;
    console.log("📥 Données reçues:", data);

    const doc = await generateReport(data);

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
// 🚀 4. Lancement du serveur
// ==========================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Serveur sur http://localhost:${PORT}`));
