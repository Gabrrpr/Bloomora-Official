import os
import random
import string
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

load_dotenv()

# Official Esting's wordmark (inline SVG so the real logo renders without an
# external image host). Single-colour vector — same artwork as Estings.svg.
ESTINGS_LOGO_SVG = (
    '<svg width="176" height="63" viewBox="0 0 219 78" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Esting\'s">'
    '<path d="M49.5497 13.8726C44.7505 18.0212 45.6407 16.1614 41.8187 13.2876C35.1786 8.29556 27.5153 17.8627 30.822 22.1747C33.2628 25.3581 40.302 23.1546 41.5429 23.9857C42.8492 24.8608 40.4592 29.9625 39.6295 31.0521C37.2033 34.2281 35.3915 33.024 31.942 33.5432C26.8791 34.3061 21.6493 36.4097 18.2482 40.4632C13.2603 46.4107 15.6841 54.2692 24.3368 52.4484C26.7195 51.9463 40.6624 44.7996 41.1704 43.086C41.5284 41.8746 40.7592 40.1171 41.7848 38.952C42.8056 37.8478 44.973 38.7131 46.2986 38.2597C50.2222 34.6059 57.2783 22.2064 62.4477 21.3825C64.3321 21.0827 68.5701 21.324 68.9813 23.6957C69.2353 25.1704 68.1903 28.5804 68.0645 30.4524C67.9654 31.9393 68.05 40.6972 68.6016 41.5041C72.1961 42.3401 79.1313 39.1202 81.0955 36.027C81.5068 35.3786 83.1202 31.3104 83.0743 30.6986C83.1638 30.1989 82.0147 30.1672 81.7075 30.1258C79.4337 29.8211 76.4269 30.6742 76.8381 27.1082C76.9107 26.472 77.9315 23.4836 78.2678 22.9401C80.0917 19.9931 83.962 22.2697 86.6011 21.5848C90.4908 15.0962 88.8991 4.77337 99.77 7.78124C101.812 8.34674 102.871 9.12918 102.307 11.3327C101.891 12.9634 97.1623 21.1802 97.3559 21.9114C99.1386 22.9474 101.874 22.2722 101.703 25.0924C101.403 29.9917 97.4526 29.5822 93.9427 30.5109C92.8251 33.3677 88.5871 40.3316 89.2112 43.2639C89.9635 46.8056 96.9229 42.0306 98.1807 40.5632C100.469 35.1812 101.925 28.4976 104.562 23.3496C105.121 22.26 105.29 21.6214 106.715 21.3752C108.575 21.051 114.052 21.6726 114.233 24.1832L107.549 40.7631C107.566 43.2639 109.538 42.579 111.105 41.8843C118.215 38.7326 117.339 28.422 120.914 22.7621C122.136 20.8292 125.147 20.8438 127.194 21.1022C128.036 21.2094 129.485 21.987 129.84 21.9919C130.399 21.9967 132.854 21.0486 133.819 20.8999C143.019 19.4715 145.481 23.6689 142.518 32.1026C141.846 34.0185 137.886 40.6631 138.587 42.0379C139.526 43.3834 143.266 41.7283 143.803 40.7094C144.187 39.9782 144.342 35.5956 144.828 33.9429C147.416 25.1777 157 17.5069 166.347 19.4276C167.583 19.6811 170.268 21.3021 170.784 21.324C171.43 21.3532 172.557 20.0955 173.478 19.9127C175.389 19.53 182.143 20.4002 182.005 23.1277C175.23 37.3701 171.541 55.5514 163.244 68.8309C152.874 85.4327 127.291 75.6412 130.554 58.5592C131.659 52.7677 135.123 51.41 140.612 52.6727C147.813 54.3302 142.426 57.3161 141.192 60.7481C140.196 63.522 140.435 66.7565 142.702 68.8479C150.588 76.1239 157.501 56.9383 159.028 51.7879C153.195 52.8433 147.455 51.4491 144.852 45.6722C140.883 47.8586 133.621 50.7787 129.639 47.3979C124.821 43.3054 130.697 35.7272 131.681 31.4152C132.383 28.3416 130.155 29.6676 128.677 30.8278C124.115 34.4085 123.824 42.7472 121.512 47.2517C120.578 49.0701 113.669 49.5892 112.102 48.741C111.562 48.4485 111.732 47.6807 111.485 47.6271C110.97 47.5174 108.42 48.8531 107.564 49.0408C104.112 49.794 101.504 49.3796 98.9234 46.9104C94.1846 50.7056 81.7995 53.9962 79.083 46.4254C78.8943 45.8989 78.9717 43.8904 78.3645 43.9903C76.872 44.9604 75.14 46.0183 73.4613 46.6082C71.8793 47.1639 68.6427 47.4247 67.6122 48.0268C66.8817 48.4534 64.7917 51.2467 63.7031 52.1316C58.8386 56.0925 54.1941 56.3631 49.2086 52.3972C47.6266 51.1395 46.5478 49.3747 44.9754 48.1243C36.4268 54.0182 24.494 65.4062 13.3474 63.9144C8.12241 63.2149 3.63764 58.4471 1.59119 53.8232C-3.58783 42.1159 4.59797 30.6036 15.7252 26.9351L15.7954 26.3696C9.702 16.9389 20.9333 5.40712 29.0465 1.85324C36.1897 -1.27651 43.8676 -0.377065 50.2512 4.05919C55.7592 7.8885 53.662 10.3187 49.5594 13.8652L49.5497 13.8726ZM164.768 27.2252C162.46 27.6322 159.115 32.7022 158.256 34.8107C155.36 41.9355 159.151 45.5137 163.916 38.8082C165.314 36.8411 170.467 26.2185 164.765 27.2252H164.768ZM58.5991 41.7624C58.8773 39.9124 59.6586 32.6462 56.3059 35.5517C55.6939 36.0831 52.4476 40.0513 52.571 40.6851C53.4781 41.3261 57.8976 42.1963 58.5991 41.7624ZM52.1066 46.6764C52.9121 48.9287 56.2527 49.7599 57.8855 47.9902L57.5057 47.2029L52.1042 46.6764H52.1066Z" fill="#2E8B34"/>'
    '<path d="M206.195 36.9216C208.924 35.9563 210.885 33.2556 212.441 30.9083C213.135 29.8601 214.202 26.7304 215.331 26.5037C216.517 26.2673 217.656 26.7864 218.251 27.8199C221.505 33.4554 210.568 41.6893 206.314 43.7441C205.738 56.3021 190.74 54.8591 184.248 47.6831C182.037 48.1706 177.129 49.8696 175.174 48.3803C171.79 45.8014 180.75 43.4321 181.401 42.0403C182.051 40.6485 180.779 37.6309 182.477 36.0563C184.059 34.5889 185.689 35.8418 187.153 35.2129C187.596 35.0228 193.239 29.4068 194.11 28.5146C195.522 27.0643 199.173 22.0553 200.624 21.6799C202.252 21.2606 207.46 21.4093 208.839 22.4331C211.224 24.2051 208.498 26.2014 207.605 27.9833C206.241 30.7035 205.721 33.9161 206.195 36.9191V36.9216ZM197.724 32.7803C197.329 32.3488 194.973 35.1032 194.698 35.4566C194.323 35.9393 192.98 37.3481 193.384 37.8819L197.24 39.1178L197.724 32.7803ZM190.402 43.0714C189.659 43.2444 189.144 43.8002 189.236 44.5997C189.555 46.6179 193.752 48.2803 194.84 46.323C196.246 43.7978 192.276 42.6351 190.402 43.0689V43.0714Z" fill="#2E8B34"/>'
    '<path d="M117.569 19.0401C112.716 23.8444 103.621 18.4672 107.402 11.5984C111.918 3.39375 124.344 12.3296 117.569 19.0401Z" fill="#2E8B34"/>'
    '<path d="M185.21 25.1582C184.521 24.4367 184.545 21.3995 184.85 20.4124C185.203 19.2667 189.877 13.5264 190.953 12.6684C196.234 8.45398 202.066 15.1693 198.708 18.7768C197.371 20.2149 191.981 21.8895 189.78 23.1862C188.679 23.8346 186.483 26.489 185.21 25.1557V25.1582Z" fill="#2E8B34"/>'
    '</svg>'
)

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
    print(f"[DEVELOPER LOG] OTP for {to_email} is: {otp}")
    
    greeting = f"Hi {first_name}," if first_name else "Hi there,"

    html = f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Esting's Verification Code</title>
    </head>
    <body style="margin:0;padding:0;background-color:#f4f6f4;font-family:Arial,Helvetica,sans-serif;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f4f6f4;">
            <tr>
                <td align="center" style="padding:32px 16px;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="max-width:520px;width:100%;background:#ffffff;border:1px solid #e6ebe6;border-radius:14px;overflow:hidden;">

                        <tr>
                            <td align="center" style="padding:36px 40px 26px;border-bottom:1px solid #f0f2f0;">
                                {ESTINGS_LOGO_SVG}
                                <p style="margin:14px 0 0;color:#6b7280;font-size:11px;letter-spacing:2px;text-transform:uppercase;">Flowers International Inc</p>
                            </td>
                        </tr>

                        <tr>
                            <td style="padding:34px 40px 4px;">
                                <p style="margin:0 0 14px;color:#111827;font-size:16px;line-height:1.6;">{greeting}</p>
                                <p style="margin:0 0 26px;color:#4b5563;font-size:15px;line-height:1.65;">
                                    Use the verification code below to continue. For your security, it expires in <strong style="color:#2E8B34;">10 minutes</strong>.
                                </p>
                            </td>
                        </tr>

                        <tr>
                            <td style="padding:0 40px;">
                                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                                    <tr>
                                        <td align="center" style="background:#f4f9f4;border:1px solid #d8e8da;border-radius:12px;padding:26px;">
                                            <p style="margin:0 0 12px;color:#6b7280;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">Verification Code</p>
                                            <p style="margin:0;color:#1f5132;font-size:36px;font-weight:700;letter-spacing:10px;font-family:'Courier New',Courier,monospace;">{otp}</p>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>

                        <tr>
                            <td style="padding:22px 40px 34px;">
                                <p style="margin:0;color:#9ca3af;font-size:13px;line-height:1.6;text-align:center;">
                                    If you didn't request this code, you can safely ignore this email.
                                </p>
                            </td>
                        </tr>

                        <tr>
                            <td style="padding:22px 40px;background:#fafbfa;border-top:1px solid #f0f2f0;text-align:center;">
                                <p style="margin:0 0 4px;color:#374151;font-size:13px;font-weight:600;">Esting's Flowers International Inc</p>
                                <p style="margin:0;color:#9ca3af;font-size:11px;">&copy; Esting's Flowers International Inc. All rights reserved.</p>
                            </td>
                        </tr>

                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    """

    subject = "Your Esting's Verification Code"
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