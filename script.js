
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

// PIN entry display
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
        dot.classList.toggle(
            "active",
            index < enteredPin.length
        );
    });

});
