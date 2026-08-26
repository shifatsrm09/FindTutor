SELECT sr.requestID, sr.budget, sr.prefStartTime, sr.prefEndTime, sr.prefDate, sr.teachingMode, sr.status,
       s.subjectName
FROM STUDENT_REQUEST sr
JOIN SUBJECT s ON s.subjectID = sr.subjectID
WHERE sr.tutorID = ?
ORDER BY sr.prefDate DESC;
