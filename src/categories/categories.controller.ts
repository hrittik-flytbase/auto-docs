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
    type: CreateCategoryDto,
  })
  @ApiBadRequestResponse({ 
    description: 'Invalid request data or parent category not found.' 
  })
  async create(@Body() createCategoryDto: CreateCategoryDto): Promise<Category> {
    return this.categoriesService.create(createCategoryDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all categories with optional filtering and sorting' })
  @ApiQuery({ 
    name: 'search', 
    required: false, 
    description: 'Search categories by name or description' 
  })
  @ApiQuery({ 
    name: 'includeChildren', 
    required: false, 
    type: Boolean,
    description: 'Include child categories in the response' 
  })
  @ApiQuery({ 
    name: 'sort', 
    required: false, 
    enum: ['asc', 'desc'],
    description: 'Sort categories by name' 
  })
  @ApiQuery({ 
    name: 'tag', 
    required: false, 
    description: 'Filter categories by tag' 
  })
  @ApiOkResponse({
    description: 'Returns the list of categories.',
    type: [CreateCategoryDto],
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
          id: { type: 'number' },
          name: { type: 'string' },
          description: { type: 'string' },
          tags: { type: 'array', items: { type: 'string' } },
          order: { type: 'number' },
          children: {
            type: 'array',
            items: { $ref: getSchemaPath(CreateCategoryDto) }
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
  @ApiOkResponse({
    description: 'Returns categories with the specified tag.',
    type: [CreateCategoryDto],
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
  @ApiOkResponse({
    description: 'The category has been successfully deleted.',
    type: CreateCategoryDto,
  })
  @ApiNotFoundResponse({ description: 'Category not found.' })
  @ApiBadRequestResponse({ description: 'Cannot delete category with children.' })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<Category> {
    return this.categoriesService.remove(id);
  }
}
