import { FastifyReply, FastifyRequest } from 'fastify';
import { IStorageService } from '../../infrastructure/services/StorageService';

export class UploadController {
    constructor(private storageService: IStorageService) { }

    async uploadFile(req: FastifyRequest, reply: FastifyReply): Promise<void> {
        try {
            const data = await req.file();
            if (!data) {
                reply.code(400).send({ error: 'No file uploaded' });
                return;
            }

            const fileUrl = await this.storageService.saveFile(data);

            reply.send({
                success: true,
                data: { url: fileUrl },
                message: 'File uploaded successfully'
            });
        } catch (error) {
            reply.code(500).send({
                success: false,
                error: error instanceof Error ? error.message : 'Upload failed'
            });
        }
    }
}
