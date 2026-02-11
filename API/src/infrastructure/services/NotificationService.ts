import nodemailer from 'nodemailer';

export interface INotificationService {
    sendOrderConfirmation(email: string, orderId: string, totalAmount: number): Promise<void>;
}

export class NotificationService implements INotificationService {
    private transporter: nodemailer.Transporter;

    constructor() {
        // For development, we can use Ethereal or just log if no credentials
        this.transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.ethereal.email',
            port: Number(process.env.SMTP_PORT) || 587,
            auth: {
                user: process.env.SMTP_USER || 'ethereal_user',
                pass: process.env.SMTP_PASS || 'ethereal_pass',
            },
        });
    }

    async sendOrderConfirmation(email: string, orderId: string, totalAmount: number): Promise<void> {
        const info = await this.transporter.sendMail({
            from: '"E-commerce Store" <noreply@ecommerce.com>',
            to: email,
            subject: `Order Confirmation #${orderId}`,
            text: `Thank you for your order! Your Order ID is ${orderId}. Total Amount: $${totalAmount}`,
            html: `
        <h1>Order Confirmation</h1>
        <p>Thank you for your order!</p>
        <p><strong>Order ID:</strong> ${orderId}</p>
        <p><strong>Total Amount:</strong> $${totalAmount.toFixed(2)}</p>
      `,
        });

        console.log('Message sent: %s', info.messageId);
        // Preview only available when sending through an Ethereal account
        console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
    }
}
