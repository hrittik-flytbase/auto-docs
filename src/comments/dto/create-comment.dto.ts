import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber } from 'class-validator';

export class CreateCommentDto {
  @ApiProperty({ example: 'Great post!', description: 'The content of the comment' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({ example: 1, description: 'The ID of the post this comment belongs to' })
  @IsNumber()
  @IsNotEmpty()
  postId: number;

  @ApiProperty({ example: 1, description: 'The ID of the user who created the comment' })
  @IsNumber()
  @IsNotEmpty()
  userId: number;
}
