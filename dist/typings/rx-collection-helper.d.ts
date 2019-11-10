import { RxCollection } from './types';
/**
 * wrappers for Pouch.put/get to handle keycompression etc
 */
export declare function _handleToPouch(col: RxCollection | any, docData: any): any;
export declare function _handleFromPouch(col: RxCollection | any, docData: any, noDecrypt?: boolean): any;
/**
 * fills in the _id and the
 * default data.
 * This also clones the data
 */
export declare function fillObjectDataBeforeInsert(collection: RxCollection | any, data: any): any;
