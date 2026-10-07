import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';

export class AddMemberDto {
    @ApiProperty({
        example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        description: 'ID of the registered user to add as project member',
    })
    @IsNotEmpty()
    @IsUUID()
    userId: string;
}
