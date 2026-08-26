SELECT te.hourlyRate, t.teachingMode
FROM TEACHES te
JOIN TUTOR t ON t.userID = te.tutorID
WHERE te.tutorID = ? AND te.subjectID = ?;
