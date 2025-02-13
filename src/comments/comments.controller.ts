import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Put, 
  Param, 
  Delete, 
  ParseIntPipe,
  Query,
  DefaultValuePipe,
  HttpStatus
} from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiParam, 
  ApiQuery,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiBadRequestResponse
} from '@nestjs/swagger';

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

@ApiTags('comments')
@Controller('comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new comment' })
  @ApiCreatedResponse({ 
    description: 'The comment has been successfully created.',
    type: CreateCommentDto
  })
  @ApiBadRequestResponse({ description: 'Invalid request data.' })
  create(@Body() createCommentDto: CreateCommentDto): Promise<Comment> {
    return this.commentsService.create(createCommentDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all comments' })
  @ApiOkResponse({ 
    description: 'Return all comments.',
    type: [CreateCommentDto]
  })
  findAll(): Promise<Comment[]> {
    return this.commentsService.findAll();
  }

  @Get('top-commenters')
  @ApiOperation({ summary: 'Get top users by comment count' })
  @ApiQuery({ 
    name: 'limit', 
    required: false, 
    type: Number,
    description: 'Number of top commenters to return'
  })
  @ApiOkResponse({ 
    description: 'Returns list of top commenters',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          userId: { type: 'number' },
          count: { type: 'number' }
        }
      }
    }
  })
  getTopCommenters(
    @Query('limit', new DefaultValuePipe(5), ParseIntPipe) limit: number
  ): Promise<TopCommenter[]> {
    return this.commentsService.findTopCommenters(limit);
  }

  @Get('by-post/:postId')
  @ApiOperation({ summary: 'Get all comments for a specific post' })
  @ApiParam({ name: 'postId', description: 'ID of the post' })
  @ApiOkResponse({ 
    description: 'Returns all comments for the post.',
    type: [CreateCommentDto]
  })
  findByPost(@Param('postId', ParseIntPipe) postId: number): Promise<Comment[]> {
    return this.commentsService.findByPostId(postId);
  }

  @Get('by-user/:userId')
  @ApiOperation({ summary: 'Get all comments by a specific user' })
  @ApiParam({ name: 'userId', description: 'ID of the user' })
  @ApiOkResponse({ 
    description: 'Returns all comments by the user.',
    type: [CreateCommentDto]
  })
  findByUser(@Param('userId', ParseIntPipe) userId: number): Promise<Comment[]> {
    return this.commentsService.findByUserId(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a comment by id' })
  @ApiParam({ name: 'id', description: 'Comment ID' })
  @ApiOkResponse({ 
    description: 'Return the comment.',
    type: CreateCommentDto
  })
  @ApiNotFoundResponse({ description: 'Comment not found.' })
  findOne(@Param('id', ParseIntPipe) id: number): Promise<Comment> {
    return this.commentsService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a comment' })
  @ApiParam({ name: 'id', description: 'Comment ID' })
  @ApiOkResponse({ 
    description: 'The comment has been successfully updated.',
    type: CreateCommentDto
  })
  @ApiNotFoundResponse({ description: 'Comment not found.' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCommentDto: UpdateCommentDto,
  ): Promise<Comment> {
    return this.commentsService.update(id, updateCommentDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a comment' })
  @ApiParam({ name: 'id', description: 'Comment ID' })
  @ApiOkResponse({ 
    description: 'The comment has been successfully deleted.',
    type: CreateCommentDto
  })
  @ApiNotFoundResponse({ description: 'Comment not found.' })
  remove(@Param('id', ParseIntPipe) id: number): Promise<Comment> {
    return this.commentsService.remove(id);
  }
}
