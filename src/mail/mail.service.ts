import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class MailService {
    private readonly logger = new Logger(MailService.name);

    constructor(private readonly mailerService: MailerService) {}

    async sendVerifyOtpMail(to: string, name: string, otp: number) {
        try {
            await this.mailerService.sendMail({
                to,
                subject: 'Verification Code',
                template: 'otp-verification',
                context: { name, otp },
            });
            this.logger.log(`Verify OTP mail sent to ${to}`);
        } catch (error) {
            this.logger.error(`Failed to send verify OTP mail to ${to}`, error);
        }
    }

    async sendResetPasswordOtpMail(to: string, name: string, otp: number) {
        try {
            await this.mailerService.sendMail({
                to,
                subject: 'Reset Password Code',
                template: 'otp-reset-password',
                context: { name, otp },
            });
            this.logger.log(`Reset Password mail sent to ${to}`);
        } catch (error) {
            this.logger.error(
                `Failed to send reset password mail to ${to}`,
                error,
            );
        }
    }
}
