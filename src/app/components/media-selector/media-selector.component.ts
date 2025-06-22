import { Component, EventEmitter, Output } from "@angular/core"

import type { PresentationItem } from "../../models/presentation-item.model"

@Component({
  selector: "app-media-selector",
  standalone: true,
  imports: [],
  template: `
    <div class="media-selector">
      <div class="selector-header">
        <div class="header-title">
          <div class="header-icon">🎬</div>
          <div>
            <h3>Videos e Imágenes</h3>
            <p>Agrega contenido multimedia a tu presentación</p>
          </div>
        </div>
      </div>
    
      <div class="media-tabs">
        <button
          class="tab-btn"
          [class.active]="activeTab === 'video'"
          (click)="setActiveTab('video')">
          <span class="tab-icon">🎬</span>
          Videos ({{ getVideoCount() }})
        </button>
        <button
          class="tab-btn"
          [class.active]="activeTab === 'image'"
          (click)="setActiveTab('image')">
          <span class="tab-icon">🖼️</span>
          Imágenes ({{ getImageCount() }})
        </button>
      </div>
    
      <div class="file-upload-area" (click)="triggerFileInput()" [class.dragover]="isDragOver"
        (dragover)="onDragOver($event)" (dragleave)="onDragLeave($event)" (drop)="onDrop($event)">
        <div class="upload-content">
          <div class="upload-icon">
            @if (activeTab === 'video') {
              <span>🎬</span>
            }
            @if (activeTab === 'image') {
              <span>🖼️</span>
            }
          </div>
          <h4>Arrastra archivos aquí o haz clic para seleccionar</h4>
          <p class="upload-hint">
            {{ activeTab === 'video' ? 'Formatos soportados: MP4, AVI, MOV, WMV' : 'Formatos soportados: JPG, PNG, GIF, BMP' }}
          </p>
          <div class="upload-button">
            <span>Seleccionar {{ activeTab === 'video' ? 'Videos' : 'Imágenes' }}</span>
          </div>
        </div>
      </div>
    
      <input
        #fileInput
        type="file"
        [accept]="activeTab === 'video' ? 'video/*' : 'image/*'"
        multiple
        (change)="onFilesSelected($event)"
        style="display: none;">
    
      @if (getFilteredFiles().length > 0) {
        <div class="selected-files">
          <div class="files-header">
            <h4>{{ activeTab === 'video' ? 'Videos' : 'Imágenes' }} cargados ({{ getFilteredFiles().length }})</h4>
            <button class="clear-files-btn" (click)="clearFiles()">Limpiar</button>
          </div>
          <div class="files-grid">
            @for (file of getFilteredFiles(); track trackByFile($index, file)) {
              <div
                class="file-card"
                [class.selected]="selectedFileIds.has(file.id)"
                (click)="toggleFileSelection(file)">
                <div class="file-preview">
                  <div class="file-thumbnail" [class.video-thumbnail]="file.type === 'video'">
                    @if (file.type === 'image' && file.thumbnail) {
                      <img
                        [src]="file.thumbnail"
                        [alt]="file.name"
                        class="thumbnail-image">
                    }
                    @if (!file.thumbnail) {
                      <span class="file-icon">
                        {{ file.type === 'video' ? '🎬' : '🖼️' }}
                      </span>
                    }
                    <div class="file-overlay">
                      <div class="overlay-content">
                        <button class="preview-btn" (click)="previewFile(file, $event)" title="Vista previa">
                          👁️
                        </button>
                        <button class="add-btn" (click)="addToPresentation(file, $event)" title="Agregar">
                          +
                        </button>
                      </div>
                    </div>
                    @if (selectedFileIds.has(file.id)) {
                      <div class="selection-indicator">
                        ✓
                      </div>
                    }
                  </div>
                </div>
                <div class="file-info">
                  <span class="file-name" [title]="file.name">{{ truncateFileName(file.name) }}</span>
                  <div class="file-meta">
                    <span class="file-size">{{ formatFileSize(file.size || 0) }}</span>
                    <span class="file-type-badge">{{ getFileExtension(file.name) }}</span>
                  </div>
                  @if (file.metadata?.width && file.metadata?.height) {
                    <div class="file-dimensions">
                      {{ file.metadata?.width }}×{{ file.metadata?.height }}
                    </div>
                  }
                </div>
              </div>
            }
          </div>
          @if (selectedFileIds.size > 0) {
            <div class="bulk-actions">
              <div class="selection-info">
                {{ selectedFileIds.size }} archivo(s) seleccionado(s)
              </div>
              <div class="bulk-buttons">
                <button class="bulk-add-btn" (click)="addSelectedToPresentation()">
                  Agregar Seleccionados
                </button>
                <button class="bulk-clear-btn" (click)="clearSelection()">
                  Limpiar Selección
                </button>
              </div>
            </div>
          }
        </div>
      }
    
      @if (selectedFiles.length === 0) {
        <div class="empty-media-state">
          <div class="empty-icon">📁</div>
          <h4>No hay archivos cargados</h4>
          <p>Comienza agregando {{ activeTab === 'video' ? 'videos' : 'imágenes' }} a tu biblioteca</p>
        </div>
      }
    
      <!-- Preview Modal -->
      @if (previewingFile) {
        <div class="preview-modal" (click)="closePreview()">
          <div class="preview-content" (click)="$event.stopPropagation()">
            <div class="preview-header">
              <h3>{{ previewingFile.name }}</h3>
              <button class="close-btn" (click)="closePreview()">×</button>
            </div>
            <div class="preview-body">
              @if (previewingFile.type === 'image') {
                <img
                  [src]="previewingFile.source"
                  [alt]="previewingFile.name"
                  class="preview-image">
              }
              @if (previewingFile.type === 'video') {
                <video
                  [src]="previewingFile.source"
                  controls
                  class="preview-video">
                </video>
              }
            </div>
            <div class="preview-actions">
              <button class="add-from-preview-btn" (click)="addFromPreview()">
                Agregar a Presentación
              </button>
            </div>
          </div>
        </div>
      }
    </div>
    `,
  styleUrls: ["./media-selector.component.css"],
})
export class MediaSelectorComponent {
  @Output() mediaSelected = new EventEmitter<PresentationItem>()

