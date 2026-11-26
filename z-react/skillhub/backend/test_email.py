from unittest.mock import patch
from shared.email_service import send_invitation_email


def test_invitation_message_and_tls(monkeypatch):
    settings = {"MAIL_FROM": "office@example.org", "SMTP_HOST": "mail.example.org",
                "SMTP_PORT": "587", "SMTP_USER": "test-user", "SMTP_PASSWORD": "test-only"}
    for key, value in settings.items():
        monkeypatch.setenv(key, value)
    with patch("shared.email_service.smtplib.SMTP") as smtp:
        link = "https://example.org/register?token=test"
        send_invitation_email("learner@example.org", "student", link)
        client = smtp.return_value.__enter__.return_value
        client.starttls.assert_called_once()
        client.login.assert_called_once_with("test-user", "test-only")
        message = client.send_message.call_args.args[0]
        assert message["To"] == "learner@example.org"
        assert link in message.get_content()
