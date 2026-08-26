SELECT tr.requestID, tr.budget, tr.prefStartTime, tr.prefEndTime, tr.prefDate, tr.teachingMode, tr.status,
       s.subjectName
FROM TUTOR_REQUEST tr
JOIN SUBJECT s ON s.subjectID = tr.subjectID
WHERE tr.studentID = ?
ORDER BY tr.prefDate DESC;
