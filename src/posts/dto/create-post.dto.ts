import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class CreatePostDto {
  @ApiProperty({ example: 'My First Post', description: 'The title of the post' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'This is the content of my post', description: 'The content of the post' })
  @IsString()
  @IsNotEmpty()
  content: string;
}
