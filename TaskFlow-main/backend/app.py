from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from datetime import datetime
from zoneinfo import ZoneInfo
import sqlite3
import os


# =========================
# APP SETUP
# =========================

app = Flask(
    __name__,
    static_folder="../frontend",
    static_url_path=""
)

CORS(app)


# =========================
# DATABASE
# =========================

BASE_DIR = os.path.dirname(
    os.path.abspath(__file__)
)

DATABASE = os.path.join(
    BASE_DIR,
    "tasks.db"
)


# =========================
# FRONTEND
# =========================

@app.route("/")
def home():
    return send_from_directory(
        app.static_folder,
        "index.html"
    )


# =========================
# HEALTH CHECK
# =========================

@app.route("/health")
def health():
    return jsonify({
        "status": "Backend is running"
    })


# =========================
# DATABASE CONNECTION
# =========================

def get_db_connection():

    connection = sqlite3.connect(
        DATABASE
    )

    connection.row_factory = sqlite3.Row

    return connection


# =========================
# CREATE TABLE
# =========================

def create_table():

    connection = get_db_connection()

    connection.execute(
        """
        CREATE TABLE IF NOT EXISTS tasks (

            id INTEGER PRIMARY KEY AUTOINCREMENT,

            title TEXT NOT NULL,

            completed INTEGER DEFAULT 0,

            completed_at TEXT

        )
        """
    )

    connection.commit()
    connection.close()


create_table()


# =========================
# GET ALL TASKS
# =========================

@app.route( "/tasks", methods=["GET"])
def get_tasks():

    connection = get_db_connection()

    tasks = connection.execute(
        """
        SELECT *
        FROM tasks
        ORDER BY
            completed ASC,
            id DESC
        """
    ).fetchall()

    connection.close()

    return jsonify(
        [
            dict(task)
            for task in tasks
        ]
    )


# =========================
# ADD TASK
# =========================

@app.route(
    "/tasks",
    methods=["POST"]
)
def add_task():

    data = request.get_json()

    title = data.get(
        "title",
        ""
    ).strip()

    if title == "":

        return jsonify({
            "error": "Task title is required"
        }), 400

    connection = get_db_connection()

    connection.execute(
        """
        INSERT INTO tasks (title)
        VALUES (?)
        """,
        (title,)
    )

    connection.commit()
    connection.close()

    return jsonify({
        "message": "Task added successfully"
    }), 201


# =========================
# COMPLETE / UNDO TASK
# =========================

@app.route(
    "/tasks/<int:task_id>/toggle",
    methods=["PUT"]
)
def toggle_task(task_id):

    connection = get_db_connection()

    task = connection.execute(
        """
        SELECT completed
        FROM tasks
        WHERE id = ?
        """,
        (task_id,)
    ).fetchone()

    if task is None:

        connection.close()

        return jsonify({
            "error": "Task not found"
        }), 404


    # Completed → Undo

    if task["completed"] == 1:

        connection.execute(
            """
            UPDATE tasks

            SET
                completed = 0,
                completed_at = NULL

            WHERE id = ?
            """,
            (task_id,)
        )


    # Active → Complete

    else:

        completed_at = datetime.now(ZoneInfo("Asia/Kolkata")).strftime("%Y-%m-%d %H:%M:%S")

        connection.execute(
            """
            UPDATE tasks

            SET
                completed = 1,
                completed_at = ?

            WHERE id = ?
            """,
            (completed_at, task_id)
        )


    connection.commit()
    connection.close()

    return jsonify({
        "message": "Task updated successfully"
    })


# =========================
# DELETE TASK
# =========================

@app.route(
    "/tasks/<int:task_id>",
    methods=["DELETE"]
)
def delete_task(task_id):

    connection = get_db_connection()

    connection.execute(
        """
        DELETE FROM tasks
        WHERE id = ?
        """,
        (task_id,)
    )

    connection.commit()
    connection.close()

    return jsonify({
        "message": "Task deleted successfully"
    })


# =========================
# RUN SERVER
# =========================

if __name__ == "__main__":

    app.run(
        host="0.0.0.0",
        port=int(os.environ.get("PORT", 5000)),
        debug=False,
        use_reloader=False
    )