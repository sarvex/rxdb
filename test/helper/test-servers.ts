import path from 'node:path';
import fs from 'node:fs';
import express from 'express';
import cors from 'cors';

import * as GraphQLServer from './graphql-server.ts';
import * as SignalingServer from './signaling-server.ts';
import { startRemoteStorageServer } from './remote-storage-server.ts';
import {
    blobToBase64String
} from '../../plugins/core/index.mjs';
import { fileURLToPath } from 'node:url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const TEST_STATIC_FILE_SERVER_PORT = 18001;
export function startTestServers() {
    const staticFilesPath = path.join(
        __dirname,
        '../../',
        'docs-src',
        'files'
    );
    console.log('staticFilesPath: ' + staticFilesPath);

    // we need one graphql server so the browser can sync to it
    GraphQLServer.spawn([], 18000);
    SignalingServer.startSignalingServer(18006);
    startRemoteStorageServer(18007);

    /**
     * we need to serve some static files
     * to run tests for attachments
     */
    const app = express();
    app.use(cors());
    app.get('/', (_req: any, res: any) => {
        res.send('Hello World!');
    });
    app.use('/files', express.static(staticFilesPath));
    app.get('/base64/:filename', async (req: any, res: any) => {
        const filename = req.params.filename;
        const filePath = path.join(
            staticFilesPath,
            filename
        );
        const buffer = fs.readFileSync(filePath);
        const blob = new Blob([buffer]);
        const base64String = await blobToBase64String(blob);
        res.set('Content-Type', 'text/html');
        res.send(base64String);
    });
    app.listen(TEST_STATIC_FILE_SERVER_PORT, () => console.log(`Server listening on port: ${TEST_STATIC_FILE_SERVER_PORT}`));
}
