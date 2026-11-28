
import { Filesystem, Directory } from "@capacitor/filesystem";
import { FileOpener } from "@capacitor-community/file-opener";
import { Capacitor } from "@capacitor/core";
import { FileSharer } from "@capgo/capacitor-file-sharer";
import { App } from "@capacitor/app";

/* =================================
   ANCHAR - JAVASCRIPT
   LOCAL DOCUMENT STORAGE
================================= */

const SPLASH_DURATION = 2000;

let enteredPin = "";
let activeCategory = "";
let activeFolderId = null;
let database = null;

const categories = [
    "Aadhaar",
    "PAN Card",
    "Bank",
    "Certificates",
    "Insurance",
    "Driving Licence"
];

/* =================================
   INDEXED DB - LOCAL STORAGE
================================= */

function openDatabase() {

    return new Promise((resolve, reject) => {

        const request = indexedDB.open("ANCHAR_VAULT", 2);

        request.onupgradeneeded = (event) => {

            const db = event.target.result;

            if (!db.objectStoreNames.contains("documents")) {

                db.createObjectStore("documents", {
                    keyPath: "id",
                    autoIncrement: true
                });

               if (!db.objectStoreNames.contains("folders")) {
               db.createObjectStore("folders", {
               keyPath: "id",
               autoIncrement: true
    });
}

            }

        };

        request.onsuccess = () => {
            database = request.result;
            resolve(database);
        };

        request.onerror = () => reject(request.error);

    });

}


function saveDocument(file, name, category, tags = [], folderId = null) {

    return new Promise((resolve, reject) => {

        const transaction = database.transaction(
            "documents",
            "readwrite"
        );

        const store = transaction.objectStore("documents");

        store.add({
            name: name,
            category: category,
            file: file,
            tags: tags,
            folderId: folderId,
            createdAt: new Date().toISOString()
        });

        transaction.oncomplete = () => resolve(true);
        transaction.onerror = () => reject(transaction.error);

    });

}


function getDocuments(category = null) {

    return new Promise((resolve, reject) => {

        const transaction = database.transaction(
            "documents",
            "readonly"
        );

        const request = transaction
            .objectStore("documents")
            .getAll();

        request.onsuccess = () => {

            let documents = request.result;

            if (category) {
                documents = documents.filter(
                    doc => doc.category === category
                );
            }

            resolve(documents);

        };

        request.onerror = () => reject(request.error);

    });

}


/* DELETE DOCUMENT FROM LOCAL DATABASE */

function deleteDocument(id) {

    return new Promise((resolve, reject) => {

        const transaction = database.transaction(
            "documents",
            "readwrite"
        );

        const store = transaction.objectStore("documents");

        store.delete(Number(id));

        transaction.oncomplete = () => resolve(true);
        transaction.onerror = () => reject(transaction.error);

    });

}

/* =================================
   START APP
================================= */

document.addEventListener("DOMContentLoaded", async () => {

    try {

        await openDatabase();

    } catch (error) {

        alert("Local storage could not be opened.");
        console.error(error);
        return;

    }

    setTimeout(() => {
        showPinScreen();
    }, SPLASH_DURATION);

});

/* =================================
   PIN SCREEN
================================= */

function showPinScreen() {

    const app = document.getElementById("app");

    app.innerHTML = `
        <main class="pin-screen">

            <div class="pin-logo">AN</div>

            <h1>ANCHAR</h1>

            <p class="pin-subtitle">
                PERSONAL DOCUMENT VAULT
            </p>

            <h2>Enter Your PIN</h2>

            <div class="pin-dots">
                <span class="dot"></span>
                <span class="dot"></span>
                <span class="dot"></span>
                <span class="dot"></span>
            </div>

            <div class="pin-message">Secure Access</div>

            <div class="pin-keypad">
                ${[1,2,3,4,5,6,7,8,9,"",0,"⌫"]
                    .map(number => `
                        <button class="pin-key"
                            data-key="${number}">
                            ${number}
                        </button>
                    `).join("")}
            </div>

            <button class="forgot-pin">Forgot PIN?</button>

        </main>
    `;

    enteredPin = "";

}

