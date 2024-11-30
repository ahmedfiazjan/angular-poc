import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { InfiniteCanvasModule } from './features/infinite-canvas/infinite-canvas.module';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, InfiniteCanvasModule],
  template: `
    <div class="app-container">
      <app-infinite-canvas></app-infinite-canvas>
    </div>
  `,
  styles: [`
    .app-container {
      width: 100%;
      height: 100vh;
      overflow: hidden;
    }
  `]
})
export class AppComponent {
  title = 'angular-poc';
}
