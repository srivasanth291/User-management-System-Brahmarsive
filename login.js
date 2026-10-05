const loginForm = document.getElementById("loginForm");
loginForm.addEventListener("submit", function (event) {
    event.preventDefault();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();
    const user = loginUser(email, password);

    if (!user) {
        alert("Invalid email or password");
        return;
    }

    switch (user.role) {
        case "admin":
            window.location.href = "admin/dashboard.html";
            break;
        case "staff":
            window.location.href = "staff/dashboard.html";
            break;
        case "student":
            window.location.href = "student/dashboard.html";
            break;
    }
});