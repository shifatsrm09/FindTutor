SELECT
    c.complaintID,
    c.description,
    c.status,
    c.createdAt,
    reporter.fullName AS reporterName,
    reporter.email AS reporterEmail,
    reported.fullName AS reportedName,
    reported.email AS reportedEmail
FROM COMPLAINT c
JOIN USER reporter ON reporter.userID = c.reporterID
JOIN USER reported ON reported.userID = c.reportedUserID
ORDER BY
    CASE WHEN c.status = 'OPEN' THEN 0 ELSE 1 END,
    c.createdAt DESC;
