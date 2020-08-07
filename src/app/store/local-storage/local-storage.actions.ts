import { createAction, props } from '@ngrx/store';
import { LocalStorage } from './local-storage.interface';
import { StorageFile, StorageFolder } from '../../core/services/storage/storage.interfaces';

export const loadLocalStorage = createAction(
    '[LocalStorage] Init', 
    props<{ data: Partial<LocalStorage> }>()
)

export const addLocalFile = createAction(
    '[LocalStorage] File created/updated', 
    /**If indexOnFiles is not -1 then it's an update */
    props<{ file: StorageFile, indexOnFiles: number }>()
)

export const updateLocalFile = createAction(
    '[LocalStorage] Updated file', 
    props<{ file: Partial<StorageFile> }>()
)

export const removeLocalFile = createAction(
    '[LocalStorage] Removed', 
    props<{ key: string }>()
)

export const addDirectory = createAction(
    '[LocalStorage] Directory created',
    props<{ folder: StorageFolder}>()
)

export const removeDirectory = createAction(
    '[LocalStorage] Directory removed',
    props<{ name: string }>()
)