/* =================================
   DASHBOARD
================================= */

async function showDashboard() {

    const app = document.getElementById("app");

    const today = new Date().toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "long",
        year: "numeric"
    });

    const documents = await getDocuments();

    app.innerHTML = `
        <main class="dashboard">

            <header class="dashboard-header">

                <div class="brand">
                    <span class="brand-shield">AN</span>
                    <h1>ANCHAR</h1>
                </div>

                <div class="header-actions">
                    <span class="today-date">${today}</span>
                    <button class="settings-btn">⚙</button>
                </div>

            </header>

            <section class="profile-section">

                <p class="section-label">PERSONAL VAULT</p>

                <div class="profile-card" id="open-profile">

                    <div class="profile-shield">AN</div>

                    <h2>NIRMAL</h2>

                    <div class="document-count">
                        <span>${documents.length}</span>
                        <small>TOTAL DOCUMENTS</small>
                    </div>

                    <p class="profile-status">MAIN ADMIN</p>

                    <small class="open-hint">
                        TAP TO OPEN VAULT
                    </small>

                </div>

            </section>

        </main>
    `;

}

/* =================================
   CATEGORY SCREEN
================================= */

function showCategories() {

    const app = document.getElementById("app");

    app.innerHTML = `
        <main class="dashboard">

            <header class="dashboard-header">

                <div class="brand">
                    <span class="brand-shield">AN</span>
                    <h1>ANCHAR</h1>
                </div>

                <button class="settings-btn" id="back-home">←</button>

            </header>

            <section class="categories-section">

                <h2>NIRMAL'S DOCUMENTS</h2>

                <p>Select a document category</p>

                <div class="category-grid">

                    ${categories.map((name, index) => `
                        <button class="category-card"
                            data-category="${name}">

                            <span class="category-number">
                                ${String(index + 1).padStart(2, "0")}
                            </span>

                            <span>${name}</span>

                        </button>
                    `).join("")}

                </div>

            </section>

        </main>
    `;

}

/* =================================
   DOCUMENT SCREEN
================================= */


async function showDocuments(category) {

    activeCategory = category;

    const app = document.getElementById("app");

    const allDocuments = await getDocuments(category);

const documents = allDocuments.filter(doc =>
    (doc.folderId || null) === activeFolderId
);

const folders = await getFolders(category, activeFolderId);
   const currentFolder = activeFolderId
    ? await getFolderById(activeFolderId)
    : null;

    app.innerHTML = `
        <main class="dashboard">

            <header class="dashboard-header">

                <div class="brand">
                    <span class="brand-shield">AN</span>
                    <h1>ANCHAR</h1>
                </div>

                <button class="settings-btn" id="back-categories">
                    ←
                </button>

            </header>

            <section class="categories-section">

                <p class="section-label">NIRMAL'S VAULT</p>

                <h2>${escapeHTML(category)}</h2>

                ${currentFolder ? `
    <button id="back-folder">
        ← Back to Parent Folder
    </button>
` : ""}

                <p>Your ${escapeHTML(category)} documents</p>

                <div class="document-actions">

                    <button class="add-document-btn" id="create-folder">
                        + Create Folder
                    </button>

                    <button class="add-document-btn" id="add-document">
                        + Add Document
                    </button>

                </div>

                <div class="saved-documents">

                    ${folders.length ? folders.map(folder => `
                        <div class="saved-document">

                            <h3>📁 ${escapeHTML(folder.name)}</h3>

                            <button data-open-folder="${folder.id}">
                                Open Folder
                            </button>

                            <p>Folder</p>

                            <button data-rename-folder="${folder.id}">
                                Rename
                            </button>

                            <button data-create-subfolder="${folder.id}">
                                + Subfolder
                            </button>

                            <button data-delete-folder="${folder.id}">
                                Delete
                            </button>

                        </div>
                    `).join("") : ""}

                    ${documents.length ? documents.map(doc => `
                        <div class="saved-document">

                            <h3>${escapeHTML(doc.name)}</h3>

                            <p>PDF Document</p>

                            <div class="document-tags">
                                ${(doc.tags || []).map(tag => `
                                    <span class="document-tag">
                                        ${escapeHTML(tag)}
                                    </span>
                                `).join("")}
                            </div>

                            <button data-view="${doc.id}">
                                View
                            </button>

                            <button data-download="${doc.id}">
                                Download
                            </button>

                            <button data-delete="${doc.id}">
                                Delete
                            </button>

                        </div>
                    `).join("") : ""}

                    ${!folders.length && !documents.length ? `
                        <div class="empty-documents">
                            <div class="empty-icon">◇</div>
                            <h3>No Documents Yet</h3>
                            <p>Your folders and documents will appear here.</p>
                        </div>
                    ` : ""}

                </div>

            </section>

        </main>
    `;
}


