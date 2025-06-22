import { Component, Input, Output, EventEmitter, type OnInit } from "@angular/core"

import { FormsModule } from "@angular/forms"
import type { PresentationItem, ExportOptions } from "../../models/presentation.model"

@Component({
  selector: "app-export-dialog",
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="export-dialog-overlay" (click)="cancel()">
      <div class="export-dialog" (click)="$event.stopPropagation()">
        <div class="dialog-header">
          <div class="header-title">
            <h2>📊 Exportar Presentación</h2>
            <p>Configura y genera tu presentación PowerPoint</p>
          </div>
          <button class="close-dialog-btn" (click)="cancel()">×</button>
        </div>
    
        <div class="dialog-body">
          <div class="export-form">
            <!-- Presentation Name -->
            <div class="form-section">
              <h3>Información de la Presentación</h3>
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
            </div>
    
            <!-- Export Format -->
            <div class="form-section">
              <h3>Formato de Exportación</h3>
              <div class="format-grid">
                <label class="format-option" [class.selected]="selectedFormat === 'pptx'">
                  <input type="radio" [(ngModel)]="selectedFormat" value="pptx" name="format">
                  <div class="format-card">
                    <div class="format-icon">📊</div>
                    <div class="format-info">
                      <span class="format-name">PowerPoint</span>
                      <span class="format-desc">Archivo .pptx editable</span>
                      <span class="format-features">• Totalmente editable • Transiciones • Notas</span>
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
                      <span class="format-features">• Solo lectura • Fácil distribución</span>
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
                      <span class="format-features">• Datos estructurados • Reutilizable</span>
                    </div>
                  </div>
                </label>
              </div>
            </div>
    
            <!-- Export Options -->
            <div class="form-section">
              <h3>Opciones de Exportación</h3>
              <div class="options-grid">
                <label class="option-item">
                  <input type="checkbox" [(ngModel)]="exportOptions.includeTransitions">
                  <span class="option-checkmark"></span>
                  <div class="option-content">
                    <span class="option-title">Incluir transiciones automáticas</span>
                    <span class="option-desc">Agrega transiciones suaves entre diapositivas</span>
                  </div>
                </label>
    
                <label class="option-item">
                  <input type="checkbox" [(ngModel)]="exportOptions.optimizeForProjector">
                  <span class="option-checkmark"></span>
                  <div class="option-content">
                    <span class="option-title">Optimizar para proyector</span>
                    <span class="option-desc">Ajusta colores y contraste para proyección</span>
                  </div>
                </label>
    
                <label class="option-item">
                  <input type="checkbox" [(ngModel)]="exportOptions.includeNotes">
                  <span class="option-checkmark"></span>
                  <div class="option-content">
                    <span class="option-title">Incluir notas del presentador</span>
                    <span class="option-desc">Agrega notas y comentarios para el presentador</span>
                  </div>
                </label>
              </div>
    
              <div class="advanced-options">
                <h4>Opciones Avanzadas</h4>
                <div class="option-row">
                  <label class="option-label">Tamaño de diapositiva:</label>
                  <select [(ngModel)]="exportOptions.slideSize" class="option-select">
                    <option value="16:9">16:9 (Pantalla ancha)</option>
                    <option value="4:3">4:3 (Estándar)</option>
                  </select>
                </div>
                <div class="option-row">
                  <label class="option-label">Calidad de exportación:</label>
                  <select [(ngModel)]="exportOptions.quality" class="option-select">
                    <option value="high">Alta calidad</option>
                    <option value="medium">Calidad media</option>
                    <option value="low">Calidad baja (archivo más pequeño)</option>
                  </select>
                </div>
              </div>
            </div>
    
            <!-- Presentation Summary -->
            <div class="form-section">
              <h3>Resumen de la Presentación</h3>
              <div class="summary-container">
                <div class="summary-stats">
                  <div class="summary-stat">
                    <span class="stat-icon">📊</span>
                    <div class="stat-content">
                      <span class="stat-number">{{ getTotalSlides() }}</span>
                      <span class="stat-label">Diapositivas totales</span>
                    </div>
                  </div>
                  <div class="summary-stat">
                    <span class="stat-icon">🎵</span>
                    <div class="stat-content">
                      <span class="stat-number">{{ getSongCount() }}</span>
                      <span class="stat-label">Canciones</span>
                    </div>
                  </div>
                  <div class="summary-stat">
                    <span class="stat-icon">🎬</span>
                    <div class="stat-content">
                      <span class="stat-number">{{ getVideoCount() }}</span>
                      <span class="stat-label">Videos</span>
                    </div>
                  </div>
                  <div class="summary-stat">
                    <span class="stat-icon">🖼️</span>
                    <div class="stat-content">
                      <span class="stat-number">{{ getImageCount() }}</span>
                      <span class="stat-label">Imágenes</span>
                    </div>
                  </div>
                  <div class="summary-stat">
                    <span class="stat-icon">⏱️</span>
                    <div class="stat-content">
                      <span class="stat-number">~{{ getEstimatedDuration() }}</span>
                      <span class="stat-label">Minutos estimados</span>
                    </div>
                  </div>
                </div>
    
                <div class="items-preview">
                  <h4>Orden de elementos:</h4>
                  <div class="preview-list">
                    @for (item of items; track item; let i = $index) {
                      <div class="preview-item">
                        <span class="item-position">{{ i + 1 }}</span>
                        <span class="item-icon">{{ getItemIcon(item.type) }}</span>
                        <span class="item-name">{{ item.name }}</span>
                        <span class="item-slides">
                          {{ item.slideCount || 1 }} slide{{ (item.slideCount || 1) > 1 ? 's' : '' }}
                        </span>
                      </div>
                    }
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
    
        <div class="dialog-footer">
          <div class="footer-info">
            <span class="file-size-estimate">
              Tamaño estimado: {{ getEstimatedFileSize() }}
            </span>
          </div>
          <div class="footer-actions">
            <button class="cancel-export-btn" (click)="cancel()">
              Cancelar
            </button>
            <button
              class="confirm-export-btn"
              (click)="confirmExport()"
              [disabled]="!presentationName.trim()">
              <span class="export-icon">⚡</span>
              Generar {{ selectedFormat.toUpperCase() }}
            </button>
          </div>
        </div>
      </div>
    </div>
    `,
  styleUrls: ["./export-dialog.component.css"],
})
export class ExportDialogComponent implements OnInit {
  @Input() items: PresentationItem[] = []
  @Output() exportConfirmed = new EventEmitter<{ name: string; format: string; options: ExportOptions }>()
  @Output() exportCancelled = new EventEmitter<void>()

  presentationName = ""
  selectedFormat = "pptx"
  exportOptions: ExportOptions = {
    includeTransitions: true,
    optimizeForProjector: true,
    includeNotes: true,
    slideSize: "16:9",
    quality: "high",
  }

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
      return total + (item.slideCount || 1)
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

  getItemIcon(type: string): string {
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

  getEstimatedFileSize(): string {
    // Rough estimation based on content
    let sizeInMB = 5 // Base PowerPoint size

    // Add size for each item type
    this.items.forEach((item) => {
      switch (item.type) {
        case "song":
          sizeInMB += (item.slideCount || 1) * 0.5
          break
        case "video":
          sizeInMB += (item.size || 50 * 1024 * 1024) / (1024 * 1024)
          break
        case "image":
          sizeInMB += (item.size || 2 * 1024 * 1024) / (1024 * 1024)
          break
      }
    })

    // Adjust for quality
    switch (this.exportOptions.quality) {
      case "high":
        sizeInMB *= 1.5
        break
      case "low":
        sizeInMB *= 0.7
        break
    }

    if (sizeInMB < 1) {
      return `${Math.round(sizeInMB * 1024)} KB`
    } else if (sizeInMB < 1024) {
      return `${Math.round(sizeInMB)} MB`
    } else {
      return `${Math.round((sizeInMB / 1024) * 10) / 10} GB`
    }
  }

  confirmExport() {
    if (!this.presentationName.trim()) {
      return
    }

    const exportData = {
      name: this.presentationName.trim(),
      format: this.selectedFormat,
      options: { ...this.exportOptions },
    }

    this.exportConfirmed.emit(exportData)
  }

  cancel() {
    this.exportCancelled.emit()
  }
}
