import { Component, Input, Output, EventEmitter } from "@angular/core"

import { FormsModule } from "@angular/forms"
import type { PresentationItem } from "../../models/presentation-item.model"

@Component({
  selector: "app-export-modal",
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="export-modal-overlay" (click)="cancel()">
      <div class="export-modal" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h2>Exportar Presentación</h2>
          <button class="close-btn" (click)="cancel()">×</button>
        </div>
    
        <div class="modal-body">
          <div class="export-form">
            <div class="form-group">
              <label for="presentationName">Nombre de la presentación:</label>
              <input
                type="text"
                id="presentationName"
                [(ngModel)]="presentationName"
                placeholder="Ej: Servicio Dominical - 15 Enero 2024"
                class="form-input"
                maxlength="100">
              <div class="input-hint">{{ presentationName.length }}/100 caracteres</div>
            </div>
    
            <div class="form-group">
              <label>Formato de exportación:</label>
              <div class="format-options">
                <label class="format-option" [class.selected]="selectedFormat === 'pptx'">
                  <input type="radio" [(ngModel)]="selectedFormat" value="pptx" name="format">
                  <div class="format-card">
                    <div class="format-icon">📊</div>
                    <div class="format-info">
                      <span class="format-name">PowerPoint</span>
                      <span class="format-desc">Archivo .pptx editable</span>
                    </div>
                  </div>
                </label>
    
                <label class="format-option" [class.selected]="selectedFormat === 'pdf'">
                  <input type="radio" [(ngModel)]="selectedFormat" value="pdf" name="format">
                  <div class="format-card">
                    <div class="format-icon">📄</div>
                    <div class="format-info">
                      <span class="format-name">PDF</span>
                      <span class="format-desc">Documento portable</span>
                    </div>
                  </div>
                </label>
    
                <label class="format-option" [class.selected]="selectedFormat === 'json'">
                  <input type="radio" [(ngModel)]="selectedFormat" value="json" name="format">
                  <div class="format-card">
                    <div class="format-icon">⚙️</div>
                    <div class="format-info">
                      <span class="format-name">Configuración</span>
                      <span class="format-desc">Archivo .json para desarrollo</span>
                    </div>
                  </div>
                </label>
              </div>
            </div>
    
            <div class="presentation-summary">
              <h3>Resumen de la presentación:</h3>
              <div class="summary-stats">
                <div class="stat-item">
                  <span class="stat-icon">📊</span>
                  <span class="stat-text">{{ getTotalSlides() }} diapositivas totales</span>
                </div>
                <div class="stat-item">
                  <span class="stat-icon">🎵</span>
                  <span class="stat-text">{{ getSongCount() }} canciones</span>
                </div>
                <div class="stat-item">
                  <span class="stat-icon">🎬</span>
                  <span class="stat-text">{{ getVideoCount() }} videos</span>
                </div>
                <div class="stat-item">
                  <span class="stat-icon">🖼️</span>
                  <span class="stat-text">{{ getImageCount() }} imágenes</span>
                </div>
                <div class="stat-item">
                  <span class="stat-icon">⏱️</span>
                  <span class="stat-text">~{{ getEstimatedDuration() }} min estimados</span>
                </div>
              </div>
            </div>
    
            <div class="export-options">
              <h3>Opciones de exportación:</h3>
              <div class="option-group">
                <label class="checkbox-option">
                  <input type="checkbox" [(ngModel)]="includeNotes">
                  <span class="checkmark"></span>
                  Incluir notas del presentador
                </label>
                <label class="checkbox-option">
                  <input type="checkbox" [(ngModel)]="optimizeForProjector">
                  <span class="checkmark"></span>
                  Optimizar para proyector (16:9)
                </label>
                <label class="checkbox-option">
                  <input type="checkbox" [(ngModel)]="includeTransitions">
                  <span class="checkmark"></span>
                  Incluir transiciones automáticas
                </label>
              </div>
            </div>
    
            <div class="items-preview">
              <h3>Orden de elementos:</h3>
              <div class="items-list">
                @for (item of items; track item; let i = $index) {
                  <div class="preview-item">
                    <span class="item-number">{{ i + 1 }}</span>
                    <span class="item-icon">
                      {{ item.type === 'song' ? '🎵' : item.type === 'video' ? '🎬' : '🖼️' }}
                    </span>
                    <span class="item-name">{{ item.name }}</span>
                    <span class="item-slides">
                      {{ item.type === 'song' ? item.slideCount + ' slides' : '1 slide' }}
                    </span>
                  </div>
                }
              </div>
            </div>
          </div>
        </div>
    
        <div class="modal-footer">
          <button class="cancel-btn" (click)="cancel()">
            Cancelar
          </button>
          <button
            class="export-btn"
            (click)="confirmExport()"
            [disabled]="!presentationName.trim()">
            <span class="export-icon">⚡</span>
            Exportar {{ selectedFormat.toUpperCase() }}
          </button>
        </div>
      </div>
    </div>
    `,
  styleUrls: ["./export-modal.component.css"],
})
export class ExportModalComponent {
  @Input() items: PresentationItem[] = []
  @Output() exportConfirmed = new EventEmitter<{ name: string; format: string; options: any }>()
  @Output() exportCancelled = new EventEmitter<void>()

  presentationName = ""
  selectedFormat = "pptx"
  includeNotes = true
  optimizeForProjector = true
  includeTransitions = false

  ngOnInit() {
    // Generate default name based on current date
    const now = new Date()
    const dateStr = now.toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
    this.presentationName = `Presentación - ${dateStr}`
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

  getEstimatedDuration(): number {
    return this.items.reduce((total, item) => {
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
    }, 0)
  }

  confirmExport() {
    if (!this.presentationName.trim()) {
      return
    }

    const exportData = {
      name: this.presentationName.trim(),
      format: this.selectedFormat,
      options: {
        includeNotes: this.includeNotes,
        optimizeForProjector: this.optimizeForProjector,
        includeTransitions: this.includeTransitions,
      },
    }

    this.exportConfirmed.emit(exportData)
  }

  cancel() {
    this.exportCancelled.emit()
  }
}