function escapeHTML(value) {

    return String(value).replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    })[char]);

}

/* =================================
   FILE INPUTS
================================= */

const pdfInput = document.createElement("input");

pdfInput.type = "file";
pdfInput.accept = "application/pdf,.pdf";
pdfInput.style.display = "none";

document.body.appendChild(pdfInput);

const cameraInput = document.createElement("input");

cameraInput.type = "file";
cameraInput.accept = "image/*";
cameraInput.setAttribute("capture", "environment");
cameraInput.style.display = "none";

document.body.appendChild(cameraInput);

/* =================================
   ADD DOCUMENT POPUP
================================= */

function showUploadPopup() {

    document.querySelector(".upload-popup")?.remove();

    const popup = document.createElement("div");

    popup.className = "upload-popup";

    popup.innerHTML = `
        <div class="upload-box">

            <h2>Add Document</h2>

            <p>Choose your upload method</p>

            <button id="choose-pdf">
                Select PDF File
            </button>

            <button id="scan-camera">
                Scan with Camera
            </button>

            <button id="close-upload">
                Cancel
            </button>

        </div>
    `;

    document.body.appendChild(popup);

}

/* =================================
   SAVE PDF
================================= */


async function askDocumentName(file, category) {

    const customName = prompt(
        "Enter your document name:",
        file.name.replace(/\.pdf$/i, "")
    );

    if (customName === null || !customName.trim()) {
        alert("Document name is required.");
        return;
    }

    const selectedTags = prompt(
        "Enter tags separated by commas:\n\nImportant, Urgent, Personal",
        ""
    );

    if (selectedTags === null) return;

    const allowedTags = ["Important", "Urgent", "Personal"];

    const tags = [...new Set(
        selectedTags.split(",")
            .map(tag => tag.trim())
            .filter(tag =>
                allowedTags.some(
                    allowed => allowed.toLowerCase() === tag.toLowerCase()
                )
            )
            .map(tag =>
                allowedTags.find(
                    allowed => allowed.toLowerCase() === tag.toLowerCase()
                )
            )
    )];

    try {

      await saveDocument(
    file,
    customName.trim(),
    category,
    tags,
    activeFolderId
);

        alert("Document saved successfully in ANCHAR!");

        document.querySelector(".upload-popup")?.remove();

        await showDocuments(category);

    } catch (error) {

        alert("Document could not be saved.");
        console.error(error);

    }

}


/* =================================
   PDF FILE SELECTION
================================= */

pdfInput.addEventListener("change", async () => {

    const file = pdfInput.files[0];

    if (!file) return;

    if (
        file.type !== "application/pdf" &&
        !file.name.toLowerCase().endsWith(".pdf")
    ) {

        alert("Please select a PDF file.");
        pdfInput.value = "";
        return;

    }

    await askDocumentName(file, activeCategory);

    pdfInput.value = "";

});

/* =================================
   CAMERA IMAGE TO PDF
================================= */

