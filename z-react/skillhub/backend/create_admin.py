from getpass import getpass

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError

from shared.database import SessionLocal
from shared.models.user import User, UserRole
from shared.security import hash_password


def create_admin():
    print("SkillHub - Initial Admin Setup")

    name = input("Admin name: ").strip()
    email = input("Admin email: ").strip().lower()
    password = getpass("Admin password: ")
    confirm_password = getpass("Confirm password: ")

    if not name or len(name) > 150:
        print("Invalid admin name")
        return

    if (
        not email
        or len(email) > 255
        or "@" not in email
        or not email.split("@")[-1]
    ):
        print("Invalid email")
        return

    if len(password) < 12:
        print("Password must contain at least 12 characters")
        return

    if password != confirm_password:
        print("Passwords do not match")
        return

    with SessionLocal() as db:
        existing_admin = db.scalar(
            select(User.id).where(
                User.role == UserRole.ADMIN
            )
        )

        if existing_admin is not None:
            print("An admin already exists. Setup stopped.")
            return

        existing_email = db.scalar(
            select(User.id).where(User.email == email)
        )

        if existing_email is not None:
            print("Email already registered")
            return

        admin = User(
            name=name,
            email=email,
            password_hash=hash_password(password),
            role=UserRole.ADMIN,
            is_active=True
        )

        db.add(admin)

        try:
            db.commit()
            print("Admin account created successfully!")

        except IntegrityError:
            db.rollback()
            print("Admin creation failed: database conflict")


if __name__ == "__main__":
    create_admin()
