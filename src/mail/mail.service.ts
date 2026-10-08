import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class MailService {
    private readonly logger = new Logger(MailService.name);

    constructor(private readonly mailerService: MailerService) {}

    sendVerifyOtpMail(to: string, name: string, otp: number): Promise<void> {
        // FIRE AND FORGET - LOG OTP AND DISPATCH IN BACKGROUND
        this.logger.log(`[OTP DEBUG] Verification OTP for ${to}: ${otp}`);

        void this.mailerService
            .sendMail({
                to,
                subject: 'Verification Code',
                template: 'otp-verification',
                context: { name, otp },
            })
            .then(() => {
                this.logger.log(`Verify OTP mail sent to ${to}`);
            })
            .catch((error) => {
                this.logger.error(
                    `Failed to send verify OTP mail to ${to}`,
                    error,
                );
            });

        return Promise.resolve();
    }

    sendResetPasswordOtpMail(
        to: string,
        name: string,
        otp: number,
    ): Promise<void> {
        // FIRE AND FORGET - LOG OTP AND DISPATCH IN BACKGROUND
        this.logger.log(`[OTP DEBUG] Reset password OTP for ${to}: ${otp}`);

        void this.mailerService
            .sendMail({
                to,
                subject: 'Reset Password Code',
                template: 'otp-reset-password',
                context: { name, otp },
            })
            .then(() => {
                this.logger.log(`Reset Password mail sent to ${to}`);
            })
            .catch((error) => {
                this.logger.error(
                    `Failed to send reset password mail to ${to}`,
                    error,
                );
            });

        return Promise.resolve();
    }
}
