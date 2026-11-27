
/* =================================
   ANCHAR - JAVASCRIPT
================================= */

// Splash screen duration
const SPLASH_DURATION = 2000;

// Start ANCHAR
document.addEventListener("DOMContentLoaded", () => {

    setTimeout(() => {
        showPinScreen();
    }, SPLASH_DURATION);

});

// PIN screen
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

            <div class="pin-message">
                Secure Access
            </div>

            <div class="pin-keypad">
                ${[1,2,3,4,5,6,7,8,9,"",0,"⌫"]
                    .map(number => `
                        <button class="pin-key"
                            data-key="${number}">
                            ${number}
                        </button>
                    `).join("")}
            </div>

            <button class="forgot-pin">
                Forgot PIN?
            </button>

        </main>
    `;

}


/* =================================
   ANCHAR - DASHBOARD
================================= */

let enteredPin = "";

document.addEventListener("click", (event) => {

    const key = event.target.closest(".pin-key");
    if (!key) return;

    const value = key.dataset.key;

    if (value === "⌫") {
        enteredPin = enteredPin.slice(0, -1);
    } else if (value !== "" && enteredPin.length < 4) {
        enteredPin += value;
    }

    document.querySelectorAll(".dot").forEach((dot, index) => {
        dot.classList.toggle("active", index < enteredPin.length);
    });

    // Temporary dashboard preview only.
    // Real PIN verification will be implemented later.
    if (enteredPin.length === 4) {
        setTimeout(() => {
            showDashboard();
            enteredPin = "";
        }, 300);
    }

});

function showDashboard() {

    const app = document.getElementById("app");

    const today = new Date().toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "long",
        year: "numeric"
    });

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

                <div class="profile-card">
                    <div class="profile-shield">AN</div>

                    <h2>NIRMAL</h2>

                    <div class="document-count">
                        <span>0</span>
                        <small>TOTAL DOCUMENTS</small>
                    </div>

                    <p class="profile-status">MAIN ADMIN</p>
                </div>
            </section>

            <section class="categories-section">
                <h2>Document Categories</h2>
                <p>Select a category to manage documents</p>

                <div class="category-grid">
                    ${[
                        "Aadhaar",
                        "PAN Card",
                        "Bank",
                        "Certificates",
                        "Insurance",
                        "Driving Licence"
                    ].map((name, index) => `
                        <button class="category-card">
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
