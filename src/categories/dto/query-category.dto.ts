import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsBoolean, IsEnum } from 'class-validator';
import { Transform } from 'class-transformer';

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc'
}

export class QueryCategoryDto {
  @ApiPropertyOptional({ 
    description: 'Search categories by name or description',
    example: 'tech' 
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ 
    description: 'Include child categories in the response',
    example: true 
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  includeChildren?: boolean;

  @ApiPropertyOptional({ 
    description: 'Sort categories by name',
    enum: SortOrder,
    example: SortOrder.ASC 
  })
  @IsOptional()
  @IsEnum(SortOrder)
  sort?: SortOrder;

  @ApiPropertyOptional({ 
    description: 'Filter categories by tag',
    example: 'programming' 
  })
  @IsOptional()
  @IsString()
  tag?: string;
}
