CREATE DATABASE rental_platform;
USE rental_platform;


CREATE TABLE users (
    userId INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('tenant', 'landlord', 'admin') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE properties (
    propertyId INT AUTO_INCREMENT PRIMARY KEY,
    landlordId INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    location VARCHAR(255) NOT NULL,
    rent DECIMAL(10, 2) NOT NULL,
    lease_term VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (landlordId) REFERENCES users(userId)
);

CREATE TABLE applications (
    applicationId INT AUTO_INCREMENT PRIMARY KEY,
    propertyId INT NOT NULL,
    tenantId INT NOT NULL,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (propertyId) REFERENCES properties(propertyId),
    FOREIGN KEY (tenantId) REFERENCES users(userId)
);

CREATE TABLE reviews (
    reviewId INT AUTO_INCREMENT PRIMARY KEY,
    propertyId INT NOT NULL,
    tenantId INT NOT NULL,
    rating INT CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (propertyId) REFERENCES properties(propertyId),
    FOREIGN KEY (tenantId) REFERENCES users(userId)
);

