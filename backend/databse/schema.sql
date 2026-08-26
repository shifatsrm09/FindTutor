CREATE DATABASE find_tutor;

USE find_tutor;


#comments

CREATE TABLE USER (
    userID INT AUTO_INCREMENT PRIMARY KEY,
    fullName VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    location VARCHAR(100),
    isBanned BOOLEAN NOT NULL DEFAULT FALSE,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE STUDENT (
    userID INT PRIMARY KEY,
    institution VARCHAR(150),

    FOREIGN KEY (userID)
        REFERENCES USER(userID)
        ON DELETE CASCADE
);

CREATE TABLE TUTOR (
    userID INT PRIMARY KEY,
    bio TEXT,
    exp_year INT,
    teachingMode VARCHAR(20),

    FOREIGN KEY (userID)
        REFERENCES USER(userID)
        ON DELETE CASCADE
);

-- SUBJECT

CREATE TABLE SUBJECT (
    subjectID INT AUTO_INCREMENT PRIMARY KEY,
    subjectName VARCHAR(100) NOT NULL,
    category VARCHAR(100)
);


CREATE TABLE AVAILABILITY (
    availabilityID INT AUTO_INCREMENT PRIMARY KEY,
    dayOfWeek VARCHAR(20) NOT NULL,
    startTime TIME NOT NULL,
    endTime TIME NOT NULL,
    tutorID INT NOT NULL,

    CONSTRAINT fk_availability_tutor
        FOREIGN KEY (tutorID)
        REFERENCES TUTOR(userID)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE TABLE TEACHES (
    tutorID INT NOT NULL,
    subjectID INT NOT NULL,
    hourlyRate DECIMAL(10,2) NOT NULL,

    PRIMARY KEY (tutorID, subjectID),

    CONSTRAINT fk_teaches_tutor
        FOREIGN KEY (tutorID)
        REFERENCES TUTOR(userID)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_teaches_subject
        FOREIGN KEY (subjectID)
        REFERENCES SUBJECT(subjectID)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE TABLE TUTOR_REQUEST (
    requestID INT AUTO_INCREMENT PRIMARY KEY,
    budget DECIMAL(10,2),
    prefStartTime TIME,
    prefEndTime TIME,
    prefDate DATE,
    teachingMode VARCHAR(30),
    studentID INT NOT NULL,
    status VARCHAR(30) DEFAULT 'OPEN',
    subjectID INT NOT NULL,

    CONSTRAINT fk_request_student
        FOREIGN KEY (studentID)
        REFERENCES STUDENT(userID)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_request_subject
        FOREIGN KEY (subjectID)
        REFERENCES SUBJECT(subjectID)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE TABLE BOOKING (
    bookingID INT AUTO_INCREMENT PRIMARY KEY,
    startTime TIME NOT NULL,
    endTime TIME NOT NULL,
    agreedRate DECIMAL(10,2) NOT NULL,
    sessionDate DATE NOT NULL,
    teachingMode VARCHAR(30),
    studentID INT NOT NULL,
    tutorID INT NOT NULL,
    subjectID INT NOT NULL,
    status VARCHAR(30) DEFAULT 'PENDING',

    CONSTRAINT fk_booking_student
        FOREIGN KEY (studentID)
        REFERENCES STUDENT(userID)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_booking_tutor
        FOREIGN KEY (tutorID)
        REFERENCES TUTOR(userID)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_booking_subject
        FOREIGN KEY (subjectID)
        REFERENCES SUBJECT(subjectID)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE TABLE REVIEW (
    reviewID INT AUTO_INCREMENT PRIMARY KEY,
    bookingID INT NOT NULL,
    comment TEXT,
    rating DECIMAL(2,1) NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_review_booking
        FOREIGN KEY (bookingID)
        REFERENCES BOOKING(bookingID)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT chk_review_rating
        CHECK (rating >= 1 AND rating <= 5)
);

CREATE TABLE STUDENT_REQUEST (
    requestID INT AUTO_INCREMENT PRIMARY KEY,
    tutorID INT NOT NULL,
    budget DECIMAL(10,2),
    prefStartTime TIME,
    prefEndTime TIME,
    prefDate DATE,
    teachingMode VARCHAR(30),
    status VARCHAR(30) DEFAULT 'OPEN',
    subjectID INT NOT NULL,

    CONSTRAINT fk_student_request_tutor
        FOREIGN KEY (tutorID)
        REFERENCES TUTOR(userID)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_student_request_subject
        FOREIGN KEY (subjectID)
        REFERENCES SUBJECT(subjectID)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE TABLE COMPLAINT (
    complaintID INT AUTO_INCREMENT PRIMARY KEY,
    reporterID INT NOT NULL,
    reportedUserID INT NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'OPEN',
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_complaint_reporter
        FOREIGN KEY (reporterID)
        REFERENCES USER(userID)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_complaint_reported_user
        FOREIGN KEY (reportedUserID)
        REFERENCES USER(userID)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);
