SELECT u.userID AS studentID, u.fullName, u.location, tr.budget, tr.prefDate, tr.prefStartTime, tr.prefEndTime,
       tr.teachingMode
FROM STUDENT_REQUEST sr
JOIN TUTOR_REQUEST tr ON tr.subjectID = sr.subjectID AND tr.status = 'OPEN'
JOIN USER u ON u.userID = tr.studentID
WHERE sr.requestID = ?
  AND sr.status = 'OPEN'
  AND u.isBanned = FALSE
  AND (sr.teachingMode = 'BOTH' OR tr.teachingMode = 'BOTH' OR sr.teachingMode = tr.teachingMode)
  AND (sr.budget IS NULL OR tr.budget IS NULL OR tr.budget >= sr.budget)
ORDER BY tr.prefDate ASC, tr.budget DESC;
