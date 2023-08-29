import { Migration } from '@mikro-orm/migrations';

export class Migration20230828204114 extends Migration {

  async up(): Promise<void> {
    this.addSql('create table `article_authors` (`article_id` int unsigned not null, `user_id` int unsigned not null, primary key (`article_id`, `user_id`)) default character set utf8mb4 engine = InnoDB;');
    this.addSql('alter table `article_authors` add index `article_authors_article_id_index`(`article_id`);');
    this.addSql('alter table `article_authors` add index `article_authors_user_id_index`(`user_id`);');

    this.addSql('create table `user_articles` (`user_id` int unsigned not null, `article_id` int unsigned not null, primary key (`user_id`, `article_id`)) default character set utf8mb4 engine = InnoDB;');
    this.addSql('alter table `user_articles` add index `user_articles_user_id_index`(`user_id`);');
    this.addSql('alter table `user_articles` add index `user_articles_article_id_index`(`article_id`);');

    this.addSql('alter table `article_authors` add constraint `article_authors_article_id_foreign` foreign key (`article_id`) references `article` (`id`) on update cascade on delete cascade;');
    this.addSql('alter table `article_authors` add constraint `article_authors_user_id_foreign` foreign key (`user_id`) references `user` (`id`) on update cascade on delete cascade;');

    this.addSql('alter table `user_articles` add constraint `user_articles_user_id_foreign` foreign key (`user_id`) references `user` (`id`) on update cascade on delete cascade;');
    this.addSql('alter table `user_articles` add constraint `user_articles_article_id_foreign` foreign key (`article_id`) references `article` (`id`) on update cascade on delete cascade;');

    this.addSql('alter table `article` drop foreign key `article_author_id_foreign`;');

    this.addSql('alter table `article` add `lock_timestamp` datetime null;');
    this.addSql('alter table `article` drop index `article_author_id_index`;');
    this.addSql('alter table `article` drop `author_id`;');
  }

  async down(): Promise<void> {
    this.addSql('drop table if exists `article_authors`;');

    this.addSql('drop table if exists `user_articles`;');

    this.addSql('alter table `article` add `author_id` int unsigned not null;');
    this.addSql('alter table `article` add constraint `article_author_id_foreign` foreign key (`author_id`) references `user` (`id`) on update cascade on delete no action;');
    this.addSql('alter table `article` drop `lock_timestamp`;');
    this.addSql('alter table `article` add index `article_author_id_index`(`author_id`);');
  }

}
