import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { randomBytes } from 'crypto';
import { diskStorage } from 'multer';
import { existsSync, mkdirSync } from 'fs';
import { extname, join } from 'path';

const UPLOAD_ROOT = join(process.cwd(), process.env.UPLOAD_DIR ?? 'uploads');
const AUDIO_DIR = join(UPLOAD_ROOT, 'audio');
const ALLOWED_AUDIO = ['.webm', '.ogg', '.oga', '.mp3', '.m4a', '.wav', '.aac'];
const MAX_MB = Number(process.env.MAX_UPLOAD_MB ?? 25);

@ApiTags('files')
@ApiBearerAuth()
@Controller('files')
export class FilesController {
  @Post('audio')
  @ApiOperation({ summary: 'Audio yuklash (speaking javoblari) — {url} qaytaradi' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          if (!existsSync(AUDIO_DIR)) mkdirSync(AUDIO_DIR, { recursive: true });
          cb(null, AUDIO_DIR);
        },
        filename: (_req, file, cb) => {
          const ext = extname(file.originalname).toLowerCase() || '.webm';
          cb(null, `${Date.now()}-${randomBytes(8).toString('hex')}${ext}`);
        },
      }),
      limits: { fileSize: MAX_MB * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        const ext = extname(file.originalname).toLowerCase();
        if (ALLOWED_AUDIO.includes(ext) || file.mimetype.startsWith('audio/')) {
          cb(null, true);
        } else {
          cb(new BadRequestException('Faqat audio fayllar qabul qilinadi'), false);
        }
      },
    }),
  )
  uploadAudio(@UploadedFile() file?: Express.Multer.File) {
    if (!file) throw new BadRequestException('Fayl yuborilmadi');
    return { url: `/uploads/audio/${file.filename}`, size: file.size };
  }
}
