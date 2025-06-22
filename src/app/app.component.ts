import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { PresentationItem } from './models/presentation-item.model';
import { SongSelectorComponent } from "./components/song-selector/song-selector.component";
import { MediaSelectorComponent } from "./components/media-selector/media-selector.component";
import { PresentationBuilderComponent } from "./components/presentation-builder/presentation-builder.component";
import { ExportModalComponent } from "./components/export-modal/export-modal.component";
import { Song } from './models/presentation.model';
import { PresentationService } from './services/presentation.service';
import { SongService } from './services/song.service';
import { SearchBarComponent } from './components/search-bar/search-bar.component';
import { MediaUploaderComponent } from "./components/media-uploader/media-uploader.component";
import { PresentationOrganizerComponent } from "./components/presentation-organizer/presentation-organizer.component";
import { ExportDialogComponent } from "./components/export-dialog/export-dialog.component";
import { ThemeService } from './services/theme.service';
import { ThemeToggleComponent } from "./components/theme-toggle/theme-toggle.component";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, SongSelectorComponent, MediaSelectorComponent, PresentationBuilderComponent, ExportModalComponent,
    SearchBarComponent, MediaUploaderComponent, PresentationOrganizerComponent, ExportDialogComponent, ThemeToggleComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  presentationItems: PresentationItem[] = []
  availableSongs: Song[] = []
  isLoadingSongs = false
  showExportDialog = false
  isProcessing = false
  processingMessage = ""
  processingDetail = ""
  processingProgress = 0
  isDarkMode = false

  constructor(
    private presentationService: PresentationService,
    private songService: SongService,
    private themeService: ThemeService,
  ) {}

  ngOnInit() {
    this.isDarkMode = this.themeService.isDarkMode()
    this.initializeApplication()
  }

  onThemeChanged(isDark: boolean) {
    this.isDarkMode = isDark
  }

  private async initializeApplication() {
    this.showProcessing("Initializing application...", "Loading system resources")

    try {
      await this.delay(1000)
      this.updateProgress(25)

      this.processingDetail = "Scanning Public/letras/ directory"
      await this.delay(800)
      this.updateProgress(50)

      this.availableSongs = await this.songService.loadAvailableSongs()
      this.updateProgress(75)

      this.processingDetail = "Setting up user interface"
      await this.delay(500)
      this.updateProgress(100)

      await this.delay(300)
      this.hideProcessing()

      this.showNotification("Application initialized successfully", "success")
    } catch (error) {
      this.hideProcessing()
      this.showNotification("Error initializing application", "error")
    }
  }

  onSearchInitiated() {
    this.isLoadingSongs = true
  }

  async onSongSelected(song: Song) {
    this.showProcessing("Loading song lyrics...", `Processing ${song.name}`)

    try {
      this.updateProgress(20)
      await this.delay(800)

      this.processingDetail = `Loading ${song.source}`
      this.updateProgress(50)
      await this.delay(600)

      this.processingDetail = "Extracting first slide preview"
      this.updateProgress(80)
      await this.delay(400)

      const presentationItem: PresentationItem = {
        id: `song-${Date.now()}`,
        name: song.name,
        type: "song",
        source: song.source,
        slideCount: song.slideCount,
        position: this.getNextPosition(),
        thumbnail: await this.generateSongThumbnail(song),
        metadata: {
          format: "pptx",
          createdAt: new Date().toISOString(),
          originalSong: song,
        },
      }

      this.presentationItems.push(presentationItem)
      this.sortItemsByPosition()

      this.updateProgress(100)
      await this.delay(200)
      this.hideProcessing()

      this.showNotification(`"${song.name}" added to presentation`, "success")
      this.isLoadingSongs = false
    } catch (error) {
      this.hideProcessing()
      this.showNotification("Error loading song", "error")
      this.isLoadingSongs = false
    }
  }

  async onMediaUploaded(mediaItems: PresentationItem[]) {
    this.showProcessing("Processing media files...", "Loading selected files")

    try {
      for (let i = 0; i < mediaItems.length; i++) {
        const item = mediaItems[i]
        this.processingDetail = `Processing ${item.name} (${i + 1}/${mediaItems.length})`
        this.updateProgress((i / mediaItems.length) * 80)

        item.position = this.getNextPosition()
        this.presentationItems.push(item)

        await this.delay(300)
      }

      this.processingDetail = "Finalizing media upload"
      this.updateProgress(100)
      await this.delay(300)

      this.sortItemsByPosition()
      this.hideProcessing()

      const count = mediaItems.length
      this.showNotification(`${count} file${count > 1 ? "s" : ""} added to presentation`, "success")
    } catch (error) {
      this.hideProcessing()
      this.showNotification("Error processing media files", "error")
    }
  }

  onItemsReordered(items: PresentationItem[]) {
    this.presentationItems = items
    this.updatePositions()
    this.showNotification("Presentation order updated", "info")
  }

  onItemRemoved(index: number) {
    const removedItem = this.presentationItems[index]
    this.presentationItems.splice(index, 1)
    this.updatePositions()
    this.showNotification(`"${removedItem.name}" removed from presentation`, "info")
  }

  onItemPositionChanged(event: { index: number; position: number }) {
    const item = this.presentationItems[event.index]
    item.position = event.position
    this.sortItemsByPosition()
    this.showNotification(`Position of "${item.name}" updated`, "info")
  }

  openExportDialog() {
    if (this.presentationItems.length === 0) {
      this.showNotification("Add elements to your presentation first", "warning")
      return
    }
    this.showExportDialog = true
  }

  closeExportDialog() {
    this.showExportDialog = false
  }

  async onExportConfirmed(exportData: { name: string; format: string; options: any }) {
    this.showExportDialog = false
    this.showProcessing("Generating presentation...", `Creating ${exportData.name}.${exportData.format}`)

    try {
      this.updateProgress(10)
      this.processingDetail = "Initializing PowerPoint generator"
      await this.delay(800)

      this.updateProgress(25)
      this.processingDetail = "Processing song lyrics"
      await this.delay(1000)

      this.updateProgress(45)
      this.processingDetail = "Integrating media assets"
      await this.delay(1200)

      this.updateProgress(65)
      this.processingDetail = "Applying transitions and effects"
      await this.delay(800)

      this.updateProgress(80)
      this.processingDetail = "Optimizing presentation"
      await this.delay(600)

      this.updateProgress(95)
      this.processingDetail = "Finalizing export"
      await this.delay(400)

      await this.presentationService.generatePresentation(
        this.presentationItems,
        exportData.name,
        exportData.format,
        exportData.options,
      )

      this.updateProgress(100)
      await this.delay(300)
      this.hideProcessing()

      this.showNotification(`Presentation "${exportData.name}" generated successfully`, "success")
    } catch (error) {
      this.hideProcessing()
      this.showNotification("Error generating presentation", "error")
    }
  }

  private getNextPosition(): number {
    if (this.presentationItems.length === 0) return 1
    return Math.max(...this.presentationItems.map((item) => item.position || 0)) + 1
  }

  private sortItemsByPosition() {
    this.presentationItems.sort((a, b) => (a.position || 0) - (b.position || 0))
  }

  private updatePositions() {
    this.presentationItems.forEach((item, index) => {
      item.position = index + 1
    })
  }

  private async generateSongThumbnail(song: Song): Promise<string> {
    const canvas = document.createElement("canvas")
    canvas.width = 320
    canvas.height = 180
    const ctx = canvas.getContext("2d")!

    // Create gradient background
    const gradient = ctx.createLinearGradient(0, 0, 320, 180)
    if (this.isDarkMode) {
      gradient.addColorStop(0, "#4c1d95")
      gradient.addColorStop(1, "#1e1b4b")
    } else {
      gradient.addColorStop(0, "#667eea")
      gradient.addColorStop(1, "#764ba2")
    }
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, 320, 180)

    // Add song title
    ctx.fillStyle = "white"
    ctx.font = "bold 24px Arial"
    ctx.textAlign = "center"
    ctx.fillText(song.name, 160, 90)

    // Add slide count
    ctx.font = "16px Arial"
    ctx.fillText(`${song.slideCount} slides`, 160, 120)

    return canvas.toDataURL()
  }

  getTotalSlides(): number {
    return this.presentationItems.reduce((total, item) => {
      return total + (item.slideCount || 1)
    }, 0)
  }

  getEstimatedDuration(): number {
    return Math.round(
      this.presentationItems.reduce((total, item) => {
        switch (item.type) {
          case "song":
            return total + (item.slideCount || 1) * 0.5
          case "video":
            return total + (item.duration || 3)
          case "image":
            return total + 1
          default:
            return total
        }
      }, 0),
    )
  }

  private showProcessing(message: string, detail: string) {
    this.isProcessing = true
    this.processingMessage = message
    this.processingDetail = detail
    this.processingProgress = 0
  }

  private hideProcessing() {
    this.isProcessing = false
    this.processingProgress = 0
  }

  private updateProgress(progress: number) {
    this.processingProgress = progress
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  private showNotification(message: string, type: "success" | "error" | "warning" | "info" = "info") {
    const notification = document.createElement("div")
    notification.className = `notification notification-${type} ${this.isDarkMode ? "dark-mode" : ""}`
    notification.innerHTML = `
      <div class="notification-content">
        <span class="notification-icon">${this.getNotificationIcon(type)}</span>
        <span class="notification-message">${message}</span>
      </div>
    `
    document.body.appendChild(notification)

    setTimeout(() => {
      notification.classList.add("notification-show")
    }, 100)

    setTimeout(() => {
      notification.classList.remove("notification-show")
      setTimeout(() => notification.remove(), 300)
    }, 3000)
  }

  private getNotificationIcon(type: string): string {
    switch (type) {
      case "success":
        return "✅"
      case "error":
        return "❌"
      case "warning":
        return "⚠️"
      case "info":
        return "ℹ️"
      default:
        return "ℹ️"
    }
  }
}
