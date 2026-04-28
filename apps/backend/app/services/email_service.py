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
        msg["Subject"] = "Your Bloomora Verification Code"
        msg["From"] = settings.MAIL_FROM
        msg["To"] = to_email

        greeting = f"Hi {first_name}," if first_name else "Hi there,"

        html = f"""
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Bloomora Verification Code</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                    <td align="center" style="padding: 40px 20px;">
                        <table role="presentation" width="100%" max-width="560" cellspacing="0" cellpadding="0" border="0" style="max-width: 560px; width: 100%; background: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.08);">
                            
                            <!-- Header with Gradient -->
                            <tr>
                                <td style="background: linear-gradient(135deg, #15803d 0%, #16a34a 50%, #86efac 100%); padding: 48px 40px 40px; text-align: center;">
                                    <div style="width: 64px; height: 64px; background: rgba(255,255,255,0.2); border-radius: 50%; margin: 0 auto 16px; display: inline-flex; align-items: center; justify-content: center; font-size: 32px;">
                                        🌸
                                    </div>
                                    <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">Bloomora</h1>
                                    <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0; font-size: 14px;">Beautiful Flowers, Delivered with Love</p>
                                </td>
                            </tr>
                            
                            <!-- Content -->
                            <tr>
                                <td style="padding: 40px;">
                                    <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 16px;">{greeting}</p>
                                    <p style="color: #6b7280; font-size: 15px; line-height: 1.6; margin: 0 0 32px;">
                                        Thank you for choosing Bloomora! Use the verification code below to complete your request. For your security, this code will expire in <strong style="color: #15803d;">10 minutes</strong>.
                                    </p>
                                    
                                    <!-- OTP Box -->
                                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                                        <tr>
                                            <td style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border: 2px dashed #86efac; border-radius: 16px; padding: 32px; text-align: center;">
                                                <p style="color: #15803d; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 12px;">Your Verification Code</p>
                                                <div style="font-size: 44px; font-weight: 800; letter-spacing: 16px; color: #15803d; font-family: 'Courier New', monospace;">
                                                    {otp}
                                                </div>
                                            </td>
                                        </tr>
                                    </table>
                                    
                                    <p style="color: #9ca3af; font-size: 13px; line-height: 1.5; margin: 24px 0 0; text-align: center;">
                                        If you didn't request this code, you can safely ignore this email. Your account is secure.
                                    </p>
                                </td>
                            </tr>
                            
                            <!-- Decorative Divider -->
                            <tr>
                                <td style="padding: 0 40px;">
                                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                                        <tr>
                                            <td style="border-top: 1px solid #e5e7eb; padding-top: 24px;"></td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                            
                            <!-- Footer -->
                            <tr>
                                <td style="padding: 0 40px 40px; text-align: center;">
                                    <p style="color: #15803d; font-size: 14px; font-weight: 600; margin: 0 0 8px;">Bloomora</p>
                                    <p style="color: #9ca3af; font-size: 12px; line-height: 1.5; margin: 0 0 16px;">
                                        Bringing nature's beauty to your doorstep.<br>
                                        Need help? Contact our support team anytime.
                                    </p>
                                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 0 auto;">
                                        <tr>
                                            <td style="padding: 0 8px;"><a href="#" style="text-decoration: none;"><span style="font-size: 18px;">🌿</span></a></td>
                                            <td style="padding: 0 8px;"><a href="#" style="text-decoration: none;"><span style="font-size: 18px;">💐</span></a></td>
                                            <td style="padding: 0 8px;"><a href="#" style="text-decoration: none;"><span style="font-size: 18px;">🌷</span></a></td>
                                        </tr>
                                    </table>
                                    <p style="color: #d1d5db; font-size: 11px; margin: 16px 0 0;">
                                        © Bloomora. All rights reserved.
                                    </p>
                                </td>
                            </tr>
                            
                        </table>
                    </td>
                </tr>
            </table>
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
