import { Component, EventEmitter, OnDestroy, OnInit, Output } from "@angular/core"

import { FormsModule } from "@angular/forms"
import type { PresentationItem } from "../../models/presentation-item.model"
import { Song } from "../../models/presentation.model"
import { debounceTime, distinctUntilChanged, Subject, takeUntil } from "rxjs"
import { SongService } from "../../services/song.service"

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
          <p>Desde Google Drive - {{ displayedSongs.length }} canciones</p>
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
          placeholder="Buscar canción por título, artista o género..."
          class="search-input"
          [(ngModel)]="searchTerm"
          (input)="onSearchInput($event)"
          [class.searching]="isSearching">
        @if (searchTerm) {
          <button
            class="clear-search-btn"
            (click)="clearSearch()"
            title="Limpiar búsqueda">
            ×
          </button>
        }
      </div>
      @if (searchTerm) {
        <div class="search-status">
          <span class="search-results-count">
            {{ filteredSongs.length }} resultado{{ filteredSongs.length !== 1 ? 's' : '' }}
            {{ isSearching ? '(buscando...)' : '' }}
          </span>
        </div>
      }
    </div>
  
    @if (!isLoading) {
      <div class="songs-container">
        @if (showScrollIndicator) {
          <div class="scroll-indicator">
            <span class="scroll-text">Desliza para ver más canciones</span>
            <span class="scroll-arrow">↓</span>
          </div>
        }
        <div class="songs-list" [class.scrollable]="showScrollIndicator">
          @for (song of displayedSongs; track trackBySong(i, song); let i = $index) {
            <div
              class="song-item"
              [class.featured]="song.name === 'Ruido'"
              [class.search-highlight]="searchTerm && song.name.toLowerCase().includes(searchTerm.toLowerCase())"
              (click)="selectSong(song)">
              <div class="song-preview">
                <div class="song-thumbnail">
                  <span class="song-icon">📄</span>
                  @if (song.name === 'Ruido') {
                    <div class="file-badge">NUEVO</div>
                  }
                  <div class="position-badge">{{ i + 1 }}</div>
                </div>
                <div class="song-info">
                  <span class="song-name" [innerHTML]="highlightSearchTerm(song.name)"></span>
                  <span class="song-details">
                    <span class="slide-count">{{ song.slideCount }} diapositivas</span>
                    @if (song.metadata?.artist) {
                      <span class="artist-info">
                        por {{ song.metadata?.artist }}
                      </span>
                    }
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
        <p>Cargando canciones desde Google Drive...</p>
        <div class="loading-progress">
          <div class="progress-bar" [style.width.%]="loadingProgress"></div>
        </div>
      </div>
    }
  
    @if (!isLoading && displayedSongs.length === 0) {
      <div class="empty-state">
        <div class="empty-icon">🎵</div>
        <h4>{{ searchTerm ? 'No se encontraron canciones' : 'No hay canciones disponibles' }}</h4>
        <p>{{ searchTerm ? 'Intenta con otro término de búsqueda' : 'Verifica la conexión con Google Drive' }}</p>
        @if (searchTerm) {
          <button class="clear-search-btn-large" (click)="clearSearch()">
            Mostrar todas las canciones
          </button>
        }
      </div>
    }
  
    <!-- Preview Modal -->
    @if (previewingSong) {
      <div class="preview-modal" (click)="closePreview()">
        <div class="preview-content" (click)="$event.stopPropagation()">
          <div class="preview-header">
            <h3>Vista Previa: {{ previewingSong?.name }}</h3>
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
export class SongSelectorComponent implements OnInit, OnDestroy {
  @Output() songSelected = new EventEmitter<PresentationItem>()

  searchTerm = ""
  isLoading = false
  loadingProgress = 0
  previewingSong: PresentationItem | null = null

  // Enhanced properties for new functionality
  allSongs: Song[] = []
  filteredSongs: Song[] = []
  displayedSongs: Song[] = []
  isSearching = false
  searchResults: Song[] = []
  showScrollIndicator = false

  private destroy$ = new Subject<void>()
  private searchSubject = new Subject<string>()

  constructor(private songService: SongService) {
    // Setup real-time search with debouncing
    this.searchSubject
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((searchTerm) => {
        this.performSearch(searchTerm)
      })
  }

  async ngOnInit() {
    await this.loadSongsFromDrive()
  }

  ngOnDestroy() {
    this.destroy$.next()
    this.destroy$.complete()
  }

  private async loadSongsFromDrive() {
    this.isLoading = true
    this.loadingProgress = 0

    try {
      // Simulate progressive loading for better UX
      const progressInterval = setInterval(() => {
        if (this.loadingProgress < 80) {
          this.loadingProgress += 10
        }
      }, 200)

      this.allSongs = await this.songService.loadAvailableSongs()

      clearInterval(progressInterval)
      this.loadingProgress = 100

      // Sort songs alphabetically by title
      this.sortSongsAlphabetically()

      // Initialize filtered songs
      this.filteredSongs = [...this.allSongs]
      this.updateDisplayedSongs()

      await this.delay(300)
      this.isLoading = false
      this.loadingProgress = 0

      this.showNotification(`Loaded ${this.allSongs.length} songs from Google Drive`, "success")
    } catch (error) {
      this.isLoading = false
      this.showNotification("Failed to load songs from Google Drive", "error")
      console.error("Error loading songs:", error)
    }
  }

  private sortSongsAlphabetically() {
    this.allSongs.sort((a, b) => {
      return a.name.toLowerCase().localeCompare(b.name.toLowerCase())
    })
  }

  private updateDisplayedSongs() {
    this.displayedSongs = this.filteredSongs
    this.showScrollIndicator = this.displayedSongs.length > 9
  }

  onSearchInput(event: Event) {
    const target = event.target as HTMLInputElement
    this.searchTerm = target.value
    this.searchSubject.next(this.searchTerm)
  }

  private async performSearch(searchTerm: string) {
    this.isSearching = true

    if (!searchTerm.trim()) {
      // Reset to all songs when search is empty
      this.filteredSongs = [...this.allSongs]
      this.isSearching = false
      this.updateDisplayedSongs()
      return
    }

    try {
      // Filter songs based on search term
      this.filteredSongs = this.allSongs.filter(
        (song) =>
          song.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (song.metadata?.artist && song.metadata.artist.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (song.metadata?.genre && song.metadata.genre.toLowerCase().includes(searchTerm.toLowerCase())),
      )

      this.updateDisplayedSongs()
      this.isSearching = false
    } catch (error) {
      this.isSearching = false
      this.showNotification("Search failed", "error")
      console.error("Search error:", error)
    }
  }

  clearSearch() {
    this.searchTerm = ""
    this.filteredSongs = [...this.allSongs]
    this.updateDisplayedSongs()
    this.isSearching = false
  }

  async refreshSongs() {
    await this.loadSongsFromDrive()
  }

  trackBySong(index: number, song: Song): string {
    return song.id
  }

  selectSong(song: Song) {
    // Convert Song to PresentationItem
    const presentationItem: PresentationItem = {
      id: `song-${Date.now()}`,
      name: song.name,
      type: "song",
      source: song.source,
      slideCount: song.slideCount,
      position: 0, // Will be set by parent component
      metadata: {
        format: "pptx",
        createdAt: new Date().toISOString(),
        originalSong: song,
      },
    }

    // Animation effect
    const songElement = event?.target as HTMLElement
    const songItem = songElement.closest(".song-item") as HTMLElement
    if (songItem) {
      songItem.style.transform = "scale(0.95)"
      setTimeout(() => {
        songItem.style.transform = "scale(1)"
      }, 150)
    }

    this.songSelected.emit(presentationItem)
    this.showNotification(`"${song.name}" added to presentation`, "success")
  }

  previewSong(song: Song, event: Event) {
    event.stopPropagation()

    // Convert Song to PresentationItem for preview
    const presentationItem: PresentationItem = {
      id: song.id,
      name: song.name,
      type: "song",
      source: song.source,
      slideCount: song.slideCount,
      metadata: {
        originalSong: song,
      },
    }

    this.previewingSong = presentationItem
  }

  closePreview() {
    this.previewingSong = null
  }

  addFromPreview() {
    if (this.previewingSong) {
      this.selectSong(this.previewingSong.metadata?.originalSong as Song)
      this.closePreview()
    }
  }

  getPreviewSlides(item: PresentationItem): string[] {
    const song = item.metadata?.originalSong as Song

    if (song?.lyrics && song.lyrics.length > 0) {
      return song.lyrics
    }

    // Fallback to simulated content
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

  private showNotification(message: string, type: "success" | "error" = "success") {
    const notification = document.createElement("div")
    notification.className = `mini-notification ${type}`
    notification.textContent = message
    document.body.appendChild(notification)

    setTimeout(() => notification.remove(), 2000)
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  highlightSearchTerm(text: string): string {
    if (!this.searchTerm) return text

    const regex = new RegExp(`(${this.searchTerm})`, "gi")
    return text.replace(regex, '<mark class="search-highlight-text">$1</mark>')
  }
}
