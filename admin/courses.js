const currentUser = checkRole("admin");

const courseContainer = document.getElementById("body3");
const createCourseBtn = 
document.getElementById("a2");
const courseModal = document.getElementById("courseModal");
const closeModal = document.getElementById("closeModal");
const cancelBtn = document.getElementById("cancelBtn");
const nextBtn = 
 document.getElementById("nextBtn");
const courseTitle = document.getElementById("courseTitle");
const courseCategory = document.getElementById("courseCategory");
const courseInstructor = document.getElementById("courseInstructor");
const courseThumbnail = document.getElementById("courseThumbnail");
const courseDescription = document.getElementById("courseDescription");

const moduleModal = document.getElementById("moduleModal");
const closeModule = document.getElementById("closeModule");
const moduleHeading = document.getElementById("moduleHeading");
const moduleTitle = document.getElementById("moduleTitle");
const videoTitle = document.getElementById("videoTitle");
const videoUrl = document.getElementById("videoUrl");
const blogText = document.getElementById("blogText");
const saveModule = document.getElementById("saveModule");
const addAnother = document.getElementById("addAnother");
const publishCourse = document.getElementById("publishCourse");

const q1 = document.getElementById("q1");
const q1a = document.getElementById("q1a");
const q1b = document.getElementById("q1b");
const q1c = document.getElementById("q1c");

const q2 = document.getElementById("q2");
const q2a = document.getElementById("q2a");
const q2b = document.getElementById("q2b");
const q2c = document.getElementById("q2c");

const q3 = document.getElementById("q3");
const q3a = document.getElementById("q3a");
const q3b = document.getElementById("q3b");
const q3c = document.getElementById("q3c");

const viewCourseModal =document.getElementById("viewCourseModal");

const closeViewCourse =
    document.getElementById("closeViewCourse");

const viewCourseTitle =
    document.getElementById("viewCourseTitle");

const viewCourseCategory =
    document.getElementById("viewCourseCategory");

const viewCourseInstructor =
    document.getElementById("viewCourseInstructor");

const viewCourseDescription =
    document.getElementById("viewCourseDescription");

const viewCourseModules =
    document.getElementById("viewCourseModules");

const courseUsers =
    JSON.parse(localStorage.getItem("users")) || [];

const staffUsers = courseUsers.filter(function (user) {
    return user.role.toLowerCase() === "staff";
});
const courseModalTitle =
    document.getElementById("courseModalTitle");
let currentCourse = null;
let moduleSaved = false;
let currentModuleNumber = 1;
let editingCourseId = null;
const editCourseBtn =
    document.getElementById("editCourseBtn");
let viewingCourseId = null;
let coursesData = [
    {
        id: 1,
        title: "Web Development",
        description: "Build websites using HTML and CSS.",
        category: "Web Development",
        instructorId: null,
        instructor: "Dr. Arjun",
        modules: []
    },
    {
        id: 2,
        title: "Python Basics",
        description: "Learn Python programming.",
        category: "Python",
        instructorId: null,
        instructor: "Ajmal",
        modules: []
    },
    {
        id: 3,
        title: "UI/UX Design",
        description: "Figma and page design.",
        category: "UI / UX",
        instructorId: null,
        instructor: "Kaviya",
        modules: []
    }
];

const savedCourses =
    localStorage.getItem("courses");

if (savedCourses) {
    coursesData = JSON.parse(savedCourses);
}

function loadInstructors() {
    courseInstructor.innerHTML =
        `<option value="">Select Instructor</option>`;

    staffUsers.forEach(function (staff) {
        const option =
            document.createElement("option");

        option.value = staff.id;

        option.textContent =
            `${staff.name} - ${staff.email}`;

        courseInstructor.appendChild(option);
    });
}

function displayCourses() {

    courseContainer.innerHTML = "";

    coursesData.forEach(function (course) {

        const moduleCount =
            course.modules ? course.modules.length : 0;

        const card =
            document.createElement("div");

        card.classList.add("course-card");

        card.innerHTML = `
            <div class="course-card-image">

                <div class="course-category">
                    ${course.category}
                </div>

                <div class="course-image-placeholder">
        
                </div>

            </div>

            <div class="course-card-content">

                <h2 class="course-card-title">
                    ${course.title}
                </h2>

                <p class="course-card-description">
                    ${course.description || "No description available."}
                </p>

                <div class="course-card-info">

                    <div class="course-info-item">
                        <span class="info-label">
                            Instructor
                        </span>

                        <span class="info-value">
                            ${course.instructor}
                        </span>
                    </div>

                    <div class="course-info-item">
                        <span class="info-label">
                            Modules
                        </span>

                        <span class="info-value">
                            ${moduleCount}
                        </span>
                    </div>

                </div>

                <div class="course-card-footer">

                    <span class="course-status">
                        Published
                    </span>

                    <button
                        class="view-course-btn"
                        onclick="viewCourse(${course.id})"
                    >
                        View Course →
                    </button>

                </div>

            </div>
        `;

        courseContainer.appendChild(card);

    });

}

