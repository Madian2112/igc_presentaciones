import { Component, Output, EventEmitter } from "@angular/core"

import type { PresentationItem } from "../../models/presentation.model"

@Component({
  selector: "app-media-uploader",
  standalone: true,
  imports: [],
  template: `
    <div class="media-uploader">
      <div class="uploader-header">
        <div class="header-title">
          <h3>📁 Carga de Multimedia</h3>
          <p>Sube videos e imágenes desde tu computadora</p>
        </div>
        @if (uploadedFiles.length > 0) {
          <div class="media-stats">
            <div class="stat-badge">
              <span class="stat-number">{{ getVideoCount() }}</span>
              <span class="stat-label">Videos</span>
            </div>
            <div class="stat-badge">
              <span class="stat-number">{{ getImageCount() }}</span>
              <span class="stat-label">Imágenes</span>
            </div>
          </div>
        }
      </div>
    
      <div class="media-tabs">
        <button
          class="tab-button"
          [class.active]="activeTab === 'video'"
          (click)="setActiveTab('video')">
          <span class="tab-icon">🎬</span>
          Videos
        </button>
        <button
          class="tab-button"
          [class.active]="activeTab === 'image'"
          (click)="setActiveTab('image')">
          <span class="tab-icon">🖼️</span>
          Imágenes
        </button>
      </div>
    
      <div class="upload-area"
        [class.dragover]="isDragOver"
        (click)="triggerFileInput()"
        (dragover)="onDragOver($event)"
        (dragleave)="onDragLeave($event)"
        (drop)="onDrop($event)">
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
            {{ activeTab === 'video' ?
            'Formatos soportados: MP4, AVI, MOV, WMV, MKV' :
            'Formatos soportados: JPG, PNG, GIF, BMP, WEBP' }}
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
        <div class="uploaded-files">
          <div class="files-header">
            <h4>{{ activeTab === 'video' ? 'Videos' : 'Imágenes' }} cargados ({{ getFilteredFiles().length }})</h4>
            <div class="header-actions">
              <button class="select-all-btn" (click)="selectAllFiles()">
                {{ allFilesSelected() ? 'Deseleccionar Todo' : 'Seleccionar Todo' }}
              </button>
              <button class="clear-files-btn" (click)="clearFiles()">
                Limpiar {{ activeTab === 'video' ? 'Videos' : 'Imágenes' }}
              </button>
            </div>
          </div>
          <div class="files-grid">
            @for (file of getFilteredFiles(); track trackByFile($index, file)) {
              <div
                class="file-card"
                [class.selected]="selectedFiles.has(file.id)"
                (click)="toggleFileSelection(file)">
                <div class="file-preview">
                  <div class="file-thumbnail" [class.video-thumbnail]="file.type === 'video'">
                    @if (file.type === 'image' && file.thumbnail) {
                      <img
                        [src]="file.thumbnail"
                        [alt]="file.name"
                        class="thumbnail-image">
                    }
                    @if (!file.thumbnail || file.type === 'video') {
                      <span class="file-icon">
                        {{ file.type === 'video' ? '🎬' : '🖼️' }}
                      </span>
                    }
                    <div class="file-overlay">
                      <button class="preview-file-btn" (click)="previewFile(file, $event)" title="Vista previa">
                        👁️
                      </button>
                      <button class="add-file-btn" (click)="addSingleFile(file, $event)" title="Agregar">
                        +
                      </button>
                    </div>
                    @if (selectedFiles.has(file.id)) {
                      <div class="selection-indicator">
                        ✓
                      </div>
                    }
                  </div>
                </div>
                <div class="file-info">
                  <span class="file-name" [title]="file.name">{{ truncateFileName(file.name) }}</span>
                  <div class="file-metadata">
                    <span class="file-size">{{ formatFileSize(file.size || 0) }}</span>
                    <span class="file-type">{{ getFileExtension(file.name) }}</span>
                  </div>
                  @if (file.metadata?.width && file.metadata?.height) {
                    <div class="file-dimensions">
                      {{ file.metadata?.width }}×{{ file.metadata?.height }}
                    </div>
                  }
                  @if (file.type === 'video' && file.duration) {
                    <div class="file-duration">
                      ⏱️ {{ formatDuration(file.duration) }}
                    </div>
                  }
                </div>
              </div>
            }
          </div>
          @if (selectedFiles.size > 0) {
            <div class="bulk-actions">
              <div class="selection-info">
                <span class="selection-count">{{ selectedFiles.size }} archivo(s) seleccionado(s)</span>
                <span class="selection-size">{{ getTotalSelectedSize() }}</span>
              </div>
              <div class="action-buttons">
                <button class="bulk-add-btn" (click)="addSelectedFiles()">
                  <span class="btn-icon">📤</span>
                  Agregar Seleccionados
                </button>
                <button class="clear-selection-btn" (click)="clearSelection()">
                  Limpiar Selección
                </button>
              </div>
            </div>
          }
        </div>
      }
    
      @if (uploadedFiles.length === 0) {
        <div class="empty-state">
          <div class="empty-icon">📁</div>
          <h4>No hay archivos cargados</h4>
          <p>Comienza subiendo {{ activeTab === 'video' ? 'videos' : 'imágenes' }} desde tu computadora</p>
          <div class="upload-tips">
            <div class="tip-item">
              <span class="tip-icon">💡</span>
              <span>Puedes arrastrar múltiples archivos a la vez</span>
            </div>
            <div class="tip-item">
              <span class="tip-icon">⚡</span>
              <span>Los archivos se procesan automáticamente</span>
            </div>
          </div>
        </div>
      }
    
      <!-- File Preview Modal -->
      @if (previewingFile) {
        <div class="preview-modal" (click)="closeFilePreview()">
          <div class="preview-content" (click)="$event.stopPropagation()">
            <div class="preview-header">
              <div class="preview-title">
                <h3>{{ previewingFile.name }}</h3>
                <div class="preview-metadata">
                  <span class="metadata-item">{{ formatFileSize(previewingFile.size || 0) }}</span>
                  @if (previewingFile.metadata?.width && previewingFile.metadata?.height) {
                    <span class="metadata-item">
                      {{ previewingFile.metadata?.width }}×{{ previewingFile.metadata?.height }}
                    </span>
                  }
                  @if (previewingFile.type === 'video' && previewingFile.duration) {
                    <span class="metadata-item">
                      {{ formatDuration(previewingFile.duration) }}
                    </span>
                  }
                </div>
              </div>
              <button class="close-preview-btn" (click)="closeFilePreview()">×</button>
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
                <span class="btn-icon">📤</span>
                Agregar a Presentación
              </button>
            </div>
          </div>
        </div>
      }
    
      <!-- Processing Overlay -->
      @if (isProcessing) {
        <div class="processing-overlay">
          <div class="processing-content">
            <div class="processing-spinner"></div>
            <h4>{{ processingMessage }}</h4>
            <p>{{ processingDetail }}</p>
            <div class="processing-progress">
              <div class="progress-bar">
                <div class="progress-fill" [style.width.%]="processingProgress"></div>
              </div>
              <span class="progress-text">{{ processingProgress }}%</span>
            </div>
          </div>
        </div>
      }
    </div>
    `,
  styleUrls: ["./media-uploader.component.css"],
})
export class MediaUploaderComponent {
  @Output() mediaUploaded = new EventEmitter<PresentationItem[]>()

