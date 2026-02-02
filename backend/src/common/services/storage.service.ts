import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class StorageService {
  private readonly uploadPath = path.join(process.cwd(), 'uploads');
  private readonly logger = new Logger(StorageService.name);

  constructor() {
    if (!fs.existsSync(this.uploadPath)) {
      fs.mkdirSync(this.uploadPath, { recursive: true });
    }
  }

  async saveFile(
    fileBuffer: Buffer,
    originalName: string,
    subFolder: string = '',
  ): Promise<string> {
    try {
      const folderPath = path.join(this.uploadPath, subFolder);
      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
      }

      const fileExt = path.extname(originalName);
      const fileName = `${uuidv4()}${fileExt}`;
      const fullPath = path.join(folderPath, fileName);

      fs.writeFileSync(fullPath, fileBuffer);

      this.logger.log(`File saved: ${fileName}`);
      return path.join(subFolder, fileName).replace(/\\/g, '/');
    } catch (error) {
      this.logger.error('Error saving file', error);
      throw error;
    }
  }

  async saveBase64(
    base64Data: string,
    fileName: string,
    subFolder: string = '',
  ): Promise<string> {
    const base64Body = base64Data.split(';base64,').pop() || '';
    const buffer = Buffer.from(base64Body, 'base64');
    return this.saveFile(buffer, fileName, subFolder);
  }

  getFilePath(relativeUrl: string): string {
    return path.join(this.uploadPath, relativeUrl);
  }
}
