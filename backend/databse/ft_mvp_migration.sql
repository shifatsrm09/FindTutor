-- Run this once after admin_mvp_migration.sql on an existing database.
USE find_tutor;

ALTER TABLE USER
ADD COLUMN location VARCHAR(100) NULL AFTER phone;

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
        FOREIGN KEY (tutorID) REFERENCES TUTOR(userID)
        ON DELETE CASCADE ON UPDATE CASCADE,

    CONSTRAINT fk_student_request_subject
        FOREIGN KEY (subjectID) REFERENCES SUBJECT(subjectID)
        ON DELETE CASCADE ON UPDATE CASCADE
);
