-- SELECT TABLE_NAME, COLUMN_NAME, CONSTRAINT_NAME
-- FROM information_schema.KEY_COLUMN_USAGE
-- WHERE REFERENCED_TABLE_NAME = 'list_model_acquisition' AND REFERENCED_COLUMN_NAME = 'id';

SELECT user.id, trim(concat(person.last_name, ' ', person.first_name)) name, person.email, institution.name institution
FROM person
JOIN institution ON institution.id = person.institution
WHERE person.position = 4;
