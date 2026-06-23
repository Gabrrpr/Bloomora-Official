import os
import random
import string
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

load_dotenv()

# ── CORE SMTP SENDER UTILITY ──────────────────────────────────────────────────
def _send_email_via_hostinger(to_email: str, subject: str, html_content: str):
    smtp_host = os.getenv("SMTP_HOST")
    smtp_port = int(os.getenv("SMTP_PORT", 465))
    
    # Clean up the variables
    smtp_user = os.getenv("SMTP_USER", "").strip(' "\'')
    smtp_pass = os.getenv("SMTP_PASSWORD", "").strip(' "\'')
    sender_email = os.getenv("SMTP_FROM_EMAIL", "").strip(' "\'')

    msg = MIMEMultipart()
    
    # 🚀 THE FIX: Send strictly the raw email address. 
    # Do not include "Esting's Flowers" here to bypass Hostinger's strict filter.
    msg["From"] = sender_email
    msg["To"] = to_email
    msg["Subject"] = subject

    msg.attach(MIMEText(html_content, "html"))

    try:
        print(f"🚀 Attempting to send live email to {to_email}...")
        with smtplib.SMTP_SSL(smtp_host, smtp_port) as server:
            server.login(smtp_user, smtp_pass)
            server.send_message(msg)
        print(f"✅ Success! Email delivered to {to_email}")
        return True, None
    except Exception as e:
        print(f"❌ SMTP Error sending to {to_email}: {str(e)}")
        return False, str(e)


# ── EMAIL FUNCTIONS ───────────────────────────────────────────────────────────
def generate_otp() -> str:
    return ''.join(random.choices(string.digits, k=6))

def send_otp_email(to_email: str, otp: str, first_name: str = None):
    print(f"🔔 [DEVELOPER LOG] OTP for {to_email} is: {otp}")
    
    greeting = f"Hi {first_name}," if first_name else "Hi there,"

    html = f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Estings Verification Code</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
            <tr>
                <td align="center" style="padding: 40px 20px;">
                    <table role="presentation" width="100%" max-width="560" cellspacing="0" cellpadding="0" border="0" style="max-width: 560px; width: 100%; background: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.08);">
                        
                        <tr>
                            <td style="background: linear-gradient(135deg, #15803d 0%, #16a34a 50%, #86efac 100%); padding: 48px 40px 40px; text-align: center;">
                                <div style="width: 64px; height: 64px; background: rgba(255,255,255,0.2); border-radius: 50%; margin: 0 auto 16px; display: inline-flex; align-items: center; justify-content: center; font-size: 32px;">
                                    🌸
                                </div>
                                <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">Esting's Flowers International Inc</h1>
                                <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0; font-size: 14px;">Beautiful Flowers, Delivered with Love</p>
                            </td>
                        </tr>
                        
                        <tr>
                            <td style="padding: 40px;">
                                <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 16px;">{greeting}</p>
                                <p style="color: #6b7280; font-size: 15px; line-height: 1.6; margin: 0 0 32px;">
                                    Thank you for choosing Esting's! Use the verification code below to complete your request. For your security, this code will expire in <strong style="color: #15803d;">10 minutes</strong>.
                                </p>
                                
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
                        
                        <tr>
                            <td style="padding: 0 40px;">
                                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                                    <tr>
                                        <td style="border-top: 1px solid #e5e7eb; padding-top: 24px;"></td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                        
                        <tr>
                            <td style="padding: 0 40px 40px; text-align: center;">
                                <p style="color: #15803d; font-size: 14px; font-weight: 600; margin: 0 0 8px;">Estings</p>
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
                                    © Estings. All rights reserved.
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

    subject = "Your Bloomora Verification Code"
    return _send_email_via_hostinger(to_email, subject, html)


