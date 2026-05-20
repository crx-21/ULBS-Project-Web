<?php
class User {
    private $userId;
    private $username;
    private $password;
}

class Property {
    private $propertyId;
    private $ownerId;
    private $title;
    private $description;
    private $location;
    private $rent;
    private $availability;
    private $images;
    private $features;
    private $floorPlan;
}

class Application {
    private $applicationId;
    private $propertyId;
    private $applicantId;
    private $status;

}

class RentalAgreement {
    private $agreementId;
    private $propertyId;
    private $tenantId;
    private $startDate;
    private $endDate;
    private $rentAmount;
}

class Payment {
    private $paymentId;
    private $agreementId;
    private $amount;
    private $paymentDate;
    private $status;
}

class Review {
    private $reviewId;
    private $propertyId;
    private $reviewerId;
    private $rating;
    private $comment;

}

class SupportTicket {
    private $ticketId;
    private $userId;
    private $subject;
    private $message;
    private $status;
}

class Message {
    private $messageId;
    private $senderId;
    private $receiverId;
    private $content;
    private $timestamp;
}

class Notification {
    private $notificationId;
    private $userId;
    private $message;
    private $isRead;
    private $timestamp;
}


?>