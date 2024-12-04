create table mail_template(
  `id` int not NULL auto_increment,
  `object` varchar(512) not null,
  `body` text not null,
  PRIMARY KEY(`id`),
  UNIQUE(`object`)
);