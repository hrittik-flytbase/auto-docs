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
  HttpStatus,
} from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { QueryCategoryDto } from './dto/query-category.dto';
import {
  ApiTags,
  ApiOperation,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
  ApiQuery,
  getSchemaPath,
  ApiParam,
} from '@nestjs/swagger';

interface Category {
  id: number;
  name: string;
  description: string;
  parentId?: number;
  tags: string[];
  order: number;
  createdAt: Date;
  updatedAt?: Date;
}

interface CategoryWithChildren extends Category {
  children: CategoryWithChildren[];
}

@ApiTags('categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new category' })
  @ApiCreatedResponse({
    description: 'The category has been successfully created.',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        name: { type: 'string', example: 'Technology' },
        description: { type: 'string', example: 'All tech-related posts' },
        parentId: { type: 'number', example: null, nullable: true },
        tags: { type: 'array', items: { type: 'string' }, example: ['tech', 'programming'] },
        order: { type: 'number', example: 1 },
        createdAt: { type: 'string', format: 'date-time', example: '2025-02-13T08:22:15.000Z' }
      }
    }
  })
  @ApiBadRequestResponse({ 
    description: 'Invalid request data or parent category not found.',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: { type: 'string', example: 'Parent category with ID 123 not found' },
        error: { type: 'string', example: 'Bad Request' }
      }
    }
  })
  async create(@Body() createCategoryDto: CreateCategoryDto): Promise<Category> {
    return this.categoriesService.create(createCategoryDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all categories with optional filtering and sorting' })
  @ApiQuery({ 
    name: 'search', 
    required: false,
    type: String,
    description: 'Search categories by name or description',
    example: 'tech'
  })
  @ApiQuery({ 
    name: 'includeChildren', 
    required: false, 
    type: Boolean,
    description: 'Include child categories in the response',
    example: true
  })
  @ApiQuery({ 
    name: 'sort', 
    required: false, 
    enum: ['asc', 'desc'],
    description: 'Sort categories by name',
    example: 'asc'
  })
  @ApiQuery({ 
    name: 'tag', 
    required: false,
    type: String,
    description: 'Filter categories by tag',
    example: 'programming'
  })
  @ApiOkResponse({
    description: 'Returns the list of categories.',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'number', example: 1 },
          name: { type: 'string', example: 'Technology' },
          description: { type: 'string', example: 'All tech-related posts' },
          parentId: { type: 'number', example: null, nullable: true },
          tags: { type: 'array', items: { type: 'string' }, example: ['tech', 'programming'] },
          order: { type: 'number', example: 1 },
          createdAt: { type: 'string', format: 'date-time', example: '2025-02-13T08:22:15.000Z' }
        }
      }
    }
  })
  async findAll(@Query() query: QueryCategoryDto): Promise<Category[]> {
    return this.categoriesService.findAll(query);
  }

  @Get('hierarchy')
  @ApiOperation({ summary: 'Get category hierarchy tree' })
  @ApiOkResponse({
    description: 'Returns the category hierarchy.',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'number', example: 1 },
          name: { type: 'string', example: 'Technology' },
          description: { type: 'string', example: 'All tech-related posts' },
          tags: { type: 'array', items: { type: 'string' }, example: ['tech', 'programming'] },
          order: { type: 'number', example: 1 },
          children: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'number', example: 2 },
                name: { type: 'string', example: 'Programming' },
                description: { type: 'string', example: 'Programming related posts' },
                tags: { type: 'array', items: { type: 'string' }, example: ['programming', 'coding'] },
                order: { type: 'number', example: 1 },
                children: { type: 'array', items: { $ref: '#/components/schemas/Category' } }
              }
            }
          }
        }
      }
    }
  })
  async getHierarchy(): Promise<CategoryWithChildren[]> {
    return this.categoriesService.getHierarchy();
  }

  @Get('by-tag/:tag')
  @ApiOperation({ summary: 'Get categories by tag' })
  @ApiParam({
    name: 'tag',
    description: 'Tag to filter categories by',
    example: 'programming',
    required: true
  })
  @ApiOkResponse({
    description: 'Returns categories with the specified tag.',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'number', example: 1 },
          name: { type: 'string', example: 'Programming' },
          description: { type: 'string', example: 'Programming related posts' },
          tags: { type: 'array', items: { type: 'string' }, example: ['programming', 'coding'] },
          order: { type: 'number', example: 1 },
          createdAt: { type: 'string', format: 'date-time', example: '2025-02-13T08:22:15.000Z' }
        }
      }
    }
  })
  async findByTag(@Param('tag') tag: string): Promise<Category[]> {
    return this.categoriesService.findByTag(tag);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a category by id' })
  @ApiOkResponse({
    description: 'Returns the category.',
    type: CreateCategoryDto,
  })
  @ApiNotFoundResponse({ description: 'Category not found.' })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<Category> {
    return this.categoriesService.findOne(id);
  }

  @Get(':id/children')
  @ApiOperation({ summary: 'Get direct child categories' })
  @ApiOkResponse({
    description: 'Returns the child categories.',
    type: [CreateCategoryDto],
  })
  @ApiNotFoundResponse({ description: 'Parent category not found.' })
  async findChildren(@Param('id', ParseIntPipe) id: number): Promise<Category[]> {
    return this.categoriesService.findChildren(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a category' })
  @ApiOkResponse({
    description: 'The category has been successfully updated.',
    type: CreateCategoryDto,
  })
  @ApiNotFoundResponse({ description: 'Category not found.' })
  @ApiBadRequestResponse({ 
    description: 'Invalid request data, parent category not found, or circular reference detected.' 
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ): Promise<Category> {
    return this.categoriesService.update(id, updateCategoryDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a category' })
  @ApiParam({
    name: 'id',
    description: 'ID of the category to delete',
    type: 'number',
    example: 1,
    required: true
  })
  @ApiOkResponse({
    description: 'The category has been successfully deleted.',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        name: { type: 'string', example: 'Programming' },
        description: { type: 'string', example: 'Programming related posts' },
        tags: { type: 'array', items: { type: 'string' }, example: ['programming', 'coding'] },
        order: { type: 'number', example: 1 },
        createdAt: { type: 'string', format: 'date-time', example: '2025-02-13T08:22:15.000Z' }
      }
    }
  })
  @ApiNotFoundResponse({ 
    description: 'Category not found.',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: { type: 'string', example: 'Category with ID 1 not found' },
        error: { type: 'string', example: 'Not Found' }
      }
    }
  })
  @ApiBadRequestResponse({ 
    description: 'Cannot delete category with children.',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: { type: 'string', example: 'Cannot delete category with child categories' },
        error: { type: 'string', example: 'Bad Request' }
      }
    }
  })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<Category> {
    return this.categoriesService.remove(id);
  }
}
