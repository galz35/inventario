import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger(MailService.name);

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('SMTP_HOST'),
      port: this.configService.get<number>('SMTP_PORT'),
      secure: false, // true for 465, false for other ports
      auth: {
        user: this.configService.get<string>('SMTP_USER'),
        pass: this.configService.get<string>('SMTP_PASS'),
      },
    });
  }

  async sendMail(to: string, subject: string, html: string) {
    try {
      const info = await this.transporter.sendMail({
        from: this.configService.get<string>('SMTP_FROM'),
        to,
        subject,
        html,
      });
      this.logger.log(`Email sent: ${info.messageId}`);
      return info;
    } catch (error) {
      this.logger.error('Error sending email', error);
      throw error;
    }
  }

  async sendStockAlert(
    productName: string,
    currentStock: number,
    minStock: number,
    warehouseName: string,
  ) {
    const html = `
      <div style="font-family: sans-serif; padding: 20px; color: #333;">
        <h2 style="color: #f43f5e;">⚠️ Alerta de Stock Bajo</h2>
        <p>El siguiente producto ha bajado del nivel mínimo establecido:</p>
        <div style="background: #f8fafc; padding: 15px; border-radius: 8px; border-left: 4px solid #f43f5e;">
          <p><strong>Producto:</strong> ${productName}</p>
          <p><strong>Almacén:</strong> ${warehouseName}</p>
          <p><strong>Stock Actual:</strong> <span style="color: #f43f5e; font-weight: bold;">${currentStock}</span></p>
          <p><strong>Stock Mínimo:</strong> ${minStock}</p>
        </div>
        <p style="margin-top: 20px;">Por favor, gestione el reabastecimiento lo antes posible.</p>
        <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
        <p style="font-size: 0.8rem; color: #888;">Este es un mensaje automático del Sistema INVCORE.</p>
      </div>
    `;
    return this.sendMail(
      this.configService.get<string>('SMTP_USER') || '', // Enviar al admin o configurar destinatario
      `[ALERTA] Stock Bajo: ${productName}`,
      html,
    );
  }
}