def send_staff_confirm_email(to_email: str, first_name: str, verify_url: str):
    print(f"\n{'='*60}")
    print(f"🔔 [DEV MODE] STAFF ACTIVATION LINK FOR: {to_email}")
    print(f"👉 CLICK HERE: {verify_url}")
    print(f"{'='*60}\n")

    greeting = f"Hi {first_name},"
    html = f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Esting's Staff Confirmation</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
            <tr>
                <td align="center" style="padding: 40px 20px;">
                    <table role="presentation" width="100%" max-width="560" cellspacing="0" cellpadding="0" border="0" style="max-width: 560px; width: 100%; background: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.08);">
                        
                        <tr>
                            <td style="background: linear-gradient(135deg, #15803d 0%, #16a34a 50%, #86efac 100%); padding: 48px 40px 40px; text-align: center;">
                                <div style="width: 64px; height: 64px; background: rgba(255,255,255,0.2); border-radius: 50%; margin: 0 auto 16px; display: inline-flex; align-items: center; justify-content: center; font-size: 32px;">
                                    👤
                                </div>
                                <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">Esting's Staff</h1>
                                <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0; font-size: 14px;">Account Activation</p>
                            </td>
                        </tr>
                        
                        <tr>
                            <td style="padding: 40px;">
                                <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 16px;">{greeting}</p>
                                <p style="color: #6b7280; font-size: 15px; line-height: 1.6; margin: 0 0 32px;">
                                    Your staff account has been created by an administrator. 
                                    <strong>Click the button below to activate your account.</strong>
                                </p>
                                
                                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                                    <tr>
                                        <td style="text-align: center;">
                                            <a href="{verify_url}" style="background: linear-gradient(135deg, #15803d, #16a34a); color: white; padding: 16px 40px; font-size: 18px; font-weight: 600; text-decoration: none; border-radius: 12px; display: inline-block; box-shadow: 0 4px 16px rgba(21,128,61,0.3);">
                                                Confirm My Account
                                            </a>
                                        </td>
                                    </tr>
                                </table>
                                
                                <p style="color: #dc2626; font-size: 14px; line-height: 1.5; margin: 32px 0 0; font-weight: 500; text-align: center;">
                                    <strong>⚠️ Security Notice</strong><br>
                                    If you didn&#39;t request to be staff of Esting's, please ignore and delete this email immediately.
                                </p>
                            </td>
                        </tr>
                        
                        <tr>
                            <td style="padding: 0 40px;">
                                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                                    <tr>
                                        <td style="border-top: 1px solid #e5e7eb; padding-top: 24px;"></td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                        
                        <tr>
                            <td style="padding: 0 40px 40px; text-align: center;">
                                <p style="color: #15803d; font-size: 14px; font-weight: 600; margin: 0 0 8px;">Esting's Flowers International Inc</p>
                                <p style="color: #9ca3af; font-size: 12px; line-height: 1.5; margin: 0 0 16px;">
                                    Bringing nature&#39;s beauty to your doorstep.
                                </p>
                                <p style="color: #d1d5db; font-size: 11px; margin: 16px 0 0;">
                                    © Esting's Flowers International Inc. All rights reserved.
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
    
    subject = "Esting's Staff Account Confirmation"
    return _send_email_via_hostinger(to_email, subject, html)


def send_order_status_email(to_email: str, first_name: str, order_number: str, status: str, message: str):
    status_config = {
        "confirmed":        {"emoji": "✅", "color": "#15803d", "label": "Order Confirmed"},
        "preparing":        {"emoji": "🌸", "color": "#d97706", "label": "Being Prepared"},
        "out_for_delivery": {"emoji": "🚚", "color": "#2563eb", "label": "Out for Delivery"},
        "delivered":        {"emoji": "🎉", "color": "#15803d", "label": "Delivered"},
        "cancelled":        {"emoji": "❌", "color": "#dc2626", "label": "Order Cancelled"},
    }
    cfg = status_config.get(status, {"emoji": "📦", "color": "#6b7280", "label": status.title()})

    html = f"""
    <!DOCTYPE html>
    <html lang="en">
    <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
    <body style="margin:0;padding:0;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background-color:#f3f4f6;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
            <tr>
                <td align="center" style="padding:40px 20px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"
                        style="max-width:560px;width:100%;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 10px 40px rgba(0,0,0,0.08);">
                        <tr>
                            <td style="background:linear-gradient(135deg,#15803d 0%,#16a34a 50%,#86efac 100%);padding:48px 40px 40px;text-align:center;">
                                <div style="font-size:48px;margin-bottom:12px;">{cfg['emoji']}</div>
                                <h1 style="color:#ffffff;margin:0;font-size:24px;font-weight:700;">Esting's Flowers International Inc</h1>
                                <p style="color:rgba(255,255,255,0.9);margin:8px 0 0;font-size:14px;">Order Update</p>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding:40px;">
                                <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 16px;">Hi {first_name},</p>
                                <p style="color:#6b7280;font-size:15px;line-height:1.6;margin:0 0 32px;">
                                    Here's an update on your order.
                                </p>
                                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                                    <tr>
                                        <td style="background:#f0fdf4;border:2px solid #86efac;border-radius:16px;padding:28px;text-align:center;">
                                            <p style="color:#6b7280;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:2px;margin:0 0 8px;">Order Number</p>
                                            <p style="color:#15803d;font-size:20px;font-weight:800;margin:0 0 16px;font-family:'Courier New',monospace;">{order_number}</p>
                                            <div style="display:inline-block;background:{cfg['color']};color:#ffffff;padding:8px 24px;border-radius:999px;font-size:14px;font-weight:700;">
                                                {cfg['label']}
                                            </div>
                                        </td>
                                    </tr>
                                </table>
                                <p style="color:#374151;font-size:14px;line-height:1.6;margin:24px 0 0;padding:16px;background:#f9fafb;border-radius:12px;border-left:4px solid {cfg['color']};">
                                    {message}
                                </p>
                                <p style="color:#9ca3af;font-size:13px;line-height:1.5;margin:24px 0 0;text-align:center;">
                                    You can track your order anytime in the Esting's app.
                                </p>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding:0 40px 40px;text-align:center;border-top:1px solid #e5e7eb;">
                                <p style="color:#15803d;font-size:14px;font-weight:600;margin:24px 0 8px;">Esting's</p>
                                <p style="color:#9ca3af;font-size:12px;margin:0;">Bringing nature's beauty to your doorstep.</p>
                                <p style="color:#d1d5db;font-size:11px;margin:12px 0 0;">© Esting's Flowers International Inc. All rights reserved.</p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    """
    
    subject = f"Esting's — {cfg['label']}: {order_number}"
    return _send_email_via_hostinger(to_email, subject, html)