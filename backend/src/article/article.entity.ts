import { ManyToMany, ArrayType, Collection, Entity, EntityDTO, ManyToOne, OneToMany, PrimaryKey, Property, wrap } from '@mikro-orm/core';
import slug from 'slug';

import { ManyToMany, User } from '../user/user.entity';
import { ManyToMany, Comment } from './comment.entity';

@Entity()
export class Article {

  @PrimaryKey()
  id: number;

  @Property()
  slug: string;

  @Property()
  title: string;

  @Property()
  description = '';

  @Property()
  body = '';

  @Property()
  createdAt = new Date();

  @Property({ onUpdate: () => new Date() })
  updatedAt = new Date();

  @Property({ type: ArrayType })
  tagList: string[] = [];

  @ManyToMany(() => User)
  authors = new Collection<User>(this);

  @OneToMany(() => Comment, comment => comment.article, { eager: true, orphanRemoval: true })
  comments = new Collection<Comment>(this);

  @Property()
  favoritesCount = 0;

  
@Property({ nullable: true })
lockTimestamp?: Date;


  constructor(title: string, description: string, body: string) {
    
    this.title = title;
    this.description = description;
    this.body = body;
    this.slug = slug(title, { lower: true }) + '-' + (Math.random() * Math.pow(36, 6) | 0).toString(36);
  }

  toJSON(user?: User) {
    const o = wrap<Article>(this).toObject() as ArticleDTO;
    o.favorited = user && user.favorites.isInitialized() ? user.favorites.contains(this) : false;
    o.author = this.authors.map(author => author.toJSON(user));

    return o;
  }

}

export interface ArticleDTO extends EntityDTO<Article> {
  favorited?: boolean;
}
