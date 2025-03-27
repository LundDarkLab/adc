start transaction;
insert into list_category_specs(category_class, value) values (21,'Renhornshacka ');
insert into list_category_specs(category_class, value) values (22,'Ihålig');
insert into list_category_specs(category_class, value) values (30,'Hängkärl');
insert into list_category_specs(category_class, value) values (30,'Skuldra');
insert into list_category_specs(category_class, value) values (30,'Urna');
insert into list_category_specs(category_class, value) values (32,'Klubba med skafthål');
insert into list_category_specs(category_class, value) values (43,'Platt huvud');
insert into list_category_specs(category_class, value) values (75,'Kantyxa');
insert into list_category_specs(category_class, value) values (75,'Hornyxa');
insert into list_category_specs(category_class, value) values (158,'Avsatsmejsel');

insert into list_category_class(value) values ('Bältehake');
insert into list_category_class(value) values ('Ljuster');
insert into list_category_class(value) values ('Zinken');

insert into list_category_class(value) values ('Halskrage');	
set @class = last_insert_id();
insert into list_category_specs(category_class, value) values(@class,'Räfflad');

insert into list_category_class(value) values ('Mikrolit');	
set @class = last_insert_id();
insert into list_category_specs(category_class, value) values(@class, 'Liksidig triangel');
insert into list_category_specs(category_class, value) values(@class, 'Triangel');
insert into list_category_specs(category_class, value) values(@class, 'Trapets');
insert into list_category_specs(category_class, value) values(@class, 'Smal trapets');
insert into list_category_specs(category_class, value) values(@class, 'Lancett');

insert into list_category_class(value) values ('Borr');	    
set @class = last_insert_id();
insert into list_category_specs(category_class, value) values(@class, 'Borr');

commit;