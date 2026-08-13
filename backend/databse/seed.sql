USE find_tutor;

-- USER DATA

INSERT INTO `USER`
    (fullName, email, password, phone)
VALUES
    (
        'Dewan Sifat Rahman',
        'sifat@student.com',
        '$2b$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNO123456789',
        '01700000001'
    ),
    (
        'Anha Sadman',
        'anha@student.com',
        '$2b$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNO123456789',
        '01700000002'
    ),
    (
        'Sadman Sadat Shopnil',
        'shopnil@student.com',
        '$2b$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNO123456789',
        '01700000003'
    ),
    (
        'Test Tutor One',
        'tutor1@example.com',
        '$2b$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNO123456789',
        '01700000004'
    ),
    (
        'Test Tutor Two',
        'tutor2@example.com',
        '$2b$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNO123456789',
        '01700000005'
    );

-- STUDENT DATA

INSERT INTO STUDENT
    (userID, institution)
VALUES
    (1, 'BRAC University'),
    (2, 'BRAC University'),
    (3, 'BRAC University');

-- TUTOR DATA

INSERT INTO TUTOR
    (userID, bio, exp_year, teachingMode)
VALUES
    (
        4,
        'Experienced CSE tutor specializing in programming and algorithms.',
        3,
        'ONLINE'
    ),
    (
        5,
        'Mathematics and physics tutor with experience teaching university students.',
        5,
        'BOTH'
    );