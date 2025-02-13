import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsNumber, Min, IsArray } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Technology', description: 'The name of the category' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'All tech-related posts', description: 'The description of the category' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiPropertyOptional({ example: 1, description: 'The ID of the parent category' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  parentId?: number;

  @ApiPropertyOptional({ 
    type: [String], 
    example: ['tech', 'programming'], 
    description: 'Tags associated with the category' 
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ example: 1, description: 'The display order of the category' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  order?: number;
}
