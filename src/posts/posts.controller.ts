import { Controller, Get, Post, Body, Put, Param, Delete, ParseIntPipe, Query } from '@nestjs/common';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';

@ApiTags('posts')
@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new blog post' })
  @ApiResponse({ status: 201, description: 'The post has been successfully created.' })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  create(@Body() createPostDto: CreatePostDto) {
    return this.postsService.create(createPostDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all blog posts' })
  @ApiResponse({ status: 200, description: 'Return all blog posts.' })
  findAll() {
    return this.postsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a blog post by id' })
  @ApiParam({ name: 'id', description: 'Post ID' })
  @ApiResponse({ status: 200, description: 'Return the blog post.' })
  @ApiResponse({ status: 404, description: 'Post not found.' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.postsService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a blog post' })
  @ApiParam({ name: 'id', description: 'Post ID' })
  @ApiResponse({ status: 200, description: 'The post has been successfully updated.' })
  @ApiResponse({ status: 404, description: 'Post not found.' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePostDto: UpdatePostDto,
  ) {
    return this.postsService.update(id, updatePostDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a blog post' })
  @ApiParam({ name: 'id', description: 'Post ID' })
  @ApiResponse({ status: 200, description: 'The post has been successfully deleted.' })
  @ApiResponse({ status: 404, description: 'Post not found.' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.postsService.remove(id);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search blog posts by title' })
  @ApiResponse({ status: 200, description: 'Returns matching blog posts' })
  @ApiResponse({ status: 400, description: 'Invalid search query' })
  search(@Query('query') query: string) {
    return this.postsService.findAll().filter(post => 
      post.title.toLowerCase().includes(query.toLowerCase())
    );
  }
}
