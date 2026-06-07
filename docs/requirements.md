# Prerequisites

## Required Software

- **XAMPP** (includes Apache + MySQL + PHP 8.x)  
  https://www.apachefriends.org/download.html

- **Composer** (PHP dependency manager)  
  https://getcomposer.org/download (use the Windows Installer)

---

## PHP Configuration

In `C:\xampp\php\php.ini`, make sure the following extension is enabled (remove the leading `;`):

```ini
extension=zip
```

Restart Apache in XAMPP after making this change.

---

## PHP Dependencies

Navigate to the `backend/` folder and run:

```bash
composer install
```

This will install:
- **PHPMailer** `^7.1` — used for sending password recovery emails via SMTP

---

## Database Setup

1. Open **phpMyAdmin** and create a database named `rental_platform`
2. Run the following SQL to create the required tables:

```sql
CREATE TABLE password_resets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    code VARCHAR(6) NOT NULL,
    expires_at DATETIME NOT NULL
);
```

---

## Email Configuration (Gmail SMTP)

Password recovery emails are sent via Gmail SMTP using PHPMailer.

1. Enable **2-Step Verification** on your Google account
2. Generate an **App Password** at https://myaccount.google.com/apppasswords
3. In `backend/password_recovery.php`, fill in your credentials:

```php
$mail->Username = 'your_gmail@gmail.com';
$mail->Password = 'your 16-character app password';
```

> ⚠️ Never commit real credentials to version control. Consider using a `.env` file.