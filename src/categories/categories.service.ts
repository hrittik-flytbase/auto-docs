import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { QueryCategoryDto, SortOrder } from './dto/query-category.dto';

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

@Injectable()
export class CategoriesService {
  private categories: Category[] = [];
  private categoryId = 1;

  async create(createCategoryDto: CreateCategoryDto): Promise<Category> {
    if (createCategoryDto.parentId) {
      const parentExists = this.categories.some(cat => cat.id === createCategoryDto.parentId);
      if (!parentExists) {
        throw new BadRequestException(`Parent category with ID ${createCategoryDto.parentId} not found`);
      }
    }

    const category = {
      id: this.categoryId++,
      ...createCategoryDto,
      tags: createCategoryDto.tags || [],
      order: createCategoryDto.order || 0,
      createdAt: new Date()
    };

    this.categories.push(category);
    return category;
  }

  async findAll(query: QueryCategoryDto): Promise<Category[]> {
    let filteredCategories = [...this.categories];

    // Apply search filter
    if (query.search) {
      const searchLower = query.search.toLowerCase();
      filteredCategories = filteredCategories.filter(cat => 
        cat.name.toLowerCase().includes(searchLower) || 
        cat.description.toLowerCase().includes(searchLower)
      );
    }

    // Apply tag filter
    if (query.tag) {
      filteredCategories = filteredCategories.filter(cat => 
        cat.tags.includes(query.tag)
      );
    }

    // Apply sorting
    if (query.sort) {
      filteredCategories.sort((a, b) => {
        const comparison = a.name.localeCompare(b.name);
        return query.sort === SortOrder.ASC ? comparison : -comparison;
      });
    }

    // Include children if requested
    if (!query.includeChildren) {
      filteredCategories = filteredCategories.filter(cat => !cat.parentId);
    }

    return filteredCategories;
  }

  async findOne(id: number): Promise<Category> {
    const category = this.categories.find(cat => cat.id === id);
    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }
    return category;
  }

  async findChildren(id: number): Promise<Category[]> {
    const parent = await this.findOne(id);
    return this.categories.filter(cat => cat.parentId === parent.id);
  }

  async findByTag(tag: string): Promise<Category[]> {
    return this.categories.filter(cat => cat.tags.includes(tag));
  }

  async getHierarchy(): Promise<any[]> {
    const rootCategories = this.categories.filter(cat => !cat.parentId);
    return Promise.all(rootCategories.map(async cat => this.buildHierarchy(cat)));
  }

  private async buildHierarchy(category: Category): Promise<any> {
    const children = await this.findChildren(category.id);
    const childHierarchies = await Promise.all(
      children.map(child => this.buildHierarchy(child))
    );

    return {
      ...category,
      children: childHierarchies
    };
  }

  async update(id: number, updateCategoryDto: UpdateCategoryDto): Promise<Category> {
    const categoryIndex = this.categories.findIndex(cat => cat.id === id);
    if (categoryIndex === -1) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    if (updateCategoryDto.parentId) {
      const parentExists = this.categories.some(cat => cat.id === updateCategoryDto.parentId);
      if (!parentExists) {
        throw new BadRequestException(`Parent category with ID ${updateCategoryDto.parentId} not found`);
      }

      // Prevent circular references
      if (updateCategoryDto.parentId === id) {
        throw new BadRequestException('Category cannot be its own parent');
      }
    }

    this.categories[categoryIndex] = {
      ...this.categories[categoryIndex],
      ...updateCategoryDto,
      tags: updateCategoryDto.tags || this.categories[categoryIndex].tags,
      updatedAt: new Date()
    };

    return this.categories[categoryIndex];
  }

  async remove(id: number): Promise<Category> {
    const categoryIndex = this.categories.findIndex(cat => cat.id === id);
    if (categoryIndex === -1) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    // Check if category has children
    const hasChildren = this.categories.some(cat => cat.parentId === id);
    if (hasChildren) {
      throw new BadRequestException('Cannot delete category with child categories');
    }

    const deletedCategory = this.categories[categoryIndex];
    this.categories.splice(categoryIndex, 1);
    return deletedCategory;
  }
}
