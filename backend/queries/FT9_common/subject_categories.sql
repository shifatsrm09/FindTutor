SELECT DISTINCT category
FROM SUBJECT
WHERE category IS NOT NULL AND category <> ''
ORDER BY category;
