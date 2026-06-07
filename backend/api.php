<?php
session_start();
ini_set('display_errors', 1);
error_reporting(E_ALL);

require_once 'database.php';
require_once 'models.php';
require_once 'auth_session.php';

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$userModel = new User($conn);
$inputData = json_decode(file_get_contents("php://input"), true);
$request = $inputData['action'] ?? $_REQUEST['action'] ?? '';
$propertyModel = new Property($conn);

switch ($request) {

    case 'Register':
        $username = $inputData['username'] ?? '';
        $password = $inputData['password'] ?? '';
        $email    = $inputData['email']    ?? '';
        $role     = $inputData['role']     ?? '';

        if (strlen($password) < 6) {
            http_response_code(400);
            echo json_encode([
                "success" => false,
                "message" => "Password must be at least 6 characters."
            ]);
            exit;
        }

        $res = $userModel->Register($username, $password, $email, $role);

        if (!$res) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Registration failed"]);
            exit;
        }

        $user = $userModel->Login($username, $password);

        if (!$user) {
            http_response_code(500);
            echo json_encode([
                "success" => false,
                "message" => "Account created but sign-in failed. Please log in manually."
            ]);
            exit;
        }

        auth_set_user_session($user);
        echo json_encode(auth_json_logged_in('Registration successful'));
        exit;

    case 'Login':
        $username = $inputData['username'] ?? '';
        $password = $inputData['password'] ?? '';
        $user = $userModel->Login($username, $password);

        if ($user) {
            auth_set_user_session($user);
            echo json_encode(auth_json_logged_in('Login successful'));
        } else {
            http_response_code(401);
            echo json_encode(["success" => false, "message" => "Invalid username or password"]);
        }
        exit;

    case 'Session':
        if (auth_is_logged_in()) {
            echo json_encode(auth_json_logged_in('Session active'));
        } else {
            echo json_encode([
                "success"    => true,
                "logged_in"  => false,
                "session_id" => null,
            ]);
        }
        exit;

    case 'Logout':
        auth_clear_session();
        echo json_encode(["success" => true, "message" => "Logged out"]);
        exit;

    case 'SetRole':
        if (!auth_is_logged_in()) {
            http_response_code(401);
            echo json_encode(["success" => false, "message" => "Unauthorized. Please log in first."]);
            exit;
        }

        $role = $inputData['role'] ?? '';

        $validRoles = ['tenant', 'landlord'];
        if (!in_array($role, $validRoles)) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Invalid role selected."]);
            exit;
        }

        $userId = $_SESSION['user_id'] ?? null;

        if (!$userId) {
            http_response_code(500);
            echo json_encode(["success" => false, "message" => "User ID not found in session."]);
            exit;
        }

        $success = $userModel->updateRole($userId, $role);

        if ($success) {
            $_SESSION['role'] = $role;
            echo json_encode(["success" => true, "message" => "Role updated successfully."]);
        } else {
            http_response_code(500);
            echo json_encode(["success" => false, "message" => "Failed to update role in the database."]);
        }
        exit;

    case 'GetCounts':
        echo json_encode([
            'status'     => 'success',
            'properties' => $propertyModel->GetPropertyCounts(),
            'cities'     => $propertyModel->GetCityCount()
        ]);
        exit;

    case 'get_properties':
        requireLandlord();
        getProperties($conn);
        exit;

    case 'get_property':
        requireLandlord();
        getProperty($conn, (int)($inputData['id'] ?? 0));
        exit;

    case 'create_property':
        requireLandlord();
        createProperty($conn, $inputData);
        exit;

    case 'update_property':
        requireLandlord();
        updateProperty($conn, $inputData);
        exit;

    case 'delete_property':
        requireLandlord();
        deleteProperty($conn, $inputData);
        exit;

    case 'upload_property_photo':
        requireLandlord();
        uploadPropertyPhoto($conn);
        exit;

    case 'get_available_properties':
        getAvailableProperties($conn);
        exit;

    case 'apply_for_property':
            requireTenant();
            applyForProperty($conn, $inputData);
            exit;
        
    case 'get_tenant_application':
            requireTenant();
            getTenantApplication($conn);
            exit;

    case 'get_applications':
        requireLandlord();
        getLandlordApplications($conn);
        exit;
            
        
            
    // This one is called via GET from email link
    case 'email_action':
        handleApplicationByToken($conn, $_GET);
        exit;
    

    case 'handle_application':
        requireLandlord();
        handleApplicationFromInbox($conn, $inputData);
        exit;  

    default:
        http_response_code(404);
        echo json_encode(["success" => false, "message" => "Invalid Action"]);
        exit;
    
}

