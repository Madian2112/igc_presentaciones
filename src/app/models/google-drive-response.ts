import { GoogleDriveFile } from "./google-drive-file"

export interface GoogleDriveResponse {
    files: GoogleDriveFile[]
    nextPageToken?: string
}
