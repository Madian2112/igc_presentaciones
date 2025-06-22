import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly THEME_KEY = "church-presentation-theme"

  isDarkMode(): boolean {
    const saved = localStorage.getItem(this.THEME_KEY)
    // Default to dark mode if no preference is saved
    return saved ? JSON.parse(saved) : true
  }

  setDarkMode(isDark: boolean): void {
    localStorage.setItem(this.THEME_KEY, JSON.stringify(isDark))
    this.updateBodyClass(isDark)
  }

  initializeTheme(): void {
    const isDark = this.isDarkMode()
    this.updateBodyClass(isDark)
  }

  private updateBodyClass(isDark: boolean): void {
    if (isDark) {
      document.body.classList.add("dark-mode")
    } else {
      document.body.classList.remove("dark-mode")
    }
  }
}
