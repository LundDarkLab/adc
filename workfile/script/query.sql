explain analyze 
SELECT i.id, i.name, i.abbreviation, i.lat, i.lon, i.logo, count(a.id) AS count
FROM institution i
INNER JOIN artifact a ON a.storage_place = i.id 
WHERE a.status = 2
GROUP BY i.id, i.name, i.abbreviation, i.lat, i.lon, i.logo
ORDER BY i.name ASC;