const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

class DataProcessor {
    constructor() {
        // Update dengan nama file Excel yang sesuai
        this.dataFile = path.join(__dirname, 'DAFTAR SEWA ATM DAN OUTLET TERBARU 2025 v1 (6).xlsx');
        this.locations = [];
        this.lastModified = null;
    }

    // Check if Excel file exists and is accessible
    fileExists() {
        return fs.existsSync(this.dataFile);
    }

    // Load data from Excel file
    loadData() {
        try {
            if (!this.fileExists()) {
                console.error('Excel file not found at:', this.dataFile);
                throw new Error('Excel file not found');
            }

            // Check if file has been modified since last load
            const stats = fs.statSync(this.dataFile);
            if (this.lastModified && stats.mtime <= this.lastModified) {
                return this.locations; // Return cached data
            }

            console.log('Loading data from Excel file...');
            
            // Read the Excel file
            const workbook = XLSX.readFile(this.dataFile);
            
            console.log('Available sheets:', workbook.SheetNames);
            
            // EXPLICITLY USE "SEWA" SHEET
            const sheetName = 'SEWA';
            
            if (!workbook.SheetNames.includes(sheetName)) {
                console.error(`Sheet "${sheetName}" not found in workbook`);
                throw new Error(`Sheet "${sheetName}" not found`);
            }
            
            const worksheet = workbook.Sheets[sheetName];
            console.log(`Using sheet: ${sheetName}`);
            
            // Convert to JSON
            const rawData = XLSX.utils.sheet_to_json(worksheet, {
                raw: false,
                defval: ''
            });
            
            console.log(`Raw data rows: ${rawData.length}`);
            if (rawData.length > 0) {
                console.log('Sample row:', rawData[0]);
                console.log('Available columns:', Object.keys(rawData[0]));
            }
            
            // Process and clean the data
            this.locations = this.processRawData(rawData);
            this.lastModified = stats.mtime;
            
            console.log(`✅ Successfully loaded ${this.locations.length} locations from SEWA sheet`);
            return this.locations;
            
        } catch (error) {
            console.error('Error loading Excel data:', error);
            // Return sample data as fallback
            return this.getSampleData();
        }
    }

    // Process raw Excel data into our required format
    processRawData(rawData) {
        const processedData = [];
        
        rawData.forEach((row, index) => {
            try {
                const lokasi = this.getFieldValue(row, ['LOKASI', 'Lokasi', 'NAMA ATM', 'Nama Lokasi', 'Location']);
                const jenis = this.getFieldValue(row, ['JENIS', 'Jenis', 'Type', 'JENIS MESIN']);
                const expiryDateValue = this.getFieldValue(row, ['TANGGAL BERAKHIR', 'Tanggal Berakhir', 'Expiry Date', 'Jatuh Tempo']);
                const yearlyRentValue = this.getFieldValue(row, [' BIAYA SEWA ', 'BIAYA SEWA', 'Biaya Sewa', 'Yearly Rent', 'Sewa Tahunan', 'Cost']);

                if (!lokasi || !jenis) {
                    return;
                }

                let parsedYearlyRent;
                if (expiryDateValue === 'ASET BNI') {
                    parsedYearlyRent = 0; // Set biaya sewa ke 0 untuk ASET BNI
                } else {
                    parsedYearlyRent = this.parseAmount(yearlyRentValue);
                }

                const location = {
                    id: index + 1,
                    name: lokasi.toString().trim(),
                    address: this.getFieldValue(row, ['ALAMAT', 'Alamat', 'Address', 'ALAMAT ATM']) || '',
                    type: this.normalizeType(jenis),
                    owner: this.getFieldValue(row, [' PEMILIK ', 'PEMILIK', 'Pemilik', 'Owner', 'NAMA']) || '',
                    expiryDate: expiryDateValue === 'ASET BNI' ? 'MILIK BNI' : this.parseDate(expiryDateValue),
                    yearlyRent: parsedYearlyRent, // Gunakan nilai yang sudah diparse
                    status: expiryDateValue === 'ASET BNI' ? 'Aman' : undefined,
                    lat: this.parseCoordinate(this.getFieldValue(row, ['LATITUDE', 'Latitude', 'Lat', 'Lintang'])),
                    lng: this.parseCoordinate(this.getFieldValue(row, ['LONGTITUDE', 'LONGITUDE', 'Longitude', 'Lng', 'Long', 'Bujur']))
                };

                // Only add locations with valid coordinates - SKIP if no coordinates
                if (location.lat && location.lng && 
                    typeof location.lat === 'number' && typeof location.lng === 'number' && 
                    !isNaN(location.lat) && !isNaN(location.lng) &&
                    location.lat !== 0 && location.lng !== 0) {
                    processedData.push(location);
                } else {
                    console.log(`⚠️  Skipping "${location.name}" - no valid coordinates`);
                }
                
            } catch (error) {
                console.warn(`Error processing row ${index + 1}:`, error);
            }
        });

        return processedData;
    }

