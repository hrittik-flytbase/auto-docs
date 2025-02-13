import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';

interface Comment {
  id: number;
  content: string;
  postId: number;
  userId: number;
  createdAt: Date;
  updatedAt?: Date;
}

interface TopCommenter {
  userId: number;
  count: number;
}

@Injectable()
export class CommentsService {
  private comments: Comment[] = [];
  private commentId = 1;

  create(createCommentDto: CreateCommentDto) {
    const comment = {
      id: this.commentId++,
      ...createCommentDto,
      createdAt: new Date()
    };
    this.comments.push(comment);
    return comment;
  }

  findAll() {
    return this.comments;
  }

  findOne(id: number) {
    const comment = this.comments.find(comment => comment.id === id);
    if (!comment) {
      throw new NotFoundException(`Comment with ID ${id} not found`);
    }
    return comment;
  }

  findByPostId(postId: number) {
    return this.comments.filter(comment => comment.postId === postId);
  }

  findByUserId(userId: number) {
    return this.comments.filter(comment => comment.userId === userId);
  }

  findTopCommenters(limit: number = 5) {
    const commentCounts = this.comments.reduce<Record<string, number>>((acc, comment) => {
      acc[comment.userId] = (acc[comment.userId] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(commentCounts)
      .map(([userId, count]) => ({ userId: parseInt(userId), count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  update(id: number, updateCommentDto: UpdateCommentDto) {
    const commentIndex = this.comments.findIndex(comment => comment.id === id);
    if (commentIndex === -1) {
      throw new NotFoundException(`Comment with ID ${id} not found`);
    }
    
    this.comments[commentIndex] = {
      ...this.comments[commentIndex],
      ...updateCommentDto,
      updatedAt: new Date()
    };
    
    return this.comments[commentIndex];
  }

  remove(id: number) {
    const commentIndex = this.comments.findIndex(comment => comment.id === id);
    if (commentIndex === -1) {
      throw new NotFoundException(`Comment with ID ${id} not found`);
    }
    
    const deletedComment = this.comments[commentIndex];
    this.comments.splice(commentIndex, 1);
    return deletedComment;
  }
}
