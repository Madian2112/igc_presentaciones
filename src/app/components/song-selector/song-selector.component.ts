import { Component, EventEmitter, Output } from "@angular/core"

import { FormsModule } from "@angular/forms"
import type { PresentationItem } from "../../models/presentation-item.model"

@Component({
  selector: "app-song-selector",
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="song-selector">
      <div class="selector-header">
        <div class="header-title">
          <div class="header-icon">🎵</div>
          <div>
            <h3>Letras de Canciones</h3>
            <p>Desde la carpeta Public/letras/</p>
          </div>
        </div>
        <button class="refresh-btn" (click)="refreshSongs()" [disabled]="isLoading">
          <span class="refresh-icon" [class.spinning]="isLoading">↻</span>
          {{ isLoading ? 'Cargando...' : 'Actualizar' }}
        </button>
      </div>
    
      <div class="search-container">
        <div class="search-input-wrapper">
          <span class="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Buscar canción..."
            class="search-input"
            [(ngModel)]="searchTerm"
            (input)="filterSongs()">
        </div>
      </div>
    
      @if (!isLoading) {
        <div class="songs-list">
          @for (song of filteredSongs; track trackBySong($index, song)) {
            <div
              class="song-item"
              [class.featured]="song.name === 'Ruido'"
              (click)="selectSong(song)">
              <div class="song-preview">
                <div class="song-thumbnail">
                  <span class="song-icon">📄</span>
                  @if (song.name === 'Ruido') {
                    <div class="file-badge">NUEVO</div>
                  }
                </div>
                <div class="song-info">
                  <span class="song-name">{{ song.name }}</span>
                  <span class="song-details">
                    <span class="slide-count">{{ song.slideCount }} diapositivas</span>
                    <span class="file-path">{{ song.source }}</span>
                  </span>
                </div>
              </div>
              <div class="song-actions">
                <button class="preview-btn" (click)="previewSong(song, $event)" title="Vista previa">
                  👁️
                </button>
                <button class="add-btn" title="Agregar a presentación">
                  <span>+</span>
                </button>
              </div>
            </div>
          }
        </div>
      }
    
      @if (isLoading) {
        <div class="loading-state">
          <div class="loading-animation">
            <div class="loading-spinner"></div>
            <div class="loading-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
          <p>Escaneando carpeta Public/letras/...</p>
          <div class="loading-progress">
            <div class="progress-bar" [style.width.%]="loadingProgress"></div>
          </div>
        </div>
      }
    
      @if (!isLoading && filteredSongs.length === 0) {
        <div class="empty-state">
          <div class="empty-icon">🎵</div>
          <h4>No se encontraron canciones</h4>
          <p>Intenta con otro término de búsqueda</p>
        </div>
      }
    
      <!-- Preview Modal -->
      @if (previewingSong) {
        <div class="preview-modal" (click)="closePreview()">
          <div class="preview-content" (click)="$event.stopPropagation()">
            <div class="preview-header">
              <h3>Vista Previa: {{ previewingSong.name }}</h3>
              <button class="close-btn" (click)="closePreview()">×</button>
            </div>
            <div class="preview-slides">
              @for (slide of getPreviewSlides(previewingSong); track slide; let i = $index) {
                <div class="slide-preview">
                  <div class="slide-number">Diapositiva {{ i + 1 }}</div>
                  <div class="slide-content">{{ slide }}</div>
                </div>
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
  styleUrls: ["./song-selector.component.css"],
})
export class SongSelectorComponent {
  @Output() songSelected = new EventEmitter<PresentationItem>()

  searchTerm = ""
  isLoading = false
  loadingProgress = 0
  previewingSong: PresentationItem | null = null

  // Simulación de canciones desde Public/letras/ incluyendo "Ruido.pptx"
  songs: PresentationItem[] = [
    {
      id: "1",
      name: "Ruido",
      type: "song",
      slideCount: 6,
      source: "Public/letras/Ruido.pptx",
      metadata: {
        createdAt: new Date().toISOString(),
        format: "pptx",
      },
    },
    { id: "2", name: "Amazing Grace", type: "song", slideCount: 4, source: "Public/letras/Amazing_Grace.pptx" },
    {
      id: "3",
      name: "How Great Thou Art",
      type: "song",
      slideCount: 5,
      source: "Public/letras/How_Great_Thou_Art.pptx",
    },
    { id: "4", name: "Blessed Assurance", type: "song", slideCount: 3, source: "Public/letras/Blessed_Assurance.pptx" },
    {
      id: "5",
      name: "Great Is Thy Faithfulness",
      type: "song",
      slideCount: 4,
      source: "Public/letras/Great_Is_Thy_Faithfulness.pptx",
    },
    { id: "6", name: "Holy Holy Holy", type: "song", slideCount: 3, source: "Public/letras/Holy_Holy_Holy.pptx" },
    { id: "7", name: "It Is Well", type: "song", slideCount: 4, source: "Public/letras/It_Is_Well.pptx" },
    { id: "8", name: "Jesus Loves Me", type: "song", slideCount: 2, source: "Public/letras/Jesus_Loves_Me.pptx" },
    {
      id: "9",
      name: "What A Friend We Have In Jesus",
      type: "song",
      slideCount: 4,
      source: "Public/letras/What_A_Friend.pptx",
    },
    { id: "10", name: "Sublime Gracia", type: "song", slideCount: 5, source: "Public/letras/Sublime_Gracia.pptx" },
    {
      id: "11",
      name: "Cuán Grande Es Él",
      type: "song",
      slideCount: 4,
      source: "Public/letras/Cuan_Grande_Es_El.pptx",
    },
    { id: "12", name: "Cristo Vive", type: "song", slideCount: 3, source: "Public/letras/Cristo_Vive.pptx" },
  ]

  filteredSongs = [...this.songs]

  trackBySong(index: number, song: PresentationItem): string {
    return song.id
  }

  filterSongs() {
    this.filteredSongs = this.songs.filter((song) => song.name.toLowerCase().includes(this.searchTerm.toLowerCase()))
  }

  selectSong(song: PresentationItem) {
    // Animación de selección
    const songElement = event?.target as HTMLElement
    const songItem = songElement.closest(".song-item") as HTMLElement
    if (songItem) {
      songItem.style.transform = "scale(0.95)"
      setTimeout(() => {
        songItem.style.transform = "scale(1)"
      }, 150)
    }

    this.songSelected.emit({ ...song })
    this.showNotification(`"${song.name}" agregada a la presentación`)
  }

  previewSong(song: PresentationItem, event: Event) {
    event.stopPropagation()
    this.previewingSong = song
  }

  closePreview() {
    this.previewingSong = null
  }

  addFromPreview() {
    if (this.previewingSong) {
      this.selectSong(this.previewingSong)
      this.closePreview()
    }
  }

  getPreviewSlides(song: PresentationItem): string[] {
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
      slides[song.name] ||
      Array.from({ length: song.slideCount || 1 }, (_, i) => `Contenido de la diapositiva ${i + 1}`)
    )
  }

  refreshSongs() {
    this.isLoading = true
    this.loadingProgress = 0

    // Simulate progressive loading
    const interval = setInterval(() => {
      this.loadingProgress += 20
      if (this.loadingProgress >= 100) {
        clearInterval(interval)
        setTimeout(() => {
          this.isLoading = false
          this.loadingProgress = 0
          this.showNotification("Biblioteca actualizada desde Public/letras/")
        }, 500)
      }
    }, 400)
  }

  private showNotification(message: string) {
    const notification = document.createElement("div")
    notification.className = "mini-notification"
    notification.textContent = message
    document.body.appendChild(notification)

    setTimeout(() => notification.remove(), 2000)
  }
}
