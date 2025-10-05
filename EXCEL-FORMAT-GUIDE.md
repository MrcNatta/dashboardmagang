# Excel File Format Guide

The application expects an Excel file with the following column headers (case-insensitive):

## Required Columns:
- **Lokasi** / **Nama Lokasi** / **Location** - Name of the ATM/Outlet location
- **Jenis** / **Type** / **Mesin** / **ATM/CRM** - Type of machine (ATM or CRM)

## Optional Columns:
- **Alamat** / **Address** - Address of the location
- **Pemilik** / **Owner** / **Penyewa** - Owner/Tenant name
- **Tanggal Berakhir** / **Expiry Date** / **Jatuh Tempo** / **Expired** - Contract expiry date
- **Biaya Sewa** / **Yearly Rent** / **Sewa Tahunan** / **Cost** - Annual rent cost (in IDR)
- **Latitude** / **Lat** / **Lintang** - GPS Latitude coordinate
- **Longitude** / **Lng** / **Long** / **Bujur** - GPS Longitude coordinate

## Data Format Notes:

### Dates:
- Supported formats: Excel date numbers, YYYY-MM-DD, DD/MM/YYYY, MM/DD/YYYY
- Examples: "2025-12-31", "31/12/2025", Excel serial number 45565

### Currency:
- Accepts various formats: "Rp 50,000,000", "50000000", "50.000.000"
- Automatically removes currency symbols and formatting

### Coordinates:
- Decimal degrees format: -1.4748, 124.8421
- If coordinates are missing, random locations within Manado area will be assigned

### Machine Types:
- "ATM", "CRM", "Cash Recycling Machine" will be normalized to "ATM" or "CRM"

## Example Excel Structure:

| Lokasi | Jenis | Pemilik | Alamat | Tanggal Berakhir | Biaya Sewa | Latitude | Longitude |
|--------|-------|---------|---------|------------------|------------|----------|-----------|
| Manado Town Square | ATM | PT. Megah | Jl. Piere Tendean | 2025-02-15 | Rp 48,000,000 | 1.4748 | 124.8421 |
| Transmart Manado | CRM | Transmart Group | Jl. Sutomo | 2025-04-20 | 60000000 | 1.4921 | 124.8472 |

The application will automatically process and clean the data, handling missing values and format variations.
