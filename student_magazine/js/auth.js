/*
----------------------
Login Selectors
----------------------
*/

// selects id's and classes for login stage
const loginEmail = document.querySelector("#loginEmail");
const emailNext = document.querySelector("#emailNext");
const loginPassword = document.querySelector("#loginPassword");
const pwNext = document.querySelector("#pwNext");
const togglePw = document.querySelector("#togglePw");
const stayNext = document.querySelector("#stayNext");
const stayChoices = document.querySelectorAll(".stay-choice");
const stayEmailText = document.querySelector("#stayEmailText");

// email validation
if (loginEmail && emailNext) {                                                  // if on login page continues
  loginEmail.addEventListener("input", () => {                                  // waits for user input
    const isValid = loginEmail.value.includes("@");                             // only allows emails that include '@' symbol
    emailNext.disabled = !isValid;                                              // disabled next section
    emailNext.classList.toggle("enabled", isValid);                             // enables next button if condition for email is met
  });

  emailNext.addEventListener("click", () => {                                   // listens for next button being interacted with
    document.querySelector('[data-step="email"]').hidden = true;                // hides email tab
    document.querySelector('[data-step="password"]').hidden = false;            // opens password tab
  });
}

if (loginPassword && pwNext) {                                                  // checks if password fufills requirements
  loginPassword.addEventListener("input", () => {
    const isValid = loginPassword.value.length >= 6;                            // validates if password length is smore than 6 characters
    pwNext.disabled = !isValid;                                                 // disabled next section
    pwNext.classList.toggle("enabled", isValid);                                // enables next button if condition for password is met
  });

  pwNext.addEventListener("click", () => {                                      // listens for next button being interacted with
    document.querySelector('[data-step="password"]').hidden = true;             // hides password tab
    document.querySelector('[data-step="stay"]').hidden = false;                // opens stay signed in tab
    
    if (stayEmailText) {
      stayEmailText.textContent = loginEmail.value;                             // displays stay signed in screen
    }
  });
}

// toggles password hide/show functionality
if (togglePw && loginPassword) {
  togglePw.addEventListener("click", () => {
    const isPassword = loginPassword.type === "password";
    loginPassword.type = isPassword ? "text" : "password";                      // changes between hidden and entered password state
    togglePw.textContent = isPassword ? "Hide" : "Show";                        // hides and shows password
  });
}


if (stayChoices.length > 0 && stayNext) {
  let selectedChoice = null;
  stayChoices.forEach(btn => {
    btn.addEventListener("click", () => {
      stayChoices.forEach(b => b.classList.remove("selected"));                 // removes selected option
      btn.classList.add("selected");
      selectedChoice = btn.dataset.choice;                                      // selected option choice
      stayNext.disabled = false;                                                // disabled state 'next' button
      stayNext.classList.add("enabled");                                        // enables 'next' button
    });
  });

  stayNext.addEventListener("click", () => {
    if (selectedChoice === "yes") {                                             // saves preference if 'yes' option was selected
      localStorage.setItem("loggedIn", "true");
      localStorage.setItem("userEmail", loginEmail.value);
    }
    window.location.href = "index.html";                                        // redirects back to homepage
  });
}

/*
----------------------
Register Selectors
----------------------
*/

// selects id's and classes for register stage
const regEmail = document.querySelector("#regEmail");
const regEmailNext = document.querySelector("#regEmailNext");
const regPassword = document.querySelector("#regPassword");
const toggleRegPw = document.querySelector("#toggleRegPw");
const createBtn = document.querySelector("#createBtn");

// email validation
if (regEmail && regEmailNext) {
  regEmail.addEventListener("input", () => {
    const isValid = regEmail.value.includes("@");                               // only allows emails that include '@' symbol
    regEmailNext.disabled = !isValid;                                           // disabled next section
    regEmailNext.classList.toggle("enabled", isValid);                          // enables next button if condition for email is met
  });

  regEmailNext.addEventListener("click", () => {                                // listens for next button being interacted with
    document.querySelector('[data-step="reg-email"]').hidden = true;            // hides email tab
    document.querySelector('[data-step="reg-password"]').hidden = false;        // shows password tab
  });
}

if (regPassword && createBtn) {                                                 // checks if password fufills requirements
  regPassword.addEventListener("input", () => {
    const isValid = regPassword.value.length >= 6;                              // validates if password length is smore than 6 characters
    createBtn.disabled = !isValid;                                              // disabled next section
    createBtn.classList.toggle("enabled", isValid);                             // enables next button if condition for email is met
  });

  createBtn.addEventListener("click", () => {                                   // listens for next button being interacted with
    alert("Account created! You can now sign in.");                             // popup notfication indicating account creation
    window.location.href = "login.html";                                        // returns back to the login page
  });
}

// toggles password hide/show functionality
if (toggleRegPw && regPassword) {
  toggleRegPw.addEventListener("click", () => {
    const isPassword = regPassword.type === "password";
    regPassword.type = isPassword ? "text" : "password";                        // changes between hidden and entered password state
    toggleRegPw.textContent = isPassword ? "Hide" : "Show";                     // hides and shows password
  });
}

/*
----------------------
Forgot Password
----------------------
*/

// selects id's and classes for forgot password stage
const forgotEmail = document.querySelector("#forgotEmail");
const resetBtn = document.querySelector("#resetBtn");

if (forgotEmail && resetBtn) {
  forgotEmail.addEventListener("input", () => {
    const isValid = forgotEmail.value.includes("@");                            // only allows emails that include '@' symbol
    resetBtn.disabled = !isValid;                                               // disabled next section
    resetBtn.classList.toggle("enabled", isValid);                              // enables next button if condition for email is met
  });

  resetBtn.addEventListener("click", () => {
    alert("Reset link sent (simulated).");                                      // popup notfication indicating reset link sry
    window.location.href = "login.html";                                        // returns back to the login page
  });
}