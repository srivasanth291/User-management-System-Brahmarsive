from fastapi import FastAPI

app = FastAPI(title="SkillHub FastAPI")

@app.get("/")
def home():
    return {
        "message": "SkillHub FastAPI Backend Running"
    }

@app.get("/api/courses")
def get_courses():
    return {
        "courses": [
            {
                "id": 1,
                "title": "Python Basics",
                "category": "Python"
            },
            {
                "id": 2,
                "title": "Web Development",
                "category": "Web Development"
            }
        ]
    }         
    