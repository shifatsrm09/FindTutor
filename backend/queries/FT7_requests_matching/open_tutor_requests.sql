SELECT tr.requestID, tr.budget, tr.prefStartTime, tr.prefEndTime, tr.prefDate, tr.teachingMode,
       s.subjectName, u.fullName AS studentName, u.location
FROM TUTOR_REQUEST tr
JOIN SUBJECT s ON s.subjectID = tr.subjectID
JOIN USER u ON u.userID = tr.studentID
WHERE tr.status = 'OPEN'
ORDER BY tr.prefDate ASC;
