const currentUser = checkRole("admin");

const studentSelect =
    document.getElementById("studentSelect");

const courseSelect =
    document.getElementById("courseSelect");

const assignCourseBtn =
    document.getElementById("assignCourseBtn");

const mappingTableBody =
    document.getElementById("mappingTableBody");

const mappingUser =
    JSON.parse(localStorage.getItem("users")) || [];

const mappingCourses =
    JSON.parse(localStorage.getItem("courses")) || [];


let courseMappings =
    JSON.parse(localStorage.getItem("courseMappings")) || [];

const students = mappingUser.filter(function (user) {

    return user.role.toLowerCase() === "student";

});

function loadStudents() {

    students.forEach(function (student) {

        const option =
            document.createElement("option");

        option.value = student.id;

        option.textContent =
            `${student.name} - ${student.email}`;

        studentSelect.appendChild(option);

    });

}

function loadCourses() {

    mappingCourses.forEach(function (course) {

        const option =
            document.createElement("option");

        option.value = course.id;

        option.textContent = course.title;

        courseSelect.appendChild(option);

    });

}

function displayMappings() {

    mappingTableBody.innerHTML = "";

    courseMappings.forEach(function (mapping) {

        const student = students.find(function (student) {

            return student.id === mapping.studentId;

        });


        const course = mappingCourses.find(function (course) {

            return course.id === mapping.courseId;

        });



        if (!student || !course) {
            return;
        }


        const row =
            document.createElement("tr");


        row.innerHTML = `
            <td>${student.name}</td>

            <td>${student.email}</td>

            <td>${course.title}</td>

            <td>
                <button onclick="removeMapping(${mapping.id})">
                    Remove
                </button>
            </td>
        `;


        mappingTableBody.appendChild(row);

    });

}


assignCourseBtn.addEventListener("click", function () {

    const studentId =
        Number(studentSelect.value);

    const courseId =
        Number(courseSelect.value);

    if (!studentId || !courseId) {

        alert("Please select student and course");

        return;
    }

    const alreadyAssigned =
        courseMappings.some(function (mapping) {

            return mapping.studentId === studentId &&
                mapping.courseId === courseId;

        });


    if (alreadyAssigned) {

        alert(
            "This course is already assigned to this student"
        );

        return;
    }

    const newMapping = {

        id: Date.now(),

        studentId: studentId,

        courseId: courseId

    };
    courseMappings.push(newMapping);

    localStorage.setItem(
        "courseMappings",
        JSON.stringify(courseMappings)
    );


    displayMappings();


    studentSelect.value = "";
    courseSelect.value = "";


    alert("Course assigned successfully");

});


function removeMapping(mappingId) {

    const confirmRemove =
        confirm("Remove this course assignment?");


    if (!confirmRemove) {
        return;
    }


    courseMappings =
        courseMappings.filter(function (mapping) {

            return mapping.id !== mappingId;

        });


    localStorage.setItem(
        "courseMappings",
        JSON.stringify(courseMappings)
    );


    displayMappings();

}


loadStudents();

loadCourses();

displayMappings();