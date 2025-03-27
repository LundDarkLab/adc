select 
  list_object_condition.id, 
  list_object_condition.value,
  count(artifact.object_condition) as tot
from list_object_condition
left join artifact on artifact.object_condition = list_object_condition.id
group by list_object_condition.id, list_object_condition.value
order by list_object_condition.value