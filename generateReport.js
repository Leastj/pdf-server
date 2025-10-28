
const PDFDocument = require("pdfkit");
const path = require("path");
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args)); // ✅ fetch CommonJS


// ============================
// Footer utilitaire
// ============================
function drawFooter(doc) {
  const FOOTER_Y = 780; // position basse
  const LEFT = 40;
  const WIDTH = 595 - 80;
  const BLUE = '#144176';

  const footerText =
`E C I - Expertises Conseils Ingénierie
Toulouse – Narbonne - Perpignan
5 Avenue Pierre-Georges Latécoère Bât B 31520 Ramonville Saint Agne – Siret : 918 911 520 00016 Rcs Toulouse – APE : 7112B
Tva Intracommunautaire N° FR04 918911520 - Téléphone : +33 7 83 87 12 10 - Email : assistance@e-c-i.fr
Toute reproduction et/ou diffusion même partielle sans accord préalable d’E C I est strictement interdite`;

  doc.font('Helvetica').fontSize(7).fillColor(BLUE);

  // Bloc unique, jamais coupé
  doc.text(footerText, LEFT, FOOTER_Y, {
    width: WIDTH,
    align: 'center',
    lineGap: 2,
    lineBreak: false, // bloque les sauts de page
    height: 50        // force la hauteur pour rester sur une seule page
  });
}

function addPageNumbers(doc) {
  const TITLE_COLOR = '#1E3A8A';
  const FONT_SIZE = 9;
  const pageTotal = doc.bufferedPageRange().count;

  for (let i = 0; i < pageTotal; i++) {
    doc.switchToPage(i);
    const pageNum = `Page ${i + 1} / ${pageTotal}`;
    const textWidth = doc.widthOfString(pageNum, { size: FONT_SIZE });
    const x = (doc.page.width - textWidth) / 2;
    const y = doc.page.height - 40;

    doc
      .font('Helvetica')
      .fontSize(FONT_SIZE)
      .fillColor(TITLE_COLOR)
      .text(pageNum, x, y);
  }
}


