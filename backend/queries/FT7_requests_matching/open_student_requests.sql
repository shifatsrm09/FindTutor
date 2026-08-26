SELECT sr.requestID, sr.budget, sr.prefStartTime, sr.prefEndTime, sr.prefDate, sr.teachingMode,
       s.subjectName, u.fullName AS tutorName, u.location
FROM STUDENT_REQUEST sr
JOIN SUBJECT s ON s.subjectID = sr.subjectID
JOIN USER u ON u.userID = sr.tutorID
WHERE sr.status = 'OPEN'
ORDER BY sr.prefDate ASC;
