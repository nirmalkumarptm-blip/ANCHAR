
const fs = require("fs");
const path = require("path");

const sourceFiles = [
    "index.html",
    "style.css",
    "script.js"
];

const outputDir = path.join(__dirname, "..", "www");

fs.mkdirSync(outputDir, { recursive: true });

sourceFiles.forEach(file => {
    const source = path.join(__dirname, "..", file);
    const destination = path.join(outputDir, file);

    if (!fs.existsSync(source)) {
        throw new Error(`Missing file: ${file}`);
    }

    fs.copyFileSync(source, destination);
});

// Copy local jsPDF library
const vendorDir = path.join(__dirname, "..", "vendor");
const pdfSource = path.join(vendorDir, "jspdf.umd.min.js");
const pdfDestination = path.join(outputDir, "jspdf.umd.min.js");

if (!fs.existsSync(pdfSource)) {
    throw new Error("Missing jsPDF library in vendor folder.");
}

fs.copyFileSync(pdfSource, pdfDestination);

console.log("ANCHAR web files and jsPDF copied successfully!");