  activeTab: "video" | "image" = "video"
  uploadedFiles: PresentationItem[] = []
  selectedFiles = new Set<string>()
  isDragOver = false
  previewingFile: PresentationItem | null = null
  isProcessing = false
  processingMessage = ""
  processingDetail = ""
  processingProgress = 0

  setActiveTab(tab: "video" | "image") {
    this.activeTab = tab
    this.clearSelection()
  }

  getFilteredFiles(): PresentationItem[] {
    return this.uploadedFiles.filter((file) => file.type === this.activeTab)
  }

  getVideoCount(): number {
    return this.uploadedFiles.filter((file) => file.type === "video").length
  }

  getImageCount(): number {
    return this.uploadedFiles.filter((file) => file.type === "image").length
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
    event.target.value = ""
  }

  private async processFiles(files: File[]) {
    const validFiles = files.filter((file) => {
      if (this.activeTab === "video") {
        return file.type.startsWith("video/")
      } else {
        return file.type.startsWith("image/")
      }
    })

    if (validFiles.length === 0) {
      this.showNotification("No se encontraron archivos válidos", "warning")
      return
    }

    this.isProcessing = true
    this.processingMessage = "Procesando archivos..."
    this.processingProgress = 0

    try {
      for (let i = 0; i < validFiles.length; i++) {
        const file = validFiles[i]
        this.processingDetail = `Procesando ${file.name} (${i + 1}/${validFiles.length})`
        this.processingProgress = Math.round((i / validFiles.length) * 80)

        const item: PresentationItem = {
          id: `${this.activeTab}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: file.name,
          type: this.activeTab,
          source: URL.createObjectURL(file),
          size: file.size,
          metadata: {
            format: file.type,
            createdAt: new Date().toISOString(),
          },
        }

        // Generate thumbnail and metadata
        if (this.activeTab === "image") {
          await this.processImage(file, item)
        } else {
          await this.processVideo(file, item)
        }

        this.uploadedFiles.push(item)
        await this.delay(200) // Simulate processing time
      }

      this.processingDetail = "Finalizando procesamiento..."
      this.processingProgress = 100
      await this.delay(300)

      this.showNotification(`${validFiles.length} archivo(s) procesado(s) correctamente`, "success")
    } catch (error) {
      this.showNotification("Error al procesar archivos", "error")
    } finally {
      this.isProcessing = false
    }

    if (files.length > validFiles.length) {
      this.showNotification(`${files.length - validFiles.length} archivo(s) no válido(s) ignorado(s)`, "warning")
    }
  }

  private async processImage(file: File, item: PresentationItem): Promise<void> {
    return new Promise((resolve) => {
      const img = new Image()
      img.onload = () => {
        item.metadata = {
          ...item.metadata,
          width: img.width,
          height: img.height,
        }
        item.thumbnail = item.source
        resolve()
      }
      img.onerror = () => resolve()
      img.src = item.source
    })
  }

  private async processVideo(file: File, item: PresentationItem): Promise<void> {
    return new Promise((resolve) => {
      const video = document.createElement("video")
      video.onloadedmetadata = () => {
        item.metadata = {
          ...item.metadata,
          width: video.videoWidth,
          height: video.videoHeight,
        }
        item.duration = Math.round((video.duration / 60) * 10) / 10 // Convert to minutes
        resolve()
      }
      video.onerror = () => resolve()
      video.src = item.source
    })
  }

  toggleFileSelection(file: PresentationItem) {
    if (this.selectedFiles.has(file.id)) {
      this.selectedFiles.delete(file.id)
    } else {
      this.selectedFiles.add(file.id)
    }
  }

  selectAllFiles() {
    const filteredFiles = this.getFilteredFiles()
    if (this.allFilesSelected()) {
      this.clearSelection()
    } else {
      filteredFiles.forEach((file) => this.selectedFiles.add(file.id))
    }
  }

  allFilesSelected(): boolean {
    const filteredFiles = this.getFilteredFiles()
    return filteredFiles.length > 0 && filteredFiles.every((file) => this.selectedFiles.has(file.id))
  }

  clearSelection() {
    this.selectedFiles.clear()
  }

  addSelectedFiles() {
    const selectedItems = this.uploadedFiles.filter((file) => this.selectedFiles.has(file.id))
    if (selectedItems.length > 0) {
      this.mediaUploaded.emit([...selectedItems])
      this.clearSelection()
      this.showNotification(`${selectedItems.length} archivo(s) agregado(s) a la presentación`, "success")
    }
  }

  addSingleFile(file: PresentationItem, event: Event) {
    event.stopPropagation()
    this.mediaUploaded.emit([file])
    this.showNotification(`"${this.truncateFileName(file.name)}" agregado a la presentación`, "success")
  }

  previewFile(file: PresentationItem, event: Event) {
    event.stopPropagation()
    this.previewingFile = file
  }

  closeFilePreview() {
    this.previewingFile = null
  }

  addFromPreview() {
    if (this.previewingFile) {
      this.addSingleFile(this.previewingFile, new Event("click"))
      this.closeFilePreview()
    }
  }

  clearFiles() {
    const filteredFiles = this.getFilteredFiles()

    // Remove from uploaded files
    this.uploadedFiles = this.uploadedFiles.filter((file) => file.type !== this.activeTab)

    // Revoke blob URLs to free memory
    filteredFiles.forEach((file) => {
      if (file.source.startsWith("blob:")) {
        URL.revokeObjectURL(file.source)
      }
    })

    this.clearSelection()
    this.showNotification(`${this.activeTab === "video" ? "Videos" : "Imágenes"} eliminados`, "info")
  }

  getTotalSelectedSize(): string {
    const totalBytes = Array.from(this.selectedFiles)
      .map((id) => this.uploadedFiles.find((file) => file.id === id))
      .filter((file) => file)
      .reduce((total, file) => total + (file!.size || 0), 0)

    return this.formatFileSize(totalBytes)
  }

  truncateFileName(name: string, maxLength = 25): string {
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

  formatDuration(minutes: number): string {
    const mins = Math.floor(minutes)
    const secs = Math.round((minutes - mins) * 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  getFileExtension(filename: string): string {
    return filename.split(".").pop()?.toUpperCase() || ""
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  private showNotification(message: string, type: "success" | "error" | "warning" | "info" = "info") {
    // This would typically use a notification service
    console.log(`${type.toUpperCase()}: ${message}`)
  }
}
