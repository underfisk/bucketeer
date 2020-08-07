import { createAction, props } from '@ngrx/store';
import { CloudStorage } from './cloud-storage.interface';
import { StorageFile } from '../../core/services/storage/storage.interfaces';

export const initializeStorage = createAction(
    '[CloudStorage] Init', 
    props<{ data: Partial<CloudStorage> }>()
)

export const fileUploaded = createAction(
    '[CloudStorage] File uploaded/updated', 
    /**If indexOnFiles is not -1 then it's an update */
    props<{ file: StorageFile, indexOnFiles: number }>()
)