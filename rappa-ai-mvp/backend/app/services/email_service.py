"""Email service for sending verification and password reset emails via Gmail SMTP."""

import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional

from app.config import settings

logger = logging.getLogger(__name__)


class EmailService:
    """Service for sending emails via SMTP (Gmail)."""

    def __init__(self):
        """Initialize email service with SMTP configuration."""
        self.smtp_host = settings.SMTP_HOST
        self.smtp_port = settings.SMTP_PORT
        self.smtp_username = settings.SMTP_USERNAME
        self.smtp_password = settings.SMTP_PASSWORD
        self.from_email = settings.SMTP_FROM_EMAIL
        self.from_name = settings.SMTP_FROM_NAME
        self.frontend_url = settings.FRONTEND_URL

        if not self.smtp_username or not self.smtp_password:
            logger.warning(
                "SMTP credentials not configured. Email sending will fail. "
                "Set SMTP_USERNAME and SMTP_PASSWORD in environment variables."
            )

    def send_email(
        self,
        to_email: str,
        subject: str,
        html_body: str,
        text_body: Optional[str] = None
    ) -> bool:
        """Send HTML email via SMTP.

        Args:
            to_email: Recipient email address
            subject: Email subject line
            html_body: HTML content of the email
            text_body: Plain text fallback (optional)

        Returns:
            bool: True if email sent successfully, False otherwise
        """
        try:
            logger.info(f"Attempting to send email to {to_email}")
            logger.info(f"SMTP Config - Host: {self.smtp_host}, Port: {self.smtp_port}, Username: {self.smtp_username}")

            # Create message
            msg = MIMEMultipart('alternative')
            msg['Subject'] = subject
            msg['From'] = f"{self.from_name} <{self.from_email}>"
            msg['To'] = to_email

            # Add plain text part if provided
            if text_body:
                text_part = MIMEText(text_body, 'plain')
                msg.attach(text_part)

            # Add HTML part
            html_part = MIMEText(html_body, 'html')
            msg.attach(html_part)

            # Send via SMTP
            logger.info(f"Connecting to SMTP server {self.smtp_host}:{self.smtp_port}")
            with smtplib.SMTP(self.smtp_host, self.smtp_port, timeout=10) as server:
                logger.info("Starting TLS...")
                server.starttls()  # Enable TLS encryption
                logger.info("Logging in...")
                server.login(self.smtp_username, self.smtp_password)
                logger.info("Sending message...")
                server.send_message(msg)
                logger.info("Message sent successfully!")

            logger.info(f"✅ Email sent successfully to {to_email}: {subject}")
            return True

        except smtplib.SMTPAuthenticationError as e:
            logger.error(f"❌ SMTP Authentication failed: {e}")
            logger.error(f"Check SMTP_USERNAME and SMTP_PASSWORD in .env file")
            return False
        except smtplib.SMTPException as e:
            logger.error(f"❌ SMTP error occurred: {e}", exc_info=True)
            return False
        except Exception as e:
            logger.error(f"❌ Failed to send email to {to_email}: {e}", exc_info=True)
            return False

    def send_verification_email(self, to_email: str, token: str) -> bool:
        """Send email verification link.

        Args:
            to_email: User's email address
            token: Verification token (UUID)

        Returns:
            bool: True if email sent successfully
        """
        verification_url = f"{self.frontend_url}/verify-email?token={token}"
        subject = "Verify Your Email - Rappa.AI"

        html_body = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body {{
                    font-family: Arial, sans-serif;
                    line-height: 1.6;
                    color: #333;
                }}
                .container {{
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                }}
                .header {{
                    background-color: #4F46E5;
                    color: white;
                    padding: 20px;
                    text-align: center;
                    border-radius: 5px 5px 0 0;
                }}
                .content {{
                    background-color: #f9fafb;
                    padding: 30px;
                    border: 1px solid #e5e7eb;
                }}
                .button {{
                    display: inline-block;
                    background-color: #4F46E5;
                    color: white;
                    padding: 12px 30px;
                    text-decoration: none;
                    border-radius: 5px;
                    margin: 20px 0;
                }}
                .footer {{
                    text-align: center;
                    color: #6b7280;
                    font-size: 12px;
                    margin-top: 30px;
                }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Welcome to Rappa.AI!</h1>
                </div>
                <div class="content">
                    <h2>Verify Your Email Address</h2>
                    <p>Thank you for signing up for Rappa.AI. To complete your registration and start processing documents, please verify your email address by clicking the button below:</p>

                    <p style="text-align: center;">
                        <a href="{verification_url}" class="button">Verify Email Address</a>
                    </p>

                    <p>Or copy and paste this link into your browser:</p>
                    <p style="word-break: break-all; color: #6b7280;">{verification_url}</p>

                    <p><strong>This verification link will expire in 24 hours.</strong></p>

                    <p>If you didn't create an account with Rappa.AI, please ignore this email.</p>
                </div>
                <div class="footer">
                    <p>&copy; 2025 Rappa.AI. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        """

        text_body = f"""
        Welcome to Rappa.AI!

        Thank you for signing up. Please verify your email address by clicking the link below:

        {verification_url}

        This verification link will expire in 24 hours.

        If you didn't create an account with Rappa.AI, please ignore this email.

        © 2025 Rappa.AI. All rights reserved.
        """

        return self.send_email(to_email, subject, html_body, text_body)

    def send_password_reset_email(self, to_email: str, token: str) -> bool:
        """Send password reset link.

        Args:
            to_email: User's email address
            token: Password reset token (UUID)

        Returns:
            bool: True if email sent successfully
        """
        reset_url = f"{self.frontend_url}/reset-password?token={token}"
        subject = "Reset Your Password - Rappa.AI"

        html_body = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body {{
                    font-family: Arial, sans-serif;
                    line-height: 1.6;
                    color: #333;
                }}
                .container {{
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                }}
                .header {{
                    background-color: #DC2626;
                    color: white;
                    padding: 20px;
                    text-align: center;
                    border-radius: 5px 5px 0 0;
                }}
                .content {{
                    background-color: #f9fafb;
                    padding: 30px;
                    border: 1px solid #e5e7eb;
                }}
                .button {{
                    display: inline-block;
                    background-color: #DC2626;
                    color: white;
                    padding: 12px 30px;
                    text-decoration: none;
                    border-radius: 5px;
                    margin: 20px 0;
                }}
                .footer {{
                    text-align: center;
                    color: #6b7280;
                    font-size: 12px;
                    margin-top: 30px;
                }}
                .warning {{
                    background-color: #FEF3C7;
                    border-left: 4px solid #F59E0B;
                    padding: 15px;
                    margin: 20px 0;
                }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Password Reset Request</h1>
                </div>
                <div class="content">
                    <h2>Reset Your Password</h2>
                    <p>We received a request to reset your password for your Rappa.AI account. Click the button below to create a new password:</p>

                    <p style="text-align: center;">
                        <a href="{reset_url}" class="button">Reset Password</a>
                    </p>

                    <p>Or copy and paste this link into your browser:</p>
                    <p style="word-break: break-all; color: #6b7280;">{reset_url}</p>

                    <div class="warning">
                        <p><strong>⚠️ This password reset link will expire in 1 hour.</strong></p>
                    </div>

                    <p>If you didn't request a password reset, please ignore this email. Your password will remain unchanged.</p>

                    <p>For security reasons, we recommend choosing a strong password that you haven't used before.</p>
                </div>
                <div class="footer">
                    <p>&copy; 2025 Rappa.AI. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        """

        text_body = f"""
        Password Reset Request

        We received a request to reset your password for your Rappa.AI account.

        Click the link below to create a new password:

        {reset_url}

        ⚠️ This password reset link will expire in 1 hour.

        If you didn't request a password reset, please ignore this email. Your password will remain unchanged.

        For security reasons, we recommend choosing a strong password that you haven't used before.

        © 2025 Rappa.AI. All rights reserved.
        """

        return self.send_email(to_email, subject, html_body, text_body)

    def send_email_change_verification(self, to_email: str, token: str) -> bool:
        """Send email change verification link to NEW email address.

        Args:
            to_email: User's NEW email address to verify
            token: Email change verification token (UUID)

        Returns:
            bool: True if email sent successfully
        """
        verification_url = f"{self.frontend_url}/verify-email-change?token={token}"
        subject = "Verify Your New Email Address - Rappa.AI"

        html_body = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body {{
                    font-family: Arial, sans-serif;
                    line-height: 1.6;
                    color: #333;
                }}
                .container {{
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                }}
                .header {{
                    background-color: #4F46E5;
                    color: white;
                    padding: 20px;
                    text-align: center;
                    border-radius: 5px 5px 0 0;
                }}
                .content {{
                    background-color: #f9fafb;
                    padding: 30px;
                    border: 1px solid #e5e7eb;
                }}
                .button {{
                    display: inline-block;
                    background-color: #4F46E5;
                    color: white;
                    padding: 12px 30px;
                    text-decoration: none;
                    border-radius: 5px;
                    margin: 20px 0;
                }}
                .footer {{
                    text-align: center;
                    color: #6b7280;
                    font-size: 12px;
                    margin-top: 30px;
                }}
                .warning {{
                    background-color: #FEF3C7;
                    border-left: 4px solid #F59E0B;
                    padding: 15px;
                    margin: 20px 0;
                }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Verify New Email Address</h1>
                </div>
                <div class="content">
                    <h2>Confirm Email Change</h2>
                    <p>You requested to change your email address for your Rappa.AI account. To complete the email change, please verify this new email address by clicking the button below:</p>

                    <p style="text-align: center;">
                        <a href="{verification_url}" class="button">Verify New Email</a>
                    </p>

                    <p>Or copy and paste this link into your browser:</p>
                    <p style="word-break: break-all; color: #6b7280;">{verification_url}</p>

                    <div class="warning">
                        <p><strong>⚠️ This verification link will expire in 1 hour.</strong></p>
                    </div>

                    <p>If you didn't request this email change, please ignore this email and contact support immediately.</p>
                </div>
                <div class="footer">
                    <p>&copy; 2025 Rappa.AI. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        """

        text_body = f"""
        Verify New Email Address

        You requested to change your email address for your Rappa.AI account.

        To complete the email change, please verify this new email address by clicking the link below:

        {verification_url}

        ⚠️ This verification link will expire in 1 hour.

        If you didn't request this email change, please ignore this email and contact support immediately.

        © 2025 Rappa.AI. All rights reserved.
        """

        return self.send_email(to_email, subject, html_body, text_body)

    def send_support_ticket_notification(
        self,
        admin_emails: list[str],
        ticket_id: int,
        user_email: str,
        ticket_type: str,
        subject: str,
        description: str,
        priority: str,
        has_attachment: bool = False
    ) -> bool:
        """Send support ticket notification to admin emails.

        Args:
            admin_emails: List of admin email addresses
            ticket_id: Ticket ID
            user_email: Email of user who submitted ticket
            ticket_type: Type of ticket (bug, feature_request, help, etc.)
            subject: Ticket subject
            description: Ticket description
            priority: Priority level
            has_attachment: Whether ticket has file attachment

        Returns:
            bool: True if email sent successfully to at least one admin
        """
        email_subject = f"🎫 New Support Ticket #{ticket_id} - {priority.upper()} Priority"

        # Map ticket types to icons
        type_icons = {
            'bug': '🐛',
            'feature_request': '💡',
            'help': '❓',
            'billing': '💳',
            'other': '📝',
        }
        icon = type_icons.get(ticket_type, '📝')

        # Map priority to colors
        priority_colors = {
            'low': '#6B7280',
            'medium': '#F59E0B',
            'high': '#F97316',
            'urgent': '#DC2626',
        }
        priority_color = priority_colors.get(priority, '#6B7280')

        html_body = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body {{
                    font-family: Arial, sans-serif;
                    line-height: 1.6;
                    color: #333;
                }}
                .container {{
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                }}
                .header {{
                    background-color: #4F46E5;
                    color: white;
                    padding: 20px;
                    text-align: center;
                    border-radius: 5px 5px 0 0;
                }}
                .content {{
                    background-color: #f9fafb;
                    padding: 30px;
                    border: 1px solid #e5e7eb;
                }}
                .ticket-info {{
                    background-color: white;
                    padding: 20px;
                    border-radius: 5px;
                    margin: 20px 0;
                    border-left: 4px solid {priority_color};
                }}
                .label {{
                    font-weight: bold;
                    color: #6b7280;
                    display: inline-block;
                    width: 100px;
                }}
                .value {{
                    color: #111827;
                }}
                .priority-badge {{
                    display: inline-block;
                    padding: 4px 12px;
                    border-radius: 12px;
                    background-color: {priority_color};
                    color: white;
                    font-size: 12px;
                    font-weight: bold;
                }}
                .description {{
                    background-color: #f3f4f6;
                    padding: 15px;
                    border-radius: 5px;
                    margin-top: 15px;
                    white-space: pre-wrap;
                    word-wrap: break-word;
                }}
                .footer {{
                    text-align: center;
                    color: #6b7280;
                    font-size: 12px;
                    margin-top: 30px;
                }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>{icon} New Support Ticket</h1>
                </div>
                <div class="content">
                    <div class="ticket-info">
                        <h2 style="margin-top: 0;">{subject}</h2>

                        <p>
                            <span class="label">Ticket ID:</span>
                            <span class="value">#{ticket_id}</span>
                        </p>

                        <p>
                            <span class="label">User:</span>
                            <span class="value">{user_email}</span>
                        </p>

                        <p>
                            <span class="label">Type:</span>
                            <span class="value">{ticket_type.replace('_', ' ').title()}</span>
                        </p>

                        <p>
                            <span class="label">Priority:</span>
                            <span class="priority-badge">{priority.upper()}</span>
                        </p>

                        {f'<p><span class="label">Attachment:</span><span class="value">✅ Yes</span></p>' if has_attachment else ''}

                        <p style="margin-top: 20px; margin-bottom: 5px;"><strong>Description:</strong></p>
                        <div class="description">{description}</div>
                    </div>

                    <p style="text-align: center; margin-top: 30px;">
                        <a href="{self.frontend_url}/admin/tickets/{ticket_id}"
                           style="display: inline-block; background-color: #4F46E5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px;">
                            View Ticket in Dashboard
                        </a>
                    </p>
                </div>
                <div class="footer">
                    <p>&copy; 2025 Rappa.AI Support System. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        """

        text_body = f"""
        New Support Ticket #{ticket_id}

        Subject: {subject}
        User: {user_email}
        Type: {ticket_type.replace('_', ' ').title()}
        Priority: {priority.upper()}
        {'Attachment: Yes' if has_attachment else ''}

        Description:
        {description}

        View ticket: {self.frontend_url}/admin/tickets/{ticket_id}

        © 2025 Rappa.AI Support System
        """

        # Send to all admin emails
        success = False
        for admin_email in admin_emails:
            if self.send_email(admin_email, email_subject, html_body, text_body):
                success = True

        return success


def get_email_service() -> EmailService:
    """Get EmailService instance.

    Returns:
        EmailService: Singleton email service instance
    """
    return EmailService()
