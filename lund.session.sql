SELECT
  p.id `person_id`,
  concat(p.last_name, ' ',p.first_name) as `name`,
  p.email,
  p.institution `institution_id`,
  i.name `institution`,
  p.position `position_id`,
  position.value `position`,
  u.id `user_id`,
  u.is_active `active`,
  u.role `role_id`,
  `role`.value as user_class
FROM person p
left join institution i on i.id = p.institution
left join list_person_position position on p.position = position.id
left join user u on u.person = p.id
left join list_user_role `role` on u.role = `role`.id
order by 2 ASC;