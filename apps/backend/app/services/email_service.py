import smtplib
import random
import string
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timedelta, timezone
from app.core.config import settings

def generate_otp() -> str:
    return ''.join(random.choices(string.digits, k=4))

def send_otp_email(to_email: str, otp: str, first_name: str = None):
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = "Your Esting's Verification Code"
        msg["From"] = settings.MAIL_FROM
        msg["To"] = to_email

        greeting = f"Hi {first_name}," if first_name else "Hi,"

        html = f"""
        <html>
        <body style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 40px;">
            <div style="max-width: 480px; margin: auto; background: white; border-radius: 16px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
<h2 style="color: #15803d; margin-bottom: 4px;">Esting's Flower International Inc.</h2>
                <p style="color: #555;">{greeting}</p>
                <p style="color: #555;">Use the code below to verify your email address. This code expires in <strong>10 minutes</strong>.</p>
                <div style="text-align: center; margin: 32px 0;">
                    <span style="font-size: 48px; font-weight: bold; letter-spacing: 12px; color: #15803d;">{otp}</span>
                </div>
                <p style="color: #999; font-size: 13px;">If you didn't request this, you can safely ignore this email.</p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;">
<p style="color: #bbb; font-size: 12px; text-align: center;">Esting's Flower International Inc.</p>
            </div>
        </body>
        </html>
        """

        msg.attach(MIMEText(html, "html"))

        with smtplib.SMTP(settings.MAIL_SERVER, settings.MAIL_PORT) as server:
            server.starttls()
            server.login(settings.MAIL_USERNAME, settings.MAIL_PASSWORD)
            server.sendmail(settings.MAIL_FROM, to_email, msg.as_string())

        return True, None
    except Exception as e:
        print(f"[EMAIL ERROR] {e}")
        return False, str(e)
