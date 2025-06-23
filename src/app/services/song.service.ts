import { Injectable } from "@angular/core"
import type { Song } from "../models/presentation.model"
import { GoogleDriveService } from "./google-drive.service"

@Injectable({
  providedIn: "root",
})
export class SongService {
  private songs: Song[] = [ ]

  constructor(private googleDriveService: GoogleDriveService) {}

  async loadAvailableSongs(): Promise<Song[]> {
    try {
      // First try to load from Google Drive
      console.log("🔄 Loading songs from Google Drive...")
      const driveSongs = await this.googleDriveService.loadSongsFromDrive()

      if (driveSongs.length > 0) {
        console.log(`✅ Loaded ${driveSongs.length} songs from Google Drive`)
        return driveSongs
      }
    } catch (error) {
      console.warn("⚠️ Failed to load from Google Drive, falling back to local songs:", error)
    }

    // Fallback to local songs
    console.log("📁 Loading local song library...")
    await this.delay(1500)
    return [...this.songs]
  }

  async searchSongs(query: string): Promise<Song[]> {
    await this.delay(300)
    if (!query.trim()) return this.songs

    return this.songs.filter(
      (song) =>
        song.name.toLowerCase().includes(query.toLowerCase()) ||
        song.metadata?.artist?.toLowerCase().includes(query.toLowerCase()) ||
        song.metadata?.genre?.toLowerCase().includes(query.toLowerCase()),
    )
  }

  async getSongById(id: string): Promise<Song | undefined> {
    return this.songs.find((song) => song.id === id)
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  async refreshSongsFromDrive(): Promise<Song[]> {
    return await this.googleDriveService.loadSongsFromDrive()
  }
}