cameraInput.addEventListener("change", async () => {

    const image = cameraInput.files[0];

    if (!image) return;

    let imageURL;

    try {

        imageURL = URL.createObjectURL(image);

        const imageElement = new Image();

        imageElement.src = imageURL;

        await new Promise((resolve, reject) => {
            imageElement.onload = resolve;
            imageElement.onerror = reject;
        });

        if (!window.jspdf) {
            throw new Error("PDF library not loaded.");
        }

        const canvas = document.createElement("canvas");

        canvas.width = imageElement.naturalWidth;
        canvas.height = imageElement.naturalHeight;

        const context = canvas.getContext("2d");

        context.drawImage(
            imageElement,
            0,
            0,
            canvas.width,
            canvas.height
        );

        const imageData = canvas.toDataURL("image/jpeg", 0.95);

        const { jsPDF } = window.jspdf;

        const pdf = new jsPDF({
            orientation: canvas.width > canvas.height
                ? "landscape"
                : "portrait",
            unit: "px",
            format: [canvas.width, canvas.height]
        });

        pdf.addImage(
            imageData,
            "JPEG",
            0,
            0,
            canvas.width,
            canvas.height
        );

        const pdfBlob = pdf.output("blob");

        await askDocumentName(
            new File(
                [pdfBlob],
                "Camera-Scan.pdf",
                { type: "application/pdf" }
            ),
            activeCategory
        );

    } catch (error) {

        alert("PDF conversion failed. Please try again.");
        console.error(error);

    } finally {

        if (imageURL) URL.revokeObjectURL(imageURL);

        cameraInput.value = "";

    }

});

/* =================================
   VIEW / DOWNLOAD DOCUMENT
================================= */

async function getDocumentById(id) {

    const documents = await getDocuments();

    return documents.find(doc => doc.id === Number(id));

}


async function openDocument(id, download = false) {

    try {

        const doc = await getDocumentById(id);

        if (!doc) {
            alert("Document not found.");
            return;
        }

        const safeName = (doc.name || "Document")
            .replace(/\.pdf$/i, "")
            .replace(/[^a-zA-Z0-9_-]/g, "_");

        const fileName = (safeName || "Document") + ".pdf";

        // Android APK
        if (Capacitor.isNativePlatform()) {

            const base64 = await new Promise((resolve, reject) => {

                const reader = new FileReader();

                reader.onloadend = () => {
                    if (
                        typeof reader.result !== "string" ||
                        !reader.result.includes(",")
                    ) {
                        reject(new Error("Could not read PDF file."));
                        return;
                    }

                    resolve(reader.result.split(",")[1]);
                };

                reader.onerror = () => reject(reader.error);

                reader.readAsDataURL(doc.file);

            });

            if (download) {

                await FileSharer.save({
                    filename: fileName,
                    contentType: "application/pdf",
                    base64Data: base64,
                    android: {
                        saveDirectory: "downloads"
                    }
                });

                alert("PDF saved successfully. Check your Downloads folder.");

            } else {

                const result = await Filesystem.writeFile({
                    path: fileName,
                    data: base64,
                    directory: Directory.Cache
                });

                await FileOpener.open({
                    filePath: result.uri,
                    contentType: "application/pdf",
                    openWithDefault: true
                });

            }

            return;
        }

        // Browser version
        const url = URL.createObjectURL(doc.file);
        const link = document.createElement("a");

        link.href = url;

        if (download) {
            link.download = fileName;
            link.click();
        } else {
            link.target = "_blank";
            link.rel = "noopener";
            link.click();
        }

        setTimeout(() => URL.revokeObjectURL(url), 60000);

    } catch (error) {

        alert("Unable to open or download document.");
        console.error("ANCHAR DOCUMENT ERROR:", error);
        alert("Error: " + (error?.message || String(error)));

    }

}

/* =================================
   ALL APP BUTTON ACTIONS
================================= */

