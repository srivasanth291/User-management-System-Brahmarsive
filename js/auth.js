const users = [
    {
        id: 1,
        name: "Admin",
        email: "admin@gmail.com",
        password: "admin123",
        role: "admin",
        permissions: {
            createStaff: true,
            createCourse: true,
            editCourse: true,
            deleteCourse: true,
            mapCourse: true,
            createAssessment: true
        }
    },
    {
        id: 2,
        name: "Staff",
        email: "staff@gmail.com",
        password: "staff123",
        role: "staff",
        permissions: {
            createStaff: false,
            createCourse: false,
            editCourse: false,
            deleteCourse: false,
            mapCourse: false,
            createAssessment: false
        }
    },
    {
        id: 3,
        name: "Vasanth",
        email: "student@gmail.com",
        password: "student123",
        role: "student",
        permissions: {
            createStaff: false,
            createCourse: false,
            editCourse: false,
            deleteCourse: false,
            mapCourse: false,
            createAssessment: false
        }
    }
];
function loginUser(email, password) {
    const user = users.find(function (user) {
        return user.email === email &&
               user.password === password;
    });
    if (!user) {
        return null;
    }
    localStorage.setItem(
        "loggedUser",
        JSON.stringify(user)
    );
    return user;
}

function getLoggedUser() {
    const loggedUser = localStorage.getItem("loggedUser");
    if (!loggedUser) {
        return null;
    }
    return JSON.parse(loggedUser);
}
function logoutUser() {
    localStorage.removeItem("loggedUser");
    window.location.href = "../login.html";
}
function checkAuthentication() {
    const user = getLoggedUser();
    if (!user) {
        window.location.href = "../login.html";
        return null;
    }
    return user;
}
function checkRole(requiredRole) {
    const user = checkAuthentication();
    if (!user) {
        return null;
    }
    if (user.role !== requiredRole) {
        alert("Access denied");
        window.location.href = "../login.html";
        return null;
    }
    return user;
}
function hasPermission(permission) {
    const user = checkAuthentication();
    if (!user) {
        return false;
    }
    return user.permissions[permission] === true;
}