SELECT
    (SELECT COUNT(*) FROM STUDENT) AS totalStudents,
    (SELECT COUNT(*) FROM TUTOR) AS totalTutors,
    (SELECT COUNT(*) FROM USER WHERE isBanned = TRUE) AS bannedUsers,
    (SELECT COUNT(*) FROM COMPLAINT WHERE status = 'OPEN') AS openComplaints;
