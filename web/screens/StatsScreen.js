/**
 * StatsScreen — statistics and charts.
 *
 * Chart.js is loaded from CDN.
 */

import { getStats } from '../services/ObservationService.js'
import { getCategoryById, loadCategories } from '../models/Category.js'
import { formatMonth } from '../utils/date.js'
import { escapeHtml } from '../utils/format.js'
import { exportObservations, importObservations } from '../services/ExportService.js'
import { showToast } from '../components/Toast.js'

/**
 * Renders the Stats screen into container.
 * @param {HTMLElement} container
 */
export default async function render(container) {
  await loadCategories()
  const stats = getStats()

  container.innerHTML = `
    <div class="screen stats-screen">
      <header class="screen__header">
        <h1>Statistics</h1>
      </header>

      <div class="stats-row">
        <div class="stat-card">
          <span class="stat-card__value">${stats.totalCount}</span>
          <span class="stat-card__label">Observations</span>
        </div>
        <div class="stat-card">
          <span class="stat-card__value">${stats.speciesCount}</span>
          <span class="stat-card__label">Species</span>
        </div>
        <div class="stat-card">
          <span class="stat-card__value">${stats.activeDays}</span>
          <span class="stat-card__label">Active days</span>
        </div>
      </div>

      ${stats.totalCount > 0 ? `
        <section class="chart-section">
          <h2 class="section-title">By Category</h2>
          <div class="chart-wrapper">
            <canvas id="chart-category" aria-label="Category breakdown chart" role="img"></canvas>
          </div>
        </section>

        <section class="chart-section">
          <h2 class="section-title">Observations per Month</h2>
          <div class="chart-wrapper">
            <canvas id="chart-monthly" aria-label="Monthly observations chart" role="img"></canvas>
          </div>
        </section>

        <section class="top-species">
          <h2 class="section-title">Top Species</h2>
          <ol class="top-species__list">
            ${stats.topSpecies.map((s, i) => `
              <li class="top-species__item">
                <span class="top-species__rank">${i + 1}</span>
                <span class="top-species__name">${escapeHtml(s.species)}</span>
                <span class="top-species__count">${s.count}</span>
              </li>
            `).join('')}
          </ol>
        </section>
      ` : `
        <div class="empty-state">
          <span class="empty-state__icon" aria-hidden="true">📊</span>
          <p>Log some observations to see your statistics.</p>
          <a href="#/log" class="btn btn-primary">Log your first observation</a>
        </div>
      `}

      <section class="data-section">
        <h2 class="section-title">Data</h2>
        <div class="data-section__actions">
          <button class="btn btn-secondary" id="export-btn">Export JSON</button>
          <label class="btn btn-secondary" for="import-input">
            Import JSON
            <input type="file" id="import-input" accept=".json" class="sr-only">
          </label>
        </div>
      </section>
    </div>
  `

  // Charts
  if (stats.totalCount > 0) {
    if (!window.Chart) {
      await loadChartJs()
    }
    renderCategoryChart(stats)
    renderMonthlyChart(stats)
  }

  // Export
  container.querySelector('#export-btn')?.addEventListener('click', () => {
    try {
      exportObservations()
      showToast('Observations exported ✓', 'success')
    } catch (err) {
      showToast(`Export failed: ${err.message}`, 'error')
    }
  })

  // Import
  container.querySelector('#import-input')?.addEventListener('change', async e => {
    const file = e.target.files[0]
    if (!file) return
    try {
      const { imported, skipped } = await importObservations(file)
      showToast(`Imported ${imported} observation${imported !== 1 ? 's' : ''}${skipped ? ` (${skipped} skipped)` : ''} ✓`, 'success')
      render(container)
    } catch (err) {
      showToast(`Import failed: ${err.message}`, 'error')
    }
  })
}

/**
 * Renders the category donut chart.
 */
function renderCategoryChart(stats) {
  const canvas = document.querySelector('#chart-category')
  if (!canvas) return

  const entries = Object.entries(stats.byCategory)
  const labels = entries.map(([id]) => getCategoryById(id)?.label ?? id)
  const data = entries.map(([, count]) => count)
  const colors = [
    '#1565C0', '#6D4C41', '#558B2F', '#00838F',
    '#EF6C00', '#2E7D32', '#7B1FA2', '#546E7A',
  ]

  new window.Chart(canvas, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{ data, backgroundColor: colors.slice(0, data.length) }],
    },
    options: {
      responsive: true,
      plugins: { legend: { position: 'bottom' } },
    },
  })
}

/**
 * Renders the monthly bar chart.
 */
function renderMonthlyChart(stats) {
  const canvas = document.querySelector('#chart-monthly')
  if (!canvas) return

  const sortedMonths = Object.keys(stats.byMonth).sort()
  const labels = sortedMonths.map(formatMonth)
  const data = sortedMonths.map(m => stats.byMonth[m])

  new window.Chart(canvas, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Observations',
        data,
        backgroundColor: '#60AD5E',
      }],
    },
    options: {
      responsive: true,
      scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } },
      plugins: { legend: { display: false } },
    },
  })
}

/**
 * Dynamically loads Chart.js from CDN.
 * @returns {Promise<void>}
 */
function loadChartJs() {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js'
    script.onload = resolve
    script.onerror = reject
    document.head.appendChild(script)
  })
}