// ============================
// Génération du PDF
// ============================
async function generateReport(data) {
  // ✅ On crée toujours un nouveau document PDF pour chaque rapport
  const doc = new PDFDocument({ size: "A4", margin: 40 });

  // ============================
// Pagination setup
// ============================
let pageCount = 1;

// Incrémente le nombre total de pages à chaque ajout
doc.on('pageAdded', () => {
  pageCount++;
});

  // Dimensions dynamiques de la page PDF
  const PAGE_W = doc.page.width;
  const PAGE_H = doc.page.height;

  // 🎨 Couleurs globales
  const BLUE = "#144176";
  const ORANGE = "#f97415";
  const GRAY = "#f5f5f5";
  const PANEL = "#fcfcfc";

  // 📐 Marges et positions
  const LEFT = 40;
  const RIGHT_COL_X = LEFT + 320;
  const RIGHT_COL_W = 202;

  // 🖋️ Polices
  const REG = "Helvetica";
  const BOLD = "Helvetica-Bold";


  // =====================
  // PAGE 1 : COUVERTURE
  // =====================

  // Logo
  const logoPath = path.resolve(__dirname, 'assets', 'logo-eci.png');
  try {
    doc.image(logoPath, LEFT, 50, { width: 164, height: 88 });
  } catch (e) {
    doc.rect(LEFT, 50, 164, 88).stroke();
    doc.font(REG).fontSize(8).fillColor('#999').text('logo missing', LEFT + 10, 90);
  }

  // Texte à gauche
  doc.font(BOLD).fontSize(8).fillColor(BLUE)
     .text("Expertises, Conseils, Ingénierie", LEFT, 150, { width: 280 })
     .font(REG).text("Maîtrise d'œuvre & Assistance à Maîtrise d'ouvrage", { width: 280 })
     .text("Ascenseurs, Fermetures automatiques, Escalators & dérivés", { width: 280 })
     .text("Expert Judiciaire Près La Cour d'Appel de Toulouse", { width: 280 })
     .text("Membre de la Compagnie des Experts", { width: 280 });

  // Chips utilitaires
  function chip(y, h, text, { bold = false } = {}) {
    doc.save().roundedRect(RIGHT_COL_X, y, RIGHT_COL_W, h, 4).fill(GRAY).restore();
    doc.font(bold ? BOLD : REG).fontSize(8).fillColor(BLUE)
       .text(text || '', RIGHT_COL_X + 6, y + (h - 8) / 2 - 1, {
         width: RIGHT_COL_W - 12, align: 'center'
       });
  }

// Client (REG au lieu de BOLD)
doc.font(REG).fontSize(8).fillColor(BLUE)
   .text('Client', RIGHT_COL_X, 50, { width: RIGHT_COL_W, align: 'center' });
chip(68, 18, data.client_name, { bold: true });
chip(90, 30, data.client_address);

// Représentée par (REG au lieu de BOLD)
doc.font(REG).fontSize(8).fillColor(BLUE)
   .text('Représentée par', RIGHT_COL_X, 130, { width: RIGHT_COL_W, align: 'center' });
chip(148, 18, data.representative, { bold: true });
chip(170, 30, data.representative_address);

 // Bloc installation
const PANEL_Y = 210;
const PANEL_H = 177;
doc.save().roundedRect(LEFT, PANEL_Y, PAGE_W, PANEL_H, 4).fill(PANEL).restore();

// Préparation du contenu
const addrText = (data.installation_address || '').toString();
const addrWidth = PAGE_W - 20;
const serviceTitles = Array.isArray(data.service_titles) && data.service_titles.length
  ? data.service_titles.join('\n')
  : '';

const refLabel = "Référence de l'installation";

// On calcule la hauteur de chaque partie
const addrH = doc.heightOfString(addrText, {
  width: addrWidth,
  align: 'center',
  lineGap: 1.5
});
const titlesH = doc.heightOfString(serviceTitles, {
  width: addrWidth,
  align: 'center'
});
const refLabelH = doc.heightOfString(refLabel, {
  width: addrWidth,
  align: 'center'
});
const pillH = 20; // fixe

// Hauteur totale du bloc
const totalH = addrH + 12 + titlesH + 20 + refLabelH + pillH;

// Décalage pour centrer verticalement dans PANEL_H
const offsetY = PANEL_Y + (PANEL_H - totalH) / 2;

// === Dessin ===

// Adresse
doc.font(REG).fontSize(8).fillColor(BLUE)
   .text(addrText, LEFT + 10, offsetY, {
     width: addrWidth,
     align: 'center',
     lineGap: 1.5
   });

// Titres de service
const titlesY = offsetY + addrH + 12;
doc.font(BOLD).fillColor(ORANGE)
   .text(serviceTitles, LEFT + 10, titlesY, {
     width: addrWidth,
     align: 'center'
   });

// Référence (libellé)
const refY = titlesY + titlesH + 20;
doc.font(REG).fillColor(BLUE)
   .text(refLabel, LEFT, refY, { width: PAGE_W, align: 'center' });

// Pilule référence
const pillW = 110;
const pillX = LEFT + (PAGE_W - pillW) / 2;
const pillY = refY + refLabelH + 5;
doc.save().roundedRect(pillX, pillY, pillW, pillH, 4).fill('#ffffff').restore();
doc.font(BOLD).fillColor(BLUE).text(data.installation_ref, pillX, pillY + 5, { width: pillW, align: 'center' });

  // =====================
// Image de couverture (remplace le placeholder)
// =====================

// Position réservée
const IMG_W = 174;
const IMG_H = 213;
const IMG_X = LEFT + (PAGE_W - IMG_W) / 2;
const IMG_Y = PANEL_Y + PANEL_H + 16;

// Recherche la photo marquée comme "isCover"
let coverPhotoUrl = null;
if (Array.isArray(data.photo_blocks)) {
  const cover = data.photo_blocks
    .flatMap(block => block.photos || [])
    .find(photo => photo.isCover && photo.photo_url);
  if (cover) coverPhotoUrl = cover.photo_url;
}

if (coverPhotoUrl) {
  try {
    const response = await fetch(coverPhotoUrl);
    if (!response.ok) throw new Error(`Image not accessible: ${response.status}`);
    const buffer = await response.arrayBuffer();
    const imageBuffer = Buffer.from(buffer);

    // ✅ Affiche l'image sans déformation
    doc.save();
    doc.roundedRect(IMG_X, IMG_Y, IMG_W, IMG_H, 4).clip();
    doc.image(imageBuffer, IMG_X, IMG_Y, {
      fit: [IMG_W, IMG_H],     // conserve le ratio
      align: 'center',
      valign: 'center'
    });
    doc.restore();
  } catch (err) {
    console.warn("⚠️ Error loading cover image:", coverPhotoUrl, err.message);
    doc.save().roundedRect(IMG_X, IMG_Y, IMG_W, IMG_H, 4).fill('#e5e5e5').restore();
    doc.font(REG).fontSize(12).fillColor('#999').text('Image not available', IMG_X, IMG_Y + IMG_H / 2 - 6, { width: IMG_W, align: 'center' });
  }
} else {
  // Aucun cover défini → placeholder gris
  doc.save().roundedRect(IMG_X, IMG_Y, IMG_W, IMG_H, 4).fill('#e5e5e5').restore();
  doc.font(REG).fontSize(12).fillColor('#999').text('Image', IMG_X, IMG_Y + IMG_H / 2 - 6, { width: IMG_W, align: 'center' });
}

  // Footer page 1
  drawFooter(doc);

    // =====================
  // PAGE 2 : PREAMBULE
  // =====================
  doc.addPage();

  // 1 - Préambule
  doc.font(BOLD).fontSize(12).fillColor(ORANGE).text('1 - Préambule', LEFT, 60);

  const ROW_Y = 100;
  doc.font(BOLD).fontSize(8).fillColor(BLUE).text("Date de l'audit", LEFT, ROW_Y);
  doc.save().roundedRect(LEFT, ROW_Y + 15, 200, 20, 4).fill(GRAY).restore();
  doc.font(REG).fillColor(BLUE).text(data.audit_date, LEFT + 8, ROW_Y + 20, { width: 184 });

  const CMT_X = LEFT + 220;
  doc.font(BOLD).text('Commentaire', CMT_X, ROW_Y);
  doc.save().roundedRect(CMT_X, ROW_Y + 15, PAGE_W - 220, 20, 4).fill(GRAY).restore();
  doc.font(REG).text(data.audit_date_note, CMT_X + 8, ROW_Y + 19, { width: PAGE_W - 220 - 16 });

  const DATE_RAP_Y = ROW_Y + 50;
  doc.font(BOLD).text('Date de rédaction du rapport', LEFT, DATE_RAP_Y);
  doc.save().roundedRect(LEFT, DATE_RAP_Y + 15, 200, 20, 4).fill(GRAY).restore();
  doc.font(REG).text(data.report_date, LEFT + 8, DATE_RAP_Y + 20, { width: 184 });

  const OBJ_Y = DATE_RAP_Y + 50;
  doc.font(BOLD).text('Objet du rapport', LEFT, OBJ_Y);
  doc.save().roundedRect(LEFT, OBJ_Y + 15, PAGE_W, 60, 4).fill(GRAY).restore();
  doc.font(REG).fontSize(8).fillColor(BLUE)
     .text(data.report_objects, LEFT + 10, OBJ_Y + 22, { width: PAGE_W - 20 });

  // =====================
  // 2 - Prestataire
  // =====================
  const PRESTA_Y = OBJ_Y + 100;
  doc.font(BOLD).fontSize(12).fillColor(ORANGE)
     .text("2 - Prestataire de maintenance & identification de l'installation", LEFT, PRESTA_Y);

  const colW = (PAGE_W - 40) / 2;
  const col1X = LEFT;
  const col2X = LEFT + colW + 40;

  // Prestataire lors du relevé
  doc.font(REG).fontSize(8).fillColor(BLUE) // regular
     .text("Prestataire lors du relevé", col1X, PRESTA_Y + 40);
  doc.save().roundedRect(col1X, PRESTA_Y + 55, colW, 20, 4).fill(GRAY).restore();
  doc.font(REG).fillColor(BLUE)
     .text(data.maintenance_provider, col1X + 8, PRESTA_Y + 60, { width: colW - 16, align: 'center' });

  // Numéro d’identification du prestataire
  doc.font(REG).fontSize(8).fillColor(BLUE) // regular
     .text("Numéro d’identification du prestataire :", col2X, PRESTA_Y + 40);
  doc.save().roundedRect(col2X, PRESTA_Y + 55, colW, 20, 4).fill(GRAY).restore();
  doc.font(REG).fillColor(BLUE)
     .text(data.maintenance_provider_id, col2X + 8, PRESTA_Y + 60, { width: colW - 16, align: 'center' });

  // =====================
  // 3 - Caractéristiques techniques
  // =====================
  const CARAC_Y = PRESTA_Y + 120;
  doc.font(BOLD).fontSize(12).fillColor(ORANGE)
     .text("3 - Caractéristiques techniques", LEFT, CARAC_Y);

  // 3.1 - Informations générales
  doc.font(REG).fontSize(12).fillColor(ORANGE)
     .text("3.1 - Informations générales", LEFT, CARAC_Y + 30);

  // =====================
  // Tableau complet 3.1
  // =====================
  const TABLE_START_Y = CARAC_Y + 60;
  const ROW_X = LEFT;
  const ROW_W_LABEL = 200;
  const ROW_W_VALUE = PAGE_W - ROW_W_LABEL - 20;
  const ROW_H = 20;

  function drawRow(label, value, y, shaded = false) {
    const bg = shaded ? GRAY : '#ffffff';

    // Label
    doc.save().roundedRect(ROW_X, y, ROW_W_LABEL, ROW_H, 2).fill(bg).restore();
    doc.font(BOLD).fontSize(8).fillColor(BLUE)
       .text(label, ROW_X + 6, y + 5, { width: ROW_W_LABEL - 12 });

    // Valeur
    doc.save().roundedRect(ROW_X + ROW_W_LABEL + 20, y, ROW_W_VALUE, ROW_H, 2).fill(bg).restore();
    doc.font(REG).fontSize(8).fillColor(BLUE)
       .text(value || "", ROW_X + ROW_W_LABEL + 26, y + 5, { width: ROW_W_VALUE - 12 });
  }

  const rows = [
    ["Normes de référence", data.reference_standards],
    ["N° appareil installateur / mainteneur", data.installer_maintainer_number],
    ["Type appareil", data.device_type],
    ["Type bâtiment", data.building_type],
    ["ERP", data.erp],
    ["IGH", data.igh],
    ["ERT", data.ert],
    ["Emplacement de l'installation", data.installation_location],
    ["Situation de l'installation", data.installation_situation],
    ["Nombre d'étage du bâtiment", data.building_floors],
    ["Marque origine", data.original_brand],
    ["Marque entretien", data.maintenance_brand],
    ["Date installation", data.installation_date],
    ["Appareil rénové", data.device_renovated],
    ["Date de rénovation", data.renovation_date]
  ];

  let currentY = TABLE_START_Y;
  rows.forEach((row, i) => {
    drawRow(row[0], row[1], currentY, i % 2 === 0);
    currentY += ROW_H;
  });

  
 // ---- Pagination helpers (même page style que 3.1) ----
const SAFE_BOTTOM = 760;        // doit rester < Y du footer (780)
const NEWPAGE_TOP = 60;         // où reprendre le contenu en haut
function ensureSpace(y, h = ROW_H) {
  if (y + h > SAFE_BOTTOM) {
    // terminer proprement la page courante
    drawFooter(doc);
    doc.addPage();
    return NEWPAGE_TOP;
  }
  return y;
}

// =====================
// 3.2 - Caractéristiques principales
// =====================
let sec32TitleY = ensureSpace(currentY + 40, 20);
doc.font(REG).fontSize(12).fillColor(ORANGE)
   .text("3.2 - Caractéristiques principales", LEFT, sec32TitleY);

let sec32Y = sec32TitleY + 30;
const rows32 = [
  ["Charge nominale", data.nominal_load],
  ["Nombre de personnes", data.person_count],
  ["Type régulation de vitesse", data.speed_regulation_type],
  ["Nombre de face d'accès", data.access_faces_count],
  ["Vitesse nominale", data.nominal_speed],
  ["Nombre de niveaux", data.levels_count],
  ["Désignation des niveaux", data.levels_designation],
  ["Course d'élévation", data.elevation_travel],
  ["Type de technologie", data.technology_type],
  ["Marque de l'armoire de commande", data.control_cabinet_brand],
  ["Type de manœuvre", data.maneuver_type],
  ["Marque de la traction", data.traction_brand_reference],
  ["Type de traction", data.traction_type],
  ["Nombre de câbles de traction", data.traction_cables_count],
  ["Diamètre des câbles de traction", data.traction_cable_diameter],
  ["Type de porte de cabine", data.cabin_door_type],
  ["Finition de la porte de cabine", data.cabin_door_finish],
  ["Type de porte de palier", data.landing_doors_type],
  ["Finition de la porte de palier", data.landing_doors_finish]
];

rows32.forEach((row, i) => {
  sec32Y = ensureSpace(sec32Y, ROW_H);
  drawRow(row[0], row[1], sec32Y, i % 2 === 0);
  sec32Y += ROW_H;
});

// =====================
// 3.3 - Machinerie – Caractéristiques principales
// =====================
let sec33TitleY = ensureSpace(sec32Y + 40, 20);
doc.font(REG).fontSize(12).fillColor(ORANGE)
   .text("3.3 - Machinerie – Caractéristiques principales", LEFT, sec33TitleY);

let sec33Y = sec33TitleY + 30;
const rows33 = [
  ["Position machinerie", data.machinery_position],
  ["Type accès machinerie", data.machinery_access_type],
  ["Présence de ventilation", data.ventilation_presence],
  ["Présence de crochets d'ancrage", data.anchor_hooks_presence],
  ["Ancrages estampillés", data.stamped_anchors]
];

rows33.forEach((row, i) => {
  sec33Y = ensureSpace(sec33Y, ROW_H);
  drawRow(row[0], row[1], sec33Y, i % 2 === 0);
  sec33Y += ROW_H;
});

// Footer page 3
drawFooter(doc);
// =====================

// ======= FORCER 3.4 SUR LA PAGE SUIVANTE (PAGE 4) =======
drawFooter(doc);     // termine proprement la page en cours (page 3)
doc.addPage();       // nouvelle page = page 4

// si tu as déjà défini NEWPAGE_TOP (=60) avec ensureSpace, garde-le.
// Sinon, décommente la ligne suivante :
// const NEWPAGE_TOP = 60;

// =====================
// 3.4 - Gaine
// =====================
let sec34TitleY = NEWPAGE_TOP; // démarre en haut de la nouvelle page
doc.font(REG).fontSize(12).fillColor(ORANGE)
   .text("3.4 - Gaine", LEFT, sec34TitleY);

let sec34Y = sec34TitleY + 30;
const rows34 = [
  ["Type de gaine", data.shaft_type],
  ["Largeur gaine", data.shaft_width],
  ["Profondeur gaine", data.shaft_depth],
  ["Hauteur sous dalle", data.shaft_height],
  ["Profondeur de la cuvette", data.pit_depth],
  ["Type de guides cabine", data.cabin_guides_type],
  ["Type de guides contrepoids", data.counterweight_guides_type]
];

rows34.forEach((row, i) => {
  sec34Y = ensureSpace(sec34Y, ROW_H);
  drawRow(row[0], row[1], sec34Y, i % 2 === 0);
  sec34Y += ROW_H;
});

// =====================
// 3.5 - Cabine – Caractéristiques principales
// =====================
let sec35TitleY = ensureSpace(sec34Y + 40, 20);
doc.font(REG).fontSize(12).fillColor(ORANGE)
   .text("3.5 - Cabine – Caractéristiques principales", LEFT, sec35TitleY);

let sec35Y = sec35TitleY + 30;
const rows35 = [
  ["Largeur cabine", data.cabin_width],
  ["Profondeur cabine", data.cabin_depth],
  ["Hauteur sous plafond cabine", data.cabin_height],
  ["Finition parois cabine", data.cabin_walls_finish],
  ["Type d'éclairage cabine", data.cabin_lighting_type],
  ["Finition du plafond cabine", data.cabin_ceiling_finish]
];

rows35.forEach((row, i) => {
  sec35Y = ensureSpace(sec35Y, ROW_H);
  drawRow(row[0], row[1], sec35Y, i % 2 === 0);
  sec35Y += ROW_H;
});



drawFooter(doc);

// =====================
// 4 - Évaluation de l’installation
// =====================

// Position juste après la section 3.5
let sec4TitleY = ensureSpace(sec35Y + 40, 20);
doc.font(BOLD).fontSize(12).fillColor(ORANGE)
   .text("4 - Évaluation de l’installation", LEFT, sec4TitleY);

let sec4Y = sec4TitleY + 30;

// Affiche la liste dynamique des observations
if (Array.isArray(data.installation_evaluation) && data.installation_evaluation.length > 0) {
  data.installation_evaluation.forEach((paragraph, i) => {
    sec4Y = ensureSpace(sec4Y, 40);
    doc.font(REG).fontSize(8).fillColor(BLUE)
       .text(`${i + 1}. ${paragraph}`, LEFT, sec4Y, { width: PAGE_W - 40, align: "justify" });
    sec4Y += 25;
  });
} else {
  doc.font(REG).fontSize(8).fillColor(BLUE)
     .text("Aucune observation enregistrée pour cette section.", LEFT, sec4Y);
}

// Footer standard
drawFooter(doc);

// =====================
// 5 - Évaluation de la qualité de maintenance
// =====================

let sec5TitleY = ensureSpace(sec4Y + 80, 40);

doc.font(BOLD).fontSize(12).fillColor(ORANGE)
   .text("5 - Évaluation de la qualité de maintenance", LEFT, sec5TitleY);

let sec5Y = sec5TitleY + 30;

// Affiche les paragraphes d’évaluation (liste dynamique)
if (Array.isArray(data.maintenance_quality_evaluation) && data.maintenance_quality_evaluation.length > 0) {
  data.maintenance_quality_evaluation.forEach((paragraph, i) => {
    sec5Y = ensureSpace(sec5Y, 40);
    doc.font(REG).fontSize(8).fillColor(BLUE)
       .text(`${i + 1}. ${paragraph}`, LEFT, sec5Y, { width: PAGE_W - 40, align: "justify" });
    sec5Y += 25;
  });
} else {
  doc.font(REG).fontSize(8).fillColor(BLUE)
     .text("Aucune observation enregistrée pour cette section.", LEFT, sec5Y);
}

// Footer standard
drawFooter(doc);

// =====================
// 6 - Constat
// =====================

// Nouvelle page pour le constat
doc.addPage();

let sec6TitleY = 80;
doc.font(BOLD).fontSize(12).fillColor(ORANGE)
   .text("6 - Constat", LEFT, sec6TitleY);

let sec6Y = sec6TitleY + 30;

// Liste des sous-sections avec leurs clés
const findingsSections = [
  { label: "A. En machinerie", key: "findings_machinery" },
  { label: "B. En gaine", key: "findings_shaft" },
  { label: "C. Aux paliers", key: "findings_landings" },
  { label: "D. En cabine", key: "findings_cabin" },
  { label: "E. Sur le toit de cabine", key: "findings_cabin_roof" },
  { label: "F. Sous la cabine", key: "findings_cabin_under" },
];

// Boucle sur chaque sous-section
findingsSections.forEach(section => {
  sec6Y = ensureSpace(sec6Y + 25, 40);

  // Sous-titre (A., B., etc.)
  doc.font(BOLD).fontSize(10).fillColor(BLUE)
     .text(section.label, LEFT, sec6Y);

  sec6Y += 25;

  const content = data[section.key];

  if (Array.isArray(content) && content.length > 0) {
    content.forEach((paragraph, i) => {
      sec6Y = ensureSpace(sec6Y, 40);

      // Calcul hauteur du texte
      const textHeight = doc.heightOfString(paragraph, { width: PAGE_W - 60 });
      const blockHeight = textHeight + 20; // padding vertical

      // Fond gris clair derrière le texte
      doc.save();
      doc.rect(LEFT, sec6Y, PAGE_W - 40, blockHeight)
         .fill("#f7f7f7");
      doc.restore();

      // Texte bleu
      doc.font(REG).fontSize(8).fillColor(BLUE)
         .text(paragraph, LEFT + 10, sec6Y + 10, { width: PAGE_W - 60, align: "left" });

      sec6Y += blockHeight + 10;
    });
  } else {
    doc.font(REG).fontSize(8).fillColor(BLUE)
       .text("Aucune observation enregistrée pour cette sous-section.", LEFT + 20, sec6Y);
    sec6Y += 25;
  }
});

// Footer standard
drawFooter(doc);

// ======================
  // 7 - Photographies des installations
  // ======================
  doc.addPage();
  let sec7Y = 80;
  doc.font(BOLD).fontSize(12).fillColor(ORANGE)
    .text("7 - Photographies des installations", LEFT, sec7Y);
  sec7Y += 40;

  if (Array.isArray(data.photo_blocks) && data.photo_blocks.length > 0) {
    for (const [blockIndex, block] of data.photo_blocks.entries()) {
      sec7Y = ensureSpace(sec7Y, 100);
      doc.font(BOLD).fontSize(10).fillColor(BLUE)
        .text(`Groupe ${blockIndex + 1} : ${block.constat_type || "Type non spécifié"}`, LEFT, sec7Y);
      sec7Y += 20;

      if (Array.isArray(block.photos) && block.photos.length > 0) {
        const photoSize = 120;
        const marginX = 30;
        let x = LEFT;
        let y = sec7Y;

        for (const photo of block.photos) {
          if (!photo.photo_url) continue;

          if (x + photoSize > PAGE_W - 50) {
            x = LEFT;
            y += photoSize + 60;
          }

try {
  const response = await fetch(photo.photo_url);
  if (!response.ok) throw new Error(`Image non accessible: ${response.status}`);
  const buffer = await response.arrayBuffer();
  const imageBuffer = Buffer.from(buffer);
  doc.image(imageBuffer, x, y, { width: photoSize, height: photoSize });
} catch (err) {
  console.warn("⚠️ Erreur lors du chargement de l’image :", photo.photo_url, err.message);
  doc
    .fontSize(8)
    .fillColor("red")
    .text("Image non disponible", x, y, { width: photoSize, align: "center" });
}


          doc.font(REG).fontSize(8).fillColor(BLUE)
            .text(photo.photo_comment || "—", x, y + photoSize + 10, { width: photoSize, align: "center" });

          x += photoSize + marginX;
        }

        sec7Y = y + photoSize + 70;
      } else {
        doc.font(REG).fontSize(8).fillColor(BLUE)
          .text("Aucune photographie pour ce groupe.", LEFT, sec7Y);
        sec7Y += 25;
      }
    }
  } else {
    doc.font(REG).fontSize(8).fillColor(BLUE)
      .text("Aucune photographie enregistrée pour cette section.", LEFT, sec7Y);
  }

  drawFooter(doc);

// ==========================================
// 🧰 SECTION 8 — Prestations de maintenance
// ==========================================

if (data.maintenance_tasks && data.maintenance_tasks.length > 0) {

  const TITLE_COLOR = '#1E3A8A';
  const ORANGE = '#F97316';
  const GRAY_BG = '#F9FAFB';

  const MARGIN_X = 50;                 // marge latérale
  const PAGE_MARGIN_TOP = 60;
  const PAGE_MARGIN_BOTTOM = 80;
  const MAX_PAGE_HEIGHT = PAGE_H - PAGE_MARGIN_BOTTOM;

 
  // --- Saut de page (une seule déclaration)
let y = doc.y + 35; // ou la valeur que tu veux initialiser

const checkPageBreak = (estimatedHeight = 100) => {
  if (y + estimatedHeight > MAX_PAGE_HEIGHT) {
    doc.addPage();
    y = PAGE_MARGIN_TOP;
  }
};

  // --- Titre principal
  const titleText =
    '8 – Liste des prestations dues par le prestataire de maintenance dans le cadre de son contrat';

  // on mesure le titre avec la bonne taille de police
  doc.font(BOLD).fontSize(14);
  const titleHeight = doc.heightOfString(titleText, { width: PAGE_W - 2 * MARGIN_X });

  // vérifier AVANT d'écrire le titre, pour que le tableau suive sur la même page
  checkPageBreak(titleHeight + 24);

  doc
    .fillColor(ORANGE)
    .text(titleText, MARGIN_X, y, { width: PAGE_W - 2 * MARGIN_X });

  y += titleHeight + 12; // petit padding sous le titre

  // --- Largeur utile du tableau et colonnes (100% de la largeur utile)
  const tableW = PAGE_W - 2 * MARGIN_X;
  // proportions : défaut 28% / commentaire 36% / délai 18% / date 18%
  const colW = [
    Math.floor(tableW * 0.28),
    Math.floor(tableW * 0.36),
    Math.floor(tableW * 0.18),
    tableW - Math.floor(tableW * 0.28) - Math.floor(tableW * 0.36) - Math.floor(tableW * 0.18),
  ];
  const colX = [
    MARGIN_X,
    MARGIN_X + colW[0],
    MARGIN_X + colW[0] + colW[1],
    MARGIN_X + colW[0] + colW[1] + colW[2],
  ];

  for (const task of data.maintenance_tasks) {
    // 🔸 Localisation
    checkPageBreak(30);
    doc.font(BOLD).fontSize(13).fillColor(ORANGE).text(task.location || '-', MARGIN_X, y);
    y = doc.y + 8;

    if (Array.isArray(task.elements) && task.elements.length > 0) {
      for (const el of task.elements) {
        // 🔧 Élément
        checkPageBreak(32);
        doc.font(BOLD).fontSize(12).fillColor(TITLE_COLOR)
          .text(`Élément : ${el.element || '-'}`, MARGIN_X, y);
        y = doc.y + 8;

        // 🟦 Entêtes
        const headerH = 32;
        checkPageBreak(headerH);

        doc.save()
          .fillColor(TITLE_COLOR)
          .rect(MARGIN_X, y, tableW, headerH)
          .fill()
          .restore();

        doc.font(BOLD).fontSize(9.5).fillColor('white');
        const headers = [
          'Défaut',
          'Commentaire',
          'Délai souhaité de réalisation',
          'Date effective de réalisation',
        ];
        headers.forEach((h, i) => {
          doc.text(h, colX[i] + 6, y + 7, { width: colW[i] - 12, lineGap: 0.5 });
        });

        y += headerH;

        // 🧩 Lignes
        let rowIndex = 0;
        const defects = Array.isArray(el.defects) ? el.defects : [];
        for (const def of defects) {
          const rowH = 32;
          checkPageBreak(rowH);

          // alternance de fond
          const rowColor = rowIndex % 2 === 0 ? GRAY_BG : 'white';
          doc.save().fillColor(rowColor).rect(MARGIN_X, y, tableW, rowH).fill().restore();

          // valeurs
          doc.font(REG).fontSize(10).fillColor('#111827'); // gris très foncé
          const values = [
            def.defect || '',
            def.comment || '',
            def.max_due_date || '—',
            def.completion_date || '—',
          ];
          values.forEach((v, i) => {
            doc.text(v, colX[i] + 6, y + 9, { width: colW[i] - 12 });
          });

          y += rowH;
          rowIndex++;
        }

        y += 14; // spacing entre éléments
      }
    }

    y += 18; // spacing entre localisations
  }
}

// 🧾 --- Vérifie s’il reste assez de place pour la section suivante (section 9)
if (y > PAGE_H - 250) {   // Si la fin de la page est trop proche
  doc.addPage();
  y = 60; // remet la marge top standard
} else {
  y += 40; // sinon, petit padding visuel
}


// ==========================================
// 🧾 SECTION 9 — Prestations à charge du propriétaire
// ==========================================


if (data.owner_tasks && data.owner_tasks.length > 0) {
  // 🔹 Garder les mêmes constantes
  const TITLE_COLOR = '#1E3A8A';
  const ORANGE = '#F97316';
  const GRAY_BG = '#F9FAFB';
  const MARGIN_X = 50;
  const PAGE_MARGIN_TOP = 60;
  const PAGE_MARGIN_BOTTOM = 80;
  const MAX_PAGE_HEIGHT = PAGE_H - PAGE_MARGIN_BOTTOM;

  // ✅ NE PAS réinitialiser `y` ni redéclarer checkPageBreak()
  // On continue à la suite de la section précédente
  y += 40; // petit padding entre section 8 et 9

  // 🔸 Titre principal
  const titleText = "9 – Liste des prestations à charge du propriétaire";
  doc.font(BOLD).fontSize(14);
  const titleHeight = doc.heightOfString(titleText, { width: PAGE_W - 2 * MARGIN_X });
  checkPageBreak(titleHeight + 24);

  doc
    .fillColor(ORANGE)
    .text(titleText, MARGIN_X, y, { width: PAGE_W - 2 * MARGIN_X });
  y += titleHeight + 12;

  // --- Largeur utile du tableau
  const tableW = PAGE_W - 2 * MARGIN_X;
  const colW = [
    Math.floor(tableW * 0.25),
    Math.floor(tableW * 0.30),
    Math.floor(tableW * 0.20),
    tableW - Math.floor(tableW * 0.25) - Math.floor(tableW * 0.30) - Math.floor(tableW * 0.20),
  ];
  const colX = [
    MARGIN_X,
    MARGIN_X + colW[0],
    MARGIN_X + colW[0] + colW[1],
    MARGIN_X + colW[0] + colW[1] + colW[2],
  ];

  for (const task of data.owner_tasks) {
    // 🟧 Localisation
    checkPageBreak(30);
    doc.font(BOLD).fontSize(13).fillColor(ORANGE).text(task.location || '-', MARGIN_X, y);
    y = doc.y + 8;

    if (Array.isArray(task.elements) && task.elements.length > 0) {
      for (const el of task.elements) {
        // 🔩 Élément
        checkPageBreak(32);
        doc.font(BOLD).fontSize(12).fillColor(TITLE_COLOR)
          .text(`Élément : ${el.name || '-'}`, MARGIN_X, y);
        y = doc.y + 8;

        // --- En-têtes
        const headerH = 32;
        checkPageBreak(headerH);
        doc.save()
          .fillColor(TITLE_COLOR)
          .rect(MARGIN_X, y, tableW, headerH)
          .fill()
          .restore();

        doc.font(BOLD).fontSize(9.5).fillColor('white');
        const headers = [
          'Défaut',
          'Commentaire',
          'Montant HT (€)',
          'Montant TTC (€)',
        ];
        headers.forEach((h, i) => {
          doc.text(h, colX[i] + 6, y + 7, { width: colW[i] - 12, lineGap: 0.5 });
        });
        y += headerH;

        // --- Lignes
        let rowIndex = 0;
        const defects = Array.isArray(el.defects) ? el.defects : [];
        for (const def of defects) {
          const rowH = 32;
          checkPageBreak(rowH);

          const rowColor = rowIndex % 2 === 0 ? GRAY_BG : 'white';
          doc.save().fillColor(rowColor).rect(MARGIN_X, y, tableW, rowH).fill().restore();

          doc.font(REG).fontSize(10).fillColor('#111827');
          const values = [
            def.name || '',
            def.comment || '',
            def.cost_ht ? `${def.cost_ht} €` : '—',
            def.cost_ttc ? `${def.cost_ttc} €` : '—',
          ];
          values.forEach((v, i) => {
            doc.text(v, colX[i] + 6, y + 9, { width: colW[i] - 12 });
          });

          y += rowH;
          rowIndex++;
        }

        y += 14;
      }
    }

    y += 18;
  }
}

// 🧾 --- Vérifie s’il reste assez de place pour la section suivante (section 10)
if (y > PAGE_H - 250) {
  doc.addPage();
  y = 60;
} else {
  y += 40;
}

// ==========================================
// 🔟 SECTION 10 — Préconisation de modernisation et de sécurité datés à charge du propriétaire
// ==========================================
if (data.modernization_tasks && data.modernization_tasks.length > 0) {
  const TITLE_COLOR = '#1E3A8A';
  const ORANGE = '#F97316';
  const GRAY_BG = '#F9FAFB';
  const MARGIN_X = 50;
  const PAGE_MARGIN_TOP = 60;
  const PAGE_MARGIN_BOTTOM = 80;
  const MAX_PAGE_HEIGHT = PAGE_H - PAGE_MARGIN_BOTTOM;

  // 🔸 Titre principal
  const titleText = "10 – Préconisation de modernisation et de sécurité datés à charge du propriétaire";
  doc.font(BOLD).fontSize(14);
  const titleHeight = doc.heightOfString(titleText, { width: PAGE_W - 2 * MARGIN_X });
  checkPageBreak(titleHeight + 24);

  doc
    .fillColor(ORANGE)
    .text(titleText, MARGIN_X, y, { width: PAGE_W - 2 * MARGIN_X });
  y += titleHeight + 12;

  // --- Largeur utile du tableau
  const tableW = PAGE_W - 2 * MARGIN_X;
  // Répartition équilibrée : défaut 25%, commentaire 30%, HT 20%, TTC 20%
  const colW = [
    Math.floor(tableW * 0.25),
    Math.floor(tableW * 0.30),
    Math.floor(tableW * 0.20),
    tableW - Math.floor(tableW * 0.25) - Math.floor(tableW * 0.30) - Math.floor(tableW * 0.20),
  ];
  const colX = [
    MARGIN_X,
    MARGIN_X + colW[0],
    MARGIN_X + colW[0] + colW[1],
    MARGIN_X + colW[0] + colW[1] + colW[2],
  ];

  for (const task of data.modernization_tasks) {
    // 🟧 Localisation
    checkPageBreak(30);
    doc.font(BOLD).fontSize(13).fillColor(ORANGE).text(task.location || '-', MARGIN_X, y);
    y = doc.y + 8;

    // 🔧 Élément
    checkPageBreak(32);
    doc.font(BOLD).fontSize(12).fillColor(TITLE_COLOR)
      .text(`Élément : ${task.element || '-'}`, MARGIN_X, y);
    y = doc.y + 8;

    // --- En-têtes
    const headerH = 32;
    checkPageBreak(headerH);
    doc.save()
      .fillColor(TITLE_COLOR)
      .rect(MARGIN_X, y, tableW, headerH)
      .fill()
      .restore();

    doc.font(BOLD).fontSize(9.5).fillColor('white');
    const headers = [
      'Défaut',
      'Commentaire',
      'Montant estimé HT (€)',
      'Montant estimé TTC (€)',
    ];
    headers.forEach((h, i) => {
      doc.text(h, colX[i] + 6, y + 7, { width: colW[i] - 12, lineGap: 0.5 });
    });

    y += headerH;

    // --- Lignes
    let rowIndex = 0;
    const defects = Array.isArray(task.defects) ? task.defects : [];
    for (const def of defects) {
      const rowH = 32;
      checkPageBreak(rowH);

      const rowColor = rowIndex % 2 === 0 ? GRAY_BG : 'white';
      doc.save().fillColor(rowColor).rect(MARGIN_X, y, tableW, rowH).fill().restore();

      doc.font(REG).fontSize(10).fillColor('#111827');
      const values = [
        def.defect || '',
        def.comment || '',
        def.cost_ht ? `${def.cost_ht} €` : '—',
        def.cost_ttc ? `${def.cost_ttc} €` : '—',
      ];
      values.forEach((v, i) => {
        doc.text(v, colX[i] + 6, y + 9, { width: colW[i] - 12 });
      });

      y += rowH;
      rowIndex++;
    }

    y += 14; // padding entre localisations
  }
}

// 🧾 --- Vérifie s’il reste assez de place pour la clôture
if (y > PAGE_H - 200) {
  doc.addPage();
  y = 60;
} else {
  y += 40;
}

// ==========================================
// 🔚 SECTION 11 — Clôture du rapport
// ==========================================
const TITLE_COLOR = '#1E3A8A';
const MARGIN_X = 50;

// ✅ Si y n'existe pas encore, on le crée maintenant
if (typeof y === 'undefined') {
  y = doc.y || 60;
} else {
  y += 60;
}

// 🟧 Titre de la section
doc
  .font(BOLD)
  .fontSize(13)
  .fillColor(ORANGE)
  .text('CLÔTURE', MARGIN_X, y);
y += 25;

// 💬 Texte de conclusion
const closureText = `Nous vous souhaitons bonne réception et restons à votre disposition pour tout complément,`;
doc
  .font(REG)
  .fontSize(11)
  .fillColor(TITLE_COLOR)
  .text(closureText, MARGIN_X, y, { width: PAGE_W - 2 * MARGIN_X });
y += 40;

// Formule de politesse
doc
  .font(REG)
  .fontSize(11)
  .fillColor(TITLE_COLOR)
  .text('Cordialement,', MARGIN_X, y);
y += 35;

// Signature
doc
  .font(REG)
  .fontSize(11)
  .fillColor(TITLE_COLOR)
  .text('Fait à [Ville], le [Date]', MARGIN_X, y);
y += 35;

doc
  .font(REG)
  .fontSize(11)
  .fillColor(TITLE_COLOR)
  .text('Pour E C I', MARGIN_X, y);
y += 25;

// Nom du signataire
doc
  .font(BOLD)
  .fontSize(11)
  .fillColor(TITLE_COLOR)
  .text('Pierre-Jean SAUTJEAU', MARGIN_X, y);

// ✅ Footer + Pagination
drawFooter(doc);
addPageNumbers(doc);

// ✅ Fin du document
doc.end();
return doc;
}