document.addEventListener("click", async (event) => {

    const target = event.target;

    const pinKey = target.closest(".pin-key");

    if (pinKey) {

        const value = pinKey.dataset.key;

        if (value === "⌫") {

            enteredPin = enteredPin.slice(0, -1);

        } else if (value !== "" && enteredPin.length < 4) {

            enteredPin += value;

        }

        document.querySelectorAll(".dot").forEach((dot, index) => {
            dot.classList.toggle("active", index < enteredPin.length);
        });

        if (enteredPin.length === 4) {

            setTimeout(() => {
                showDashboard();
                enteredPin = "";
            }, 300);

        }

        return;

    }

    if (target.closest("#open-profile")) {
        showCategories();
        return;
    }

    if (target.closest("#back-home")) {
        showDashboard();
        return;
    }

    const categoryCard = target.closest("[data-category]");

if (categoryCard) {
    activeFolderId = null;
    showDocuments(categoryCard.dataset.category);
    return;
}

    if (target.closest("#back-categories")) {
        showCategories();
        return;
    }

    if (target.closest("#add-document")) {
        showUploadPopup();
        return;
    }

    if (target.closest("#close-upload")) {
        document.querySelector(".upload-popup")?.remove();
        return;
    }

    if (target.closest("#choose-pdf")) {
        pdfInput.click();
        return;
    }

    if (target.closest("#scan-camera")) {
        cameraInput.click();
        return;
    }

    const viewButton = target.closest("[data-view]");

    if (viewButton) {
        await openDocument(viewButton.dataset.view, false);
        return;
    }

    const downloadButton = target.closest("[data-download]");

    if (downloadButton) {
        await openDocument(downloadButton.dataset.download, true);
        return;
    }

    
const deleteButton = target.closest("[data-delete]");

if (deleteButton) {

    const confirmed = confirm(
        "Are you sure you want to permanently delete this document?"
    );

    if (!confirmed) return;

    try {

        await deleteDocument(deleteButton.dataset.delete);

        alert("Document deleted successfully!");

        await showDocuments(activeCategory);

    } catch (error) {

        alert("Unable to delete document.");
        console.error(error);

    }

    return;

}

   // Open Folder
const openFolderButton = target.closest("[data-open-folder]");

if (openFolderButton) {

    activeFolderId = Number(
        openFolderButton.dataset.openFolder
    );

    await showDocuments(activeCategory);

    return;
}

   // Back to Parent Folder
if (target.closest("#back-folder")) {

    const currentFolder = await getFolderById(activeFolderId);

    activeFolderId = currentFolder
        ? currentFolder.parentId
        : null;

    await showDocuments(activeCategory);

    return;
}

    // Create Folder
    if (target.closest("#create-folder")) {

        const folderName = prompt("Enter folder name:");

        if (!folderName || !folderName.trim()) {
            return;
        }

        try {
            await createFolder(
                folderName.trim(),
                activeCategory
            );

            await showDocuments(activeCategory);

        } catch (error) {
            alert("Unable to create folder.");
            console.error(error);
        }

        return;
    }

        
    // Create Subfolder
    const subfolderButton = target.closest("[data-create-subfolder]");

    if (subfolderButton) {

        const parentId = Number(
            subfolderButton.dataset.createSubfolder
        );

        const folderName = prompt("Enter subfolder name:");

        if (!folderName || !folderName.trim()) {
            return;
        }

        try {
            await createFolder(
                folderName.trim(),
                activeCategory,
                parentId
            );

            alert("Subfolder created successfully!");

        } catch (error) {
            alert("Unable to create subfolder.");
            console.error(error);
        }

        return;
    }


    // Rename Folder
    const renameFolderButton = target.closest("[data-rename-folder]");

    if (renameFolderButton) {

        const folderId = renameFolderButton.dataset.renameFolder;

        const newName = prompt("Enter new folder name:");

        if (!newName || !newName.trim()) {
            return;
        }

        try {
            await renameFolder(
                folderId,
                newName.trim()
            );

            await showDocuments(activeCategory);

        } catch (error) {
            alert("Unable to rename folder.");
            console.error(error);
        }

        return;
    }

    // Delete Folder
    const deleteFolderButton = target.closest("[data-delete-folder]");

    if (deleteFolderButton) {

        const folderId = deleteFolderButton.dataset.deleteFolder;

        const confirmed = confirm(
            "Delete this folder permanently?"
        );

        if (!confirmed) {
            return;
        }

        try {
            await deleteFolder(folderId);

            alert("Folder deleted.");

            await showDocuments(activeCategory);

        } catch (error) {
            alert("Unable to delete folder.");
            console.error(error);
        }

        return;
    }
   
   
});

