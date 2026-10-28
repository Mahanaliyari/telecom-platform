"""Create (or update) a user from the command line.

    python -m scripts.create_user --email admin@example.com --name "Admin User" --role admin

The password is asked for interactively, so it never ends up in your shell history.
Use --update to change the password, name or role of an existing user.
"""
import argparse
import getpass
import sys

from pydantic import EmailStr, TypeAdapter, ValidationError
from sqlalchemy import select

from app.database import Base, SessionLocal, engine
from app.models import User
from app.security import hash_password, validate_password


def main() -> int:
    parser = argparse.ArgumentParser(description="Create a user.")
    parser.add_argument("--email", required=True)
    parser.add_argument("--name", required=True, help="Full name")
    parser.add_argument("--role", choices=["admin", "analyst"], default="analyst")
    parser.add_argument("--password", help="Avoid this: it is visible in shell history")
    parser.add_argument("--update", action="store_true", help="Update the user if it exists")
    args = parser.parse_args()

    try:
        email = TypeAdapter(EmailStr).validate_python(args.email).strip().lower() # type: ignore
    except ValidationError as error:
        print(f"Invalid email: {error.errors()[0]['msg']}")
        return 1

    password = args.password or getpass.getpass("Password: ")
    if args.password is None and getpass.getpass("Repeat password: ") != password:
        print("The passwords do not match.")
        return 1
    try:
        validate_password(password)
    except ValueError as error:
        print(error)
        return 1

    Base.metadata.create_all(engine)  # creates the users table the first time
    with SessionLocal() as session:
        user = session.scalar(select(User).where(User.email == email))
        if user and not args.update:
            print(f"{email} already exists. Use --update to change it.")
            return 1
        if user is None:
            user = User(email=email)
            session.add(user)
        user.password_hash = hash_password(password)
        user.full_name = " ".join(args.name.split())
        user.role = args.role
        user.is_active = True
        session.commit()
        print(f"Saved {email} with role '{user.role}'.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