function resetModuleForm() {
    moduleTitle.value = "";
    videoTitle.value = "";
    videoUrl.value = "";
    blogText.value = "";

    q1.value = "";
    q1a.value = "";
    q1b.value = "";
    q1c.value = "";

    q2.value = "";
    q2a.value = "";
    q2b.value = "";
    q2c.value = "";

    q3.value = "";
    q3a.value = "";
    q3b.value = "";
    q3c.value = "";

    const radioButtons =
        document.querySelectorAll(
            'input[name="q1answer"], input[name="q2answer"], input[name="q3answer"]'
        );

    radioButtons.forEach(function (radio) {
        radio.checked = false;
    });

    moduleSaved = false;
}

function resetCourseForm() {
    courseTitle.value = "";
    courseInstructor.value = "";
    courseDescription.value = "";
    courseThumbnail.value = "";
    courseCategory.selectedIndex = 0;
}

loadInstructors();
displayCourses();

createCourseBtn.addEventListener("click", function (event) {

    event.preventDefault();

    editingCourseId = null;

    courseModalTitle.textContent = "Create Course";

    resetCourseForm();

    courseModal.style.display = "flex";
});

closeModal.addEventListener("click", function () {
    courseModal.style.display = "none";
});

cancelBtn.addEventListener("click", function () {
    courseModal.style.display = "none";
    resetCourseForm();
});

nextBtn.addEventListener("click", function () {
    const title =
        courseTitle.value.trim();

    const category =
        courseCategory.value;

    const instructorId =
        Number(courseInstructor.value);

    const description =
        courseDescription.value.trim();

    if (title === "" || !instructorId) {
        alert(
            "Please enter course title and select instructor"
        );

        return;
    }

    const selectedInstructor =
        staffUsers.find(function (staff) {
            return staff.id === instructorId;
        });

    if (!selectedInstructor) {
        alert("Selected instructor not found");
        return;
    }

 if (editingCourseId !== null) {

    const existingCourse = coursesData.find(function (course) {
        return course.id === editingCourseId;
    });

    if (!existingCourse) {
        alert("Course not found");
        return;
    }

    currentCourse = {
        id: existingCourse.id,
        title: title,
        category: category,
        instructorId: instructorId,
        instructor: selectedInstructor.name,
        description: description,
        modules: JSON.parse(
            JSON.stringify(existingCourse.modules || [])
        )
    };

} else {

    currentCourse = {
        id: Date.now(),
        title: title,
        category: category,
        instructorId: instructorId,
        instructor: selectedInstructor.name,
        description: description,
        modules: []
    };

}

    currentModuleNumber = 1;

    moduleHeading.textContent =
        `Module ${currentModuleNumber}`;

    resetModuleForm();

    courseModal.style.display = "none";
    moduleModal.style.display = "flex";

    console.log(currentCourse);
});

saveModule.addEventListener("click", function () {
    if (moduleSaved) {
        alert("This module is already saved");
        return;
    }

    const title =
        moduleTitle.value.trim();

    const vTitle =
        videoTitle.value.trim();

    const vUrl =
        videoUrl.value.trim();

    const blog =
        blogText.value.trim();

    if (title === "") {
        alert("Please enter module title");
        return;
    }

    const q1Answer =
        document.querySelector(
            'input[name="q1answer"]:checked'
        );

    const q2Answer =
        document.querySelector(
            'input[name="q2answer"]:checked'
        );

    const q3Answer =
        document.querySelector(
            'input[name="q3answer"]:checked'
        );

    const quiz1 = {
        question: q1.value.trim(),

        options: {
            A: q1a.value.trim(),
            B: q1b.value.trim(),
            C: q1c.value.trim()
        },

        correctAnswer:
            q1Answer ? q1Answer.value : null
    };

    const quiz2 = {
        question: q2.value.trim(),

        options: {
            A: q2a.value.trim(),
            B: q2b.value.trim(),
            C: q2c.value.trim()
        },

        correctAnswer:
            q2Answer ? q2Answer.value : null
    };

    const quiz3 = {
        question: q3.value.trim(),

        options: {
            A: q3a.value.trim(),
            B: q3b.value.trim(),
            C: q3c.value.trim()
        },

        correctAnswer:
            q3Answer ? q3Answer.value : null
    };

    const module = {
        id: Date.now(),

        title: title,

        video: {
            title: vTitle,
            url: vUrl
        },

        blog: blog,

        quizzes: [
            quiz1,
            quiz2,
            quiz3
        ]
    };

    currentCourse.modules.push(module);

    moduleSaved = true;

    console.log(currentCourse);

    alert("Module saved successfully");
});