    // Helper function to get field value with multiple possible column names
    getFieldValue(row, possibleFields) {
        for (const field of possibleFields) {
            if (row[field] !== undefined && row[field] !== null && row[field] !== '') {
                return row[field];
            }
        }
        return null;
    }

    // Parse date from various formats
    parseDate(dateValue) {
        if (!dateValue || dateValue === '' || dateValue === null || dateValue === undefined) {
            return '-'; // Return dash instead of random date
        }
        
        try {
            // Handle Excel serial date numbers
            if (typeof dateValue === 'number') {
                const date = XLSX.SSF.parse_date_code(dateValue);
                return `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`;
            }
            
            // Handle DD/MM/YYYY format (common in Indonesia)
            if (typeof dateValue === 'string' && dateValue.includes('/')) {
                const parts = dateValue.split('/');
                if (parts.length === 3) {
                    const day = parts[0].padStart(2, '0');
                    const month = parts[1].padStart(2, '0');
                    const year = parts[2];
                    return `${year}-${month}-${day}`;
                }
            }
            
            // Handle string dates
            if (typeof dateValue === 'string') {
                const date = new Date(dateValue);
                if (!isNaN(date.getTime())) {
                    return date.toISOString().split('T')[0];
                }
            }
            
            return '-'; // Return dash for invalid dates
        } catch (error) {
            console.warn('Error parsing date:', dateValue, error);
            return '-';
        }
    }

    // Parse monetary amounts
    parseAmount(amountValue) {
        if (!amountValue || amountValue === '' || amountValue === null || amountValue === undefined) {
            return 0; // Return 0 instead of random amount
        }
        
        try {
            // Remove currency symbols and formatting (Rp. 666.666.666,-)
            let amount = String(amountValue)
                .replace(/Rp\.?/gi, '')  // Remove Rp
                .replace(/\./g, '')       // Remove thousand separators
                .replace(/,/g, '')        // Remove decimal separator
                .replace(/\s/g, '')       // Remove spaces
                .replace(/-/g, '');       // Remove dash
            
            amount = parseInt(amount);
            
            if (isNaN(amount) || amount <= 0) {
                return 0; // Return 0 for invalid amounts
            }
            
            return amount;
        } catch (error) {
            console.warn('Error parsing amount:', amountValue, error);
            return 0;
        }
    }

    // Parse coordinates
    parseCoordinate(coordValue) {
        if (!coordValue || coordValue === '' || coordValue === null || coordValue === undefined) {
            return null;
        }
        
        try {
            // Handle string coordinates with comma as decimal separator
            let coordStr = String(coordValue).trim().replace(',', '.');
            const coord = parseFloat(coordStr);
            
            // Check if valid number and not zero
            if (isNaN(coord) || coord === 0) {
                return null;
            }
            
            return coord;
        } catch (error) {
            console.warn('Error parsing coordinate:', coordValue, error);
            return null;
        }
    }

    // Generate random coordinates within Manado area
    getRandomManadoCoordinates() {
        const baseLatitude = 1.4748;
        const baseLongitude = 124.8421;
        const range = 0.1; // Approximately 10km radius
        
        return {
            lat: baseLatitude + (Math.random() - 0.5) * range,
            lng: baseLongitude + (Math.random() - 0.5) * range
        };
    }

    // Normalize machine types
    normalizeType(type) {
        if (!type) return 'ATM';
        
        const typeStr = String(type).toUpperCase().trim();
        if (typeStr.includes('CRM') || typeStr.includes('CASH RECYCLING')) {
            return 'CRM';
        }
        return 'ATM';
    }

