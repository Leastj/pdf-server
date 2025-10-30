// ==========================
// 📦 Import des dépendances
// ==========================
const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const sharp = require("sharp");
const generateReport = require("./generateReport");

const app = express();

// ==========================
// ⚙️ FIX Render + CORS + Figma
// ==========================
const allowedOrigins = [
  "https://lint-shop-36442167.figma.site",
  "http://localhost:5173",
  "https://pdf-server-qimr.onrender.com",
  "https://auditlift.e-c-i.fr" // ✅ Ajout du nouveau front production
];


// Middleware personnalisé pour CORS (plus fiable que cors())
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Credentials", "true");

  // Réponse rapide pour les prévols (OPTIONS)
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }

  next();
});


// ==========================
// 📄 Middleware global
// ==========================
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// ==========================
// 📸 Upload et compression des photos
// ==========================

// Crée le dossier d’upload s’il n’existe pas
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

// Configuration Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // max 5MB
  fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error("Format non supporté (JPG, PNG, WEBP uniquement)."));
    }
    cb(null, true);
  },
});

// Endpoint d’upload avec compression Sharp
app.post("/api/upload", upload.single("photo"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "Aucun fichier reçu" });

    const inputPath = req.file.path;
    const compressedName = `compressed-${Date.now()}${path.extname(req.file.originalname)}`;
    const outputPath = path.join(uploadDir, compressedName);

    // Compression et redimensionnement
    await sharp(inputPath)
      .resize({ width: 1600, withoutEnlargement: true })
      .jpeg({ quality: 70 })
      .toFile(outputPath);

    fs.unlinkSync(inputPath); // supprime l’original

    // Génère l’URL publique
    const fileUrl = `${req.protocol}://${req.get("host")}/uploads/${compressedName}`;
    console.log("✅ Photo uploadée et compressée :", fileUrl);

    res.json({ url: fileUrl });
  } catch (err) {
    console.error("❌ Erreur upload :", err);
    res.status(500).json({ error: err.message });
  }
});

// Rendre le dossier /uploads public
app.use("/uploads", express.static(uploadDir));

// ==========================
// 🧾 Endpoint de génération du PDF
// ==========================
app.post("/api/pdfkit", async (req, res) => {
  try {
    const data = req.body;
    console.log("📥 Données reçues pour le PDF:", Object.keys(data));

    // ✅ Génération du document PDF
    const doc = await generateReport(data);

    // ✅ Définition des headers
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=rapport.pdf");

    // ✅ On envoie le flux, sans refaire .end()
    doc.pipe(res);

    // ❌ SUPPRIMER doc.end(); (le fichier l'appelle déjà à la fin)
  } catch (err) {
    console.error("❌ Erreur PDF:", err);
    res.status(500).json({ error: err.message, stack: err.stack });
  }
});


// ==========================
// 🚀 Lancement du serveur
// ==========================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Serveur en ligne sur http://localhost:${PORT}`));
