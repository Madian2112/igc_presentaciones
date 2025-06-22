export interface GoogleDriveFile {
    id: string
    name: string
    mimeType: string
    webViewLink: string
    webContentLink: string
    size: string
    modifiedTime: string
    thumbnailLink?: string
}
