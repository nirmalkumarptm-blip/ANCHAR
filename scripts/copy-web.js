
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

console.log("ANCHAR web files copied successfully!");
