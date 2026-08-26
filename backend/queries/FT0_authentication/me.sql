SELECT
    u.userID,
    u.fullName,
    u.email,
    u.isBanned,
    CASE
        WHEN s.userID IS NOT NULL THEN 'student'
        WHEN t.userID IS NOT NULL THEN 'tutor'
        ELSE NULL
    END AS role
FROM USER u
LEFT JOIN STUDENT s
    ON u.userID = s.userID
LEFT JOIN TUTOR t
    ON u.userID = t.userID
WHERE u.userID = ?;
