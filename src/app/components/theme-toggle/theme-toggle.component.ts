
import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-theme-toggle',
  standalone: true,
  imports: [],
  template: `
    <div class="theme-toggle">
      <button 
        class="toggle-btn"
        [class.dark]="isDarkMode"
        (click)="toggleTheme()"
        [title]="isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'">
        <div class="toggle-track">
          <div class="toggle-thumb">
            <span class="toggle-icon">{{ isDarkMode ? '🌙' : '☀️' }}</span>
          </div>
        </div>
      </button>
      <span class="toggle-label">{{ isDarkMode ? 'Dark' : 'Light' }}</span>
    </div>
  `,
  styleUrl: './theme-toggle.component.css'
})
export class ThemeToggleComponent implements OnInit {
  @Output() themeChanged = new EventEmitter<boolean>()

  isDarkMode = false

  constructor(private themeService: ThemeService) {}

  ngOnInit() {
    this.isDarkMode = this.themeService.isDarkMode()
  }

  toggleTheme() {
    this.isDarkMode = !this.isDarkMode
    this.themeService.setDarkMode(this.isDarkMode)
    this.themeChanged.emit(this.isDarkMode)
  }
}
