import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport, Transporter } from 'nodemailer';

export interface MailMessage {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

/**
 * SMTP mail sender. Without SMTP_HOST it falls back to logging the message,
 * so OTP flows stay testable locally without any mail account.
 */
@Injectable()
export class MailService implements OnModuleInit {
  private readonly logger = new Logger(MailService.name);
  private transporter: Transporter | null = null;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const host = this.configService.get<string>('SMTP_HOST');
    if (!host) {
      this.logger.warn('SMTP_HOST yo‘q — xatlar konsolga yoziladi (dev rejim)');
      return;
    }
    const port = Number(this.configService.get<string>('SMTP_PORT') ?? 587);
    this.transporter = createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user: this.configService.get<string>('SMTP_USER'),
        pass: this.configService.get<string>('SMTP_PASS'),
      },
    });
    this.logger.log(`SMTP sozlandi: ${host}:${port}`);
  }

  get isConfigured(): boolean {
    return !!this.transporter;
  }

  async send(message: MailMessage): Promise<void> {
    if (!this.transporter) {
      this.logger.log(
        `📧 [DEV] ${message.to} — ${message.subject}\n${message.text}`,
      );
      return;
    }
    const from =
      this.configService.get<string>('SMTP_FROM') ??
      `multilevel.wisar.uz <${this.configService.get<string>('SMTP_USER')}>`;
    await this.transporter.sendMail({
      from,
      to: message.to,
      subject: message.subject,
      text: message.text,
      html: message.html,
    });
  }

  /** Branded OTP email. */
  async sendOtp(to: string, code: string, purposeUz: string): Promise<void> {
    const subject = `${code} — multilevel.wisar.uz tasdiqlash kodi`;
    const text =
      `Tasdiqlash kodingiz: ${code}\n\n` +
      `Maqsad: ${purposeUz}\n` +
      `Kod 5 daqiqa amal qiladi.\n\n` +
      `Agar bu so‘rovni siz yubormagan bo‘lsangiz, xatni e’tiborsiz qoldiring.`;
    const html = `
      <div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:480px;margin:0 auto;padding:24px">
        <h2 style="margin:0 0 4px">multilevel.wisar.uz</h2>
        <p style="color:#666;margin:0 0 24px">CEFR imtihoniga bepul tayyorgarlik</p>
        <p style="margin:0 0 8px">${escapeHtml(purposeUz)} uchun tasdiqlash kodi:</p>
        <div style="font-size:34px;font-weight:700;letter-spacing:8px;padding:16px 0">${code}</div>
        <p style="color:#666;font-size:14px">Kod <b>5 daqiqa</b> amal qiladi.</p>
        <hr style="border:none;border-top:1px solid #eee;margin:24px 0">
        <p style="color:#999;font-size:12px">
          Agar bu so‘rovni siz yubormagan bo‘lsangiz, xatni e’tiborsiz qoldiring —
          hisobingiz xavfsiz.
        </p>
      </div>`;
    await this.send({ to, subject, text, html });
  }
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
