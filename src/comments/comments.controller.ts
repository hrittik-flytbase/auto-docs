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
  DefaultValuePipe
} from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiParam, 
  ApiQuery 
} from '@nestjs/swagger';

@ApiTags('comments')
@Controller('comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new comment' })
  @ApiResponse({ 
    status: 201, 
    description: 'The comment has been successfully created.',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number' },
        content: { type: 'string' },
        postId: { type: 'number' },
        userId: { type: 'number' },
        createdAt: { type: 'string', format: 'date-time' }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Invalid request data.' })
  create(@Body() createCommentDto: CreateCommentDto) {
    return this.commentsService.create(createCommentDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all comments' })
  @ApiResponse({ status: 200, description: 'Return all comments.' })
  findAll() {
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
  @ApiResponse({ 
    status: 200, 
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
  ) {
    return this.commentsService.findTopCommenters(limit);
  }

  @Get('by-post/:postId')
  @ApiOperation({ summary: 'Get all comments for a specific post' })
  @ApiParam({ name: 'postId', description: 'ID of the post' })
  @ApiResponse({ status: 200, description: 'Returns all comments for the post.' })
  findByPost(@Param('postId', ParseIntPipe) postId: number) {
    return this.commentsService.findByPostId(postId);
  }

  @Get('by-user/:userId')
  @ApiOperation({ summary: 'Get all comments by a specific user' })
  @ApiParam({ name: 'userId', description: 'ID of the user' })
  @ApiResponse({ status: 200, description: 'Returns all comments by the user.' })
  findByUser(@Param('userId', ParseIntPipe) userId: number) {
    return this.commentsService.findByUserId(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a comment by id' })
  @ApiParam({ name: 'id', description: 'Comment ID' })
  @ApiResponse({ status: 200, description: 'Return the comment.' })
  @ApiResponse({ status: 404, description: 'Comment not found.' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.commentsService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a comment' })
  @ApiParam({ name: 'id', description: 'Comment ID' })
  @ApiResponse({ status: 200, description: 'The comment has been successfully updated.' })
  @ApiResponse({ status: 404, description: 'Comment not found.' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCommentDto: UpdateCommentDto,
  ) {
    return this.commentsService.update(id, updateCommentDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a comment' })
  @ApiParam({ name: 'id', description: 'Comment ID' })
  @ApiResponse({ status: 200, description: 'The comment has been successfully deleted.' })
  @ApiResponse({ status: 404, description: 'Comment not found.' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.commentsService.remove(id);
  }
}
