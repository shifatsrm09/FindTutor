USE find_tutor;

ALTER TABLE USER
ADD COLUMN isBanned BOOLEAN NOT NULL DEFAULT FALSE;

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
