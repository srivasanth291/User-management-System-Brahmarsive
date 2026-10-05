let editProfile = document.getElementById("editProfile");
let isEditing = false;
let adminName = document.getElementById("adminName");
let adminEmail = document.getElementById("adminEmail");
let adminPhone = document.getElementById("adminPhone");
let adminPassword = document.getElementById("adminPassword");
let savedProfile = JSON.parse(localStorage.getItem("adminProfile")) ;

if (savedProfile) {
    adminName.innerText = savedProfile.name;
    adminEmail.innerText = savedProfile.email;
    adminPhone.innerText = savedProfile.phone;
    adminPassword.innerText = savedProfile.password;
}
editProfile.addEventListener("click", function(event) {
    event.preventDefault();

    if (isEditing == false) {

        editProfile.innerText = "Save";
        isEditing = true;


    let currentName = adminName.innerText;
    let currentEmail = adminEmail.innerText;
    let currentPhone = adminPhone.innerText;
    let currentPassword = adminPassword.innerText;

adminEmail.innerHTML = `
    <input type="email" id="emailInput" value="${currentEmail}">
`;

adminPhone.innerHTML = `
    <input type="text" id="phoneInput" value="${currentPhone}">
`;

adminPassword.innerHTML = `
<input type="password" id="passwordInput" value="${currentPassword}">
`;

adminName.innerHTML = `
        <input type="text" id="nameInput" value="${currentName}">
    `;
    } 

       else {
        let newName = document.getElementById("nameInput").value;
        let newEmail = document.getElementById("emailInput").value;
        let newPhone = document.getElementById("phoneInput").value;
        let newPassword = document.getElementById("passwordInput").value;


        let adminProfile = {
        name: newName,
        email: newEmail,
        phone: newPhone,
        password: newPassword
    };

    localStorage.setItem("adminProfile", JSON.stringify(adminProfile));
    adminName.innerText = newName;
    adminEmail.innerText = newEmail;
    adminPhone.innerText = newPhone;
    adminPassword.innerText = newPassword;

    editProfile.innerText = "Edit";

    isEditing = false;

    }

});
