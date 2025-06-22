import { Component, Input, Output, EventEmitter } from "@angular/core"

import { FormsModule } from "@angular/forms"
import type { PresentationItem } from "../../models/presentation-item.model"

@Component({
  selector: "app-presentation-builder",
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="presentation-builder">
      <div class="builder-header">
        <div class="header-title">
          <div class="header-icon">📋</div>
          <div>
            <h3>Constructor de Presentación</h3>
            <p>Organiza y ordena los elementos de tu presentación</p>
          </div>
        </div>
        <div class="builder-actions">
          @if (items.length > 0) {
            <button class="clear-btn" (click)="clearAll()">
              <span>🗑️</span>
              Limpiar Todo
            </button>
          }
          <button
            class="generate-btn"
            (click)="generate()"
            [disabled]="items.length === 0">
            <span>⚡</span>
            Exportar Presentación
          </button>
        </div>
      </div>
    
      @if (items.length > 0) {
        <div class="presentation-preview">
          <div class="slides-counter">
            <div class="counter-content">
              <div class="counter-icon">📊</div>
              <div class="counter-info">
                <span class="counter-number">{{ getTotalSlides() }}</span>
                <span class="counter-label">Diapositivas totales</span>
              </div>
            </div>
            <div class="items-summary">
              <span class="summary-item">
                <span class="summary-icon">🎵</span>
                {{ getSongCount() }}
              </span>
              <span class="summary-item">
                <span class="summary-icon">🎬</span>
                {{ getVideoCount() }}
              </span>
              <span class="summary-item">
                <span class="summary-icon">🖼️</span>
                {{ getImageCount() }}
              </span>
            </div>
          </div>
          <div class="items-list">
            @for (item of items; track trackByItem(i, item); let i = $index) {
              <div
                class="presentation-item"
                [class.dragging]="draggedIndex === i"
                [class.drag-over]="dragOverIndex === i"
                draggable="true"
                (dragstart)="onDragStart(i, $event)"
                (dragover)="onDragOver($event, i)"
                (dragleave)="onDragLeave($event)"
                (drop)="onDrop($event, i)"
                (dragend)="onDragEnd()">
                <div class="item-handle">
                  <span class="handle-icon">⋮⋮</span>
                </div>
                <div class="item-content">
                  <div class="item-icon" [class]="'icon-' + item.type">
                    @if (item.type === 'song') {
                      <span>🎵</span>
                    }
                    @if (item.type === 'video') {
                      <span>🎬</span>
                    }
                    @if (item.type === 'image') {
                      <span>🖼️</span>
                    }
                  </div>
                  <div class="item-info">
                    <span class="item-name">{{ item.name }}</span>
                    <span class="item-details">
                      {{ getItemDetails(item) }}
                    </span>
                    @if (item.source) {
                      <span class="item-source">
                        {{ getSourceDisplay(item.source) }}
                      </span>
                    }
                  </div>
                </div>
                <div class="item-controls">
                  <div class="position-control">
                    <label>Posición:</label>
                    <input
                      type="number"
                      [value]="item.position || (i + 1)"
                      (change)="onPositionChange(i, $event)"
                      min="1"
                      [max]="items.length"
                      class="position-input">
                  </div>
                  <div class="slide-info">
                    <span class="slide-range">Diapositiva {{ getSlidePosition(i) }}</span>
                  </div>
                </div>
                <div class="item-actions">
                  <button class="preview-item-btn" (click)="previewItem(item)" title="Vista previa">
                    👁️
                  </button>
                  <button class="edit-item-btn" (click)="editItem(item, i)" title="Editar">
                    ✏️
                  </button>
                  <button class="remove-btn" (click)="removeItem(i)" [title]="'Eliminar ' + item.name">
                    <span>×</span>
                  </button>
                </div>
              </div>
            }
          </div>
          <div class="presentation-actions">
            <button class="preview-btn" (click)="previewPresentation()">
              <span>👁️</span>
              Vista Previa Completa
            </button>
            <button class="save-draft-btn" (click)="saveDraft()">
              <span>💾</span>
              Guardar Borrador
            </button>
            @if (hasSavedDraft()) {
              <button class="load-draft-btn" (click)="loadDraft()">
                <span>📂</span>
                Cargar Borrador
              </button>
            }
          </div>
        </div>
      }
    
      @if (items.length === 0) {
        <div class="empty-state">
          <div class="empty-animation">
            <div class="empty-icon">📋</div>
            <div class="empty-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
          <h4>Tu presentación está vacía</h4>
          <p>Selecciona canciones, videos o imágenes para comenzar a construir tu presentación.</p>
          <div class="empty-suggestions">
            <div class="suggestion-item">
              <span class="suggestion-icon">🎵</span>
              <span>Agrega canciones desde Public/letras/</span>
            </div>
            <div class="suggestion-item">
              <span class="suggestion-icon">🎬</span>
              <span>Incluye videos multimedia</span>
            </div>
            <div class="suggestion-item">
              <span class="suggestion-icon">🖼️</span>
              <span>Inserta imágenes de apoyo</span>
            </div>
          </div>
        </div>
      }
    
      <!-- Item Preview Modal -->
      @if (previewingItem) {
        <div class="item-preview-modal" (click)="closeItemPreview()">
          <div class="preview-content" (click)="$event.stopPropagation()">
            <div class="preview-header">
              <h3>{{ previewingItem.name }}</h3>
              <button class="close-btn" (click)="closeItemPreview()">×</button>
            </div>
            <div class="preview-body">
              @if (previewingItem.type === 'song') {
                <div class="song-preview">
                  <div class="song-slides">
                    @for (slide of getSongSlides(previewingItem); track slide; let i = $index) {
                      <div class="slide-preview">
                        <div class="slide-number">Diapositiva {{ i + 1 }}</div>
                        <div class="slide-content">{{ slide }}</div>
                      </div>
                    }
                  </div>
                </div>
              }
              @if (previewingItem.type === 'image') {
                <div class="image-preview">
                  <img [src]="previewingItem.source" [alt]="previewingItem.name" class="preview-image">
                </div>
              }
              @if (previewingItem.type === 'video') {
                <div class="video-preview">
                  <video [src]="previewingItem.source" controls class="preview-video"></video>
                </div>
              }
            </div>
          </div>
        </div>
      }
    </div>
    `,
  styleUrls: ["./presentation-builder.component.css"],
})
export class PresentationBuilderComponent {
  @Input() items: PresentationItem[] = []
  @Output() itemsReordered = new EventEmitter<PresentationItem[]>()
  @Output() itemRemoved = new EventEmitter<number>()
  @Output() itemPositionChanged = new EventEmitter<{ index: number; position: number }>()
  @Output() generatePresentation = new EventEmitter<void>()

  draggedIndex: number | null = null
  dragOverIndex: number | null = null
  previewingItem: PresentationItem | null = null

  trackByItem(index: number, item: PresentationItem): string {
    return item.id
  }

  getTotalSlides(): number {
    return this.items.reduce((total, item) => {
      if (item.type === "song") {
        return total + (item.slideCount || 1)
      }
      return total + 1
    }, 0)
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

  getItemDetails(item: PresentationItem): string {
    switch (item.type) {
      case "song":
        return `${item.slideCount} diapositivas • PowerPoint`
      case "video":
        const duration = item.duration ? ` • ${item.duration} min` : ""
        return `Video multimedia${duration}`
      case "image":
        const dimensions =
          item.metadata?.width && item.metadata?.height ? ` • ${item.metadata.width}×${item.metadata.height}` : ""
        return `Imagen de apoyo${dimensions}`
      default:
        return ""
    }
  }

  getSourceDisplay(source: string): string {
    if (source.startsWith("Public/letras/")) {
      return source
    }
    if (source.startsWith("blob:")) {
      return "Archivo local"
    }
    return source.length > 30 ? source.substring(0, 30) + "..." : source
  }

  getSlidePosition(index: number): string {
    let position = 1
    for (let i = 0; i < index; i++) {
      if (this.items[i].type === "song") {
        position += this.items[i].slideCount || 1
      } else {
        position += 1
      }
    }

    const currentItem = this.items[index]
    if (currentItem.type === "song" && (currentItem.slideCount || 1) > 1) {
      return `${position}-${position + (currentItem.slideCount || 1) - 1}`
    }

    return position.toString()
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

  removeItem(index: number) {
    const item = this.items[index]
    this.itemRemoved.emit(index)
    this.showNotification(`"${item.name}" eliminado de la presentación`)
  }

  previewItem(item: PresentationItem) {
    this.previewingItem = item
  }

  closeItemPreview() {
    this.previewingItem = null
  }

  editItem(item: PresentationItem, index: number) {
    // Placeholder for edit functionality
    this.showNotification(`Función de edición para "${item.name}" próximamente`)
  }

  getSongSlides(item: PresentationItem): string[] {
    // Simulate slide content based on song name
    const slides: { [key: string]: string[] } = {
      Ruido: [
        "🎵 RUIDO 🎵",
        "Verso 1:\nEn el silencio de la noche\nTu voz se escucha más",
        "Coro:\nNo hay ruido que pueda\nAcallar tu amor",
        "Verso 2:\nEn medio del caos\nTú traes paz",
        "Puente:\nSolo en Ti encuentro\nLa calma que necesito",
        "Final:\nTu amor es más fuerte\nQue cualquier ruido",
      ],
    }

    return (
      slides[item.name] ||
      Array.from({ length: item.slideCount || 1 }, (_, i) => `Contenido de la diapositiva ${i + 1}`)
    )
  }

  clearAll() {
    if (confirm("¿Estás seguro de que quieres eliminar todos los elementos?")) {
      this.itemsReordered.emit([])
      this.showNotification("Presentación limpiada")
    }
  }

  generate() {
    this.generatePresentation.emit()
  }

  previewPresentation() {
    this.showNotification("Función de vista previa completa próximamente")
  }

  saveDraft() {
    const draftData = {
      items: this.items,
      savedAt: new Date().toISOString(),
      totalSlides: this.getTotalSlides(),
    }
    localStorage.setItem("presentation-draft", JSON.stringify(draftData))
    this.showNotification("Borrador guardado localmente")
  }

  loadDraft() {
    const savedDraft = localStorage.getItem("presentation-draft")
    if (savedDraft) {
      try {
        const draftData = JSON.parse(savedDraft)
        this.itemsReordered.emit(draftData.items || [])
        this.showNotification("Borrador cargado exitosamente")
      } catch (error) {
        this.showNotification("Error al cargar el borrador", "warning")
      }
    }
  }

  hasSavedDraft(): boolean {
    return localStorage.getItem("presentation-draft") !== null
  }

  private showNotification(message: string, type: "success" | "warning" = "success") {
    const notification = document.createElement("div")
    notification.className = `mini-notification ${type}`
    notification.textContent = message
    document.body.appendChild(notification)

    setTimeout(() => notification.remove(), 2000)
  }
}
