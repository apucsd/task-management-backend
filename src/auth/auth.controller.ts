import {
    Body,
    Controller,
    Post,
    Req,
    Res,
    UnauthorizedException,
    UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ForgotPasswordDto } from './dto/forget-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { AuthGuard } from 'src/common/guards/auth/auth.guard';
import { ResponseMessage } from 'src/common/decorators/response-message.decorator';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { ConfigService } from '@nestjs/config';

@Controller('auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService,
        private readonly configService: ConfigService,
    ) {}

    @Post('/register')
    @ResponseMessage(
        'User registered successfully. Please check your email for verification.',
    )
    async register(@Body() registerDto: RegisterDto) {
        return await this.authService.register(registerDto);
    }

    @Post('/login')
    @ResponseMessage('User logged in successfully')
    async login(
        @Body() loginDto: LoginDto,
        @Res({ passthrough: true }) res: Response,
    ) {
        const { refreshToken, ...rest } =
            await this.authService.login(loginDto);

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: this.configService.get('NODE_ENV') === 'production',
            sameSite: 'strict',
            maxAge: 30 * 24 * 60 * 60 * 1000, // 30 DAYS
        });

        return rest;
    }

    @Post('/verify-otp')
    @ResponseMessage('OTP verified successfully')
    async verifyOtp(@Body() verifyOtpDto: VerifyOtpDto) {
        return await this.authService.verifyOtp(verifyOtpDto);
    }

    @Post('/resend-registration-otp')
    @ResponseMessage('OTP sent successfully. Please check your email.')
    async resendRegistrationOtp(@Body() body: ForgotPasswordDto) {
        return await this.authService.resendRegistrationOtp(body.email);
    }

    @Post('/forgot-password')
    @ResponseMessage('Please check your email for reset password otp')
    async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
        return await this.authService.forgotPassword(forgotPasswordDto);
    }

    @Post('/reset-password')
    @ResponseMessage('Password reset successfully')
    async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
        return await this.authService.resetPassword(resetPasswordDto);
    }

    @Post('/change-password')
    @UseGuards(AuthGuard)
    @ResponseMessage('Password changed successfully')
    async changePassword(
        @CurrentUser('id') userId: string,
        @Body() body: ChangePasswordDto,
    ) {
        return await this.authService.changePassword(userId, body);
    }

    @Post('/refresh-token')
    @ResponseMessage('Token refreshed successfully')
    async refreshToken(@Req() req: Request) {
        const token = req.cookies['refreshToken'];
        if (!token) {
            throw new UnauthorizedException('Refresh token not found');
        }
        return await this.authService.refreshToken(token);
    }
}
