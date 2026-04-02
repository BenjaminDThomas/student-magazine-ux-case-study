/*
----------------------
Login Selectors
----------------------
*/

// selects id's and classes for login stage
const loginEmail    = document.querySelector("#loginEmail");
const emailNext     = document.querySelector("#emailNext");
const loginPassword = document.querySelector("#loginPassword");
const pwNext        = document.querySelector("#pwNext");
const togglePw      = document.querySelector("#togglePw");
const stayNext      = document.querySelector("#stayNext");
const stayChoices   = document.querySelectorAll(".stay-choice");
const stayEmailText = document.querySelector("#stayEmailText");

/* ── user store helpers ── */

// returns all registered users array from localStorage
function getUsers() {
    try { return JSON.parse(localStorage.getItem("users")) || []; } catch { return []; }
}

// finds a registered user by email, returns user object or null
function findUser(email) {
    return getUsers().find((u) => u.email === email.toLowerCase().trim()) || null;
}

/* ── email step ── */

if (loginEmail && emailNext) {
    const emailError = document.createElement("p");
    emailError.className = "auth-subtext";
    emailError.style.color = "#c0392b";
    emailError.hidden = true;
    emailNext.parentNode.insertBefore(emailError, emailNext);

    loginEmail.addEventListener("input", () => {                                // waits for user input
        const isValid = loginEmail.value.includes("@");                         // only allows emails that include '@' symbol
        emailNext.disabled = !isValid;                                          // disabled next section
        emailNext.classList.toggle("enabled", isValid);                         // enables next button if condition is met
        emailError.hidden = true;
    });

    emailNext.addEventListener("click", () => {                                 // listens for next button
        const email = loginEmail.value.trim().toLowerCase();
        const user  = findUser(email);

        if (!user) {
            // email not registered — block and show error
            emailError.textContent = "No account found. Please register first.";
            emailError.hidden = false;
            return;
        }

        emailError.hidden = true;
        document.querySelector('[data-step="email"]').hidden = true;            // hides email tab
        document.querySelector('[data-step="password"]').hidden = false;        // opens password tab
    });
}

/* ── password step ── */

if (loginPassword && pwNext) {
    const pwError = document.createElement("p");
    pwError.className = "auth-subtext";
    pwError.style.color = "#c0392b";
    pwError.hidden = true;
    pwNext.parentNode.insertBefore(pwError, pwNext);

    // back button to return to email step
    const pwBack = document.createElement("button");
    pwBack.type = "button";
    pwBack.className = "auth-btn enabled";
    pwBack.style.background = "transparent";
    pwBack.style.color = "inherit";
    pwBack.style.border = "1px solid rgba(0,0,0,0.2)";
    pwBack.style.marginTop = "8px";
    pwBack.style.opacity = "1";
    pwBack.textContent = "← Back";
    pwNext.parentNode.insertBefore(pwBack, pwError);

    pwBack.addEventListener("click", () => {
        document.querySelector('[data-step="password"]').hidden = true;
        document.querySelector('[data-step="email"]').hidden = false;
        loginPassword.value = "";
        pwNext.disabled = true;
        pwNext.classList.remove("enabled");
        pwError.hidden = true;
    });

    loginPassword.addEventListener("input", () => {
        const isValid = loginPassword.value.length >= 6;                        // validates password length
        pwNext.disabled = !isValid;                                             // disabled next section
        pwNext.classList.toggle("enabled", isValid);                            // enables next button
        pwError.hidden = true;
    });

    pwNext.addEventListener("click", () => {                                    // listens for next button
        const email    = loginEmail.value.trim().toLowerCase();
        const user     = findUser(email);
        const entered  = loginPassword.value;

        if (!user || user.password !== entered) {
            // wrong password — show error, stay on password step
            pwError.textContent = "Incorrect password. Please try again.";
            pwError.hidden = false;
            loginPassword.value = "";
            pwNext.disabled = true;
            pwNext.classList.remove("enabled");
            return;
        }

        pwError.hidden = true;
        document.querySelector('[data-step="password"]').hidden = true;         // hides password tab
        document.querySelector('[data-step="stay"]').hidden = false;            // opens stay signed in tab

        if (stayEmailText) {
            stayEmailText.textContent = email;                                  // displays email on stay signed in screen
        }
    });
}

/* ── password visibility toggle ── */

if (togglePw && loginPassword) {
    togglePw.addEventListener("click", () => {
        const isPassword = loginPassword.type === "password";
        loginPassword.type = isPassword ? "text" : "password";                 // toggles password visibility
        togglePw.textContent = isPassword ? "Hide" : "Show";
    });
}

/* ── stay signed in step ── */

