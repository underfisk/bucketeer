import dayjs from 'dayjs'


export interface StorageUploadFile {
    name: string
    folder?: string 
    body: any
    bytes: number 
    mimeType: string
}

export interface StorageFile {
    key: string 
    name: string 
    createdAt: dayjs.Dayjs
    size: number
    prettySize: string
    extension: string
    lastModifiedAt?: dayjs.Dayjs
}

export interface StorageFolder {
    key: string 
    name: string 
    files: StorageFile[]
    folders: StorageFolder[]
    createdAt: dayjs.Dayjs
}