import { Component, ElementRef, OnInit, ViewChild, AfterViewInit, HostListener } from '@angular/core';
import { ApiService, LocationData, ApiObject } from '../../core/services/api.service';
import { firstValueFrom, forkJoin } from 'rxjs';

interface Point {
  x: number;
  y: number;
}

@Component({
  selector: 'app-infinite-canvas',
  template: `
    <div class="canvas-container">
      <canvas #canvas></canvas>
      <div class="location-info" *ngIf="locationInfo">
        <h3>Your Location Data</h3>
        <p>IP: {{locationInfo.ip}}</p>
        <p>City: {{locationInfo.city}}</p>
        <p>Country: {{locationInfo.country_name}}</p>
      </div>
    </div>
  `,
  styles: [`
    .canvas-container {
      width: 100%;
      height: 100vh;
      position: relative;
      overflow: hidden;
    }

    canvas {
      position: absolute;
      top: 0;
      left: 0;
      touch-action: none;
    }

    .location-info {
      position: absolute;
      top: 20px;
      right: 20px;
      background: rgba(255, 255, 255, 0.9);
      padding: 15px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      z-index: 1;
    }
  `]
})
export class InfiniteCanvasComponent implements OnInit, AfterViewInit {
  @ViewChild('canvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  public locationInfo: LocationData | null = null;
  private ctx!: CanvasRenderingContext2D;
  private objects: ApiObject[] = [];
  private scale = 1;
  private offset: Point = { x: 0, y: 0 };
  private isDragging = false;
  private lastPoint: Point | null = null;
  private animationFrameId: number | null = null;

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadData();
  }

  ngAfterViewInit(): void {
    this.initializeCanvas();
    this.setupEventListeners();
    this.startDrawLoop();
  }

  private loadData(): void {
    forkJoin({
      location: this.apiService.getIpData(),
      objects: this.apiService.getObjects()
    }).subscribe({
      next: (data) => {
        this.locationInfo = data.location;
        this.objects = data.objects;
        this.draw();
      },
      error: (error) => {
        console.error('Error loading data:', error);
      }
    });
  }

  private initializeCanvas(): void {
    const canvas = this.canvasRef.nativeElement;
    this.ctx = canvas.getContext('2d')!;
    this.resizeCanvas();
  }

  @HostListener('window:resize')
  private resizeCanvas(): void {
    const canvas = this.canvasRef.nativeElement;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    this.draw();
  }

  private setupEventListeners(): void {
    const canvas = this.canvasRef.nativeElement;

    // Pan handling
    canvas.addEventListener('mousedown', (e) => this.startDrag(e.clientX, e.clientY));
    canvas.addEventListener('mousemove', (e) => this.drag(e.clientX, e.clientY));
    canvas.addEventListener('mouseup', () => this.endDrag());
    canvas.addEventListener('mouseleave', () => this.endDrag());

    // Touch handling
    canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      this.startDrag(touch.clientX, touch.clientY);
    });
    canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      this.drag(touch.clientX, touch.clientY);
    });
    canvas.addEventListener('touchend', () => this.endDrag());

    // Zoom handling
    canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      this.zoom(delta, { x: e.clientX, y: e.clientY });
    });
  }

  private startDrag(x: number, y: number): void {
    this.isDragging = true;
    this.lastPoint = { x, y };
  }

  private drag(x: number, y: number): void {
    if (!this.isDragging || !this.lastPoint) return;

    const dx = x - this.lastPoint.x;
    const dy = y - this.lastPoint.y;

    this.offset.x += dx;
    this.offset.y += dy;

    this.lastPoint = { x, y };
    this.draw();
  }

  private endDrag(): void {
    this.isDragging = false;
    this.lastPoint = null;
  }

  private zoom(delta: number, point: Point): void {
    const oldScale = this.scale;
    this.scale *= delta;
    this.scale = Math.min(Math.max(0.1, this.scale), 5); // Limit zoom

    // Adjust offset to zoom toward mouse position
    const factor = this.scale / oldScale - 1;
    this.offset.x -= (point.x - this.offset.x) * factor;
    this.offset.y -= (point.y - this.offset.y) * factor;

    this.draw();
  }

  private startDrawLoop(): void {
    const animate = () => {
      this.draw();
      this.animationFrameId = requestAnimationFrame(animate);
    };
    animate();
  }

  private draw(): void {
    if (!this.ctx) return;

    const canvas = this.canvasRef.nativeElement;
    this.ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Save the current state
    this.ctx.save();

    // Apply transformations
    this.ctx.translate(this.offset.x, this.offset.y);
    this.ctx.scale(this.scale, this.scale);

    // Draw grid
    this.drawGrid();

    // Draw objects
    this.objects.forEach((obj, index) => {
      const x = (index % 5) * 200;
      const y = Math.floor(index / 5) * 200;
      this.drawObject(obj, x, y);
    });

    // Restore the state
    this.ctx.restore();
  }

  private drawGrid(): void {
    const gridSize = 50;
    const canvas = this.canvasRef.nativeElement;

    // Calculate visible grid area
    const startX = Math.floor(-this.offset.x / (gridSize * this.scale)) * gridSize;
    const startY = Math.floor(-this.offset.y / (gridSize * this.scale)) * gridSize;
    const endX = startX + canvas.width / this.scale + gridSize;
    const endY = startY + canvas.height / this.scale + gridSize;

    this.ctx.strokeStyle = '#eee';
    this.ctx.lineWidth = 0.5;

    for (let x = startX; x < endX; x += gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, startY);
      this.ctx.lineTo(x, endY);
      this.ctx.stroke();
    }

    for (let y = startY; y < endY; y += gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(startX, y);
      this.ctx.lineTo(endX, y);
      this.ctx.stroke();
    }
  }

  private drawObject(obj: ApiObject, x: number, y: number): void {
    // Draw card background
    this.ctx.fillStyle = '#f0f0f0';
    this.ctx.strokeStyle = '#ddd';
    this.ctx.lineWidth = 1;
    this.roundRect(x, y, 150, 100, 5);
    this.ctx.fill();
    this.ctx.stroke();

    // Draw text
    this.ctx.fillStyle = '#333';
    this.ctx.font = '14px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(obj.name || `Object ${obj.id}`, x + 75, y + 50);
  }

  private roundRect(x: number, y: number, w: number, h: number, r: number): void {
    this.ctx.beginPath();
    this.ctx.moveTo(x + r, y);
    this.ctx.arcTo(x + w, y, x + w, y + h, r);
    this.ctx.arcTo(x + w, y + h, x, y + h, r);
    this.ctx.arcTo(x, y + h, x, y, r);
    this.ctx.arcTo(x, y, x + w, y, r);
    this.ctx.closePath();
  }

  ngOnDestroy(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }
}