module.exports = generateReport;


// ============================
// Exemple de données
// ============================
/*generateReport({
  client_name: "Client Test",
  client_address: "123 rue de la République\n75000 Paris",
  representative: "M. Dupont",
  representative_address: "45 avenue de Lyon\n69000 Lyon",
  installation_address: "JARDIN DES TUILERIES, 198766 VILLENEUVE de Maguelone, 4070 Montpellier",
  service_titles: ["Audit ascenseur", "Maintenance"],
  installation_ref: "REF-001",
  audit_date: "13/09/2025",
  audit_date_note: "Accès limité à la machinerie.",
  report_date: "13/09/2025",
  report_objects: "Vérification, Contrôle, Analyse",
  maintenance_provider: "Société X",
  maintenance_provider_id: "ID-123456",
  reference_standards: "EN 81-20 / EN 81-50",
  installer_maintainer_number: "12345-XYZ",
  device_type: "Ascenseur électrique",
  building_type: "Immeuble d’habitation",
  erp: "Oui",
  igh: "Non",
  ert: "Non",
  installation_location: "Hall principal",
  installation_situation: "Encastré",
  building_floors: "5",
  original_brand: "Otis",
  maintenance_brand: "Kone",
  installation_date: "2005",
  device_renovated: "Oui",
  renovation_date: "2018",
nominal_load: "630 kg",
  person_count: "8",
  speed_regulation_type: "VVVF",
  access_faces_count: "2",
  nominal_speed: "1 m/s",
  levels_count: "6",
  levels_designation: "RDC, 1, 2, 3, 4, 5",
  elevation_travel: "15 m",
  technology_type: "Électrique",
  control_cabinet_brand: "Schneider",
  maneuver_type: "Collective sélective",
  traction_brand_reference: "Otis Gen2",
  traction_type: "Courroie plate",
  traction_cables_count: "4",
  traction_cable_diameter: "8 mm",
  cabin_door_type: "Battante",
  cabin_door_finish: "Inox brossé",
  landing_doors_type: "Coulissantes",
  landing_doors_finish: "Peinture époxy",
  machinery_position: "En gaine",
  machinery_access_type: "Trappe sécurisée",
  ventilation_presence: "Oui",
  anchor_hooks_presence: "Oui",
  stamped_anchors: "Oui",
  // 3.4
shaft_type: "Béton",
shaft_width: "1500 mm",
shaft_depth: "1600 mm",
shaft_height: "2800 mm",
pit_depth: "1200 mm",
cabin_guides_type: "T en acier",
counterweight_guides_type: "T en acier",
// 3.5
cabin_width: "1000 mm",
cabin_depth: "1250 mm",
cabin_height: "2200 mm",
cabin_walls_finish: "Inox brossé",
cabin_lighting_type: "LED",
cabin_ceiling_finish: "Inox miroir"


});*/

