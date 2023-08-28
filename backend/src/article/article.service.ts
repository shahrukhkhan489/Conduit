import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { EntityManager, QueryOrder, wrap } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs'
import { EntityRepository } from '@mikro-orm/mysql';

import { User } from '../user/user.entity';
import { Article } from './article.entity';
import { IArticleRO, IArticlesRO, ICommentsRO } from './article.interface';
import { Comment } from './comment.entity';
import { CreateArticleDto, CreateCommentDto } from './dto';
import { Tag } from '../tag/tag.entity';

@Injectable()
export class ArticleService {
  constructor(
    private readonly em: EntityManager,
    @InjectRepository(Article)
    private readonly articleRepository: EntityRepository<Article>,
    @InjectRepository(Comment)
    private readonly commentRepository: EntityRepository<Comment>,
    @InjectRepository(User)
    private readonly userRepository: EntityRepository<User>,
  ) {}

  async findAll(userId: number, query: any): Promise<IArticlesRO> {
    const user = userId ? await this.userRepository.findOne(userId, { populate: ['followers', 'favorites'] }) : undefined;
    const qb = this.articleRepository
      .createQueryBuilder('a')
      .select('a.*')
      .leftJoin('a.authors', 'u');

    if ('tag' in query) {
      qb.andWhere({ tagList: new RegExp(query.tag) });
    }

    if ('author' in query) {
      const author = await this.userRepository.findOne({ username: query.author });

      if (!author) {
        return { articles: [], articlesCount: 0 };
      }

      qb.andWhere({ authors: author.id });
    }

    if ('favorited' in query) {
      const author = await this.userRepository.findOne({ username: query.favorited }, { populate: ['favorites'] });

      if (!author) {
        return { articles: [], articlesCount: 0 };
      }

      const ids = author.favorites.$.getIdentifiers();
      qb.andWhere({ authors: ids });
    }

    qb.orderBy({ createdAt: QueryOrder.DESC });
    const res = await qb.clone().count('id', true).execute('get');
    const articlesCount = res.count;

    if ('limit' in query) {
      qb.limit(query.limit);
    }

    if ('offset' in query) {
      qb.offset(query.offset);
    }

    const articles = await qb.getResult();

    return { articles: articles.map(a => a.toJSON(user)), articlesCount };
  }

  async findFeed(userId: number, query): Promise<IArticlesRO> {
    const user = userId ? await this.userRepository.findOne(userId, { populate: ['followers', 'favorites'] }) : undefined;
    const res = await this.articleRepository.findAndCount({ authors: { followers: userId } }, {
      populate: ['authors'],
      orderBy: { createdAt: QueryOrder.DESC },
      limit: query.limit,
      offset: query.offset,
    });

    console.log('findFeed', { articles: res[0], articlesCount: res[1] });
    return { articles: res[0].map(a => a.toJSON(user)), articlesCount: res[1] };
  }

  async findOne(userId: number, where): Promise<IArticleRO> {
    const user = userId ? await this.userRepository.findOneOrFail(userId, { populate: ['followers', 'favorites'] }) : undefined;
    const article = await this.articleRepository.findOne(where, { populate: ['authors'] });
    return { article: article && article.toJSON(user) };
  }

  async addComment(userId: number, slug: string, dto: CreateCommentDto) {
    const article = await this.articleRepository.findOneOrFail({ slug }, { populate: ['authors'] });
    const author = await this.userRepository.findOneOrFail(userId);
    const comment = new Comment(author, article, dto.body);
    await this.em.persistAndFlush(comment);

    return { comment, article: article.toJSON(author) };
  }

  async deleteComment(userId: number, slug: string, id: number): Promise<IArticleRO> {
    const article = await this.articleRepository.findOneOrFail({ slug }, { populate: ['authors'] });
    const user = await this.userRepository.findOneOrFail(userId);
    const comment = this.commentRepository.getReference(id);

    if (article.comments.contains(comment)) {
      article.comments.remove(comment);
      await this.em.removeAndFlush(comment);
    }

    return { article: article.toJSON(user) };
  }

  async favorite(id: number, slug: string): Promise<IArticleRO> {
    const article = await this.articleRepository.findOneOrFail({ slug }, { populate: ['authors'] });
    const user = await this.userRepository.findOneOrFail(id, { populate: ['favorites', 'followers'] });

    if (!user.favorites.contains(article)) {
      user.favorites.add(article);
      article.favoritesCount++;
    }

    await this.em.flush();
    return { article: article.toJSON(user) };
  }

  async unFavorite(id: number, slug: string): Promise<IArticleRO> {
    const article = await this.articleRepository.findOneOrFail({ slug }, { populate: ['authors'] });
    const user = await this.userRepository.findOneOrFail(id, { populate: ['followers', 'favorites'] });

    if (user.favorites.contains(article)) {
      user.favorites.remove(article);
      article.favoritesCount--;
    }

    await this.em.flush();
    return { article: article.toJSON(user) };
  }

  async findComments(slug: string): Promise<ICommentsRO> {
    const article = await this.articleRepository.findOne({ slug }, { populate: ['comments'] });
    return { comments: article.comments.getItems() };
  }

  async create(userId: number, dto: CreateArticleDto) {
    const user = await this.userRepository.findOne({ id: userId }, { populate: ['followers', 'favorites', 'articles'] });
    const article = new Article(dto.title, dto.description, dto.body);
    article.authors.add(user);

    let parsedTagList = dto.tagList;
    if (typeof parsedTagList === 'string') {
      parsedTagList = (parsedTagList as string).split(',').map(tag => tag.trim());
    }

    // Ensure new tags are stored in the tag repository
    for (const tag of parsedTagList) {
      let existingTag = await this.em.findOne(Tag, { tag: tag });
      if (!existingTag) {
        const newTag = new Tag();
        newTag.tag = tag;
        await this.em.persistAndFlush(newTag);
      }
    }

    article.tagList.push(...parsedTagList);
    user.articles.add(article);
    await this.em.flush();

    return { article: article.toJSON(user) };
  }

  async update(userId: number, slug: string, articleData: any): Promise<IArticleRO> {
    const user = await this.userRepository.findOne({ id: userId }, { populate: ['followers', 'favorites', 'articles'] });
    const article = await this.articleRepository.findOne({ slug }, { populate: ['authors'] });
    
const now = new Date();
const timeDifference = (now.getTime() - article.lockTimestamp?.getTime() || 0) / 1000;  // in seconds

if (timeDifference < 300) {  // 5 minutes in seconds
    throw new HttpException('Article is locked by another author.', 423);
}


    wrap(article).assign(articleData);
    
article.lockTimestamp = new Date();
await this.articleRepository.persistAndFlush(article);

    
if (articleData.addAuthors) {
    for (const authorEmail of articleData.addAuthors) {
        const author = await this.userRepository.findOne({ email: authorEmail });
        if (author) {
            article.authors.add(author);
        }
    }
}

    await this.em.flush();

    return { article: article.toJSON(user) };
  }

  async delete(slug: string) {
    return this.articleRepository.nativeDelete({ slug });
  }

}