addAnother.addEventListener("click", function () {
    if (!moduleSaved) {
        alert(
            "Please save the current module first"
        );

        return;
    }

    currentModuleNumber++;

    resetModuleForm();

    moduleHeading.textContent =
        `Module ${currentModuleNumber}`;
});

closeModule.addEventListener("click", function () {
    moduleModal.style.display = "none";
});

publishCourse.addEventListener("click", function () {
    if (!currentCourse) {
        alert("No course available to publish");
        return;
    }

    if (currentCourse.modules.length === 0) {
        alert("Please add at least one module");
        return;
    }

    if (!moduleSaved) {
        alert(
            "Please save the current module before publishing"
        );

        return;
    }

    coursesData.push(currentCourse);

    localStorage.setItem(
        "courses",
        JSON.stringify(coursesData)
    );

    displayCourses();

    moduleModal.style.display = "none";

    alert("Course published successfully");

    currentCourse = null;
    currentModuleNumber = 1;
    moduleSaved = false;

    resetModuleForm();
    resetCourseForm();
});
function viewCourse(courseId) {
    viewingCourseId = courseId;

    const course = coursesData.find(function (course) {
        return course.id === courseId;
    });

    if (!course) {
        alert("Course not found");
        return;
    }

    viewCourseTitle.textContent = course.title;

    viewCourseCategory.textContent =
        course.category || "Not specified";

    viewCourseInstructor.textContent =
        course.instructor || "Not assigned";

    viewCourseDescription.textContent =
        course.description || "No description available";

    viewCourseModules.innerHTML = "";

    if (!course.modules || course.modules.length === 0) {

        viewCourseModules.innerHTML =
            "<p>No modules added to this course.</p>";

    } else {

       course.modules.forEach(function (module, index) {

    const moduleBox =
        document.createElement("div");

    moduleBox.classList.add("view-module");

    let quizHTML = "";

    if (module.quizzes && module.quizzes.length > 0) {

        module.quizzes.forEach(function (quiz, quizIndex) {

            if (!quiz.question) {
                return;
            }

            quizHTML += `
                <div class="view-quiz">

                    <p class="quiz-question">
                        ${quizIndex + 1}. ${quiz.question}
                    </p>

                    <div class="quiz-options">
                        <p>
                            A. ${quiz.options.A || ""}
                        </p>

                        <p>
                            B. ${quiz.options.B || ""}
                        </p>

                        <p>
                            C. ${quiz.options.C || ""}
                        </p>
                    </div>

                    <p class="correct-answer">
                        Correct Answer:
                        <strong>
                            ${quiz.correctAnswer || "Not selected"}
                        </strong>
                    </p>

                </div>
            `;
        });

    } else {

        quizHTML = `
            <p>No quiz questions added.</p>
        `;

    }

    moduleBox.innerHTML = `
        <h4>
            Module ${index + 1}: ${module.title}
        </h4>

        <p>
            <strong>Video:</strong>
            ${module.video?.title || "No video"}
        </p>

        <p>
            <strong>Video URL:</strong>
            ${module.video?.url || "Not available"}
        </p>

        <p>
            <strong>Content:</strong>
            ${module.blog || "No content"}
        </p>

        <div class="module-quiz-section">
            <h4>Quiz</h4>

            ${quizHTML}
        </div>
    `;

    viewCourseModules.appendChild(moduleBox);

});
    }

    viewCourseModal.style.display = "flex";
}
closeViewCourse.addEventListener("click", function () {
    viewCourseModal.style.display = "none";
});
viewCourseModal.addEventListener("click", function (event) {

    if (event.target === viewCourseModal) {
        viewCourseModal.style.display = "none";
    }

});
function editCourse(courseId) {

    const course = coursesData.find(function (course) {
        return course.id === courseId;
    });

    if (!course) {
        alert("Course not found");
        return;
    }

    editingCourseId = course.id;

  
    courseTitle.value = course.title || "";
    courseCategory.value = course.category || "";
    courseInstructor.value = course.instructorId || "";
    courseDescription.value = course.description || "";


    
    courseModalTitle.textContent = "Edit Course";

    viewCourseModal.style.display = "none";


    courseModal.style.display = "flex";
}
editCourseBtn.addEventListener("click", function () {

    if (!viewingCourseId) {
        return;
    }

    editCourse(viewingCourseId);

});