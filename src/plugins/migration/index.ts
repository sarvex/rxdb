import {
    combineLatest,
    Observable
} from 'rxjs';
import {
    shareReplay,
    switchMap
} from 'rxjs/operators';
import type {
    RxPlugin,
    RxCollection,
    RxDatabase,
    AllMigrationStates
} from '../../types';
import {
    getFromMapOrCreate,
    PROMISE_RESOLVE_FALSE,
    RXJS_SHARE_REPLAY_DEFAULTS
} from '../../../plugins/utils';
import {
    RxMigrationState
} from './rx-migration-state';
import { getMigrationStateByDatabase, onDatabaseDestroy } from './migration-helpers';

export const DATA_MIGRATOR_BY_COLLECTION: WeakMap<RxCollection, RxMigrationState> = new WeakMap();

export const RxDBMigrationPlugin: RxPlugin = {
    name: 'migration',
    rxdb: true,
    hooks: {
        preDestroyRxDatabase: {
            after: onDatabaseDestroy
        }
    },
    prototypes: {
        RxDatabase: (proto: any) => {
            proto.migrationStates = function (this: RxDatabase): Observable<AllMigrationStates> {
                return getMigrationStateByDatabase(this).pipe(
                    shareReplay(RXJS_SHARE_REPLAY_DEFAULTS)
                );
            };
        },
        RxCollection: (proto: any) => {
            proto.getMigrationState = function (this: RxCollection): RxMigrationState {
                return getFromMapOrCreate(
                    DATA_MIGRATOR_BY_COLLECTION,
                    this,
                    () => new RxMigrationState(
                        this.asRxCollection,
                        this.migrationStrategies
                    )
                );
            };
            proto.migrationNeeded = function (this: RxCollection) {
                if (this.schema.version === 0) {
                    return PROMISE_RESOLVE_FALSE;
                }
                return mustMigrate(this.getDataMigrator());
            };
        }
    }
};


export * from './data-migrator';
export * from './migration-helper';
export * from './migration-state';
