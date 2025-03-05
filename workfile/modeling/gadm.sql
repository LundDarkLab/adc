------------------------------------------------------
-- 250213
------------------------------------------------------
alter table gadm0 drop index `OGR_FID`;
alter table gadm0 add primary key(`OGR_FID`);
alter table gadm0 add constraint `gid0_unique` unique (gid_0)
alter table gadm0 change gid_0 gid_0 varchar(256) not null;
alter table gadm0 change country country varchar(256) not null;

alter table gadm1 drop index `OGR_FID`;
alter table gadm1 add primary key(`OGR_FID`);
alter table gadm1 add constraint `gid1_unique` unique (gid_1)
alter table gadm1 change gid_0 gid_0 varchar(256) not null;
alter table gadm1 change gid_1 gid_1 varchar(256) not null;

alter table gadm2 drop index `OGR_FID`;
alter table gadm2 add primary key(`OGR_FID`);
alter table gadm2 add constraint `gid2_unique` unique (gid_2)
alter table gadm2 change gid_0 gid_0 varchar(256) not null;
alter table gadm2 change gid_1 gid_1 varchar(256) not null;