    // Fallback sample data if Excel file can't be read
    getSampleData() {
        console.log('⚠️  Using sample data as fallback');
        return [
            { id: 1, name: "Manado Town Square", lat: 1.4748, lng: 124.8421, type: "ATM", owner: "PT. Megah Properti", expiryDate: "2025-02-15", yearlyRent: 48000000, address: "Jl. Piere Tendean" },
            { id: 2, name: "Transmart Manado", lat: 1.4921, lng: 124.8472, type: "CRM", owner: "Transmart Group", expiryDate: "2025-04-20", yearlyRent: 60000000, address: "Jl. Sutomo" },
            { id: 3, name: "Manado Trade Center", lat: 1.4801, lng: 124.8456, type: "ATM", owner: "CV. Jaya Abadi", expiryDate: "2025-08-10", yearlyRent: 36000000, address: "Jl. RE Martadinata" },
            { id: 4, name: "Mega Mall", lat: 1.4567, lng: 124.8290, type: "ATM", owner: "PT. Mega Mall", expiryDate: "2026-01-05", yearlyRent: 54000000, address: "Jl. Pierre Tendean Boulevard" },
            { id: 5, name: "Bahu Mall", lat: 1.4556, lng: 124.8321, type: "CRM", owner: "Bahu Group", expiryDate: "2025-03-25", yearlyRent: 45000000, address: "Jl. Wolter Monginsidi" }
        ];
    }

    // Get locations (load from Excel if needed)
    getLocations() {
        return this.loadData();
    }

    // Refresh data (reload from Excel)
    refreshData() {
        this.lastModified = null; // Force reload
        return this.loadData();
    }
    // Save a new location to the Excel file
    async saveNewLocation(newLocation) {
    try {
        // Gunakan this.dataFile, bukan this.filePath
        if (!this.fileExists()) {
            throw new Error('Excel file not found');
        }

        // Read existing workbook
        const workbook = XLSX.readFile(this.dataFile);
        
        // Use SEWA sheet
        const sheetName = 'SEWA';
        if (!workbook.SheetNames.includes(sheetName)) {
            throw new Error(`Sheet "${sheetName}" not found`);
        }
        
        const worksheet = workbook.Sheets[sheetName];
        
        // Convert worksheet to array of objects
        const data = XLSX.utils.sheet_to_json(worksheet);
        
        // Format new location for Excel (sesuaikan dengan header Excel Anda)
        const excelRow = {
            'LOKASI': newLocation.name,
            'JENIS': newLocation.type,
            ' PEMILIK ': newLocation.owner,
            'ALAMAT': newLocation.address,
            'TANGGAL BERAKHIR': newLocation.expiryDate,
            ' BIAYA SEWA ': newLocation.yearlyRent,
            'LATITUDE': newLocation.lat,
            'LONGTITUDE': newLocation.lng  // Note: typo from original Excel
        };
        
        // Add new row
        data.push(excelRow);
        
        // Convert back to worksheet
        const newWorksheet = XLSX.utils.json_to_sheet(data);
        workbook.Sheets[sheetName] = newWorksheet;
        
        // Write back to file
        XLSX.writeFile(workbook, this.dataFile);
        
        // Clear cache to force reload
        this.lastModified = null;
        
        return true;
    } catch (error) {
        console.error('Error saving new location:', error);
        throw error;
    }

    
    }
    //Delete file
    async deleteLocation(locationId) {
    try {
        if (!this.fileExists()) {
            throw new Error('Excel file not found');
        }

        // Read existing workbook
        const workbook = XLSX.readFile(this.dataFile);
        
        // Use SEWA sheet
        const sheetName = 'SEWA';
        if (!workbook.SheetNames.includes(sheetName)) {
            throw new Error(`Sheet "${sheetName}" not found`);
        }
        
        const worksheet = workbook.Sheets[sheetName];
        
        // Convert worksheet to array of objects
        let data = XLSX.utils.sheet_to_json(worksheet);
        
        // Find and remove the location
        const initialLength = data.length;
        data = data.filter((row, index) => {
            // Match by ID (index + 1) or by name
            const rowId = index + 1;
            const rowName = this.getFieldValue(row, ['LOKASI', 'Lokasi', 'NAMA ATM', 'Nama Lokasi', 'Location']);
            
            return rowId !== locationId && rowName !== locationId;
        });
        
        if (data.length === initialLength) {
            throw new Error('Location not found');
        }
        
        // Convert back to worksheet
        const newWorksheet = XLSX.utils.json_to_sheet(data);
        workbook.Sheets[sheetName] = newWorksheet;
        
        // Write back to file
        XLSX.writeFile(workbook, this.dataFile);
        
        // Clear cache to force reload
        this.lastModified = null;
        
        return true;
    } catch (error) {
        console.error('Error deleting location:', error);
        throw error;
    }
}
}

module.exports = DataProcessor;