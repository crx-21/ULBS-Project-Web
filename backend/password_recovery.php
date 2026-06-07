<?php
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;
require __DIR__ . '/vendor/autoload.php';
require __DIR__ . '/config.php';

header('Content-Type: application/json');
require 'database.php'; // Load the DB connection once at the top

// Read the incoming JSON data
$data = json_decode(file_get_contents("php://input"), true);
$action = $data['action'] ?? '';

// --- ROUTER ---
if ($action === 'send_code') {
    send_code($conn, $data);
} elseif ($action === 'reset_data') {
    reset_data($conn, $data);
} else {
    http_response_code(400);
    echo json_encode(['message' => 'Invalid action.']);
}

// --- FUNCTIONS ---

function send_code($conn, $data) {
    $email = $data['email'] ?? '';

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        echo json_encode(['message' => 'Invalid email format.']);
        exit;
    }

    // 1. Check if user exists
    $stmt = $conn->prepare("SELECT 1 FROM users WHERE email = ?");
    $stmt->execute([$email]);
    if (!$stmt->fetch()) {
        echo json_encode(['message' => 'If that email is registered, a code has been sent.']);
        exit;
    }

    // 2. Generate a 6-digit code and expiration time
    $code = str_pad(rand(0, 999999), 6, '0', STR_PAD_LEFT);
    $expires_at = date('Y-m-d H:i:s', strtotime('+15 minutes'));

    // 3. Save to database
    $stmt = $conn->prepare("
        INSERT INTO password_resets (email, code, expires_at) 
        VALUES (?, ?, ?) 
        ON DUPLICATE KEY UPDATE code = ?, expires_at = ?
    ");
    $stmt->execute([$email, $code, $expires_at, $code, $expires_at]);

    // 4. Send the Email via PHPMailer
    $mail = new PHPMailer(true);
    try {
        $mail->isSMTP();
        $mail->Host       = 'smtp.gmail.com';
        $mail->SMTPAuth   = true;
        $mail->Username   = MAIL_USERNAME;
        $mail->Password   = MAIL_PASSWORD;
        $mail->SMTPSecure = 'tls';
        $mail->Port       = 587;

        $mail->setFrom(MAIL_USERNAME, MAIL_FROM_NAME);
        $mail->addAddress($email);
        $mail->Subject = "Rentify - Your Password Recovery Code";
        $mail->Body    = "Your account recovery code is: $code\n\nIt expires in 15 minutes.";

        $mail->send();
        echo json_encode(['message' => 'A code has been sent.']);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['message' => 'Failed to send email. Check mail server configuration.']);
    }
}

function reset_data($conn, $data) {
    $email        = $data['email'] ?? '';
    $code         = $data['code'] ?? '';
    $new_password = $data['newPassword'] ?? '';

    // 1. Validate required fields first
    if (!$email || !$code || !$new_password) {
        http_response_code(400);
        echo json_encode(['message' => 'Missing required fields.']);
        exit;
    }

    // 2. Verify the code
    $stmt = $conn->prepare("SELECT * FROM password_resets WHERE email = ? AND code = ?");
    $stmt->execute([$email, $code]);
    $reset_record = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$reset_record) {
        http_response_code(400);
        echo json_encode(['message' => 'Invalid code.']);
        exit;
    }

    // 3. Check expiration
    if (strtotime($reset_record['expires_at']) < time()) {
        http_response_code(400);
        echo json_encode(['message' => 'Code has expired. Please request a new one.']);
        exit;
    }

    // 4. Hash the new password
    $hashed_password = password_hash($new_password, PASSWORD_BCRYPT);

    // 5. Update the user's password
    $stmt = $conn->prepare("UPDATE users SET password_hash = ? WHERE email = ?");
    $stmt->execute([$hashed_password, $email]);

    // 6. Delete the used recovery code
    $stmt = $conn->prepare("DELETE FROM password_resets WHERE email = ?");
    $stmt->execute([$email]);

    echo json_encode(['message' => 'Password successfully reset! You can now log in.']);
}
?>