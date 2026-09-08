const API_URL = "";

async function requestJson(url, options = {}) {

    try {

        const response = await fetch(url, options);

        if (!response.ok) {
            let errorMessage = "Request failed.";

            try {
                const errorData = await response.json();

                if (errorData && errorData.error) {
                    errorMessage = errorData.error;
                }
            }
            catch (err) {
                console.error(err);
            }

            throw new Error(errorMessage);
        }

        return await response.json();
    }
    catch (error) {
        console.error(error);
        return null;
    }

}

// =========================
// LOAD TASKS
// =========================

window.onload = loadTasks;

async function loadTasks() {
    const tasks = await requestJson("/tasks");

    if (!tasks) {
        alert(
            "Cannot connect to the backend."
        );
        return;
    }

    displayTasks(tasks);
}


// =========================
// DISPLAY TASKS
// =========================

function displayTasks(tasks) {

    const activeList =
        document.getElementById(
            "activeTaskList"
        );

    const completedList =
        document.getElementById(
            "completedTaskList"
        );

    const historyList =
        document.getElementById(
            "historyList"
        );


    activeList.innerHTML = "";
    completedList.innerHTML = "";
    historyList.innerHTML = "";


    let activeCount = 0;
    let completedCount = 0;


    tasks.forEach(task => {

        if (task.completed === 0) {

            activeCount++;

            activeList.appendChild(
                createTaskElement(task)
            );

        }

        else {

            completedCount++;

            completedList.appendChild(
                createTaskElement(task)
            );

            historyList.appendChild(
                createHistoryElement(task)
            );

        }

    });


    // =========================
    // COUNTS
    // =========================

    document.getElementById(
        "activeCount"
    ).innerText = activeCount;


    document.getElementById(
        "completedCount"
    ).innerText = completedCount;


    document.getElementById(
        "totalCount"
    ).innerText = tasks.length;


    // =========================
    // EMPTY MESSAGES
    // =========================

    if (activeCount === 0) {

        activeList.innerHTML =
            `<div class="empty">
                No active tasks 🎉
            </div>`;

    }


    if (completedCount === 0) {

        completedList.innerHTML =
            `<div class="empty">
                No completed tasks yet.
            </div>`;

        historyList.innerHTML =
            `<div class="empty">
                Your completed task history will appear here.
            </div>`;

    }

}


// =========================
// CREATE TASK ELEMENT
// =========================

function createTaskElement(task) {

    const taskElement =
        document.createElement("div");


    taskElement.className = "task";


    if (task.completed === 1) {

        taskElement.classList.add(
            "completed"
        );

    }


    taskElement.innerHTML = `

        <span>
            ${escapeHTML(task.title)}
        </span>

        <div class="task-buttons">

            <button
                class="complete-btn"
                onclick="toggleTask(${task.id})"
            >
                ${
                    task.completed === 1
                    ? "Undo"
                    : "Complete"
                }
            </button>

            <button
                class="delete-btn"
                onclick="deleteTask(${task.id})"
            >
                Delete
            </button>

        </div>

    `;


    return taskElement;

}


// =========================
// CREATE HISTORY ELEMENT
// =========================

function createHistoryElement(task) {

    const historyElement =
        document.createElement("div");


    historyElement.className =
        "history-item";


    historyElement.innerHTML = `

        <span class="history-task">
            ${escapeHTML(task.title)}
        </span>

        <span class="history-date">
            ${task.completed_at}
        </span>

    `;


    return historyElement;

}


// =========================
// ADD TASK
// =========================

async function addTask() {

    const input =
        document.getElementById(
            "taskInput"
        );


    const title =
        input.value.trim();


    if (title === "") {

        alert(
            "Please enter a task."
        );

        return;

    }


    const result = await requestJson(
        "/tasks",
        {
            method: "POST",

            headers: {
                "Content-Type":
                    "application/json"
            },

            body: JSON.stringify({
                title: title
            })
        }
    );

    if (!result) {
        alert(
            "Failed to add task."
        );
        return;
    }

    input.value = "";

    loadTasks();

}


// =========================
// COMPLETE / UNDO
// =========================

async function toggleTask(id) {

    const result = await requestJson(
        `/tasks/${id}/toggle`,
        {
            method: "PUT"
        }
    );

    if (!result) {
        alert(
            "Failed to update task."
        );
        return;
    }

    loadTasks();

}
// =========================
// DELETE TASK
// =========================

async function deleteTask(id) {

    const confirmed =
        confirm(
            "Delete this task?"
        );


    if (!confirmed) {

        return;

    }


    const result = await requestJson(
        `/tasks/${id}`,
        {
            method: "DELETE"
        }
    );

    if (!result) {
        alert(
            "Failed to delete task."
        );
        return;
    }

    loadTasks();

}


// =========================
// ENTER KEY
// =========================

document
    .getElementById("taskInput")
    .addEventListener(
        "keydown",
        function(event) {

            if (event.key === "Enter") {

                addTask();

            }

        }
    );


// =========================
// BASIC HTML ESCAPING
// =========================

function escapeHTML(text) {

    const div =
        document.createElement("div");


    div.textContent = text;


    return div.innerHTML;

}