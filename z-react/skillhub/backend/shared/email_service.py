import os
import smtplib
import ssl

from pathlib import Path
from email.message import EmailMessage
from dotenv import load_dotenv

load_dotenv(
    Path(__file__).resolve().parent.parent / ".env"
)


def send_invitation_email(
    recipient: str,
    role: str,
    registration_link: str
):
    message = EmailMessage()

    message["Subject"] = "SkillHub - Registration Invitation"
    message["From"] = os.environ["MAIL_FROM"]
    message["To"] = recipient

    message.set_content(
        f"""Welcome to SkillHub!

You have been invited to join SkillHub as {role}.

Click the following link to register:

{registration_link}

This invitation expires in 24 hours.
The link can only be used once.

If you did not expect this invitation,
you can ignore this email.

SkillHub Team
"""
    )

    with smtplib.SMTP(
        os.environ["SMTP_HOST"],
        int(os.getenv("SMTP_PORT", "587")),
        timeout=20
    ) as server:
        server.starttls(context=ssl.create_default_context())
        server.login(
            os.environ["SMTP_USER"],
            os.environ["SMTP_PASSWORD"]
        )
        server.send_message(message)
