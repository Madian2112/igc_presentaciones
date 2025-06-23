import { Injectable } from '@angular/core';
import { Song } from '../models/presentation.model';
import { GoogleDriveFile } from '../models/google-drive-file';
import { GoogleDriveResponse } from '../models/google-drive-response';
import { environment } from '../../environments/environment';
import orderBy from 'lodash/orderBy'

@Injectable({
  providedIn: 'root'
})
export class GoogleDriveService {

  async loadSongsFromDrive(): Promise<Song[]> {
    try {
      console.log("🔄 Loading songs from Google Drive folder...")

      const files = await this.fetchFolderContents(environment.FOLDER_ID_DRIVE)
      const songs: Song[] = []

      for (const file of files) {
        if (this.isPowerPointFile(file)) {
          try {
            const song = await this.convertFileToSong(file)
            songs.push(song)
          } catch (error) {
            console.warn(`⚠️ Failed to process file ${file.name}:`, error)
          }
        }
      }

      const cancionesOrdenadas = orderBy(songs, ['name'], ['asc'])
      console.log(`✅ Loaded ${cancionesOrdenadas.length} songs from Google Drive`)
      return cancionesOrdenadas
    } catch (error) {
      console.error("❌ Error loading songs from Google Drive:", error)
      throw new Error(
        `Failed to load songs from Google Drive: ${error instanceof Error ? error.message : "Unknown error"}`,
      )
    }
  }

  private async fetchFolderContents(folderId: string): Promise<GoogleDriveFile[]> {
    const allFiles: GoogleDriveFile[] = []
    let nextPageToken: string | undefined

    do {
      const url = new URL(`${environment.BASE_URL_DRIVE}/files`)
      url.searchParams.set("q", `'${folderId}' in parents and trashed=false`)
      url.searchParams.set(
        "fields",
        "nextPageToken,files(id,name,mimeType,webViewLink,webContentLink,size,modifiedTime,thumbnailLink)",
      )
      url.searchParams.set("key", environment.API_KEY_GOOGLE)
      url.searchParams.set("pageSize", "100")

      if (nextPageToken) {
        url.searchParams.set("pageToken", nextPageToken)
      }

      const response = await fetch(url.toString())

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error("Access denied. Please check API key and folder permissions.")
        } else if (response.status === 404) {
          throw new Error("Google Drive folder not found. Please verify the folder ID.")
        } else {
          throw new Error(`Google Drive API error: ${response.status} ${response.statusText}`)
        }
      }

      const data: GoogleDriveResponse = await response.json()
      allFiles.push(...data.files)
      nextPageToken = data.nextPageToken
    } while (nextPageToken)

    return allFiles
  }

  private isPowerPointFile(file: GoogleDriveFile): boolean {
    const powerPointMimeTypes = [
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "application/vnd.google-apps.presentation",
    ]

    const powerPointExtensions = [".ppt", ".pptx"]

    return (
      powerPointMimeTypes.includes(file.mimeType) ||
      powerPointExtensions.some((ext) => file.name.toLowerCase().endsWith(ext))
    )
  }

  private async convertFileToSong(file: GoogleDriveFile): Promise<Song> {
    const songName = this.extractSongName(file.name)
    const slideCount = await this.estimateSlideCount(file)

    return {
      id: file.id,
      name: songName,
      source: `Public/letras/${file.name}`, // Mantener formato original para mostrar
      slideCount: slideCount,
      lyrics: await this.extractLyricsPreview(file),
      metadata: {
        artist: this.extractArtist(file.name),
        genre: "Worship", 
        year: new Date(file.modifiedTime).getFullYear(),
        fileSize: parseInt(file.size) || 0,
        mimeType: file.mimeType,
        thumbnailUrl: file.thumbnailLink,
        driveFileId: file.id, // ✅ ESTO ES CLAVE para el copy-paste
        lastModified: file.modifiedTime,
        // ✅ También guardamos los links de descarga
        webViewLink: file.webViewLink,
        webContentLink: file.webContentLink
      },
    }
  }

  private extractSongName(filename: string): string {
    let name = filename.replace(/\.(ppt|pptx)$/i, "")
    name = name.replace(/^\d+[\s\-.]*/, "")
    name = name.replace(/[-_]/g, " ")
    name = name.replace(/\s+/g, " ").trim()
    return name.replace(/\b\w/g, (l) => l.toUpperCase())
  }

  private extractArtist(filename: string): string {
    const match = filename.match(/^([^-]+)\s*-\s*(.+)/)
    if (match) {
      return match[1].trim()
    }
    return "Unknown Artist"
  }

  private async estimateSlideCount(file: GoogleDriveFile): Promise<number> {
    const sizeInKB = parseInt(file.size) / 1024

    if (sizeInKB < 100) return 2
    if (sizeInKB < 300) return 4
    if (sizeInKB < 500) return 6
    if (sizeInKB < 1000) return 8
    return 10
  }

  private async extractLyricsPreview(file: GoogleDriveFile): Promise<string[]> {
    const songName = this.extractSongName(file.name)

    return [
      `🎵 ${songName.toUpperCase()} 🎵`,
      "Verse 1:\n[Lyrics will be extracted from PowerPoint]",
      "Chorus:\n[Lyrics will be extracted from PowerPoint]", 
      "Verse 2:\n[Lyrics will be extracted from PowerPoint]",
      "Bridge:\n[Lyrics will be extracted from PowerPoint]",
      "Final:\n[Lyrics will be extracted from PowerPoint]",
    ]
  }

  // ✅ Método mejorado para descargar archivos
  async downloadFile(fileId: string): Promise<Blob> {
    try {
      console.log(`📥 Downloading file from Google Drive: ${fileId}`)
      
      // Para archivos de Google Apps (Google Slides), necesitamos exportarlos
      const fileMetadata = await this.getFileMetadata(fileId)
      
      let url: string
      
      if (fileMetadata.mimeType === "application/vnd.google-apps.presentation") {
        // Exportar Google Slides como PowerPoint
        url = `${environment.BASE_URL_DRIVE}/files/${fileId}/export?mimeType=application/vnd.openxmlformats-officedocument.presentationml.presentation&key=${environment.API_KEY_GOOGLE}`
      } else {
        // Descargar archivo PowerPoint nativo
        url = `${environment.BASE_URL_DRIVE}/files/${fileId}?alt=media&key=${environment.API_KEY_GOOGLE}`
      }

      const response = await fetch(url)

      if (!response.ok) {
        throw new Error(`Failed to download file: ${response.status} ${response.statusText}`)
      }

      const blob = await response.blob()
      console.log(`✅ Downloaded file: ${blob.size} bytes`)
      return blob
      
    } catch (error) {
      console.error("❌ Error downloading file:", error)
      throw error
    }
  }

  async getFileMetadata(fileId: string): Promise<GoogleDriveFile> {
    try {
      const url = `${environment.BASE_URL_DRIVE}/files/${fileId}?fields=id,name,mimeType,size,modifiedTime,thumbnailLink,webViewLink,webContentLink&key=${environment.API_KEY_GOOGLE}`
      const response = await fetch(url)

      if (!response.ok) {
        throw new Error(`Failed to get file metadata: ${response.status} ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error("Error getting file metadata:", error)
      throw error
    }
  }

  // ✅ Método adicional para verificar permisos
  async testDriveConnection(): Promise<boolean> {
    try {
      const response = await fetch(
        `${environment.BASE_URL_DRIVE}/files/${environment.FOLDER_ID_DRIVE}?key=${environment.API_KEY_GOOGLE}`
      )
      return response.ok
    } catch {
      return false
    }
  }
}