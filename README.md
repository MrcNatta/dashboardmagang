# BNI ATM Dashboard

Dashboard Monitoring ATM & Outlet untuk wilayah Manado yang dibangun dengan Electron.

## Features

- 🗺️ Peta interaktif lokasi ATM dan Outlet
- 📊 Dashboard dengan KPI dan analytics
- ⏰ Monitoring jatuh tempo kontrak sewa
- 🔍 Filter dan pencarian data
- 📱 Responsive design
- 💾 Export data functionality

## Development

### Prerequisites

- Node.js (v16 atau lebih baru)
- npm atau yarn

### Installation

1. Clone repository ini
2. Install dependencies:
   ```bash
   npm install
   ```

3. Jalankan aplikasi dalam mode development:
   ```bash
   npm run dev
   ```

### Build

Untuk membuat executable:

- Windows: `npm run build-win`
- macOS: `npm run build-mac`
- Linux: `npm run build-linux`
- Semua platform: `npm run dist`

## Project Structure

```
bni-map/
├── main.js              # Electron main process
├── index.html           # Dashboard UI
├── package.json         # Dependencies dan scripts
├── assets/              # Icons dan assets
└── dist/                # Built executables
```

## Technologies Used

- **Electron** - Desktop app framework
- **Leaflet** - Interactive maps
- **Chart.js** - Data visualization
- **Font Awesome** - Icons
- **HTML/CSS/JavaScript** - Frontend

## Data Source

Aplikasi ini menggunakan sample data untuk demo. Dalam implementasi produksi, data akan diambil dari database atau API.

## License

MIT License