// ─── Auth Guard ───────────────────────────────────────────────────────────────

function requireLandlord() {
    if (empty($_SESSION['user_id']) || ($_SESSION['role'] ?? '') !== 'landlord') {
        echo json_encode(['success' => false, 'message' => 'Unauthorized.']);
        exit;
    }
}

// ─── Property Handlers ────────────────────────────────────────────────────────

function getProperties($conn) {
    $landlordId = $_SESSION['user_id'];

    $stmt = $conn->prepare("
        SELECT propertyId, title, description, location, rent, lease_term, photos, created_at, status
        FROM properties
        WHERE landlordId = :landlordId
        ORDER BY created_at DESC
    ");
    $stmt->execute([':landlordId' => $landlordId]);
    $properties = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(['success' => true, 'properties' => $properties]);
}

function getProperty($conn, int $propertyId) {
    $landlordId = $_SESSION['user_id'];

    $stmt = $conn->prepare("
        SELECT propertyId, title, description, location, rent, lease_term, created_at
        FROM properties
        WHERE propertyId = :propertyId AND landlordId = :landlordId
    ");
    $stmt->execute([':propertyId' => $propertyId, ':landlordId' => $landlordId]);
    $property = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$property) {
        echo json_encode(['success' => false, 'message' => 'Property not found.']);
        return;
    }

    echo json_encode(['success' => true, 'property' => $property]);
}

function createProperty($conn, array $input) {
    $landlordId = $_SESSION['user_id'];

    $title       = trim($input['title'] ?? '');
    $description = trim($input['description'] ?? '');
    $location    = trim($input['location'] ?? '');
    $rent        = $input['rent'] ?? null;
    $lease_term  = trim($input['lease_term'] ?? '');

    if (!$title || !$location || !$rent || !$lease_term) {
        echo json_encode(['success' => false, 'message' => 'Title, location, rent and lease term are required.']);
        return;
    }

    if (!is_numeric($rent) || $rent <= 0) {
        echo json_encode(['success' => false, 'message' => 'Rent must be a positive number.']);
        return;
    }

    $stmt = $conn->prepare("
        INSERT INTO properties (landlordId, title, description, location, rent, lease_term)
        VALUES (:landlordId, :title, :description, :location, :rent, :lease_term)
    ");
    $stmt->execute([
        ':landlordId'  => $landlordId,
        ':title'       => $title,
        ':description' => $description,
        ':location'    => $location,
        ':rent'        => $rent,
        ':lease_term'  => $lease_term
    ]);

    echo json_encode(['success' => true, 'propertyId' => $conn->lastInsertId()]);
}

function updateProperty($conn, array $input) {
    $landlordId = $_SESSION['user_id'];
    $propertyId = (int)($input['propertyId'] ?? 0);

    $title       = trim($input['title'] ?? '');
    $description = trim($input['description'] ?? '');
    $location    = trim($input['location'] ?? '');
    $rent        = $input['rent'] ?? null;
    $lease_term  = trim($input['lease_term'] ?? '');

    if (!$propertyId || !$title || !$location || !$rent || !$lease_term) {
        echo json_encode(['success' => false, 'message' => 'All fields are required.']);
        return;
    }

    if (!is_numeric($rent) || $rent <= 0) {
        echo json_encode(['success' => false, 'message' => 'Rent must be a positive number.']);
        return;
    }

    // Make sure property exists and belongs to this landlord
    $checkStmt = $conn->prepare("SELECT propertyId FROM properties WHERE propertyId = :propertyId AND landlordId = :landlordId");
    $checkStmt->execute([':propertyId' => $propertyId, ':landlordId' => $landlordId]);
    if (!$checkStmt->fetch()) {
        echo json_encode(['success' => false, 'message' => 'Property not found.']);
        return;
    }

    $stmt = $conn->prepare("
        UPDATE properties
        SET title = :title, description = :description, location = :location,
        rent = :rent, lease_term = :lease_term
        WHERE propertyId = :propertyId AND landlordId = :landlordId
    ");
    $stmt->execute([
        ':title'       => $title,
        ':description' => $description,
        ':location'    => $location,
        ':rent'        => $rent,
        ':lease_term'  => $lease_term,
        ':propertyId'  => $propertyId,
        ':landlordId'  => $landlordId
    ]);

    echo json_encode(['success' => true]);
}

function deleteProperty($conn, array $input) {
    $landlordId = $_SESSION['user_id'];
    $propertyId = (int)($input['propertyId'] ?? 0);

    if (!$propertyId) {
        echo json_encode(['success' => false, 'message' => 'Invalid property ID.']);
        return;
    }

    // Make sure property belongs to this landlord
    $stmt = $conn->prepare("SELECT propertyId FROM properties WHERE propertyId = :propertyId AND landlordId = :landlordId");
    $stmt->execute([':propertyId' => $propertyId, ':landlordId' => $landlordId]);
    if (!$stmt->fetch()) {
        echo json_encode(['success' => false, 'message' => 'Property not found.']);
        return;
    }

    // Delete related applications first
    $stmt = $conn->prepare("DELETE FROM applications WHERE propertyId = :propertyId");
    $stmt->execute([':propertyId' => $propertyId]);

    // Now delete the property
    $stmt = $conn->prepare("DELETE FROM properties WHERE propertyId = :propertyId AND landlordId = :landlordId");
    $stmt->execute([':propertyId' => $propertyId, ':landlordId' => $landlordId]);

    echo json_encode(['success' => true]);
}

function uploadPropertyPhoto($conn) {
    $landlordId = $_SESSION['user_id'];
    $propertyId = (int)($_POST['propertyId'] ?? 0);

    if (!$propertyId) {
        echo json_encode(['success' => false, 'message' => 'Invalid property ID.']);
        return;
    }

    // Make sure property belongs to this landlord
    $stmt = $conn->prepare("SELECT propertyId FROM properties WHERE propertyId = :propertyId AND landlordId = :landlordId");
    $stmt->execute([':propertyId' => $propertyId, ':landlordId' => $landlordId]);
    if (!$stmt->fetch()) {
        echo json_encode(['success' => false, 'message' => 'Property not found.']);
        return;
    }

    if (empty($_FILES['photo'])) {
        echo json_encode(['success' => false, 'message' => 'No file uploaded.']);
        return;
    }

    $file    = $_FILES['photo'];
    $allowed = ['image/jpeg', 'image/png', 'image/webp'];
    $maxSize = 5 * 1024 * 1024; // 5MB

    if (!in_array($file['type'], $allowed)) {
        echo json_encode(['success' => false, 'message' => 'Only JPG, PNG and WEBP allowed.']);
        return;
    }

    if ($file['size'] > $maxSize) {
        echo json_encode(['success' => false, 'message' => 'File too large. Max 5MB.']);
        return;
    }

    $ext      = pathinfo($file['name'], PATHINFO_EXTENSION);
    $filename = uniqid('prop_', true) . '.' . $ext;
    $uploadDir  = __DIR__ . '/../uploads/properties/';
    $uploadPath = $uploadDir . $filename;

    if (!is_dir($uploadDir)) mkdir($uploadDir, 0755, true);

    if (!move_uploaded_file($file['tmp_name'], $uploadPath)) {
        echo json_encode(['success' => false, 'message' => 'Failed to save file.']);
        return;
    }

    // Delete old photo file if exists
    $stmt = $conn->prepare("SELECT photos FROM properties WHERE propertyId = :propertyId");
    $stmt->execute([':propertyId' => $propertyId]);
    $old = $stmt->fetchColumn();
    if ($old && file_exists($uploadDir . $old)) {
        unlink($uploadDir . $old);
    }

    // Save new filename to DB
    $stmt = $conn->prepare("UPDATE properties SET photos = :filename WHERE propertyId = :propertyId");
    $stmt->execute([':filename' => $filename, ':propertyId' => $propertyId]);

    echo json_encode([
        'success'  => true,
        'filename' => $filename,
        'url'      => '/ULBS-Project-Web/uploads/properties/' . $filename
    ]);
}

//Partea 1
function getAvailableProperties($conn) {
    $stmt = $conn->prepare("
        SELECT propertyId, title, description, location, rent, lease_term, photos, created_at
        FROM properties
        WHERE status = 'available'
        ORDER BY created_at DESC
    ");
    $stmt->execute();
    $properties = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(['success' => true, 'properties' => $properties]);
}

function requireTenant() {
    if (empty($_SESSION['user_id']) || ($_SESSION['role'] ?? '') !== 'tenant') {
        echo json_encode(['success' => false, 'message' => 'Unauthorized.']);
        exit;
    }
}

function getTenantApplication($conn) {
    $tenantId = $_SESSION['user_id'];

    $stmt = $conn->prepare("
        SELECT a.applicationId, a.propertyId, a.status, a.created_at,
               p.title, p.location, p.rent, p.photos
        FROM applications a
        JOIN properties p ON p.propertyId = a.propertyId
        WHERE a.tenantId = :tenantId
        LIMIT 1
    ");
    $stmt->execute([':tenantId' => $tenantId]);
    $application = $stmt->fetch(PDO::FETCH_ASSOC);

    echo json_encode([
        'success'     => true,
        'has_applied' => $application ? true : false,
        'application' => $application ?: null
    ]);
}

function applyForProperty($conn, array $input) {
    $tenantId   = $_SESSION['user_id'];
    $propertyId = (int)($input['propertyId'] ?? 0);
    $title      = trim($input['title'] ?? '');
    $message    = trim($input['message'] ?? '');

    if (!$propertyId) {
        echo json_encode(['success' => false, 'message' => 'Invalid property ID.']);
        return;
    }

    if (!$title || !$message) {
        echo json_encode(['success' => false, 'message' => 'Title and message are required.']);
        return;
    }

    // Check tenant hasn't already applied anywhere
    $stmt = $conn->prepare("SELECT applicationId FROM applications WHERE tenantId = :tenantId");
    $stmt->execute([':tenantId' => $tenantId]);
    if ($stmt->fetch()) {
        echo json_encode(['success' => false, 'message' => 'You have already applied for a property.']);
        return;
    }

    // Get property + landlord email in one query
    $stmt = $conn->prepare("
        SELECT p.propertyId, p.title AS propertyTitle, p.location,
               u.email AS landlordEmail, u.username AS landlordName
        FROM properties p
        JOIN users u ON u.userId = p.landlordId
        WHERE p.propertyId = :propertyId
    ");
    $stmt->execute([':propertyId' => $propertyId]);
    $property = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$property) {
        echo json_encode(['success' => false, 'message' => 'Property not found.']);
        return;
    }

    // Get tenant username
    $stmt = $conn->prepare("SELECT username FROM users WHERE userId = :tenantId");
    $stmt->execute([':tenantId' => $tenantId]);
    $tenant = $stmt->fetch(PDO::FETCH_ASSOC);

    // Insert application
    $stmt = $conn->prepare("
        INSERT INTO applications (propertyId, tenantId, status, title, message)
        VALUES (:propertyId, :tenantId, 'pending', :title, :message)
    ");
    $stmt->execute([
        ':propertyId' => $propertyId,
        ':tenantId'   => $tenantId,
        ':title'      => $title,
        ':message'    => $message
    ]);

    $applicationId = $conn->lastInsertId();

    // Send email to landlord
    sendApplicationEmail(
        $conn,
        $property['landlordEmail'],
        $property['landlordName'],
        $tenant['username'],
        $property['propertyTitle'],
        $property['location'],
        $title,
        $message,
        $applicationId
    );

    echo json_encode(['success' => true, 'applicationId' => $applicationId]);
}

function sendApplicationEmail($conn, $landlordEmail, $landlordName, $tenantName, $propertyTitle, $location, $appTitle, $appMessage, $applicationId) {
    require_once __DIR__ . '/vendor/autoload.php';
    require_once __DIR__ . '/config.php';

    // Generate secure token
    $token = bin2hex(random_bytes(32));
    $stmt  = $conn->prepare("UPDATE applications SET action_token = :token WHERE applicationId = :id");
    $stmt->execute([':token' => $token, ':id' => $applicationId]);

    $baseUrl     = 'http://localhost/ULBS-Project-Web/backend/api.php';
    $approveUrl = $baseUrl . '?action=email_action&token=' . $token . '&decision=approved';
    $rejectUrl  = $baseUrl . '?action=email_action&token=' . $token . '&decision=rejected';

    $mail = new PHPMailer\PHPMailer\PHPMailer(true);

    try {
        $mail->isSMTP();
        $mail->Host       = 'smtp.gmail.com';
        $mail->SMTPAuth   = true;
        $mail->Username   = MAIL_USERNAME;
        $mail->Password   = MAIL_PASSWORD;
        $mail->SMTPSecure = PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_STARTTLS;
        $mail->Port       = 587;

        $mail->setFrom(MAIL_USERNAME, MAIL_FROM_NAME);
        $mail->addAddress($landlordEmail, $landlordName);

        $mail->isHTML(true);
        $mail->Subject = "New Application: {$appTitle}";
        $mail->Body    = "
            <div style='font-family: Montserrat, sans-serif; max-width: 600px; margin: auto;'>
                <div style='background: #5c0a28; padding: 24px; border-radius: 12px 12px 0 0;'>
                    <h1 style='color: white; margin: 0; font-size: 1.4rem;'>New Rental Application</h1>
                </div>
                <div style='background: #fff; padding: 28px; border: 1px solid #e8d8de; border-radius: 0 0 12px 12px;'>
                    <p style='color: #555;'>Hi <strong>{$landlordName}</strong>,</p>
                    <p style='color: #555;'>You have received a new application for your property.</p>

                    <div style='background: #f5f0f2; border-radius: 10px; padding: 16px; margin: 20px 0;'>
                        <p style='margin: 0 0 6px; color: #5c0a28; font-weight: 700;'>🏠 {$propertyTitle}</p>
                        <p style='margin: 0; color: #888; font-size: 0.9rem;'>📍 {$location}</p>
                    </div>

                    <div style='border-left: 4px solid #5c0a28; padding-left: 16px; margin: 20px 0;'>
                        <p style='margin: 0 0 4px; font-weight: 700; color: #333;'>From: {$tenantName}</p>
                        <p style='margin: 0 0 12px; font-weight: 600; color: #5c0a28;'>{$appTitle}</p>
                        <p style='margin: 0; color: #666; line-height: 1.6;'>{$appMessage}</p>
                    </div>

                    <div style='display: flex; gap: 12px; margin-top: 28px;'>
                        <a href='{$approveUrl}' style='flex: 1; text-align: center; padding: 14px; background: #2dc653; color: white; text-decoration: none; border-radius: 50px; font-weight: 700; font-size: 1rem;'>
                            ✓ Accept
                        </a>
                        <a href='{$rejectUrl}' style='flex: 1; text-align: center; padding: 14px; background: #e63946; color: white; text-decoration: none; border-radius: 50px; font-weight: 700; font-size: 1rem;'>
                            ✕ Reject
                        </a>
                    </div>

                    <p style='color: #aaa; font-size: 0.8rem; margin-top: 24px; text-align: center;'>
                        You can also manage applications from your Rentifly dashboard.
                    </p>
                </div>
            </div>
        ";

        $mail->send();
    } catch (Exception $e) {
        error_log('Mailer error: ' . $mail->ErrorInfo);
    }
}

function getLandlordApplications($conn) {
    $landlordId = $_SESSION['user_id'];

    $stmt = $conn->prepare("
        SELECT a.applicationId, a.status, a.title, a.message, a.created_at,
               u.username AS tenantName, u.email AS tenantEmail,
               p.title AS propertyTitle, p.location
        FROM applications a
        JOIN users u ON u.userId = a.tenantId
        JOIN properties p ON p.propertyId = a.propertyId
        WHERE p.landlordId = :landlordId
        ORDER BY a.created_at DESC
    ");
    $stmt->execute([':landlordId' => $landlordId]);
    $applications = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $pending = array_filter($applications, fn($a) => $a['status'] === 'pending');

    echo json_encode([
        'success'      => true,
        'applications' => $applications,
        'pending_count'=> count($pending)
    ]);
}

function handleApplicationByToken($conn, array $input) {
    $token  = trim($input['token'] ?? '');
    $action = trim($input['decision'] ?? $input['action'] ?? '');

    if (!$token || !in_array($action, ['approved', 'rejected'])) {
        echo json_encode(['success' => false, 'message' => 'Invalid request.']);
        return;
    }

    $stmt = $conn->prepare("SELECT applicationId, status FROM applications WHERE action_token = :token");
    $stmt->execute([':token' => $token]);
    $application = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$application) {
        echo json_encode(['success' => false, 'message' => 'Application not found.']);
        return;
    }

    if ($application['status'] !== 'pending') {
        echo json_encode(['success' => false, 'message' => 'Application already ' . $application['status'] . '.']);
        return;
    }

    $stmt = $conn->prepare("UPDATE applications SET status = :status WHERE action_token = :token");
    $stmt->execute([':status' => $action, ':token' => $token]);

    // If approved, mark property as occupied
    if ($action === 'approved') {
        $stmt = $conn->prepare("
            UPDATE properties SET status = 'occupied'
            WHERE propertyId = (SELECT propertyId FROM applications WHERE action_token = :token)
        ");
        $stmt->execute([':token' => $token]);
    }

    // Redirect to a nice confirmation page
    header('Location: /ULBS-Project-Web/frontend/dashboard/applicationResult.html?action=' . $action);
    exit;
}

function handleApplicationFromInbox($conn, array $input) {
    $landlordId    = $_SESSION['user_id'];
    $applicationId = (int)($input['applicationId'] ?? 0);
    $decision      = trim($input['decision'] ?? '');

    if (!$applicationId) {
        echo json_encode(['success' => false, 'message' => 'Invalid application ID.']);
        return;
    }

    if (!in_array($decision, ['approved', 'rejected'])) {
        echo json_encode(['success' => false, 'message' => 'Invalid decision.']);
        return;
    }

    // Verify application belongs to this landlord's property
    $stmt = $conn->prepare("
        SELECT a.applicationId, a.status, a.propertyId
        FROM applications a
        JOIN properties p ON p.propertyId = a.propertyId
        WHERE a.applicationId = :applicationId 
        AND p.landlordId = :landlordId
    ");
    $stmt->execute([
        ':applicationId' => $applicationId,
        ':landlordId'    => $landlordId
    ]);
    $application = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$application) {
        echo json_encode(['success' => false, 'message' => 'Application not found.']);
        return;
    }

    if ($application['status'] !== 'pending') {
        echo json_encode(['success' => false, 'message' => 'Application already ' . $application['status'] . '.']);
        return;
    }

    // Update application status
    $stmt = $conn->prepare("
        UPDATE applications 
        SET status = :status 
        WHERE applicationId = :applicationId
    ");
    $stmt->execute([
        ':status'        => $decision,
        ':applicationId' => $applicationId
    ]);

    // If approved mark property as occupied
    if ($decision === 'approved') {
        $stmt = $conn->prepare("
            UPDATE properties 
            SET status = 'occupied' 
            WHERE propertyId = :propertyId
        ");
        $stmt->execute([':propertyId' => $application['propertyId']]);
    }

    echo json_encode(['success' => true, 'message' => 'Application ' . $decision . ' successfully.']);
}

?>