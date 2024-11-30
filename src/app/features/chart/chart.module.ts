import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HighchartsChartModule } from 'highcharts-angular';
import { ChartComponent } from './chart.component';

// Import Highcharts modules
import * as Highcharts from 'highcharts';
import HighchartsMore from 'highcharts/highcharts-more';
import HighchartsExporting from 'highcharts/modules/exporting';

// Initialize modules
HighchartsMore(Highcharts);
HighchartsExporting(Highcharts);

@NgModule({
  declarations: [ChartComponent],
  imports: [
    CommonModule,
    HighchartsChartModule
  ],
  exports: [ChartComponent]
})
export class ChartModule { }
