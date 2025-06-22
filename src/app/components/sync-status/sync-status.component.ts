
import { CommonModule } from '@angular/common';
import { Component, input, output } from '@angular/core';


@Component({
  selector: 'app-sync-status',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sync-status.component.html',
  styleUrl: './sync-status.component.css'
})
export class SyncStatusComponent {
  googleDriveError = input.required<string | null>();
  lastSyncTime = input.required<Date | null>();
  retryGoogleDriveConnection = output<void>();
} 