  activeTab: "video" | "image" = "video"
  selectedFiles: (PresentationItem & { size?: number })[] = []
  selectedFileIds = new Set<string>()
  isDragOver = false
  previewingFile: PresentationItem | null = null

  setActiveTab(tab: "video" | "image") {
    this.activeTab = tab
    this.clearSelection()
  }

  getFilteredFiles() {
    return this.selectedFiles.filter((file) => file.type === this.activeTab)
  }

  getVideoCount(): number {
    return this.selectedFiles.filter((file) => file.type === "video").length
  }

  getImageCount(): number {
    return this.selectedFiles.filter((file) => file.type === "image").length
  }

  trackByFile(index: number, file: PresentationItem): string {
    return file.id
  }

  triggerFileInput() {
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    fileInput.click()
  }

  onDragOver(event: DragEvent) {
    event.preventDefault()
    this.isDragOver = true
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault()
    this.isDragOver = false
  }

  onDrop(event: DragEvent) {
    event.preventDefault()
    this.isDragOver = false

    const files = Array.from(event.dataTransfer?.files || [])
    this.processFiles(files)
  }

  onFilesSelected(event: any) {
    const files = Array.from(event.target.files) as File[]
    this.processFiles(files)

    // Reset input
    event.target.value = ""
  }

  private processFiles(files: File[]) {
    const validFiles = files.filter((file) => {
      if (this.activeTab === "video") {
        return file.type.startsWith("video/")
      } else {
        return file.type.startsWith("image/")
      }
    })

    validFiles.forEach((file) => {
      const item: PresentationItem & { size?: number } = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        name: file.name,
        type: this.activeTab,
        source: URL.createObjectURL(file),
        size: file.size,
        duration: this.activeTab === "video" ? this.estimateVideoDuration(file) : undefined,
        metadata: {
          format: file.type,
          createdAt: new Date().toISOString(),
        },
      }

      // Generate thumbnail for images
      if (this.activeTab === "image") {
        this.generateImageThumbnail(file, item)
      }

      // Get video metadata
      if (this.activeTab === "video") {
        this.getVideoMetadata(file, item)
      }

      this.selectedFiles.push(item)
    })

