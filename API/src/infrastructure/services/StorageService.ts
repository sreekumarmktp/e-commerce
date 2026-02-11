import fs from 'fs';
import path from 'path';
import { pipeline } from 'stream/promises';
import { MultipartFile } from '@fastify/multipart';

export interface IStorageService {
    saveFile(file: MultipartFile): Promise<string>;
    deleteFile(filePath: string): Promise<void>;
}

export class LocalStorageService implements IStorageService {
    private uploadDir: string;
    private baseUrl: string;

    constructor() {
        this.uploadDir = path.join(process.cwd(), 'uploads');
        this.baseUrl = process.env.API_URL || 'http://localhost:3001';

        // Ensure upload directory exists
        if (!fs.existsSync(this.uploadDir)) {
            fs.mkdirSync(this.uploadDir, { recursive: true });
        }
    }

    async saveFile(file: MultipartFile): Promise<string> {
        const filename = `${Date.now()}-${file.filename.replace(/\s+/g, '-')}`;
        const filepath = path.join(this.uploadDir, filename);

        await pipeline(file.file, fs.createWriteStream(filepath));

        // Return relative URL or absolute URL
        return `/uploads/${filename}`;
    }

    async deleteFile(fileUrl: string): Promise<void> {
        const filename = fileUrl.split('/').pop();
        if (!filename) return;

        const filepath = path.join(this.uploadDir, filename);
        if (fs.existsSync(filepath)) {
            await fs.promises.unlink(filepath);
        }
    }
}
