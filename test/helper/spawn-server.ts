/**
 * creates a new express-server to use as sync-target
 * @link https://github.com/pouchdb/express-pouchdb
 */

import { randomString } from 'async-test-util';
import { PROMISE_RESOLVE_VOID } from '../../plugins/core/index.mjs';
import { getFetchWithCouchDBAuthorization } from '../../plugins/replication-couchdb/index.mjs';
import { ENV_VARIABLES } from '../unit/config.ts';
import { nextPort } from './port-manager.ts';

import express from 'express';
const app = express();
import PouchDB from 'pouchdb';
import memdown from 'memdown';
const InMemPouchDB = PouchDB.defaults({
    prefix: '/test_tmp/server-temp-pouch/',
    db: memdown,
    configPath: 'test_tmp/'
});
import expressPouch from 'express-pouchdb';

expressPouch(InMemPouchDB);

if (ENV_VARIABLES.NATIVE_COUCHDB) {
    console.log('ENV_VARIABLES.NATIVE_COUCHDB: ' + ENV_VARIABLES.NATIVE_COUCHDB);
}

/**
 * Spawns a CouchDB server
 */
export async function spawn(
    databaseName = randomString(5),
    port?: number
): Promise<{
    dbName: string;
    url: string;
    close: () => Promise<void>;
}> {

    /**
     * If a native CouchDB server is used,
     * do not spawn a PouchDB server.
     */
    if (ENV_VARIABLES.NATIVE_COUCHDB) {
        if (port) {
            throw new Error('if NATIVE_COUCHDB is set, do not specify a port');
        }
        port = parseInt(ENV_VARIABLES.NATIVE_COUCHDB, 10);
        const url = 'http://0.0.0.0:' + port + '/' + databaseName + '/';

        const controller = new AbortController();
        setTimeout(() => controller.abort(), 1000);
        const authFetch = getFetchWithCouchDBAuthorization('root', 'root');
        await authFetch(
            url,
            {
                method: 'PUT',
                signal: controller.signal
            }
        );
        return {
            dbName: databaseName,
            url,
            close: () => PROMISE_RESOLVE_VOID
        };
    }

    port = port ? port : await nextPort();
    const path = '/db';
    app.use(path, expressPouch);
    const dbRootUrl = 'http://0.0.0.0:' + port + path;

    return new Promise(res => {
        const server = app.listen(port, async function () {
            const url = dbRootUrl + '/' + databaseName + '/';

            // create the CouchDB database
            await fetch(
                url,
                {
                    method: 'PUT'
                }
            );

            res({
                dbName: databaseName,
                url,
                /**
                 * TODO add check in last.unit.test to ensure
                 * that all servers have been closed.
                 */
                close(now = false) {
                    if (now) {
                        server.close();
                        return Promise.resolve();
                    } else {
                        return new Promise(res2 => {
                            setTimeout(() => {
                                server.close();
                                res2();
                            }, 1000);
                        });
                    }
                }
            });
        });
    });
}
