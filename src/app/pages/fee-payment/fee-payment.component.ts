import { Component, AfterViewInit, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { ApiService } from '../../services/api.service';

declare var ApexCharts: any;

export interface FeeOverview {
  total_invoices: number;
  paid_invoices: number;
  pending_invoices: number;
  overdue_invoices: number;
  total_collected?: number;
  total_outstanding?: number;
  currency?: string;
  currencySymbol?: string;
}

export interface FeeChart {
  year?: number;
  labels: string[];
  series: number[];
}

export interface FeeTransaction {
  s_no?: number;
  id?: string;
  numericId?: number;
  invoice_number?: string;
  student_name?: string;
  parent_name?: string;
  grade?: string;
  inv_month?: string;
  total?: number;
  formattedAmount?: string;
  due_date?: string;
  status: string;
  paymentMethod?: string;
}

@Component({
  selector: 'app-fee-payment',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './fee-payment.component.html',
  styleUrls: []
})
export class FeePaymentComponent implements OnInit, AfterViewInit, OnDestroy {
  isLoading = false;

  overview: FeeOverview = {
    total_invoices: 0,
    paid_invoices: 0,
    pending_invoices: 0,
    overdue_invoices: 0,
    total_collected: 0,
    total_outstanding: 0,
    currency: 'USD',
    currencySymbol: '$'
  };

  chartData: FeeChart = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    series: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
  };

  transactions: FeeTransaction[] = [];

  // Filters
  searchTerm = '';
  selectedStatus = 'All Status';
  selectedGrade = 'All Grades';
  selectedYear = '2026';

  years = ['2026', '2025', '2024', '2023'];
  grades = [
    'All Grades',
    'Pre-K',
    'Kindergarten',
    '1st Grade',
    '2nd Grade',
    '3rd Grade',
    '4th Grade',
    '5th Grade',
    '6th Grade',
    '7th Grade',
    '8th Grade',
    '9th Grade',
    '10th Grade',
    '11th Grade',
    '12th Grade'
  ];

  // Pagination
  currentPage = 1;
  pageSize = 10;
  pageSizeOptions = [5, 10, 20, 50];

  private searchSubject = new Subject<string>();
  private searchSubscription?: Subscription;
  private chartInstance: any = null;

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.searchSubscription = this.searchSubject.pipe(
      debounceTime(400),
      distinctUntilChanged()
    ).subscribe(() => {
      this.currentPage = 1;
      this.fetchFeePayments();
    });

    this.fetchFeePayments();
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.renderChart(this.chartData.labels, this.chartData.series);
    }, 150);
  }

  ngOnDestroy(): void {
    this.searchSubscription?.unsubscribe();
    if (this.chartInstance) {
      try {
        this.chartInstance.destroy();
      } catch (e) { /* ignore */ }
    }
  }

  onSearchChange(val: string): void {
    this.searchSubject.next(val);
  }

  onStatusChange(status: string): void {
    this.selectedStatus = status;
    this.currentPage = 1;
    this.fetchFeePayments();
  }

  onGradeChange(grade: string): void {
    this.selectedGrade = grade;
    this.currentPage = 1;
    this.fetchFeePayments();
  }

  onYearChange(year: string): void {
    this.selectedYear = year;
    this.fetchFeePayments();
  }

  onPageSizeChange(size: number): void {
    this.pageSize = Number(size);
    this.currentPage = 1;
  }

  setPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  get filteredTransactions(): FeeTransaction[] {
    return this.transactions.filter(t => {
      // 1. Search Filter
      const search = (this.searchTerm || '').toLowerCase();
      const matchSearch = !search ||
        (t.student_name || '').toLowerCase().includes(search) ||
        (t.parent_name || '').toLowerCase().includes(search) ||
        (t.grade || '').toLowerCase().includes(search) ||
        (t.invoice_number || '').toLowerCase().includes(search);

      // 2. Status Filter
      const matchStatus = this.selectedStatus === 'All Status' ||
        (t.status || '').toLowerCase() === this.selectedStatus.toLowerCase() ||
        (this.selectedStatus === 'OVERDUE' && (t.status || '').toLowerCase().includes('over'));

      // 3. Grade Filter
      const matchGrade = this.selectedGrade === 'All Grades' ||
        (t.grade || '').toLowerCase() === this.selectedGrade.toLowerCase();

      return matchSearch && matchStatus && matchGrade;
    });
  }

  get totalPages(): number {
    const total = this.filteredTransactions.length;
    return Math.ceil(total / this.pageSize) || 1;
  }

  get paginatedTransactions(): FeeTransaction[] {
    const list = this.filteredTransactions;
    const startIndex = (this.currentPage - 1) * this.pageSize;
    return list.slice(startIndex, startIndex + this.pageSize);
  }

  get startIndex(): number {
    return this.filteredTransactions.length === 0 ? 0 : (this.currentPage - 1) * this.pageSize + 1;
  }

  get endIndex(): number {
    const end = this.currentPage * this.pageSize;
    return end > this.filteredTransactions.length ? this.filteredTransactions.length : end;
  }

  get pagesArray(): number[] {
    const total = this.totalPages;
    const current = this.currentPage;
    const maxVisible = 5;
    const pages: number[] = [];

    if (total <= maxVisible) {
      for (let i = 1; i <= total; i++) pages.push(i);
    } else {
      let start = Math.max(1, current - 2);
      let end = Math.min(total, start + maxVisible - 1);
      if (end - start < maxVisible - 1) {
        start = Math.max(1, end - maxVisible + 1);
      }
      for (let i = start; i <= end; i++) pages.push(i);
    }
    return pages;
  }

  fetchFeePayments(): void {
    this.isLoading = true;
    const params: any = {};

    if (this.searchTerm && this.searchTerm.trim()) {
      params.search = this.searchTerm.trim();
    }
    if (this.selectedStatus && this.selectedStatus !== 'All Status') {
      params.status = this.selectedStatus.toUpperCase().replace(/\s+/g, '_');
    }
    if (this.selectedGrade && this.selectedGrade !== 'All Grades') {
      params.grade = this.selectedGrade;
    }
    if (this.selectedYear) {
      params.year = this.selectedYear;
    }

    this.apiService.get<any>('admin/fee-payments', params).subscribe({
      next: (res) => {
        this.isLoading = false;
        const data = res?.data || res;
        if (data) {
          // 1. Overview Cards
          if (data.overview) {
            this.overview = {
              total_invoices: data.overview.total_invoices ?? 0,
              paid_invoices: data.overview.paid_invoices ?? 0,
              pending_invoices: data.overview.pending_invoices ?? 0,
              overdue_invoices: data.overview.overdue_invoices ?? 0,
              total_collected: data.overview.total_collected ?? 0,
              total_outstanding: data.overview.total_outstanding ?? 0,
              currency: data.overview.currency || 'USD',
              currencySymbol: data.overview.currencySymbol || '$'
            };
          } else if (data.stats) {
            this.overview = {
              total_invoices: data.stats.total_invoices ?? 0,
              paid_invoices: data.stats.paid_invoices ?? 0,
              pending_invoices: data.stats.pending_invoices ?? 0,
              overdue_invoices: data.stats.overdue_invoices ?? 0
            };
          }

          // 2. 12-Month Chart
          if (data.chart) {
            this.chartData = data.chart;
            this.renderChart(data.chart.labels, data.chart.series);
          }

          // 3. Transactions Table
          if (Array.isArray(data.transactions)) {
            this.transactions = data.transactions;
          } else if (Array.isArray(data.invoices)) {
            this.transactions = data.invoices;
          } else if (Array.isArray(data)) {
            this.transactions = data;
          }
        }
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Error fetching fee payments:', err);
      }
    });
  }

  renderChart(labels: string[] = [], seriesData: number[] = []): void {
    const defaultLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const finalLabels = (labels && labels.length) ? labels : defaultLabels;
    const finalSeries = (seriesData && seriesData.length) ? seriesData : [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

    const maxVal = Math.max(...finalSeries, 0);
    const maxY = maxVal > 0 ? Math.ceil(maxVal * 1.2) : 5000;

    const options = {
      series: [{
        name: 'Fees Collection',
        data: finalSeries
      }],
      chart: {
        type: 'area',
        height: 228,
        toolbar: { show: false },
        zoom: { enabled: false }
      },
      stroke: {
        curve: 'smooth',
        width: 3,
        colors: ['#F4C542']
      },
      fill: {
        type: 'gradient',
        gradient: {
          shadeIntensity: 0,
          opacityFrom: 0.45,
          opacityTo: 0,
          stops: [0, 100]
        },
        colors: ['#F4C542']
      },
      markers: {
        size: finalSeries.map(val => (val > 0 ? 5 : 0)),
        colors: ['#F4C542'],
        strokeColors: '#fff',
        strokeWidth: 2,
        hover: { size: 7 }
      },
      dataLabels: { enabled: false },
      grid: {
        borderColor: '#efefef',
        strokeDashArray: 0
      },
      xaxis: {
        categories: finalLabels,
        axisBorder: { show: false },
        axisTicks: { show: false }
      },
      yaxis: {
        min: 0,
        max: maxY,
        tickAmount: 3,
        labels: {
          formatter: (val: any) => '$' + Number(val).toLocaleString()
        }
      },
      tooltip: {
        y: {
          formatter: (val: any) => '$' + Number(val).toLocaleString()
        }
      },
      colors: ['#F4C542']
    };

    const chartEl = document.querySelector('#feesChart');
    if (chartEl && typeof ApexCharts !== 'undefined') {
      if (this.chartInstance) {
        this.chartInstance.updateOptions(options);
      } else {
        this.chartInstance = new ApexCharts(chartEl, options);
        this.chartInstance.render();
      }
    }
  }
}
