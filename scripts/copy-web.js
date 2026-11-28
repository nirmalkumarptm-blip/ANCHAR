const fs = require("fs");
const path = require("path");
const esbuild = require("esbuild");

const rootDir = path.join(__dirname, "..");
const outputDir = path.join(rootDir, "www");

fs.mkdirSync(outputDir, { recursive: true });

// Copy HTML and CSS
["index.html", "style.css"].forEach(file => {
    const source = path.join(rootDir, file);
    const destination = path.join(outputDir, file);

    if (!fs.existsSync(source)) {
        throw new Error(`Missing file: ${file}`);
    }

    fs.copyFileSync(source, destination);
});

// Copy jsPDF library
const pdfSource = path.join(rootDir, "vendor", "jspdf.umd.min.js");
const pdfDestination = path.join(outputDir, "jspdf.umd.min.js");

if (!fs.existsSync(pdfSource)) {
    throw new Error("Missing jsPDF library in vendor folder.");
}

fs.copyFileSync(pdfSource, pdfDestination);

// Bundle JavaScript and Capacitor plugins
esbuild.buildSync({
    entryPoints: [path.join(rootDir, "script.js")],
    bundle: true,
    platform: "browser",
    format: "iife",
    target: ["es2020"],
    outfile: path.join(outputDir, "script.js")
});

console.log("ANCHAR files and Capacitor plugins bundled successfully!");
