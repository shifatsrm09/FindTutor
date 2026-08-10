CREATE DATABASE find_tutor;

USE find_tutor;


#comments

CREATE TABLE USER (
    userID INT AUTO_INCREMENT PRIMARY KEY,
    fullName VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
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