// =================================
// ANCHAR - FOLDER MANAGEMENT
// =================================

function createFolder(name, category, parentId = null) {
    return new Promise((resolve, reject) => {
        const transaction = database.transaction("folders", "readwrite");
        const store = transaction.objectStore("folders");

        const request = store.add({
            name: name,
            category: category,
            parentId: parentId,
            createdAt: new Date().toISOString()
        });

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

function getFolders(category, parentId = null) {
    return new Promise((resolve, reject) => {
        const transaction = database.transaction("folders", "readonly");
        const store = transaction.objectStore("folders");
        const request = store.getAll();

        request.onsuccess = () => {
            const folders = request.result.filter(folder =>
                folder.category === category &&
                folder.parentId === parentId
            );

            resolve(folders);
        };

        request.onerror = () => reject(request.error);
    });
}

// Rename Folder
function renameFolder(folderId, newName) {
    return new Promise((resolve, reject) => {
        const transaction = database.transaction("folders", "readwrite");
        const store = transaction.objectStore("folders");
        const request = store.get(Number(folderId));

        request.onsuccess = () => {
            const folder = request.result;

            if (!folder) {
                reject("Folder not found");
                return;
            }

            folder.name = newName;

            const updateRequest = store.put(folder);

            updateRequest.onsuccess = () => resolve(true);
            updateRequest.onerror = () => reject(updateRequest.error);
        };

        request.onerror = () => reject(request.error);
    });
}

// Delete Folder

function deleteFolder(folderId) {
    return new Promise((resolve, reject) => {

        const transaction = database.transaction(
            ["folders", "documents"],
            "readwrite"
        );

        const folderStore = transaction.objectStore("folders");
        const documentStore = transaction.objectStore("documents");

        let folders;
        let documents;
        let processed = false;

        function processDeletion() {
            if (!folders || !documents || processed) return;

            processed = true;

            const folderIds = new Set([Number(folderId)]);

            let changed = true;

            while (changed) {
                changed = false;

                folders.forEach(folder => {
                    if (
                        folder.parentId !== null &&
                        folderIds.has(Number(folder.parentId)) &&
                        !folderIds.has(Number(folder.id))
                    ) {
                        folderIds.add(Number(folder.id));
                        changed = true;
                    }
                });
            }

            folderIds.forEach(id => folderStore.delete(id));

            documents.forEach(doc => {
                if (folderIds.has(Number(doc.folderId))) {
                    documentStore.delete(doc.id);
                }
            });
        }

        const folderRequest = folderStore.getAll();
        const documentRequest = documentStore.getAll();

        folderRequest.onsuccess = () => {
            folders = folderRequest.result;
            processDeletion();
        };

        documentRequest.onsuccess = () => {
            documents = documentRequest.result;
            processDeletion();
        };

        transaction.oncomplete = () => resolve(true);
        transaction.onerror = () => reject(transaction.error);
        transaction.onabort = () => reject(transaction.error);
    });
}


// Get Folder Details
function getFolderById(folderId) {
    return new Promise((resolve, reject) => {

        const transaction = database.transaction(
            "folders",
            "readonly"
        );

        const store = transaction.objectStore("folders");

        const request = store.get(Number(folderId));

        request.onsuccess = () => {
            resolve(request.result || null);
        };

        request.onerror = () => {
            reject(request.error);
        };
    });
}
