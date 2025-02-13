import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { PostsModule } from './posts/posts.module';
import { CommentsModule } from './comments/comments.module';
import { CategoriesModule } from './categories/categories.module';

@Module({
  imports: [UsersModule, PostsModule, CommentsModule, CategoriesModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
