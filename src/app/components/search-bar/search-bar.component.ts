import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { SongService } from '../../services/song.service';
import { Song } from '../../models/presentation.model';

import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-search-bar',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="search-container">
      <div class="search-header">
        <div class="search-title">
          <h3>🎵 Biblioteca de Letras</h3>
          <p>Directorio: <code>Public/letras/</code></p>
        </div>
        <button class="refresh-btn" (click)="refreshSongs()" [disabled]="isRefreshing">
          <span class="refresh-icon" [class.spinning]="isRefreshing">🔄</span>
          {{ isRefreshing ? 'Actualizando...' : 'Actualizar' }}
        </button>
      </div>
    
      <div class="search-input-container">
        <div class="search-input-wrapper">
          <span class="search-icon">🔍</span>
          <input
            type="text"
            class="search-input"
            placeholder="Buscar canciones por nombre, artista o género..."
            [(ngModel)]="searchQuery"
            (input)="onSearchInput()"
            (keyup.enter)="performSearch()">
            @if (searchQuery) {
              <button class="clear-search-btn" (click)="clearSearch()">
                ×
              </button>
            }
          </div>
          <button class="search-btn" (click)="performSearch()" [disabled]="isSearching">
            {{ isSearching ? 'Buscando...' : 'Buscar' }}
          </button>
        </div>
    
        @if (!isLoading) {
          <div class="search-results">
            @if (searchResults.length > 0) {
              <div class="results-header">
                <span class="results-count">{{ searchResults.length }} canción(es) encontrada(s)</span>
                <div class="view-toggle">
                  <button
                    class="toggle-btn"
                    [class.active]="viewMode === 'grid'"
                    (click)="viewMode = 'grid'">
                    ⊞
                  </button>
                  <button
                    class="toggle-btn"
                    [class.active]="viewMode === 'list'"
                    (click)="viewMode = 'list'">
                    ☰
                  </button>
                </div>
              </div>
            }
            <div class="songs-container" [class]="'view-' + viewMode">
              @for (song of searchResults; track trackBySong($index, song)) {
                <div
                  class="song-card"
                  [class.featured]="song.name === 'Ruido'"
                  (click)="selectSong(song)">
                  <div class="song-thumbnail">
                    <div class="thumbnail-content">
                      <span class="song-icon">📄</span>
                      <div class="slide-count-badge">{{ song.slideCount }}</div>
                    </div>
                    @if (song.name === 'Ruido') {
                      <div class="featured-badge">NUEVO</div>
                    }
                  </div>
                  <div class="song-info">
                    <h4 class="song-title">{{ song.name }}</h4>
                    <div class="song-metadata">
                      @if (song.metadata?.artist) {
                        <span class="song-artist">
                          👤 {{ song.metadata?.artist }}
                        </span>
                      }
                      @if (song.metadata?.genre) {
                        <span class="song-genre">
                          🎵 {{ song.metadata?.genre }}
                        </span>
                      }
                      @if (song.metadata?.year) {
                        <span class="song-year">
                          📅 {{ song.metadata?.year }}
                        </span>
                      }
                    </div>
                    <div class="song-source">
                      <span class="source-icon">📁</span>
                      <span class="source-path">{{ song.source }}</span>
                    </div>
                    <div class="song-stats">
                      <span class="stat-item">
                        <span class="stat-icon">📊</span>
                        {{ song.slideCount }} diapositivas
                      </span>
                    </div>
                  </div>
                  <div class="song-actions">
                    <button class="preview-btn" (click)="previewSong(song, $event)" title="Vista previa">
                      👁️
                    </button>
                    <button class="select-btn" title="Seleccionar canción">
                      <span>+</span>
                    </button>
                  </div>
                </div>
              }
            </div>
            @if (searchResults.length === 0 && searchQuery) {
              <div class="empty-results">
                <div class="empty-icon">🔍</div>
                <h4>No se encontraron canciones</h4>
                <p>Intenta con otros términos de búsqueda</p>
                <button class="show-all-btn" (click)="showAllSongs()">
                  Mostrar todas las canciones
                </button>
              </div>
            }
          </div>
        }
    
        @if (isLoading) {
          <div class="loading-state">
            <div class="loading-animation">
              <div class="loading-spinner"></div>
              <div class="loading-text">
                <h4>{{ loadingMessage }}</h4>
                <p>{{ loadingDetail }}</p>
              </div>
            </div>
          </div>
        }
    
        <!-- Preview Modal -->
        @if (previewingSong) {
          <div class="preview-modal" (click)="closePreview()">
            <div class="preview-content" (click)="$event.stopPropagation()">
              <div class="preview-header">
                <div class="preview-title">
                  <h3>{{ previewingSong?.name }}</h3>
                  <div class="preview-metadata">
                    @if (previewingSong.metadata?.artist) {
                      <span>{{ previewingSong?.metadata?.artist }}</span>
                    }
                    @if (previewingSong.metadata?.year) {
                      <span>({{ previewingSong?.metadata?.year }})</span>
                    }
                  </div>
                </div>
                <button class="close-preview-btn" (click)="closePreview()">×</button>
              </div>
              @if (previewingSong.lyrics) {
                <div class="preview-slides">
                  @for (slide of previewingSong.lyrics; track slide; let i = $index) {
                    <div class="slide-preview">
                      <div class="slide-number">Diapositiva {{ i + 1 }}</div>
                      <div class="slide-content">{{ slide }}</div>
                    </div>
                  }
                </div>
              }
              <div class="preview-actions">
                <button class="add-from-preview-btn" (click)="selectFromPreview()">
                  Agregar a Presentación
                </button>
              </div>
            </div>
          </div>
        }
      </div>
    `,
  styleUrl: './search-bar.component.css'
})
export class SearchBarComponent implements OnInit {
  @Input() songs: Song[] = []
  @Input() isLoading = false
  @Output() songSelected = new EventEmitter<Song>()
  @Output() searchInitiated = new EventEmitter<void>()

  searchQuery = ""
  searchResults: Song[] = []
  isSearching = false
  isRefreshing = false
  viewMode: "grid" | "list" = "grid"
  previewingSong: Song | null = null
  loadingMessage = ""
  loadingDetail = ""

  constructor(private songService: SongService) {}

  ngOnInit() {
    this.searchResults = [...this.songs]
  }

  ngOnChanges() {
    if (this.songs.length > 0 && this.searchResults.length === 0) {
      this.searchResults = [...this.songs]
    }
  }

  trackBySong(index: number, song: Song): string {
    return song.id
  }

  onSearchInput() {
    if (this.searchQuery.length === 0) {
      this.searchResults = [...this.songs]
    }
  }

  async performSearch() {
    if (this.isSearching) return

    this.isSearching = true
    this.searchInitiated.emit()

    try {
      this.searchResults = await this.songService.searchSongs(this.searchQuery)
    } catch (error) {
      console.error("Error searching songs:", error)
    } finally {
      this.isSearching = false
    }
  }

  clearSearch() {
    this.searchQuery = ""
    this.searchResults = [...this.songs]
  }

  showAllSongs() {
    this.searchQuery = ""
    this.searchResults = [...this.songs]
  }

  async refreshSongs() {
    this.isRefreshing = true
    this.loadingMessage = "Actualizando biblioteca..."
    this.loadingDetail = "Escaneando directorio Public/letras/"

    try {
      await new Promise((resolve) => setTimeout(resolve, 2000))
      this.searchResults = await this.songService.loadAvailableSongs()
      this.showNotification("Biblioteca actualizada correctamente", "success")
    } catch (error) {
      this.showNotification("Error al actualizar la biblioteca", "error")
    } finally {
      this.isRefreshing = false
    }
  }

  selectSong(song: Song) {
    this.songSelected.emit(song)
  }

  previewSong(song: Song, event: Event) {
    event.stopPropagation()
    this.previewingSong = song
  }

  closePreview() {
    this.previewingSong = null
  }

  selectFromPreview() {
    if (this.previewingSong) {
      this.selectSong(this.previewingSong)
      this.closePreview()
    }
  }

  private showNotification(message: string, type: string) {
    // This would typically use a notification service
    console.log(`${type.toUpperCase()}: ${message}`)
  }
}