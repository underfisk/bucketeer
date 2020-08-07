import { StorageFile,StorageFolder } from '../../core/services/storage/storage.interfaces'

export interface LocalStorage {
    files: StorageFile[]
    folders: StorageFolder[]
}