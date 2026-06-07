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
        SELECT propertyId, title, description, location, rent, lease_term, photos, created_at
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

    $stmt = $conn->prepare("
        DELETE FROM properties
        WHERE propertyId = :propertyId AND landlordId = :landlordId
    ");
    $stmt->execute([':propertyId' => $propertyId, ':landlordId' => $landlordId]);

    if ($stmt->rowCount() === 0) {
        echo json_encode(['success' => false, 'message' => 'Property not found.']);
        return;
    }

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

?>