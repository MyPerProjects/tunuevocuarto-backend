import { IsOptional, IsString, Length } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @Length(9, 9)
  yapeNumber?: string;

  @IsOptional()
  @IsString()
  bcpAccount?: string;
}
