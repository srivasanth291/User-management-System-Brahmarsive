const currentUser = checkRole("admin");
const userTableBody = document.getElementById("userTableBody");
const addUserBtn = document.getElementById("adduser");
const userModal =document.getElementById("userModal");
const closeModal =document.getElementById("closeModal");
const cancelUser =document.getElementById("cancelUser")
const userRole =document.getElementById("userRole");
const staffPermissions =document.getElementById("staffPermissions");
const userForm =document.getElementById("userForm");

const userSearch = document.getElementById("userSearch");
const roleFilter = document.getElementById("roleFilter");
const activeUserBtn = document.getElementById("activeuser");
const pendingBtn = document.getElementById("pending");

const userStatus = document.getElementById("userStatus");

let editingUserId = null;
let usersData = [
    {
        id: 1,
        name: "Sri Vasanth R",
        email: "srivasanth@gmail.com",
        lastLogin: "12 Sep 2026",
        role: "Student"
    },

    {
        id: 2,
        name: "Dr. Arjun",
        email: "arjun@gmail.com",
        lastLogin: "12 Sep 2026",
        role: "Staff"
    },

    {
        id: 3,
        name: "Kaviya M",
        email: "kaviya@gmail.com",
        lastLogin: "10 Sep 2026",
        role: "Student"
    }
];

const savedUsers = localStorage.getItem("users");
if (savedUsers) {
    const parsedUsers = JSON.parse(savedUsers);
    usersData.length = 0;
    usersData.push(...parsedUsers);
}


function displayUsers(users = usersData) {

    userTableBody.innerHTML = "";

    users.forEach(function (user) {

        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${user.name}</td>
            <td>${user.email}</td>
            <td>${user.lastLogin}</td>
            <td>${user.role}</td>
            <td>
                <button class="edit-btn"   onclick="editUser(${user.id})">
                    Edit
                </button>
                <button class="delete-btn" onclick="deleteUser(${user.id})">
                    Delete
                </button>
            </td>
        `;
        userTableBody.appendChild(row);
    });

}

function editUser(userId) {
    const user = usersData.find(function (user) {
        return user.id === userId;
    });

    if (!user) {
        return;
    }
    editingUserId = userId;
    userName.value = user.name;
    userEmail.value = user.email;
    userPassword.value = user.password;
    userRole.value = user.role.toLowerCase();
    userStatus.value = user.status || "active";
    if (user.role.toLowerCase() === "staff") {
        staffPermissions.style.display = "block";
        createCourse.checked =
            user.permissions?.createCourse || false;
        editCourse.checked =
            user.permissions?.editCourse || false;
        deleteCourse.checked =
            user.permissions?.deleteCourse || false;
        createAssessment.checked =
            user.permissions?.createAssessment || false;
    } else {
        staffPermissions.style.display = "none";
    }

    userModal.style.display = "flex";
}
function deleteUser(userId) {
    const confirmDelete = confirm(
        "Are you sure you want to delete this user?"
    );
    if (!confirmDelete) {
        return;
    }
    usersData = usersData.filter(function (user) {
        return user.id !== userId;
    });
    localStorage.setItem(
        "users",
        JSON.stringify(usersData)
    );
    displayUsers();
}

//here this is helps to get the form data from the adduser 
const userName = document.getElementById("userName");
const userEmail = document.getElementById("userEmail");
const userPassword = document.getElementById("userPassword");

const createCourse = document.getElementById("createCourse");
const editCourse = document.getElementById("editCourse");
const deleteCourse = document.getElementById("deleteCourse");
const createAssessment = document.getElementById("createAssessment");

userForm.addEventListener("submit", function (event) {

    event.preventDefault();

    const name = userName.value.trim();
    const email = userEmail.value.trim();
    const password = userPassword.value.trim();
    const role = userRole.value;
    const status = userStatus.value;
    let permissions = {
    createCourse: false,
    editCourse: false,
    deleteCourse: false,
    createAssessment: false
    };
    if (role === "staff") {

    permissions = {
        createCourse: createCourse.checked,
        editCourse: editCourse.checked,
        deleteCourse: deleteCourse.checked,
        createAssessment: createAssessment.checked
    };

}
if (editingUserId === null) {

    const newUser = {
        id: Date.now(),
        name: name,
        email: email,
        password: password,
        lastLogin: "Never",
        role: role,
         status: status,
        permissions: permissions
    };
    usersData.push(newUser);
} else {
    const user = usersData.find(function (user) {
        return user.id === editingUserId;
    });
    if (user) {
        user.name = name;
        user.email = email;
        user.password = password;
        user.role = role;
        user.status = status;
        user.permissions = permissions;
    }
}
    localStorage.setItem("users", JSON.stringify(usersData));
    displayUsers();
    userForm.reset();
    staffPermissions.style.display = "none";
    userModal.style.display = "none";
    editingUserId = null;

});
displayUsers();


const logoutBtn = document.getElementById("logoutBtn");
logoutBtn.addEventListener("click", function (event) {
    event.preventDefault();
    logoutUser();
});


addUserBtn.addEventListener("click", function (event) {
    event.preventDefault();
    editingUserId = null;
    userForm.reset();
    staffPermissions.style.display = "none";
    userModal.style.display = "flex";
});

userRole.addEventListener("change", function () {
    const selectedRole = userRole.value;
    if (selectedRole === "staff") {
        staffPermissions.style.display = "block";
    } else {
        staffPermissions.style.display = "none";
    }
});

closeModal.addEventListener("click", function () {
    editingUserId = null;
    userForm.reset();
    staffPermissions.style.display = "none";
    userModal.style.display = "none";
});
cancelUser.addEventListener("click", function () {
    editingUserId = null;
    userForm.reset();
    staffPermissions.style.display = "none";
    userModal.style.display = "none";
});

function filterUsers() {
    const searchValue =userSearch.value.toLowerCase().trim();

    const selectedRole =roleFilter.value;
    const filteredUsers = usersData.filter(function (user) {
        const matchesSearch =
            user.name.toLowerCase().includes(searchValue) ||
            user.email.toLowerCase().includes(searchValue) ||
            user.role.toLowerCase().includes(searchValue);
        const matchesRole =
            selectedRole === "all" ||
            user.role.toLowerCase() === selectedRole;
        return matchesSearch && matchesRole;
    });
    displayUsers(filteredUsers);
}

userSearch.addEventListener("input", filterUsers);
roleFilter.addEventListener("change", function () {

    filterUsers();

});
activeUserBtn.addEventListener("click", function (event) {
    event.preventDefault();
    const activeUsers = usersData.filter(function (user) {
        return !user.status || user.status === "active";
    });
    displayUsers(activeUsers);
});

pendingBtn.addEventListener("click", function (event) {
    event.preventDefault();
    const pendingUsers = usersData.filter(function (user) {
        return user.status === "pending";
    });
    displayUsers(pendingUsers);
});