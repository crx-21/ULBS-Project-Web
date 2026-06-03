<?php
require_once 'database.php';


class User {
    private $userId;
    private $username;
    private $email;
    private $password_hash;
    private $role;
    private $db;

    public function __construct($conn) {
        $this->db = $conn;
    }

    public function Register($username, $password, $email, $role) {
        $hash = password_hash($password, PASSWORD_DEFAULT);
        $stmt = $this->db->prepare(
            "INSERT INTO users (username, email, role, password_hash) VALUES (?, ?, ?, ?)"
        );
        return $stmt->execute([$username, $email, $role, $hash]);
    }

    public function Login($username, $password) {
        $stmt = $this->db->prepare("SELECT * FROM users WHERE username = ?");
        $stmt->execute([$username]);
        $user = $stmt->fetch();
        if ($user && password_verify($password, $user['password_hash'])) {
            return $user;
        }
        return false;
    }

    public function GetById($userId) {
        $stmt = $this->db->prepare("SELECT * FROM users WHERE userId = ?");
        $stmt->execute([$userId]);
        return $stmt->fetch();
    }

    public function updateRole($userId, $role) {
       
            $stmt = $this->db->prepare("UPDATE users SET role = ? WHERE userId = ?");
            return $stmt->execute([$role, $userId]);
        
       
    }
}


class Property {
    private $propertyId;
    private $landlordId;
    private $title;
    private $description;
    private $location;
    private $rent;
    private $lease_term;
    private $db;

    public function __construct($conn) {
        $this->db = $conn;
    }

    public function Create($landlordId, $title, $description, $location, $rent, $lease_term) {
        $stmt = $this->db->prepare(
            "INSERT INTO properties (landlordId, title, description, location, rent, lease_term)
             VALUES (?, ?, ?, ?, ?, ?)"
        );
        return $stmt->execute([$landlordId, $title, $description, $location, $rent, $lease_term]);
    }

    public function GetAll() {
        $stmt = $this->db->prepare("SELECT * FROM properties");
        $stmt->execute();
        return $stmt->fetchAll();
    }

    public function GetById($propertyId) {
        $stmt = $this->db->prepare("SELECT * FROM properties WHERE propertyId = ?");
        $stmt->execute([$propertyId]);
        return $stmt->fetch();
    }

    public function GetByLandlord($landlordId) {
        $stmt = $this->db->prepare("SELECT * FROM properties WHERE landlordId = ?");
        $stmt->execute([$landlordId]);
        return $stmt->fetchAll();
    }

    public function Update($propertyId, $title, $description, $location, $rent, $lease_term) {
        $stmt = $this->db->prepare(
            "UPDATE properties SET title = ?, description = ?, location = ?, rent = ?, lease_term = ?
             WHERE propertyId = ?"
        );
        return $stmt->execute([$title, $description, $location, $rent, $lease_term, $propertyId]);
    }

    public function Delete($propertyId) {
        $stmt = $this->db->prepare("DELETE FROM properties WHERE propertyId = ?");
        return $stmt->execute([$propertyId]);
    }
}


class Application {
    private $applicationId;
    private $propertyId;
    private $tenantId;
    private $status;
    private $db;

    public function __construct($conn) {
        $this->db = $conn;
    }

    public function Create($propertyId, $tenantId) {
        $stmt = $this->db->prepare(
            "INSERT INTO applications (propertyId, tenantId) VALUES (?, ?)"
        );
        return $stmt->execute([$propertyId, $tenantId]);
    }

    public function GetByProperty($propertyId) {
        $stmt = $this->db->prepare("SELECT * FROM applications WHERE propertyId = ?");
        $stmt->execute([$propertyId]);
        return $stmt->fetchAll();
    }

    public function GetByTenant($tenantId) {
        $stmt = $this->db->prepare("SELECT * FROM applications WHERE tenantId = ?");
        $stmt->execute([$tenantId]);
        return $stmt->fetchAll();
    }

    public function UpdateStatus($applicationId, $status) {
        $stmt = $this->db->prepare(
            "UPDATE applications SET status = ? WHERE applicationId = ?"
        );
        return $stmt->execute([$status, $applicationId]);
    }
}


class Review {
    private $reviewId;
    private $propertyId;
    private $tenantId;
    private $rating;
    private $comment;
    private $db;

    public function __construct($conn) {
        $this->db = $conn;
    }

    public function Create($propertyId, $tenantId, $rating, $comment) {
        $stmt = $this->db->prepare(
            "INSERT INTO reviews (propertyId, tenantId, rating, comment) VALUES (?, ?, ?, ?)"
        );
        return $stmt->execute([$propertyId, $tenantId, $rating, $comment]);
    }

    public function GetByProperty($propertyId) {
        $stmt = $this->db->prepare("SELECT * FROM reviews WHERE propertyId = ?");
        $stmt->execute([$propertyId]);
        return $stmt->fetchAll();
    }

    public function GetByTenant($tenantId) {
        $stmt = $this->db->prepare("SELECT * FROM reviews WHERE tenantId = ?");
        $stmt->execute([$tenantId]);
        return $stmt->fetchAll();
    }

    public function Delete($reviewId) {
        $stmt = $this->db->prepare("DELETE FROM reviews WHERE reviewId = ?");
        return $stmt->execute([$reviewId]);
    }
}
?>