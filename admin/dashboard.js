let users = JSON.parse(localStorage.getItem("users")) || [];
let courses = JSON.parse(localStorage.getItem("courses")) || [];

let totalCourses = courses.length;

let authors = users.filter(function(user) {
    return user.role === "Staff";
});

let totalAuthors = authors.length;
let totalUsers = users.length;

document.getElementById("totalCourses").innerText = totalCourses;
document.getElementById("totalAuthors").innerText = totalAuthors;
document.getElementById("totalUsers").innerText = totalUsers;

let recentCourses = document.getElementById("body3");

let latestCourses = courses.slice(-4).reverse();

latestCourses.forEach(function(course) {

    let courseCard = document.createElement("div");
    courseCard.className = "recent-course-card";

    courseCard.innerHTML = `
        <div class="card-body">
            <h2>${course.title}</h2>
            <p>${course.category}</p>
            <p>Instructor: ${course.instructor}</p>
        </div>
    `;

    recentCourses.appendChild(courseCard);
});