    if (validFiles.length > 0) {
      this.showNotification(`${validFiles.length} archivo(s) cargado(s)`)
    }

    if (files.length > validFiles.length) {
      this.showNotification(`${files.length - validFiles.length} archivo(s) no válido(s) ignorado(s)`, "warning")
    }
  }

  private generateImageThumbnail(file: File, item: PresentationItem) {
    const img = new Image()
    img.onload = () => {
      item.metadata = {
        ...item.metadata,
        width: img.width,
        height: img.height,
      }
      item.thumbnail = item.source
    }
    img.src = item.source!
  }

  private getVideoMetadata(file: File, item: PresentationItem) {
    const video = document.createElement("video")
    video.onloadedmetadata = () => {
      item.metadata = {
        ...item.metadata,
        width: video.videoWidth,
        height: video.videoHeight,
      }
      item.duration = Math.round((video.duration / 60) * 10) / 10 // Convert to minutes
    }
    video.src = item.source!
  }

  private estimateVideoDuration(file: File): number {
    // Estimate based on file size (rough approximation)
    const sizeInMB = file.size / (1024 * 1024)
    return Math.max(1, Math.round(sizeInMB / 10)) // Rough estimate: 10MB per minute
  }

  toggleFileSelection(file: PresentationItem) {
    if (this.selectedFileIds.has(file.id)) {
      this.selectedFileIds.delete(file.id)
    } else {
      this.selectedFileIds.add(file.id)
    }
  }

  clearSelection() {
    this.selectedFileIds.clear()
  }

  addSelectedToPresentation() {
    const selectedFiles = this.selectedFiles.filter((file) => this.selectedFileIds.has(file.id))
    selectedFiles.forEach((file) => {
      this.mediaSelected.emit({ ...file })
    })
    this.showNotification(`${selectedFiles.length} archivo(s) agregado(s) a la presentación`)
    this.clearSelection()
  }

  addToPresentation(file: PresentationItem, event?: Event) {
    if (event) {
      event.stopPropagation()
    }

    this.mediaSelected.emit({ ...file })
    this.showNotification(`"${this.truncateFileName(file.name)}" agregado a la presentación`)
  }

  previewFile(file: PresentationItem, event: Event) {
    event.stopPropagation()
    this.previewingFile = file
  }

  closePreview() {
    this.previewingFile = null
  }

  addFromPreview() {
    if (this.previewingFile) {
      this.addToPresentation(this.previewingFile)
      this.closePreview()
    }
  }

  clearFiles() {
    const filteredFiles = this.getFilteredFiles()
    this.selectedFiles = this.selectedFiles.filter((file) => file.type !== this.activeTab)

    // Liberar URLs de objeto
    filteredFiles.forEach((file) => {
      if (file.source?.startsWith("blob:")) {
        URL.revokeObjectURL(file.source)
      }
    })

    this.clearSelection()
    this.showNotification(`${this.activeTab === "video" ? "Videos" : "Imágenes"} eliminados`)
  }

  truncateFileName(name: string, maxLength = 20): string {
    if (name.length <= maxLength) return name
    const extension = name.split(".").pop()
    const nameWithoutExt = name.substring(0, name.lastIndexOf("."))
    const truncated = nameWithoutExt.substring(0, maxLength - extension!.length - 4)
    return `${truncated}...${extension}`
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return "0 B"
    const k = 1024
    const sizes = ["B", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i]
  }

  getFileExtension(filename: string): string {
    return filename.split(".").pop()?.toUpperCase() || ""
  }

  private showNotification(message: string, type: "success" | "warning" = "success") {
    const notification = document.createElement("div")
    notification.className = `mini-notification ${type}`
    notification.textContent = message
    document.body.appendChild(notification)

    setTimeout(() => notification.remove(), 2000)
  }
}
