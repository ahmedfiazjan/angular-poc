import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../core/services/api.service';
import * as Highcharts from 'highcharts';

@Component({
  selector: 'app-chart',
  template: `
    <highcharts-chart
      [Highcharts]="Highcharts"
      [options]="chartOptions"
      style="width: 100%; height: 400px; display: block;">
    </highcharts-chart>
  `
})
export class ChartComponent implements OnInit {
  Highcharts: typeof Highcharts = Highcharts;
  chartOptions: Highcharts.Options = {
    chart: {
      type: 'line'
    },
    title: {
      text: 'API Data Visualization'
    },
    xAxis: {
      title: {
        text: 'Index'
      }
    },
    yAxis: {
      title: {
        text: 'Values'
      }
    },
    series: [{
      type: 'line',
      name: 'Objects',
      data: [] // Initialize with empty array
    }] as Highcharts.SeriesOptionsType[]
  };

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    this.apiService.getObjects().subscribe({
      next: (data: any[]) => {
        const seriesData = data.map((item, index) => ({
          x: index,
          y: parseInt(item.id) || index, // Ensure numeric value
          name: item.name || `Item ${index}`
        }));

        // Update chart with new configuration
        this.chartOptions = {
          ...this.chartOptions,
          series: [{
            type: 'line',
            name: 'Objects',
            data: seriesData
          }] as Highcharts.SeriesOptionsType[]
        };

        // Force chart redraw
        const chart = Highcharts.charts.find(c => c);
        if (chart) {
          chart.redraw();
        }
      },
      error: (error) => {
        console.error('Error fetching data:', error);
      }
    });
  }
}
