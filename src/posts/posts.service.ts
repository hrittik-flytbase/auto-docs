import { Injectable, NotFoundException } from '@nestjs/common';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';

@Injectable()
export class PostsService {
  private posts = [];
  private postId = 1;

  create(createPostDto: CreatePostDto) {
    const post = {
      id: this.postId++,
      ...createPostDto,
    };
    this.posts.push(post);
    return post;
  }

  findAll() {
    return this.posts;
  }

  findOne(id: number) {
    const post = this.posts.find(post => post.id === id);
    if (!post) {
      throw new NotFoundException(`Post with ID ${id} not found`);
    }
    return post;
  }

  update(id: number, updatePostDto: UpdatePostDto) {
    const postIndex = this.posts.findIndex(post => post.id === id);
    if (postIndex === -1) {
      throw new NotFoundException(`Post with ID ${id} not found`);
    }
    
    this.posts[postIndex] = {
      ...this.posts[postIndex],
      ...updatePostDto,
    };
    
    return this.posts[postIndex];
  }

  remove(id: number) {
    const postIndex = this.posts.findIndex(post => post.id === id);
    if (postIndex === -1) {
      throw new NotFoundException(`Post with ID ${id} not found`);
    }
    
    const deletedPost = this.posts[postIndex];
    this.posts.splice(postIndex, 1);
    return deletedPost;
  }
}
