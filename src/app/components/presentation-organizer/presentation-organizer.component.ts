import { Component, Input, Output, EventEmitter } from "@angular/core"

import { FormsModule } from "@angular/forms"
import type { PresentationItem } from "../../models/presentation.model"

@Component({
  selector: "app-presentation-organizer",
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="presentation-organizer">
      <div class="organizer-header">
        <div class="header-title">
          <h3>📋 Organización de Presentación</h3>
          <p>Arrastra y ordena todos los elementos de tu presentación</p>
        </div>
        @if (items.length > 0) {
          <div class="organizer-stats">
            <div class="stat-item">
              <span class="stat-icon">📊</span>
              <span class="stat-text">{{ getTotalSlides() }} diapositivas</span>
            </div>
            <div class="stat-item">
              <span class="stat-icon">⏱️</span>
              <span class="stat-text">~{{ getEstimatedDuration() }} min</span>
            </div>
          </div>
        }
      </div>
    
      @if (items.length > 0) {
        <div class="presentation-content">
          <div class="content-summary">
            <div class="summary-cards">
              <div class="summary-card songs">
                <div class="card-icon">🎵</div>
                <div class="card-info">
                  <span class="card-number">{{ getSongCount() }}</span>
                  <span class="card-label">Canciones</span>
                </div>
              </div>
              <div class="summary-card videos">
                <div class="card-icon">🎬</div>
                <div class="card-info">
                  <span class="card-number">{{ getVideoCount() }}</span>
                  <span class="card-label">Videos</span>
                </div>
              </div>
              <div class="summary-card images">
                <div class="card-icon">🖼️</div>
                <div class="card-info">
                  <span class="card-number">{{ getImageCount() }}</span>
                  <span class="card-label">Imágenes</span>
                </div>
              </div>
            </div>
          </div>
          <div class="items-container">
            <div class="container-header">
              <h4>Elementos de la Presentación</h4>
              <div class="container-actions">
                <button class="compact-view-btn"
                  [class.active]="isCompactView"
                  (click)="toggleCompactView()"
                  title="Vista compacta">
                  ⊞
                </button>
                <button class="clear-all-btn" (click)="clearAllItems()" title="Limpiar todo">
                  🗑️
                </button>
              </div>
            </div>
            <div class="items-list" [class.compact]="isCompactView">
              @for (item of items; track trackByItem(i, item); let i = $index) {
                <div
                  class="presentation-item"
                  [class.dragging]="draggedIndex === i"
                  [class.drag-over]="dragOverIndex === i"
                  [class.compact]="isCompactView"
                  draggable="true"
                  (dragstart)="onDragStart(i, $event)"
                  (dragover)="onDragOver($event, i)"
                  (dragleave)="onDragLeave($event)"
                  (drop)="onDrop($event, i)"
                  (dragend)="onDragEnd()">
                  <div class="item-handle">
                    <span class="handle-icon">⋮⋮</span>
                  </div>
                  <div class="item-preview">
                    <div class="item-thumbnail" [class]="'thumbnail-' + item.type">
                      @if (item.thumbnail) {
                        <img
                          [src]="item.thumbnail"
                          [alt]="item.name"
                          class="thumbnail-image">
                      }
                      @if (!item.thumbnail) {
                        <span class="item-type-icon">
                          {{ getTypeIcon(item.type) }}
                        </span>
                      }
                    </div>
                  </div>
                  <div class="item-content">
                    <div class="item-header">
                      <h5 class="item-name">{{ item.name }}</h5>
                      <div class="item-badges">
                        <span class="type-badge" [class]="'badge-' + item.type">
                          {{ getTypeName(item.type) }}
                        </span>
                        @if (item.slideCount && item.slideCount > 1) {
                          <span class="slides-badge">
                            {{ item.slideCount }} slides
                          </span>
                        }
                      </div>
                    </div>
                    @if (!isCompactView) {
                      <div class="item-details">
                        <div class="detail-row">
                          <span class="detail-label">Fuente:</span>
                          <span class="detail-value">{{ getSourceDisplay(item.source) }}</span>
                        </div>
                        @if (item.metadata?.width && item.metadata?.height) {
                          <div class="detail-row">
                            <span class="detail-label">Dimensiones:</span>
                            <span class="detail-value">{{ item.metadata?.width }}×{{ item.metadata?.height }}</span>
                          </div>
                        }
                        @if (item.duration) {
                          <div class="detail-row">
                            <span class="detail-label">Duración:</span>
                            <span class="detail-value">{{ formatDuration(item.duration) }}</span>
                          </div>
                        }
                        @if (item.size) {
                          <div class="detail-row">
                            <span class="detail-label">Tamaño:</span>
                            <span class="detail-value">{{ formatFileSize(item.size) }}</span>
                          </div>
                        }
                      </div>
                    }
                  </div>
                  <div class="item-controls">
                    <div class="position-control">
                      <label class="position-label">Posición:</label>
                      <input
                        type="number"
                        class="position-input"
                        [value]="item.position || (i + 1)"
                        (change)="onPositionChange(i, $event)"
                        min="1"
                        [max]="items.length">
                    </div>
                    @if (!isCompactView) {
                      <div class="slide-position">
                        <span class="position-label">Diapositivas:</span>
                        <span class="position-range">{{ getSlideRange(i) }}</span>
                      </div>
                    }
                  </div>
                  <div class="item-actions">
                    <button class="preview-item-btn"
                      (click)="previewItem(item)"
                      title="Vista previa">
                      👁️
                    </button>
                    <button class="move-up-btn"
                      (click)="moveItemUp(i)"
                      [disabled]="i === 0"
                      title="Mover arriba">
                      ↑
                    </button>
                    <button class="move-down-btn"
                      (click)="moveItemDown(i)"
                      [disabled]="i === items.length - 1"
                      title="Mover abajo">
                      ↓
                    </button>
                    <button class="remove-item-btn"
                      (click)="removeItem(i)"
                      title="Eliminar">
                      ×
                    </button>
                  </div>
                </div>
              }
            </div>
          </div>
          <div class="organizer-actions">
            <button class="preview-all-btn" (click)="previewAllItems()">
              <span class="btn-icon">👁️</span>
              Vista Previa Completa
            </button>
            <button class="save-order-btn" (click)="saveCurrentOrder()">
              <span class="btn-icon">💾</span>
              Guardar Orden
            </button>
            @if (hasSavedOrder()) {
              <button class="load-order-btn" (click)="loadSavedOrder()">
                <span class="btn-icon">📂</span>
                Cargar Orden Guardado
              </button>
            }
          </div>
        </div>
      }
    
      @if (items.length === 0) {
        <div class="empty-organizer">
          <div class="empty-animation">
            <div class="empty-icon">📋</div>
            <div class="empty-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
          <h4>No hay elementos en la presentación</h4>
          <p>Agrega canciones, videos o imágenes para comenzar a organizar tu presentación.</p>
          <div class="empty-suggestions">
            <div class="suggestion-card">
              <span class="suggestion-icon">🎵</span>
              <span class="suggestion-text">Busca y selecciona letras de canciones</span>
            </div>
            <div class="suggestion-card">
              <span class="suggestion-icon">📁</span>
              <span class="suggestion-text">Sube videos e imágenes desde tu computadora</span>
            </div>
            <div class="suggestion-card">
              <span class="suggestion-icon">📋</span>
              <span class="suggestion-text">Organiza y ordena todos los elementos</span>
            </div>
          </div>
        </div>
      }
    
      <!-- Item Preview Modal -->
      @if (previewingItem) {
        <div class="item-preview-modal" (click)="closeItemPreview()">
          <div class="preview-modal-content" (click)="$event.stopPropagation()">
            <div class="preview-modal-header">
              <div class="preview-modal-title">
                <h3>{{ previewingItem.name }}</h3>
                <span class="preview-type-badge" [class]="'badge-' + previewingItem.type">
                  {{ getTypeName(previewingItem.type) }}
                </span>
              </div>
              <button class="close-preview-btn" (click)="closeItemPreview()">×</button>
            </div>
            <div class="preview-modal-body">
              <!-- Song Preview -->
              @if (previewingItem.type === 'song') {
                <div class="song-preview">
                  @if (previewingItem.metadata?.originalSong?.lyrics) {
                    <div class="song-slides">
                      @for (slide of previewingItem.metadata?.originalSong?.lyrics; track slide; let i = $index) {
                        <div class="slide-preview"
                          >
                          <div class="slide-number">Diapositiva {{ i + 1 }}</div>
                          <div class="slide-content">{{ slide }}</div>
                        </div>
                      }
                    </div>
                  }
                  @if (!previewingItem.metadata?.originalSong?.lyrics) {
                    <div class="no-lyrics">
                      <p>Vista previa de letras no disponible</p>
                    </div>
                  }
                </div>
              }
              <!-- Image Preview -->
              @if (previewingItem.type === 'image') {
                <div class="image-preview">
                  <img [src]="previewingItem.source"
                    [alt]="previewingItem.name"
                    class="preview-image">
                </div>
              }
              <!-- Video Preview -->
              @if (previewingItem.type === 'video') {
                <div class="video-preview">
                  <video [src]="previewingItem.source"
                    controls
                    class="preview-video">
                  </video>
                </div>
              }
            </div>
          </div>
        </div>
      }
    </div>
    `,
  styleUrls: ["./presentation-organizer.component.css"],
})
export class PresentationOrganizerComponent {
  @Input() items: PresentationItem[] = []
  @Output() itemsReordered = new EventEmitter<PresentationItem[]>()
  @Output() itemRemoved = new EventEmitter<number>()
  @Output() itemPositionChanged = new EventEmitter<{ index: number; position: number }>()

  draggedIndex: number | null = null
  dragOverIndex: number | null = null
  previewingItem: PresentationItem | null = null
  isCompactView = false

  trackByItem(index: number, item: PresentationItem): string {
    return item.id
  }

  getTotalSlides(): number {
    return this.items.reduce((total, item) => {
      return total + (item.slideCount || 1)
    }, 0)
  }

  getEstimatedDuration(): number {
    return Math.round(
      this.items.reduce((total, item) => {
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

  getSongCount(): number {
    return this.items.filter((item) => item.type === "song").length
  }

  getVideoCount(): number {
    return this.items.filter((item) => item.type === "video").length
  }

  getImageCount(): number {
    return this.items.filter((item) => item.type === "image").length
  }

  getTypeIcon(type: string): string {
    switch (type) {
      case "song":
        return "🎵"
      case "video":
        return "🎬"
      case "image":
        return "🖼️"
      default:
        return "📄"
    }
  }

  getTypeName(type: string): string {
    switch (type) {
      case "song":
        return "Canción"
      case "video":
        return "Video"
      case "image":
        return "Imagen"
      default:
        return "Archivo"
    }
  }

  getSourceDisplay(source: string): string {
    if (source.startsWith("Public/letras/")) {
      return source
    }
    if (source.startsWith("blob:")) {
      return "Archivo local"
    }
    return source.length > 40 ? source.substring(0, 40) + "..." : source
  }

  getSlideRange(index: number): string {
    let startSlide = 1
    for (let i = 0; i < index; i++) {
      startSlide += this.items[i].slideCount || 1
    }

    const currentItem = this.items[index]
    const slideCount = currentItem.slideCount || 1

    if (slideCount === 1) {
      return startSlide.toString()
    } else {
      return `${startSlide}-${startSlide + slideCount - 1}`
    }
  }

  formatDuration(minutes: number): string {
    const mins = Math.floor(minutes)
    const secs = Math.round((minutes - mins) * 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return "0 B"
    const k = 1024
    const sizes = ["B", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i]
  }

  toggleCompactView() {
    this.isCompactView = !this.isCompactView
  }

  onPositionChange(index: number, event: any) {
    const newPosition = Number.parseInt(event.target.value)
    if (newPosition >= 1 && newPosition <= this.items.length) {
      this.itemPositionChanged.emit({ index, position: newPosition })
    }
  }

  onDragStart(index: number, event: DragEvent) {
    this.draggedIndex = index
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = "move"
      event.dataTransfer.setData("text/html", "")
    }
  }

  onDragOver(event: DragEvent, index: number) {
    event.preventDefault()
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = "move"
    }
    this.dragOverIndex = index
  }

  onDragLeave(event: DragEvent) {
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
    const x = event.clientX
    const y = event.clientY

    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      this.dragOverIndex = null
    }
  }

  onDrop(event: DragEvent, dropIndex: number) {
    event.preventDefault()
    this.dragOverIndex = null

    if (this.draggedIndex !== null && this.draggedIndex !== dropIndex) {
      const newItems = [...this.items]
      const draggedItem = newItems.splice(this.draggedIndex, 1)[0]
      newItems.splice(dropIndex, 0, draggedItem)

      this.itemsReordered.emit(newItems)
      this.showNotification(`"${draggedItem.name}" movido a la posición ${dropIndex + 1}`)
    }
  }

  onDragEnd() {
    this.draggedIndex = null
    this.dragOverIndex = null
  }

  moveItemUp(index: number) {
    if (index > 0) {
      const newItems = [...this.items]
      const item = newItems.splice(index, 1)[0]
      newItems.splice(index - 1, 0, item)
      this.itemsReordered.emit(newItems)
      this.showNotification(`"${item.name}" movido hacia arriba`)
    }
  }

  moveItemDown(index: number) {
    if (index < this.items.length - 1) {
      const newItems = [...this.items]
      const item = newItems.splice(index, 1)[0]
      newItems.splice(index + 1, 0, item)
      this.itemsReordered.emit(newItems)
      this.showNotification(`"${item.name}" movido hacia abajo`)
    }
  }

  removeItem(index: number) {
    const item = this.items[index]
    if (confirm(`¿Estás seguro de que quieres eliminar "${item.name}" de la presentación?`)) {
      this.itemRemoved.emit(index)
    }
  }

  clearAllItems() {
    if (confirm("¿Estás seguro de que quieres eliminar todos los elementos de la presentación?")) {
      this.itemsReordered.emit([])
      this.showNotification("Todos los elementos han sido eliminados")
    }
  }

  previewItem(item: PresentationItem) {
    this.previewingItem = item
  }

  closeItemPreview() {
    this.previewingItem = null
  }

  previewAllItems() {
    this.showNotification("Función de vista previa completa próximamente")
  }

  saveCurrentOrder() {
    const orderData = {
      items: this.items.map((item) => ({
        id: item.id,
        name: item.name,
        type: item.type,
        position: item.position,
      })),
      savedAt: new Date().toISOString(),
    }
    localStorage.setItem("presentation-order", JSON.stringify(orderData))
    this.showNotification("Orden de presentación guardado")
  }

  loadSavedOrder() {
    const savedOrder = localStorage.getItem("presentation-order")
    if (savedOrder) {
      try {
        const orderData = JSON.parse(savedOrder)
        // This would need to be implemented to reorder based on saved data
        this.showNotification("Orden de presentación cargado")
      } catch (error) {
        this.showNotification("Error al cargar el orden guardado")
      }
    }
  }

  hasSavedOrder(): boolean {
    return localStorage.getItem("presentation-order") !== null
  }

  private showNotification(message: string) {
    // This would typically use a notification service
    console.log(`INFO: ${message}`)
  }
}