if (stayChoices.length > 0 && stayNext) {
    let selectedChoice = null;

    stayChoices.forEach((btn) => {
        btn.addEventListener("click", () => {
            stayChoices.forEach((b) => b.classList.remove("selected"));         // removes selected option
            btn.classList.add("selected");
            selectedChoice = btn.dataset.choice;                                // selected option choice
            stayNext.disabled = false;                                          // enables next button
            stayNext.classList.add("enabled");
        });
    });

    stayNext.addEventListener("click", () => {
        const email = loginEmail.value.trim().toLowerCase();

        // store current user so the rest of the site knows who is logged in
        localStorage.setItem("currentUser", JSON.stringify({ email }));

        if (selectedChoice === "yes") {                                         // persist login if 'yes' selected
            localStorage.setItem("staySignedIn", "true");
        } else {
            localStorage.removeItem("staySignedIn");
        }

        const returnTo = new URLSearchParams(location.search).get("returnTo");  // redirect back to origin page
        window.location.href = returnTo || "index.html";
    });
}

/*
----------------------
Register Selectors
----------------------
*/

// selects id's and classes for register stage
const regEmail     = document.querySelector("#regEmail");
const regEmailNext = document.querySelector("#regEmailNext");
const regPassword  = document.querySelector("#regPassword");
const toggleRegPw  = document.querySelector("#toggleRegPw");
const createBtn    = document.querySelector("#createBtn");

/* ── register email step ── */

if (regEmail && regEmailNext) {
    const regEmailError = document.createElement("p");
    regEmailError.className = "auth-subtext";
    regEmailError.style.color = "#c0392b";
    regEmailError.hidden = true;
    regEmailNext.parentNode.insertBefore(regEmailError, regEmailNext);

    regEmail.addEventListener("input", () => {
        const isValid = regEmail.value.includes("@");                           // only allows emails with '@'
        regEmailNext.disabled = !isValid;                                       // disabled next section
        regEmailNext.classList.toggle("enabled", isValid);                      // enables next button
        regEmailError.hidden = true;
    });

    regEmailNext.addEventListener("click", () => {                              // listens for next button
        const email = regEmail.value.trim().toLowerCase();

        if (findUser(email)) {
            // already registered — block and prompt to sign in
            regEmailError.textContent = "An account with this email already exists. Sign in instead.";
            regEmailError.hidden = false;
            return;
        }

        regEmailError.hidden = true;
        document.querySelector('[data-step="reg-email"]').hidden = true;        // hides email tab
        document.querySelector('[data-step="reg-password"]').hidden = false;    // shows password tab
    });
}

/* ── register password step ── */

if (regPassword && createBtn) {
    // back button to return to email step
    const regPwBack = document.createElement("button");
    regPwBack.type = "button";
    regPwBack.className = "auth-btn enabled";
    regPwBack.style.cssText = "background:transparent;color:inherit;border:1px solid rgba(0,0,0,0.2);margin-top:8px;opacity:1;";
    regPwBack.textContent = "← Back";
    createBtn.parentNode.insertBefore(regPwBack, createBtn);

    // already have an account link below create button
    const regSwitch = document.createElement("p");
    regSwitch.className = "auth-switch";
    regSwitch.innerHTML = 'Already have an account? <a href="login.html">Sign in</a>';
    createBtn.after(regSwitch);

    regPwBack.addEventListener("click", () => {                                 // returns to email step
        document.querySelector('[data-step="reg-password"]').hidden = true;
        document.querySelector('[data-step="reg-email"]').hidden = false;
        regPassword.value = "";
        createBtn.disabled = true;
        createBtn.classList.remove("enabled");
    });

    regPassword.addEventListener("input", () => {
        const isValid = regPassword.value.length >= 6;                          // validates password length
        createBtn.disabled = !isValid;                                          // disabled next section
        createBtn.classList.toggle("enabled", isValid);                         // enables create button
    });

    createBtn.addEventListener("click", () => {                                 // listens for create button
        const email    = regEmail.value.trim().toLowerCase();
        const password = regPassword.value;

        // save new user to localStorage
        const users = getUsers();
        users.push({ email, password });
        localStorage.setItem("users", JSON.stringify(users));

        // immediately sign them in
        localStorage.setItem("currentUser", JSON.stringify({ email }));

        const returnTo = new URLSearchParams(location.search).get("returnTo");  // redirect back to origin
        window.location.href = returnTo || "index.html";
    });
}

/* register password visibility toggle */

if (toggleRegPw && regPassword) {
    toggleRegPw.addEventListener("click", () => {
        const isPassword = regPassword.type === "password";
        regPassword.type = isPassword ? "text" : "password";                   // toggles password visibility
        toggleRegPw.textContent = isPassword ? "Hide" : "Show";
    });
}

/*
----------------------
Forgot Password
----------------------
*/

// selects id's and classes for forgot password stage
const forgotEmail = document.querySelector("#forgotEmail");
const resetBtn    = document.querySelector("#resetBtn");

if (forgotEmail && resetBtn) {
    forgotEmail.addEventListener("input", () => {
        const isValid = forgotEmail.value.includes("@");                        // only allows emails with '@'
        resetBtn.disabled = !isValid;                                           // disabled reset button
        resetBtn.classList.toggle("enabled", isValid);                          // enables reset button
    });

    resetBtn.addEventListener("click", () => {
        alert("Reset link sent (simulated).");                                  // popup indicating reset link sent
        window.location.href = "login.html";                                    // returns to login page
    });
}