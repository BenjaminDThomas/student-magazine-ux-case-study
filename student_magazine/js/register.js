// email input and next button selector
const emailInput = document.querySelector("#email");
const nextBtn = document.querySelector("#nextBtn");

function validEmail(v){                                                     // email format validator
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}

emailInput.addEventListener("input", () => {                                // if user entered email
  const ok = validEmail(emailInput.value);                                  // if email is valid continue
  nextBtn.disabled = !ok;
  nextBtn.classList.toggle("enabled", ok);                                  // enables next button
});

function getUsers(){                                                        // get saved users from local storage
  return JSON.parse(localStorage.getItem("users") || "[]");
}
function setUsers(arr){                                                     // save users to local storage
  localStorage.setItem("users", JSON.stringify(arr));
}

nextBtn.addEventListener("click", () => {
  const email = emailInput.value.trim().toLowerCase();
  if(!validEmail(email)) return;

  const users = getUsers();
  if(!users.includes(email)) users.push(email);                             // pre-existing email validator
  setUsers(users);

  localStorage.setItem("currentUser", JSON.stringify({ email }));           // store current logged in user

  const returnTo = new URLSearchParams(location.search).get("returnTo");    // redirect back to inital page of entry
  location.href = returnTo || "index.html";
});
