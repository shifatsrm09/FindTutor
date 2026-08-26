SELECT
    u.userID,
    u.fullName,
    u.email,
    u.phone,
    u.isBanned,
    CASE
        WHEN s.userID IS NOT NULL THEN 'student'
        WHEN t.userID IS NOT NULL THEN 'tutor'
        ELSE 'unknown'
    END AS role
FROM USER u
LEFT JOIN STUDENT s ON s.userID = u.userID
LEFT JOIN TUTOR t ON t.userID = u.userID
ORDER BY u.createdAt DESC;
