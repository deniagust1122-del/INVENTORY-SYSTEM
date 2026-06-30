/**
 * Utility for interacting with Google Sheets API directly from the client.
 */

export interface POItem {
  noPO: string;
  bulan: string;
  kodeBarang: string;
  namaBarang: string;
  qty: number;
  satuan: string;
  hargaSatuan: number;
  totalHarga: number;
  supplier: string;
  noSPB_LPB: string;
  rowIndex: number; // Row number in the spreadsheet
  diskon?: number;  // Optional
  ppn?: number;     // Optional
}

export interface MasterBarangItem {
  no: string;
  kodeBarang: string;
  namaBarang: string;
  satuan: string;
  stokAwalQty: number;
  stokAwalHarga: number;
  stokAwalTotal: number;
  penerimaanQty: number;
  penerimaanHarga: number;
  penerimaanTotal: number;
  pengeluaranQty: number;
  pengeluaranHarga: number;
  pengeluaranTotal: number;
  stokAkhirQty: number;
  stokAkhirHarga: number;
  stokAkhirTotal: number;
}

export interface PenerimaanItem {
  no: string;
  tanggal: string;
  noLPB: string;
  noPO: string;
  kodeBarang: string;
  supplier: string;
  namaBarang: string;
  satuan: string;
  qty: number;
  hargaSatuan: number;
  total: number;
  keterangan: string;
  kategori: string;
  verification: string;
  diskon?: number;
  ppn?: number;
  petugas?: string;
}

export interface PengeluaranItem {
  no: string;
  tanggal: string;
  noSKB: string;
  kodeBarang: string;
  namaBarang: string;
  satuan: string;
  qty: number;
  hargaSatuan: number;
  total: number;
  kodePakai: string;
  costCenter: string;
  coa: string;
  keterangan: string;
}

// --- OFFLINE STATE & PERSISTENCE CONFIGURATION ---
const LOCAL_PO_KEY = 'offline_po_items';
const LOCAL_MASTER_KEY = 'offline_master_barang_items';
const LOCAL_PENERIMAAN_KEY = 'offline_penerimaan_items';
const LOCAL_PENGELUARAN_KEY = 'offline_pengeluaran_items';
const LOCAL_USERS_KEY = 'offline_users';

export const DEFAULT_PO_ITEMS: POItem[] = [
  { noPO: 'PO-2026-001', bulan: 'Januari', kodeBarang: '1001', namaBarang: 'Semen Padang Type I', qty: 200, satuan: 'Sack', hargaSatuan: 65000, totalHarga: 13000000, supplier: 'PT. Semen Padang', noSPB_LPB: '', rowIndex: 4 },
  { noPO: 'PO-2026-001', bulan: 'Januari', kodeBarang: '1002', namaBarang: 'Besi Beton 12mm', qty: 150, satuan: 'Batang', hargaSatuan: 110000, totalHarga: 16500000, supplier: 'PT. Baja Utama', noSPB_LPB: '', rowIndex: 5 },
  { noPO: 'PO-2026-002', bulan: 'Februari', kodeBarang: '1003', namaBarang: 'Cat Tembok Weathercoat 20L', qty: 50, satuan: 'Pail', hargaSatuan: 450000, totalHarga: 22500000, supplier: 'PT. Jotun Indonesia', noSPB_LPB: '', rowIndex: 6 },
  { noPO: 'PO-2026-003', bulan: 'Maret', kodeBarang: '1004', namaBarang: 'Pipa PVC AW 3 Inch', qty: 100, satuan: 'Batang', hargaSatuan: 85000, totalHarga: 8500000, supplier: 'PT. Wavin Indonesia', noSPB_LPB: '', rowIndex: 7 },
  { noPO: 'PO-2026-003', bulan: 'Maret', kodeBarang: '1005', namaBarang: 'Kabel NYM 3x2.5mm 100m', qty: 40, satuan: 'Roll', hargaSatuan: 750000, totalHarga: 30000000, supplier: 'PT. Supreme Cable', noSPB_LPB: '', rowIndex: 8 }
];

export const DEFAULT_MASTER_BARANG: MasterBarangItem[] = [
  { no: '1', kodeBarang: '1001', namaBarang: 'Semen Padang Type I', satuan: 'Sack', stokAwalQty: 10, stokAwalHarga: 65000, stokAwalTotal: 650000, penerimaanQty: 200, penerimaanHarga: 65000, penerimaanTotal: 13000000, pengeluaranQty: 195, pengeluaranHarga: 65000, pengeluaranTotal: 12675000, stokAkhirQty: 15, stokAkhirHarga: 65000, stokAkhirTotal: 975000 },
  { no: '2', kodeBarang: '1002', namaBarang: 'Besi Beton 12mm', satuan: 'Batang', stokAwalQty: 5, stokAwalHarga: 110000, stokAwalTotal: 550000, penerimaanQty: 150, penerimaanHarga: 110000, penerimaanTotal: 16500000, pengeluaranQty: 153, pengeluaranHarga: 110000, pengeluaranTotal: 16830000, stokAkhirQty: 2, stokAkhirHarga: 110000, stokAkhirTotal: 220000 },
  { no: '3', kodeBarang: '1003', namaBarang: 'Cat Tembok Weathercoat 20L', satuan: 'Pail', stokAwalQty: 2, stokAwalHarga: 450000, stokAwalTotal: 900000, penerimaanQty: 50, penerimaanHarga: 450000, penerimaanTotal: 22500000, pengeluaranQty: 51, pengeluaranHarga: 450000, pengeluaranTotal: 22950000, stokAkhirQty: 1, stokAkhirHarga: 450000, stokAkhirTotal: 450000 },
  { no: '4', kodeBarang: '1004', namaBarang: 'Pipa PVC AW 3 Inch', satuan: 'Batang', stokAwalQty: 20, stokAwalHarga: 85000, stokAwalTotal: 1700000, penerimaanQty: 100, penerimaanHarga: 85000, penerimaanTotal: 8500000, pengeluaranQty: 90, pengeluaranHarga: 85000, pengeluaranTotal: 7650000, stokAkhirQty: 30, stokAkhirHarga: 85000, stokAkhirTotal: 2550000 },
  { no: '5', kodeBarang: '1005', namaBarang: 'Kabel NYM 3x2.5mm 100m', satuan: 'Roll', stokAwalQty: 8, stokAwalHarga: 750000, stokAwalTotal: 6000000, penerimaanQty: 40, penerimaanHarga: 750000, penerimaanTotal: 30000000, pengeluaranQty: 43, pengeluaranHarga: 750000, pengeluaranTotal: 32250000, stokAkhirQty: 5, stokAkhirHarga: 750000, stokAkhirTotal: 3750000 }
];

export const DEFAULT_PENERIMAAN: PenerimaanItem[] = [
  { no: '1', tanggal: '2026-01-10', noLPB: 'LPB-260110-01', noPO: 'PO-2026-001', kodeBarang: '1001', supplier: 'PT. Semen Padang', namaBarang: 'Semen Padang Type I', satuan: 'Sack', qty: 200, hargaSatuan: 65000, total: 13000000, keterangan: 'Semen untuk proyek gedung A', kategori: 'Semen', verification: 'TERVERIFIKASI' },
  { no: '2', tanggal: '2026-01-15', noLPB: 'LPB-260115-01', noPO: 'PO-2026-001', kodeBarang: '1002', supplier: 'PT. Baja Utama', namaBarang: 'Besi Beton 12mm', satuan: 'Batang', qty: 150, hargaSatuan: 110000, total: 16500000, keterangan: 'Besi beton tulangan', kategori: 'Besi', verification: 'TERVERIFIKASI' }
];

export const DEFAULT_PENGELUARAN: PengeluaranItem[] = [
  { no: '1', tanggal: '2026-01-12', noSKB: 'SKB-260112-01', kodeBarang: '1001', namaBarang: 'Semen Padang Type I', satuan: 'Sack', qty: 195, hargaSatuan: 65000, total: 12675000, kodePakai: 'PK-01', costCenter: 'CC-GedungA', coa: 'COA-5001', keterangan: 'Pembangunan fondasi' },
  { no: '2', tanggal: '2026-01-18', noSKB: 'SKB-260118-01', kodeBarang: '1002', namaBarang: 'Besi Beton 12mm', satuan: 'Batang', qty: 153, hargaSatuan: 110000, total: 16830000, kodePakai: 'PK-02', costCenter: 'CC-GedungA', coa: 'COA-5002', keterangan: 'Rangka kolom' }
];

function getLocalData<T>(key: string, defaultVal: T): T {
  if (typeof window === 'undefined') return defaultVal;
  const stored = localStorage.getItem(key);
  if (!stored) {
    localStorage.setItem(key, JSON.stringify(defaultVal));
    return defaultVal;
  }
  try {
    return JSON.parse(stored);
  } catch (e) {
    return defaultVal;
  }
}

function setLocalData<T>(key: string, data: T): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(data));
}

const DEFAULT_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbz_fKes1r8haO8YtnmLhExoSipmRr3RLlFKMC5vMREHGk_O7xgS1k5QAG7ElkRg9Qy7/exec';

export function getAppsScriptUrl(): string {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('apps_script_url') || DEFAULT_APPS_SCRIPT_URL;
  }
  return DEFAULT_APPS_SCRIPT_URL;
}

export function setAppsScriptUrl(url: string): void {
  if (typeof window !== 'undefined') {
    if (url.trim()) {
      localStorage.setItem('apps_script_url', url.trim());
    } else {
      localStorage.removeItem('apps_script_url');
    }
  }
}

async function getSheetValues(range: string, token: string): Promise<string[][]> {
  const exclamationIdx = range.indexOf('!');
  let sheetName = exclamationIdx !== -1 ? range.substring(0, exclamationIdx) : range;
  let cellRange = exclamationIdx !== -1 ? range.substring(exclamationIdx + 1) : '';
  
  if (sheetName.startsWith("'") && sheetName.endsWith("'")) {
    sheetName = sheetName.slice(1, -1);
  }
  
  const currentUrl = getAppsScriptUrl();
  const nocache = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const url = `${currentUrl}?action=read&sheet=${encodeURIComponent(sheetName)}&range=${encodeURIComponent(cellRange)}&_nocache=${nocache}`;
  const proxyUrl = `/api/proxy?url=${encodeURIComponent(url)}&_t=${nocache}`;
  const res = await fetch(proxyUrl, {
    cache: 'no-store',
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  });
  if (!res.ok) {
    throw new Error(`Apps Script Fetch Error: ${res.status} ${res.statusText}`);
  }
  const data = await res.json();
  if (data.status === 'error' || data.error) {
    throw new Error(data.error || data.message || 'Unknown Apps Script error');
  }
  return data.values || [];
}

/**
 * Appends a row of values to a specific sheet range.
 */
async function appendSheetRow(range: string, values: any[][], token: string): Promise<any> {
  const exclamationIdx = range.indexOf('!');
  let sheetName = exclamationIdx !== -1 ? range.substring(0, exclamationIdx) : range;
  let cellRange = exclamationIdx !== -1 ? range.substring(exclamationIdx + 1) : '';
  
  if (sheetName.startsWith("'") && sheetName.endsWith("'")) {
    sheetName = sheetName.slice(1, -1);
  }

  const payload = {
    action: 'append',
    sheet: sheetName,
    range: cellRange,
    values: values
  };

  const currentUrl = getAppsScriptUrl();
  const proxyUrl = `/api/proxy?url=${encodeURIComponent(currentUrl)}`;
  const res = await fetch(proxyUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    throw new Error(`Apps Script Append Error: ${res.status} ${res.statusText}`);
  }
  const data = await res.json();
  if (data.status === 'error' || data.error) {
    throw new Error(data.error || data.message || 'Unknown Apps Script append error');
  }
  return data;
}

/**
 * Updates a specific sheet range with values.
 */
async function updateSheetRow(range: string, values: any[][], token: string): Promise<any> {
  const exclamationIdx = range.indexOf('!');
  let sheetName = exclamationIdx !== -1 ? range.substring(0, exclamationIdx) : range;
  let cellRange = exclamationIdx !== -1 ? range.substring(exclamationIdx + 1) : '';
  
  if (sheetName.startsWith("'") && sheetName.endsWith("'")) {
    sheetName = sheetName.slice(1, -1);
  }

  const payload = {
    action: 'update',
    sheet: sheetName,
    range: cellRange,
    values: values
  };

  const currentUrl = getAppsScriptUrl();
  const proxyUrl = `/api/proxy?url=${encodeURIComponent(currentUrl)}`;
  const res = await fetch(proxyUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    throw new Error(`Apps Script Update Error: ${res.status} ${res.statusText}`);
  }
  const data = await res.json();
  if (data.status === 'error' || data.error) {
    throw new Error(data.error || data.message || 'Unknown Apps Script update error');
  }
  return data;
}

/**
 * Maps a flat data object to a sheet's headers, matching columns dynamically.
 * Supports synonyms, exact matches, and provides fallback logic.
 */
export function mapDataToHeaders(headers: string[], dataMap: Record<string, any>): any[] {
  const row = new Array(headers.length).fill('');
  
  headers.forEach((header, idx) => {
    const h = String(header || '').trim().toUpperCase();
    if (!h) return;
    
    // Check if there is a matching key in our dataMap
    for (const key of Object.keys(dataMap)) {
      const k = key.toUpperCase();
      if (h === k || h.replace(/\s+/g, '') === k.replace(/\s+/g, '')) {
        row[idx] = dataMap[key] !== undefined ? dataMap[key] : '';
        return;
      }
    }
    
    // Standard synonyms mapping
    if (h.includes('TGL') || h.includes('TANGGAL')) {
      row[idx] = dataMap.tanggal !== undefined ? dataMap.tanggal : '';
    } else if (h === 'NO LPB' || h === 'LPB' || h === 'NOMOR LPB' || h.includes('LPB')) {
      row[idx] = dataMap.noLPB !== undefined ? dataMap.noLPB : '';
    } else if (h === 'NO PO' || h === 'PO' || h === 'NOMOR PO' || h.includes('PO NUMBER')) {
      row[idx] = dataMap.noPO !== undefined ? dataMap.noPO : '';
    } else if (h === 'KODE BARANG' || h === 'KODEBARANG' || h === 'KODE') {
      row[idx] = dataMap.kodeBarang !== undefined ? dataMap.kodeBarang : '';
    } else if (h === 'KODE SUPLIER' || h === 'KODE SUPPLIER') {
      row[idx] = dataMap.kodeSuplier !== undefined ? dataMap.kodeSuplier : (dataMap.kodeSupplier !== undefined ? dataMap.kodeSupplier : 'SP00030');
    } else if (h === 'SUPPLIER' || h === 'SUPLIER' || h === 'NAMA SUPPLIER') {
      row[idx] = dataMap.supplier !== undefined ? dataMap.supplier : '';
    } else if (h === 'NAMA BARANG' || h === 'NAMA BARANG & SPESIFIKASI' || h.includes('SPESIFIKASI')) {
      row[idx] = dataMap.namaBarang !== undefined ? dataMap.namaBarang : '';
    } else if (h === 'SAT' || h === 'SATUAN') {
      row[idx] = dataMap.satuan !== undefined ? dataMap.satuan : '';
    } else if (h === 'JUMLAH' || h === 'QTY' || h === 'QUANTITY') {
      row[idx] = dataMap.qty !== undefined ? dataMap.qty : 0;
    } else if (h === 'HARGA @' || h === 'HARGA SATUAN' || h.includes('RP/STN')) {
      row[idx] = dataMap.hargaSatuan !== undefined ? dataMap.hargaSatuan : 0;
    } else if (h === 'DISKON' || h === 'DISCOUNT') {
      row[idx] = dataMap.diskon !== undefined ? dataMap.diskon : 0;
    } else if (h === 'PPN') {
      row[idx] = dataMap.ppn !== undefined ? dataMap.ppn : 0;
    } else if (h === 'TOTAL' || h === 'TOTAL HARGA') {
      row[idx] = dataMap.total !== undefined ? dataMap.total : 0;
    } else if (h === 'TOTAL BAYAR' || h === 'NETTO') {
      row[idx] = dataMap.totalBayar !== undefined ? dataMap.totalBayar : 0;
    } else if (h === 'KETERANGAN' || h === 'KET') {
      row[idx] = dataMap.keterangan !== undefined ? dataMap.keterangan : '';
    } else if (h === 'KATEGORY' || h === 'KATEGORI') {
      row[idx] = dataMap.kategori !== undefined ? dataMap.kategori : '';
    } else if (h === 'VERIFICATION' || h === 'STATUS') {
      row[idx] = dataMap.verification !== undefined ? dataMap.verification : '';
    } else if (h === 'NO SKB' || h === 'SKB' || h === 'NOMOR SKB' || h.includes('SKB')) {
      row[idx] = dataMap.noSKB !== undefined ? dataMap.noSKB : '';
    } else if (h === 'KODE PAKAI' || h.includes('PAKAI')) {
      row[idx] = dataMap.kodePakai !== undefined ? dataMap.kodePakai : '';
    } else if (h === 'COST CENTER' || h === 'CC') {
      row[idx] = dataMap.costCenter !== undefined ? dataMap.costCenter : '';
    } else if (h === 'COA') {
      row[idx] = dataMap.coa !== undefined ? dataMap.coa : '';
    } else if (h === 'PETUGAS' || h === 'OPERATOR' || h === 'USER' || h.includes('PETUGAS') || h.includes('OPERATOR') || h.includes('USER')) {
      row[idx] = dataMap.petugas !== undefined ? dataMap.petugas : '';
    }
  });
  
  return row;
}

/**
 * Finds the first empty row in PENERIMAAN starting from B3
 */
export async function getPenerimaanNextRow(token: string): Promise<number> {
  try {
    const rawRows = await getSheetValues('PENERIMAAN!B3:U', token);
    if (rawRows.length < 2) return 4;
    
    const dataRows = rawRows.slice(1);
    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];
      const isDateEmpty = !row[0] || String(row[0]).trim() === '';
      const isLpbEmpty = !row[1] || String(row[1]).trim() === '';
      const isPoEmpty = !row[2] || String(row[2]).trim() === '';
      
      if (isDateEmpty && isLpbEmpty && isPoEmpty) {
        return i + 4;
      }
    }
    return dataRows.length + 4;
  } catch (e) {
    console.error('Failed to find next empty row in PENERIMAAN:', e);
    try {
      const rawRows = await getSheetValues('Penerimaan!B3:U', token);
      if (rawRows.length < 2) return 4;
      const dataRows = rawRows.slice(1);
      for (let i = 0; i < dataRows.length; i++) {
        const row = dataRows[i];
        if ((!row[0] || String(row[0]).trim() === '') && (!row[1] || String(row[1]).trim() === '')) {
          return i + 4;
        }
      }
      return dataRows.length + 4;
    } catch (_) {
      return 4;
    }
  }
}

/**
 * Finds the first empty row in PENGELUARAN starting from B3
 */
export async function getPengeluaranNextRow(token: string): Promise<number> {
  try {
    const rawRows = await getSheetValues('PENGELUARAN!B3:N', token);
    if (rawRows.length < 2) return 4;
    
    const dataRows = rawRows.slice(1);
    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];
      const isDateEmpty = !row[0] || String(row[0]).trim() === '';
      const isSkbEmpty = !row[1] || String(row[1]).trim() === '';
      const isKodeEmpty = !row[2] || String(row[2]).trim() === '';
      
      if (isDateEmpty && isSkbEmpty && isKodeEmpty) {
        return i + 4;
      }
    }
    return dataRows.length + 4;
  } catch (e) {
    console.error('Failed to find next empty row in PENGELUARAN:', e);
    try {
      const rawRows = await getSheetValues('Pengeluaran!B3:N', token);
      if (rawRows.length < 2) return 4;
      const dataRows = rawRows.slice(1);
      for (let i = 0; i < dataRows.length; i++) {
        const row = dataRows[i];
        if ((!row[0] || String(row[0]).trim() === '') && (!row[1] || String(row[1]).trim() === '')) {
          return i + 4;
        }
      }
      return dataRows.length + 4;
    } catch (_) {
      return 4;
    }
  }
}

/**
 * Fetches and parses all PO items.
 */
export async function fetchPOItems(token: string): Promise<POItem[]> {
  if (!token) {
    return getLocalData<POItem[]>(LOCAL_PO_KEY, DEFAULT_PO_ITEMS);
  }
  try {
    // PO sheet: row 3 contains headers. We fetch from PO!A3:Q to ensure headers are matched.
    const rawRows = await getSheetValues('PO!A3:Q', token);
    if (rawRows.length < 2) return [];

    const headers = rawRows[0].map(h => String(h || '').trim().toUpperCase());
  const dataRows = rawRows.slice(1);

  // Helper to find index by header name
  const findColIndex = (names: string[]): number => {
    const exactIdx = headers.findIndex(h => names.some(name => h === name));
    if (exactIdx !== -1) return exactIdx;
    const cleanNames = names.map(n => n.replace(/[^A-Z0-9]/g, ''));
    const cleanHeaders = headers.map(h => h.replace(/[^A-Z0-9]/g, ''));
    const cleanIdx = cleanHeaders.findIndex(ch => cleanNames.some(cn => ch === cn));
    if (cleanIdx !== -1) return cleanIdx;
    return headers.findIndex(h => names.some(name => h.includes(name)));
  };

  const idxNoPO = findColIndex(['NO. PO', 'PO NUMBER']);
  const idxBulan = findColIndex(['BULAN', 'MONTH']);
  const idxKodeBarang = findColIndex(['KODE BARANG', 'KODEBARANG']);
  const idxNamaBarang = findColIndex(['NAMA BARANG', 'NAMA_BARANG']);
  const idxQty = findColIndex(['JUMLAH', 'QTY', 'QUANTITY']);
  const idxSatuan = findColIndex(['SATUAN', 'SAT']);
  const idxHargaSatuan = findColIndex(['HARGA SATUAN', 'RP/STN', 'HARGA @']);
  const idxTotalHarga = findColIndex(['TOTAL', 'TOTAL HARGA']);
  const idxSupplier = findColIndex(['SUPPLIER', 'PENYEDIA']);
  const idxNoSPB_LPB = findColIndex(['NO SPB/ LPB LMP', 'SPB', 'LPB']);
  const idxDiskon = findColIndex(['DISKON', 'DISC', 'POTONGAN']);
  const idxPpn = findColIndex(['PPN', 'PAJAK', 'TAX']);

  const items: POItem[] = [];

  dataRows.forEach((row, i) => {
    // A PO row must at least have a PO number to be valid
    const poNum = idxNoPO !== -1 ? String(row[idxNoPO] || '') : '';
    const name = idxNamaBarang !== -1 ? String(row[idxNamaBarang] || '') : '';
    
    if (!poNum || poNum.toLowerCase() === 'rekap po' || poNum.trim() === '') return;

    const parseNum = (val: any): number => {
      if (val === undefined || val === null) return 0;
      const strVal = String(val).trim();
      if (!strVal) return 0;
      // Remove currency, periods and commas, handle decimal point
      let cleaned = strVal.replace(/Rp\.?/g, '').replace(/\s/g, '');
      // If there are multiple periods, e.g. "280.000", they are thousands separators in Indonesian.
      // Let's replace dot with nothing if it is used as thousands separator.
      // Indonesian format: 280.000,00 -> 280000.00
      if (cleaned.indexOf(',') !== -1) {
        cleaned = cleaned.replace(/\./g, '').replace(/,/g, '.');
      } else {
        // e.g. "280.000" or "280000"
        // If there's a dot but it represents thousands (no decimals, length of last chunk is 3)
        const parts = cleaned.split('.');
        if (parts.length > 1 && parts[parts.length - 1].length === 3) {
          cleaned = cleaned.replace(/\./g, '');
        }
      }
      const num = parseFloat(cleaned);
      return isNaN(num) ? 0 : num;
    };

    const itemHargaSatuan = idxHargaSatuan !== -1 ? parseNum(row[idxHargaSatuan]) : (row[9] !== undefined ? parseNum(row[9]) : 0);
    const itemDiskon = idxDiskon !== -1 ? parseNum(row[idxDiskon]) : (row[11] !== undefined ? parseNum(row[11]) : 0);
    const itemPpn = idxPpn !== -1 ? parseNum(row[idxPpn]) : (row[12] !== undefined ? parseNum(row[12]) : 0);

    items.push({
      noPO: poNum,
      bulan: idxBulan !== -1 ? row[idxBulan] || '' : '',
      kodeBarang: idxKodeBarang !== -1 ? row[idxKodeBarang] || '' : '',
      namaBarang: name,
      qty: idxQty !== -1 ? parseNum(row[idxQty]) : 0,
      satuan: idxSatuan !== -1 ? row[idxSatuan] || '' : '',
      hargaSatuan: itemHargaSatuan,
      totalHarga: idxTotalHarga !== -1 ? parseNum(row[idxTotalHarga]) : 0,
      supplier: idxSupplier !== -1 ? row[idxSupplier] || '' : '',
      noSPB_LPB: idxNoSPB_LPB !== -1 ? row[idxNoSPB_LPB] || '' : '',
      rowIndex: i + 4, // Row 3 is headers, so first data row is Row 4 (1-indexed)
      diskon: itemDiskon,
      ppn: itemPpn
    });
  });

  return items;
  } catch (err) {
    console.warn('Failed to fetch PO items from Google Sheets. Using cached PO items.', err);
    return getLocalData<POItem[]>(LOCAL_PO_KEY, DEFAULT_PO_ITEMS);
  }
}

/**
 * Fetches and parses all MasterBarang items.
 */
export async function fetchMasterBarangItems(token: string): Promise<MasterBarangItem[]> {
  if (!token) {
    return getLocalData<MasterBarangItem[]>(LOCAL_MASTER_KEY, DEFAULT_MASTER_BARANG);
  }
  let rawRows: string[][] = [];
  try {
    rawRows = await getSheetValues('MUTASI BARANG!B1:R', token);
  } catch (err) {
    console.warn('MUTASI BARANG not found, falling back to MasterBarang:', err);
    try {
      rawRows = await getSheetValues('MasterBarang!B1:R', token);
    } catch (_) {
      try {
        rawRows = await getSheetValues('MasterBarang!A1:P', token);
      } catch (e) {
        console.warn('Could not load MasterBarang/MUTASI BARANG from Google Sheets. Using local/cached fallback data. This is normal if the backend URL has not been fully configured on your custom Spreadsheet.', e);
        return getLocalData<MasterBarangItem[]>(LOCAL_MASTER_KEY, DEFAULT_MASTER_BARANG);
      }
    }
  }
  if (rawRows.length < 2) return [];

  // Find header row automatically (checking for keywords like KODE, BARANG, NAMA)
  let headerRowIdx = 0;
  for (let i = 0; i < Math.min(rawRows.length, 5); i++) {
    const row = rawRows[i];
    const hasKode = row.some(cell => {
      const c = String(cell).toUpperCase();
      return c.includes('KODE') || c.includes('BARANG') || c.includes('NAMA');
    });
    if (hasKode) {
      headerRowIdx = i;
      break;
    }
  }

  const headers = rawRows[headerRowIdx].map(h => String(h || '').trim().toUpperCase());
  const dataRows = rawRows.slice(headerRowIdx + 1);

  // Helper to find index by header name
  const findColIndex = (names: string[], afterIndex: number = -1): number => {
    const exactIdx = headers.findIndex((h, idx) => idx > afterIndex && names.some(name => h === name));
    if (exactIdx !== -1) return exactIdx;
    const cleanNames = names.map(n => n.replace(/[^A-Z0-9]/g, ''));
    const cleanHeaders = headers.map(h => h.replace(/[^A-Z0-9]/g, ''));
    const cleanIdx = cleanHeaders.findIndex((ch, idx) => idx > afterIndex && cleanNames.some(cn => ch === cn));
    if (cleanIdx !== -1) return cleanIdx;
    return headers.findIndex((h, idx) => idx > afterIndex && names.some(name => h.includes(name)));
  };

  const idxKode = findColIndex(['KODE BARANG', 'KODEBARANG', 'KODE']);
  const idxNama = findColIndex(['NAMA BARANG', 'NAMA_BARANG', 'SPESIFIKASI', 'NAMA']);
  const idxSat = findColIndex(['SATUAN', 'SAT']);

  const parseNum = (val: any): number => {
    if (val === undefined || val === null) return 0;
    const strVal = String(val).trim();
    if (!strVal) return 0;
    let cleaned = strVal.replace(/Rp\.?/g, '').replace(/\s/g, '');
    if (cleaned.indexOf(',') !== -1) {
      cleaned = cleaned.replace(/\./g, '').replace(/,/g, '.');
    } else {
      const parts = cleaned.split('.');
      if (parts.length > 1 && parts[parts.length - 1].length === 3) {
        cleaned = cleaned.replace(/\./g, '');
      }
    }
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
  };

  const items: MasterBarangItem[] = [];

  dataRows.forEach((row, i) => {
    const colKode = idxKode !== -1 ? idxKode : 0;
    const colNama = idxNama !== -1 ? idxNama : 1;
    const colSat = idxSat !== -1 ? idxSat : 2;

    const kode = String(row[colKode] || '');
    const nama = String(row[colNama] || '');
    
    // Skip categories or empty rows
    if (!kode || isNaN(Number(kode)) || !nama || nama.includes('KOSONG') || nama.trim() === '') return;

    // Map columns relative to Column B (Kode Barang is Col B)
    // If range is MUTASI BARANG!B1:R, then index 0 is B, 1 is C, 2 is D, 3 is E, etc.
    const hasColQ_R = row.length >= 17; // Q is 15, R is 16

    items.push({
      no: String(i + 1),
      kodeBarang: kode,
      namaBarang: nama,
      satuan: row[colSat] || '',
      stokAwalQty: parseNum(row[3]),
      stokAwalHarga: parseNum(row[4]),
      stokAwalTotal: parseNum(row[5]),
      penerimaanQty: parseNum(row[6]),
      penerimaanHarga: parseNum(row[7]),
      penerimaanTotal: parseNum(row[8]),
      pengeluaranQty: parseNum(row[9]),
      pengeluaranHarga: parseNum(row[10]),
      pengeluaranTotal: parseNum(row[11]),
      // Use Column Q/R (Stok Akhir Qty and Stok Akhir Total) if available, otherwise fallback to Col N/P (index 12/14)
      stokAkhirQty: hasColQ_R ? parseNum(row[15]) : parseNum(row[12]),
      stokAkhirHarga: parseNum(row[13]),
      stokAkhirTotal: hasColQ_R ? parseNum(row[16]) : parseNum(row[14])
    });
  });

  return items;
}

/**
 * Fetches Penerimaan data starting from Column B to calculate new LPB numbers.
 */
export async function fetchPenerimaanItems(token: string): Promise<PenerimaanItem[]> {
  if (!token) {
    return getLocalData<PenerimaanItem[]>(LOCAL_PENERIMAAN_KEY, DEFAULT_PENERIMAAN);
  }
  let rawRows: string[][] = [];
  let isColBStart = true;
  try {
    rawRows = await getSheetValues('PENERIMAAN!B3:V', token);
  } catch (err) {
    console.warn('PENERIMAAN!B3:V failed, trying legacy Penerimaan!A3:V', err);
    try {
      rawRows = await getSheetValues('Penerimaan!A3:V', token);
      isColBStart = false;
    } catch (e) {
      console.warn('Could not load Penerimaan items from Google Sheets. Using local/cached fallback data. This is normal if the backend URL has not been fully configured on your custom Spreadsheet.', e);
      return getLocalData<PenerimaanItem[]>(LOCAL_PENERIMAAN_KEY, DEFAULT_PENERIMAAN);
    }
  }
  if (rawRows.length < 2) return [];

  const headers = rawRows[0].map(h => String(h || '').trim().toUpperCase());
  const dataRows = rawRows.slice(1);

  const findColIndex = (names: string[]): number => {
    const exactIdx = headers.findIndex(h => names.some(name => h === name));
    if (exactIdx !== -1) return exactIdx;
    const cleanNames = names.map(n => n.replace(/[^A-Z0-9]/g, ''));
    const cleanHeaders = headers.map(h => h.replace(/[^A-Z0-9]/g, ''));
    const cleanIdx = cleanHeaders.findIndex(ch => cleanNames.some(cn => ch === cn));
    if (cleanIdx !== -1) return cleanIdx;
    return headers.findIndex(h => names.some(name => h.includes(name)));
  };

  const idxTanggal = findColIndex(['TANGGAL', 'TGL', 'TANGGAL PENERIMAAN']);
  const idxNoLPB = findColIndex(['NO LPB', 'LPB', 'NOMOR LPB']);
  const idxNoPO = findColIndex(['NO PO', 'PO', 'NOMOR PO']);
  const idxSupplier = findColIndex(['SUPPLIER', 'SUPLIER', 'NAMA SUPPLIER']);
  const idxKodeBarang = findColIndex(['KODE BARANG', 'KODEBARANG', 'KODE']);
  const idxNamaBarang = findColIndex(['NAMA BARANG & SPESIFIKASI', 'NAMA BARANG', 'BARANG', 'SPESIFIKASI']);
  const idxSatuan = findColIndex(['SATUAN', 'SAT']);
  const idxQty = findColIndex(['QTY', 'JUMLAH', 'QUANTITY', 'QTY/JUMLAH']);
  const idxHargaSatuan = findColIndex(['HARGA SATUAN', 'HARGA @', 'RP/STN', 'HARGA']);
  const idxDiskon = findColIndex(['DISKON', 'DISCOUNT']);
  const idxPpn = findColIndex(['PPN']);
  const idxTotal = findColIndex(['TOTAL', 'TOTAL HARGA']);
  const idxKeterangan = findColIndex(['KETERANGAN', 'KET']);
  const idxKategori = findColIndex(['KATEGORI', 'KATEGORY']);
  const idxVerification = findColIndex(['VERIFICATION', 'STATUS', 'VERIFIKASI']);
  const idxPetugas = findColIndex(['PETUGAS', 'OPERATOR', 'USER']);

  const parseNum = (val: any): number => {
    if (val === undefined || val === null) return 0;
    const strVal = String(val).trim();
    if (!strVal) return 0;
    let cleaned = strVal.replace(/Rp\.?/g, '').replace(/\s/g, '');
    if (cleaned.indexOf(',') !== -1) {
      cleaned = cleaned.replace(/\./g, '').replace(/,/g, '.');
    } else {
      const parts = cleaned.split('.');
      if (parts.length > 1 && parts[parts.length - 1].length === 3) {
        cleaned = cleaned.replace(/\./g, '');
      }
    }
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
  };

  const items: PenerimaanItem[] = [];

  dataRows.forEach((row, i) => {
    const colOffset = isColBStart ? 1 : 0;

    // Helper to get value. Prioritizes the header-matched index from dynamic search,
    // otherwise falls back to the exact standard column letter index specified.
    // Standard Column 0-indexed values:
    // A=0, B=1 (Tanggal), C=2 (No PO), D=3 (No LPB), E=4 (Supplier), I=8 (Kode Barang), J=9 (Nama Barang), K=10 (Satuan), L=11 (Qty), M=12 (Harga Satuan), N=13 (Diskon), O=14 (PPN), P=15 (Total), Q=16 (Verification), R=17 (Keterangan), S=18 (Kategori), T=19 (Petugas)
    const getVal = (idxFromHeader: number, defaultColIdx: number): string => {
      const idx = idxFromHeader !== -1 ? idxFromHeader : (defaultColIdx - colOffset);
      if (idx >= 0 && idx < row.length) {
        return String(row[idx] ?? '').trim();
      }
      return '';
    };

    const tanggal = getVal(idxTanggal, 1);
    const poNum = getVal(idxNoPO, 2);
    const lpb = getVal(idxNoLPB, 3);
    const supplier = getVal(idxSupplier, 4);
    const kodeBarang = getVal(idxKodeBarang, 8);
    const namaBarang = getVal(idxNamaBarang, 9);
    const satuan = getVal(idxSatuan, 10);
    const qty = parseNum(getVal(idxQty, 11));
    const hargaSatuan = parseNum(getVal(idxHargaSatuan, 12));
    const diskon = parseNum(getVal(idxDiskon, 13));
    const ppn = parseNum(getVal(idxPpn, 14));
    const total = parseNum(getVal(idxTotal, 15));
    const verification = getVal(idxVerification, 16);
    const keterangan = getVal(idxKeterangan, 17);
    const kategori = getVal(idxKategori, 18);
    const petugas = getVal(idxPetugas, 20);

    if (!tanggal && !lpb && !namaBarang) return;

    items.push({
      no: getVal(-1, 0) || String(i + 1),
      tanggal,
      noLPB: lpb,
      noPO: poNum,
      kodeBarang,
      supplier,
      namaBarang,
      satuan,
      qty,
      hargaSatuan,
      total,
      keterangan,
      kategori,
      verification,
      diskon,
      ppn,
      petugas
    });
  });

  return items;
}

/**
 * Fetches Pengeluaran items.
 */
export async function fetchPengeluaranItems(token: string): Promise<PengeluaranItem[]> {
  if (!token) {
    return getLocalData<PengeluaranItem[]>(LOCAL_PENGELUARAN_KEY, DEFAULT_PENGELUARAN);
  }
  let rawRows: string[][] = [];
  let isColBStart = true;
  try {
    rawRows = await getSheetValues('PENGELUARAN!B3:P', token);
  } catch (err) {
    console.warn('PENGELUARAN!B3:P failed, trying legacy Pengeluaran!A3:Q', err);
    try {
      rawRows = await getSheetValues('Pengeluaran!A3:Q', token);
      isColBStart = false;
    } catch (e) {
      console.warn('Could not load Pengeluaran items from Google Sheets. Using local/cached fallback data. This is normal if the backend URL has not been fully configured on your custom Spreadsheet.', e);
      return getLocalData<PengeluaranItem[]>(LOCAL_PENGELUARAN_KEY, DEFAULT_PENGELUARAN);
    }
  }
  if (rawRows.length < 2) return [];

  const dataRows = rawRows.slice(1);
  const items: PengeluaranItem[] = [];

  dataRows.forEach((row, i) => {
    const offset = isColBStart ? -1 : 0;

    const tanggal = row[1 + offset] || '';
    const skb = row[2 + offset] || '';
    const kodeBarang = row[3 + offset] || '';
    const namaBarang = row[4 + offset] || '';
    
    if (!tanggal && !skb && !namaBarang) return;

    items.push({
      no: row[0 + offset] || String(i + 1),
      tanggal,
      noSKB: skb,
      kodeBarang,
      namaBarang,
      satuan: row[5 + offset] || '',
      qty: Number(row[6 + offset]) || 0,
      hargaSatuan: Number(row[7 + offset]) || 0,
      total: Number(row[8 + offset]) || 0,
      kodePakai: row[9 + offset] || '',
      costCenter: row[10 + offset] || '',
      coa: row[11 + offset] || '',
      keterangan: row[14 + offset] || ''
    });
  });

  return items;
}

async function initializePenerimaanSheet(token: string): Promise<void> {
  const values = [
    ['Tanggal', 'No LPB', 'No PO', 'Kode Barang', 'Kode Supplier', 'Supplier', 'Nama Barang', 'Satuan', 'Qty', 'Harga Satuan', 'Diskon', 'PPN', 'Total', 'Total Bayar', 'Keterangan', 'Kategori', 'Verification', 'Short Code', 'Petugas', 'Cetak']
  ];
  try {
    await updateSheetRow('PENERIMAAN!B3:U3', values, token);
    console.log('Successfully initialized PENERIMAAN sheet with headers!');
  } catch (err) {
    try {
      await updateSheetRow('Penerimaan!B3:U3', values, token);
      console.log('Successfully initialized Penerimaan sheet with headers!');
    } catch (e) {
      console.warn('Could not initialize Penerimaan sheet:', e);
    }
  }
}

async function initializePengeluaranSheet(token: string): Promise<void> {
  const values = [
    ['Tanggal', 'No SKB', 'Kode Barang', 'Nama Barang', 'Satuan', 'Qty', 'Harga Satuan', 'Total', 'Kode Pakai', 'Cost Center', 'COA', 'Sisa Anggaran', 'Keterangan']
  ];
  try {
    await updateSheetRow('PENGELUARAN!B3:N3', values, token);
    console.log('Successfully initialized PENGELUARAN sheet with headers!');
  } catch (err) {
    try {
      await updateSheetRow('Pengeluaran!B3:N3', values, token);
      console.log('Successfully initialized Pengeluaran sheet with headers!');
    } catch (e) {
      console.warn('Could not initialize Pengeluaran sheet:', e);
    }
  }
}

/**
 * Appends a Penerimaan record dynamically using Header Matching and Empty Row Detection.
 * This guarantees we write to the exact correct columns regardless of their shifting!
 */
export async function appendPenerimaanRow(
  data: {
    tanggal: string;
    noLPB: string;
    noPO: string;
    kodeBarang: string;
    kodeSuplier: string;
    supplier: string;
    namaBarang: string;
    satuan: string;
    qty: number;
    hargaSatuan: number;
    diskon: string;
    ppn: string;
    total: number;
    totalBayar: number;
    keterangan: string;
    kategori: string;
    check: string;
    verification: string;
    shortCode: string;
    petugas?: string;
  },
  token: string,
  appUrl: string
): Promise<any> {
  if (!token) {
    // 1. Get and append to Penerimaan items
    const localPenerimaan = getLocalData<PenerimaanItem[]>(LOCAL_PENERIMAAN_KEY, DEFAULT_PENERIMAAN);
    const newNo = String(localPenerimaan.length + 1);
    const newPenerimaanItem: PenerimaanItem = {
      no: newNo,
      tanggal: data.tanggal,
      noLPB: data.noLPB,
      noPO: data.noPO,
      kodeBarang: data.kodeBarang,
      supplier: data.supplier,
      namaBarang: data.namaBarang,
      satuan: data.satuan,
      qty: data.qty,
      hargaSatuan: data.hargaSatuan,
      total: data.total,
      keterangan: data.keterangan,
      kategori: data.kategori,
      verification: data.verification,
      diskon: Number(data.diskon) || 0,
      ppn: Number(data.ppn) || 0,
      petugas: data.petugas || ''
    };
    localPenerimaan.push(newPenerimaanItem);
    setLocalData(LOCAL_PENERIMAAN_KEY, localPenerimaan);

    // 2. Update Master Barang Stock Qty and Values
    const localMaster = getLocalData<MasterBarangItem[]>(LOCAL_MASTER_KEY, DEFAULT_MASTER_BARANG);
    const targetItem = localMaster.find(item => item.kodeBarang === data.kodeBarang);
    if (targetItem) {
      targetItem.penerimaanQty += data.qty;
      targetItem.penerimaanTotal += data.total;
      // Recalculate stok akhir
      targetItem.stokAkhirQty = targetItem.stokAwalQty + targetItem.penerimaanQty - targetItem.pengeluaranQty;
      targetItem.stokAkhirTotal = targetItem.stokAkhirQty * (targetItem.penerimaanHarga || targetItem.stokAwalHarga || 0);
    } else {
      // If code not found, register new item
      localMaster.push({
        no: String(localMaster.length + 1),
        kodeBarang: data.kodeBarang,
        namaBarang: data.namaBarang,
        satuan: data.satuan,
        stokAwalQty: 0,
        stokAwalHarga: data.hargaSatuan,
        stokAwalTotal: 0,
        penerimaanQty: data.qty,
        penerimaanHarga: data.hargaSatuan,
        penerimaanTotal: data.total,
        pengeluaranQty: 0,
        pengeluaranHarga: 0,
        pengeluaranTotal: 0,
        stokAkhirQty: data.qty,
        stokAkhirHarga: data.hargaSatuan,
        stokAkhirTotal: data.total
      });
    }
    setLocalData(LOCAL_MASTER_KEY, localMaster);

    // 3. Mark PO Item as delivered if matched
    const localPO = getLocalData<POItem[]>(LOCAL_PO_KEY, DEFAULT_PO_ITEMS);
    const matchedPo = localPO.find(po => po.noPO === data.noPO && po.kodeBarang === data.kodeBarang);
    if (matchedPo) {
      matchedPo.noSPB_LPB = matchedPo.noSPB_LPB ? `${matchedPo.noSPB_LPB}, ${data.noLPB}` : data.noLPB;
    }
    setLocalData(LOCAL_PO_KEY, localPO);

    return { status: 'success', offline: true };
  }

  const tStart = performance.now();
  console.log(`[PENERIMAAN_LOG] Memulai appendPenerimaanRow pada ${new Date().toLocaleTimeString()}...`);

  // First fetch the headers from PENERIMAAN!B3:U3
  let rawHeaders;
  let usePENERIMAAN = true;
  const tHeaderStart = performance.now();
  console.log(`[PENERIMAAN_LOG] 1. Mengambil headers kolom dari Google Sheets...`);
  try {
    rawHeaders = await getSheetValues('PENERIMAAN!B3:U3', token);
  } catch (err) {
    console.warn('PENERIMAAN!B3:U3 failed, trying legacy Penerimaan!B3:U3', err);
    try {
      rawHeaders = await getSheetValues('Penerimaan!B3:U3', token);
    } catch (e) {
      console.warn('Could not fetch legacy Penerimaan headers:', e);
    }
    usePENERIMAAN = false;
  }
  const tHeaderEnd = performance.now();
  console.log(`[PENERIMAAN_LOG] ✓ Selesai mengambil headers kolom dalam ${(tHeaderEnd - tHeaderStart).toFixed(2)}ms.`);
  
  if (!rawHeaders || rawHeaders.length === 0) {
    console.warn('Penerimaan headers empty, attempting to auto-initialize...');
    try {
      await initializePenerimaanSheet(token);
    } catch (e) {
      console.error('Failed to auto-create Penerimaan headers:', e);
    }
    rawHeaders = [['Tanggal', 'No LPB', 'No PO', 'Kode Barang', 'Kode Supplier', 'Supplier', 'Nama Barang', 'Satuan', 'Qty', 'Harga Satuan', 'Diskon', 'PPN', 'Total', 'Total Bayar', 'Keterangan', 'Kategori', 'Verification', 'Short Code', 'Petugas', 'Cetak']];
  }
  const headers = rawHeaders[0].map(h => String(h || '').trim().toUpperCase());
  
  // Find the exact bottom-most empty row starting from Row 4
  const tNextRowStart = performance.now();
  console.log(`[PENERIMAAN_LOG] 2. Mendeteksi baris kosong berikutnya di Google Sheets...`);
  const nextRow = await getPenerimaanNextRow(token);
  const tNextRowEnd = performance.now();
  console.log(`[PENERIMAAN_LOG] ✓ Berhasil mendeteksi baris kosong berikutnya (Baris: ${nextRow}) dalam ${(tNextRowEnd - tNextRowStart).toFixed(2)}ms.`);
 
  // Map values dynamically using mapDataToHeaders
  // We supply default values '0' for empty PPN/Diskon fields to prevent #VALUE! error
  const rowArray = mapDataToHeaders(headers, {
    tanggal: data.tanggal,
    noLPB: data.noLPB,
    noPO: data.noPO,
    kodeBarang: data.kodeBarang,
    kodeSuplier: data.kodeSuplier,
    supplier: data.supplier,
    namaBarang: data.namaBarang,
    satuan: data.satuan,
    qty: data.qty,
    hargaSatuan: data.hargaSatuan,
    diskon: data.diskon && String(data.diskon).trim() !== '' ? String(data.diskon) : '0',
    ppn: data.ppn && String(data.ppn).trim() !== '' ? String(data.ppn) : '0',
    total: data.total,
    totalBayar: data.totalBayar,
    keterangan: data.keterangan,
    kategori: data.kategori,
    verification: data.verification,
    shortCode: data.shortCode,
    petugas: data.petugas || ''
  });
 
  // Inject the dynamic print LPB HYPERLINK formula referencing current row cells (Column C for LPB)
  const idxCheck = headers.findIndex(h => h.includes('CHECK') || h.includes('CETAK') || h.includes('PRINT'));
  const printUrlDynamic = `=HYPERLINK("${appUrl}/cetak-lpb?no_lpb=" & C${nextRow}; "🖨️ Cetak LPB")`;
  if (idxCheck !== -1) {
    rowArray[idxCheck] = printUrlDynamic;
  } else {
    // Fallback to column T (index 18) if header matching is not successful
    if (rowArray.length > 18) {
      rowArray[18] = printUrlDynamic;
    }
  }
 
  // Update specific row range starting from Column B (B${nextRow}:U${nextRow})
  const sheetName = usePENERIMAAN ? 'PENERIMAAN' : 'Penerimaan';
  const rangeToUpdate = `${sheetName}!B${nextRow}:U${nextRow}`;
  
  const tUpdateRowStart = performance.now();
  console.log(`[PENERIMAAN_LOG] 3. Menulis baris data penerimaan baru ke Google Sheets range ${rangeToUpdate}...`);
  const updateRes = await updateSheetRow(rangeToUpdate, [rowArray], token);
  const tUpdateRowEnd = performance.now();
  console.log(`[PENERIMAAN_LOG] ✓ Selesai menulis data baris ke sheet dalam ${(tUpdateRowEnd - tUpdateRowStart).toFixed(2)}ms.`);

  // Also, we update the PO sheet to mark this item as delivered/partially delivered if needed!
  const tPoUpdateStart = performance.now();
  console.log(`[PENERIMAAN_LOG] 4. Memperbarui status item pada sheet PO...`);
  try {
    const poItems = await fetchPOItems(token);
    const matchedPo = poItems.find(po => po.noPO === data.noPO && po.kodeBarang === data.kodeBarang);
    if (matchedPo && matchedPo.rowIndex) {
      const currentLPBText = matchedPo.noSPB_LPB ? `${matchedPo.noSPB_LPB}, ${data.noLPB}` : data.noLPB;
      await updateSheetRow(`PO!Q${matchedPo.rowIndex}`, [[currentLPBText]], token);
    }
  } catch (poErr) {
    console.warn('Failed to update PO sheet delivery state:', poErr);
  }
  const tPoUpdateEnd = performance.now();
  console.log(`[PENERIMAAN_LOG] ✓ Selesai memperbarui status PO dalam ${(tPoUpdateEnd - tPoUpdateStart).toFixed(2)}ms.`);

  const tTotal = performance.now() - tStart;
  console.log(`[PENERIMAAN_LOG] 🎉 TOTAL PROSES PENULISAN PENERIMAAN SELESAI DALAM ${tTotal.toFixed(2)}ms.`);

  return updateRes;
}

/**
 * Appends a Pengeluaran record dynamically using Header Matching and Empty Row Detection.
 */
export async function appendPengeluaranRow(
  data: {
    tanggal: string;
    noSKB: string;
    kodeBarang: string;
    namaBarang: string;
    satuan: string;
    qty: number;
    hargaSatuan: number;
    total: number;
    kodePakai: string;
    costCenter: string;
    coa: string;
    keterangan: string;
  },
  token: string
): Promise<any> {
  if (!token) {
    // 1. Get and append to Pengeluaran items
    const localPengeluaran = getLocalData<PengeluaranItem[]>(LOCAL_PENGELUARAN_KEY, DEFAULT_PENGELUARAN);
    const newNo = String(localPengeluaran.length + 1);
    const newPengeluaranItem: PengeluaranItem = {
      no: newNo,
      tanggal: data.tanggal,
      noSKB: data.noSKB,
      kodeBarang: data.kodeBarang,
      namaBarang: data.namaBarang,
      satuan: data.satuan,
      qty: data.qty,
      hargaSatuan: data.hargaSatuan,
      total: data.total,
      kodePakai: data.kodePakai,
      costCenter: data.costCenter,
      coa: data.coa,
      keterangan: data.keterangan
    };
    localPengeluaran.push(newPengeluaranItem);
    setLocalData(LOCAL_PENGELUARAN_KEY, localPengeluaran);

    // 2. Update Master Barang Stock Qty and Values
    const localMaster = getLocalData<MasterBarangItem[]>(LOCAL_MASTER_KEY, DEFAULT_MASTER_BARANG);
    const targetItem = localMaster.find(item => item.kodeBarang === data.kodeBarang);
    if (targetItem) {
      targetItem.pengeluaranQty += data.qty;
      targetItem.pengeluaranTotal += data.total;
      // Recalculate stok akhir
      targetItem.stokAkhirQty = targetItem.stokAwalQty + targetItem.penerimaanQty - targetItem.pengeluaranQty;
      targetItem.stokAkhirTotal = targetItem.stokAkhirQty * (targetItem.stokAwalHarga || targetItem.penerimaanHarga || 0);
    }
    setLocalData(LOCAL_MASTER_KEY, localMaster);

    return { status: 'success', offline: true };
  }

  let rawHeaders;
  let usePENGELUARAN = true;
  try {
    rawHeaders = await getSheetValues('PENGELUARAN!B3:N3', token);
  } catch (err) {
    console.warn('PENGELUARAN!B3:N3 failed, trying legacy Pengeluaran!B3:N3', err);
    try {
      rawHeaders = await getSheetValues('Pengeluaran!B3:N3', token);
    } catch (e) {
      console.warn('Could not fetch legacy Pengeluaran headers:', e);
    }
    usePENGELUARAN = false;
  }

  if (!rawHeaders || rawHeaders.length === 0) {
    console.warn('Pengeluaran headers empty, attempting to auto-initialize...');
    try {
      await initializePengeluaranSheet(token);
    } catch (e) {
      console.error('Failed to auto-create Pengeluaran headers:', e);
    }
    rawHeaders = [['Tanggal', 'No SKB', 'Kode Barang', 'Nama Barang', 'Satuan', 'Qty', 'Harga Satuan', 'Total', 'Kode Pakai', 'Cost Center', 'COA', 'Sisa Anggaran', 'Keterangan']];
  }
  const headers = rawHeaders[0].map(h => String(h || '').trim().toUpperCase());
  
  // Find the exact bottom-most empty row starting from Row 4
  const nextRow = await getPengeluaranNextRow(token);

  // Map values dynamically using mapDataToHeaders
  const rowArray = mapDataToHeaders(headers, {
    tanggal: data.tanggal,
    noSKB: data.noSKB,
    kodeBarang: data.kodeBarang,
    namaBarang: data.namaBarang,
    satuan: data.satuan,
    qty: data.qty,
    hargaSatuan: data.hargaSatuan,
    total: data.total,
    kodePakai: data.kodePakai,
    costCenter: data.costCenter,
    coa: data.coa,
    keterangan: data.keterangan
  });

  const sheetName = usePENGELUARAN ? 'PENGELUARAN' : 'Pengeluaran';
  const rangeToUpdate = `${sheetName}!B${nextRow}:N${nextRow}`;
  return await updateSheetRow(rangeToUpdate, [rowArray], token);
}

export interface UserItem {
  username: string;
  password?: string;
  role: 'admin' | 'gudang';
  nama?: string;
}

export const DEFAULT_USERS: UserItem[] = [
  { username: 'admin', password: 'password123', role: 'admin', nama: 'Admin Gudang' },
  { username: 'manager', password: 'password123', role: 'admin', nama: 'Manager Logistik' },
  { username: 'gudang', password: 'password123', role: 'gudang', nama: 'Deni Agustian' }
];

export async function fetchUsers(token: string): Promise<UserItem[]> {
  if (!token) {
    return getLocalData<UserItem[]>(LOCAL_USERS_KEY, DEFAULT_USERS);
  }
  try {
    // Fetch starting from row 1 to read headers and resolve column shifts dynamically
    const rawRows = await getSheetValues('USERS!A1:D50', token);
    if (!rawRows || rawRows.length === 0) {
      console.log('[USERS FETCH] No data returned from USERS sheet, using default users.');
      return DEFAULT_USERS;
    }
    
    // Detect if the first row contains headers
    const firstRow = rawRows[0] || [];
    const isHeader = firstRow.some(cell => {
      const val = (cell || '').toString().trim().toLowerCase();
      return val === 'username' || val === 'role' || val === 'password' || val === 'nama';
    });
    
    let startIndex = 1;
    let usernameCol = 0;
    let passwordCol = 1;
    let roleCol = 2;
    let namaCol = 3;
    
    if (isHeader) {
      startIndex = 1;
      firstRow.forEach((cell, idx) => {
        const val = (cell || '').toString().trim().toLowerCase();
        if (val === 'username') usernameCol = idx;
        else if (val === 'password') passwordCol = idx;
        else if (val === 'role') roleCol = idx;
        else if (val === 'nama' || val === 'name') namaCol = idx;
      });
      console.log(`[USERS HEADER DETECTED] columns mapping -> username: ${usernameCol}, password: ${passwordCol}, role: ${roleCol}, nama: ${namaCol}`);
    } else {
      startIndex = 0;
      console.log('[USERS NO HEADER DETECTED] using default column indices A=0, B=1, C=2, D=3');
    }
    
    const dataRows = rawRows.slice(startIndex);
    const users = dataRows.map((row, index) => {
      const rawUsername = (row[usernameCol] || '').toString().trim();
      const rawPassword = (row[passwordCol] || '').toString().trim();
      const rawRole = (row[roleCol] || '').toString().trim().toLowerCase();
      const rawNama = (row[namaCol] || '').toString().trim();
      
      // Rigorous role checking: case-insensitive, sanitized
      const role: 'admin' | 'gudang' = (rawRole === 'admin' || rawRole === 'manager') ? 'admin' : 'gudang';
      
      return {
        username: rawUsername,
        password: rawPassword,
        role,
        nama: rawNama || rawUsername || 'User'
      };
    }).filter(u => u.username);
    
    console.log('[USERS FETCH SUCCESS] Parsed users from spreadsheet:', users.map(u => ({ username: u.username, role: u.role, nama: u.nama })));
    setLocalData(LOCAL_USERS_KEY, users);
    return users;
  } catch (err) {
    console.warn('USERS sheet fetch failed or USERS sheet doesn\'t exist. Using cached or default users.', err);
    // Try to auto-create the sheet in the background if it failed because it doesn't exist
    try {
      await initializeUsersSheet(token);
    } catch (createErr) {
      console.error('Failed to auto-create USERS sheet:', createErr);
    }
    return getLocalData<UserItem[]>(LOCAL_USERS_KEY, DEFAULT_USERS);
  }
}

async function initializeUsersSheet(token: string): Promise<void> {
  const values = [
    ['Username', 'Password', 'Role', 'Nama'],
    ['admin', 'password123', 'admin', 'Admin Gudang'],
    ['manager', 'password123', 'admin', 'Manager Logistik'],
    ['gudang', 'password123', 'gudang', 'Deni Agustian']
  ];
  try {
    await updateSheetRow('USERS!A1:D4', values, token);
    console.log('Successfully initialized USERS sheet with default users!');
  } catch (err) {
    console.warn('Could not initialize USERS sheet (maybe need to add sheet first):', err);
  }
}

export async function appendUserRow(
  data: {
    username: string;
    password?: string;
    role: 'admin' | 'gudang';
    nama?: string;
  },
  token: string
): Promise<any> {
  if (!token) {
    const localUsers = getLocalData<UserItem[]>(LOCAL_USERS_KEY, DEFAULT_USERS);
    localUsers.push({
      username: data.username,
      password: data.password || '',
      role: data.role,
      nama: data.nama || ''
    });
    setLocalData(LOCAL_USERS_KEY, localUsers);
    return { status: 'success', offline: true };
  }
  const rowArray = [
    data.username,
    data.password || '',
    data.role,
    data.nama || ''
  ];
  
  return await appendSheetRow('USERS!A:D', [rowArray], token);
}

/**
 * Fetches the background image URL from the 'BACKGROUND' sheet.
 * Scans columns A and B of rows 1-5 to find the first cell containing a URL.
 */
export async function fetchBackgroundImage(token: string): Promise<string> {
  if (!token) {
    return localStorage.getItem('background_image_url') || '';
  }
  try {
    const rawRows = await getSheetValues('BACKGROUND!A1:B5', token);
    if (!rawRows || rawRows.length === 0) {
      return '';
    }
    
    for (const row of rawRows) {
      for (const cell of row) {
        if (cell) {
          const val = String(cell || '').trim();
          if (val.startsWith('http://') || val.startsWith('https://')) {
            localStorage.setItem('background_image_url', val);
            return val;
          }
        }
      }
    }
    return '';
  } catch (err) {
    console.warn('BACKGROUND sheet fetch failed or not found, using cached or default.', err);
    return localStorage.getItem('background_image_url') || '';
  }
}

// --- SPB (SURAT PERMINTAAN BARANG) MODULE SUPPORT ---

export interface SPBItem {
  no: string;
  tanggal: string;
  noSPB: string;
  namaPeminta: string;
  departemen: string;
  kodeBarang: string;
  namaBarang: string;
  qty: number;
  keterangan: string;
  status: 'Pending' | 'Disetujui';
  rowIndex?: number;
}

const LOCAL_SPB_KEY = 'offline_spb_items';

export const DEFAULT_SPB_ITEMS: SPBItem[] = [
  { no: '1', tanggal: '2026-06-25', noSPB: 'SPB-260625-001', namaPeminta: 'Andi Wijaya', departemen: 'Produksi', kodeBarang: '1001', namaBarang: 'Semen Padang Type I', qty: 10, keterangan: 'Semen untuk perbaikan lantai', status: 'Pending' },
  { no: '2', tanggal: '2026-06-26', noSPB: 'SPB-260626-002', namaPeminta: 'Budi Santoso', departemen: 'Maintenance', kodeBarang: '1004', namaBarang: 'Pipa PVC AW 3 Inch', qty: 5, keterangan: 'Pipa saluran air pecah', status: 'Pending' },
  { no: '3', tanggal: '2026-06-27', noSPB: 'SPB-260627-003', namaPeminta: 'Citra Lestari', departemen: 'IT', kodeBarang: '1005', namaBarang: 'Kabel NYM 3x2.5mm 100m', qty: 2, keterangan: 'Instalasi jaringan gedung baru', status: 'Disetujui' }
];

async function initializeSPBSheet(token: string): Promise<void> {
  const values = [
    ['Tanggal', 'No SPB', 'Nama Peminta', 'Departemen', 'Kode Barang', 'Nama Barang', 'Qty', 'Keterangan', 'Status']
  ];
  try {
    await updateSheetRow('SPB!B3:J3', values, token);
    console.log('Successfully initialized SPB sheet with headers!');
  } catch (err) {
    console.warn('Could not initialize SPB sheet:', err);
  }
}

export async function fetchSPBItems(token: string): Promise<SPBItem[]> {
  if (!token) {
    return getLocalData<SPBItem[]>(LOCAL_SPB_KEY, DEFAULT_SPB_ITEMS);
  }
  try {
    const rawRows = await getSheetValues('SPB!B3:K', token);
    if (rawRows.length < 2) return [];

    const headers = rawRows[0].map(h => String(h || '').trim().toUpperCase());
    const dataRows = rawRows.slice(1);

    const findColIndex = (names: string[]): number => {
      const exactIdx = headers.findIndex(h => names.some(name => h === name));
      if (exactIdx !== -1) return exactIdx;
      return headers.findIndex(h => names.some(name => h.includes(name)));
    };

    const idxTanggal = findColIndex(['TANGGAL', 'TGL']);
    const idxNoSPB = findColIndex(['NO SPB', 'SPB', 'NOMOR SPB']);
    const idxNamaPeminta = findColIndex(['NAMA PEMINTA', 'PEMINTA', 'NAMA']);
    const idxDepartemen = findColIndex(['DEPARTEMEN', 'DEPT']);
    const idxKodeBarang = findColIndex(['KODE BARANG', 'KODEBARANG', 'KODE']);
    const idxNamaBarang = findColIndex(['NAMA BARANG', 'BARANG']);
    const idxQty = findColIndex(['JUMLAH', 'QTY', 'QUANTITY']);
    const idxKeterangan = findColIndex(['KETERANGAN', 'KET']);
    const idxStatus = findColIndex(['STATUS', 'VERIFICATION']);

    const items: SPBItem[] = [];

    dataRows.forEach((row, i) => {
      const getVal = (idxFromHeader: number, defaultOffset: number): string => {
        const idx = idxFromHeader !== -1 ? idxFromHeader : defaultOffset;
        if (idx >= 0 && idx < row.length) {
          return String(row[idx] ?? '').trim();
        }
        return '';
      };

      const tanggal = getVal(idxTanggal, 0);
      const noSPB = getVal(idxNoSPB, 1);
      const namaPeminta = getVal(idxNamaPeminta, 2);
      const departemen = getVal(idxDepartemen, 3);
      const kodeBarang = getVal(idxKodeBarang, 4);
      const namaBarang = getVal(idxNamaBarang, 5);
      const qtyStr = getVal(idxQty, 6);
      const keterangan = getVal(idxKeterangan, 7);
      const statusStr = getVal(idxStatus, 8);

      if (!tanggal && !noSPB && !namaBarang) return;

      const qty = parseFloat(qtyStr.replace(/\./g, '').replace(/,/g, '.')) || 0;
      const status = (statusStr.toLowerCase() === 'disetujui' || statusStr.toLowerCase() === 'approved') ? 'Disetujui' : 'Pending';

      items.push({
        no: String(i + 1),
        tanggal,
        noSPB,
        namaPeminta,
        departemen,
        kodeBarang,
        namaBarang,
        qty,
        keterangan,
        status,
        rowIndex: i + 4
      });
    });

    return items;
  } catch (err) {
    console.warn('SPB sheet fetch failed. Trying to auto-initialize SPB sheet in background.', err);
    try {
      await initializeSPBSheet(token);
    } catch (e) {
      console.error('Failed to auto-create SPB sheet:', e);
    }
    return getLocalData<SPBItem[]>(LOCAL_SPB_KEY, DEFAULT_SPB_ITEMS);
  }
}

export async function appendSPBRow(
  data: {
    tanggal: string;
    noSPB: string;
    namaPeminta: string;
    departemen: string;
    kodeBarang: string;
    namaBarang: string;
    qty: number;
    keterangan: string;
    status: 'Pending' | 'Disetujui';
  },
  token: string
): Promise<any> {
  if (!token) {
    const localSPB = getLocalData<SPBItem[]>(LOCAL_SPB_KEY, DEFAULT_SPB_ITEMS);
    const newNo = String(localSPB.length + 1);
    const newItem: SPBItem = {
      no: newNo,
      ...data
    };
    localSPB.push(newItem);
    setLocalData(LOCAL_SPB_KEY, localSPB);
    return { status: 'success', offline: true };
  }

  let nextRow = 4;
  try {
    const rawRows = await getSheetValues('SPB!B3:K', token);
    if (rawRows.length >= 2) {
      const dataRows = rawRows.slice(1);
      let foundIndex = -1;
      for (let i = 0; i < dataRows.length; i++) {
        const r = dataRows[i];
        if ((!r[0] || String(r[0]).trim() === '') && (!r[1] || String(r[1]).trim() === '')) {
          foundIndex = i;
          break;
        }
      }
      nextRow = foundIndex !== -1 ? (foundIndex + 4) : (dataRows.length + 4);
    }
  } catch (e) {
    console.error('Failed to find next row in SPB:', e);
  }

  const rowArray = [
    data.tanggal,
    data.noSPB,
    data.namaPeminta,
    data.departemen,
    data.kodeBarang,
    data.namaBarang,
    data.qty,
    data.keterangan,
    data.status
  ];

  const rangeToUpdate = `SPB!B${nextRow}:J${nextRow}`;
  return await updateSheetRow(rangeToUpdate, [rowArray], token);
}

export async function updateSPBStatus(
  noSPB: string,
  newStatus: 'Pending' | 'Disetujui',
  token: string
): Promise<any> {
  if (!token) {
    const localSPB = getLocalData<SPBItem[]>(LOCAL_SPB_KEY, DEFAULT_SPB_ITEMS);
    const matched = localSPB.find(item => item.noSPB === noSPB);
    if (matched) {
      matched.status = newStatus;
      setLocalData(LOCAL_SPB_KEY, localSPB);
    }
    return { status: 'success', offline: true };
  }

  try {
    const items = await fetchSPBItems(token);
    const matched = items.find(item => item.noSPB === noSPB);
    if (matched && matched.rowIndex) {
      const range = `SPB!J${matched.rowIndex}`;
      return await updateSheetRow(range, [[newStatus]], token);
    } else {
      throw new Error(`SPB dengan nomor ${noSPB} tidak ditemukan.`);
    }
  } catch (err) {
    console.error('Gagal memperbarui status SPB:', err);
    throw err;
  }
}

export interface MasterPengeluaranItem {
  kodePakai: string;
  costCenter: string;
  coaAccount: string;
}

export const DEFAULT_MASTER_PENGELUARAN: MasterPengeluaranItem[] = [
  { kodePakai: 'PROD-01', costCenter: 'GUDANG UTAMA', coaAccount: '11510-Persediaan' },
  { kodePakai: 'PROD-02', costCenter: 'PRODUKSI LINE A', coaAccount: '51010-Biaya Bahan Buku' },
  { kodePakai: 'MAINT-01', costCenter: 'MAINTENANCE GUDANG', coaAccount: '51020-Biaya Suku Cadang' },
  { kodePakai: 'OFFICE-01', costCenter: 'KANTOR / UMUM', coaAccount: '51030-Biaya Alat Tulis Kantor' }
];

export async function fetchMasterPengeluaranItems(token: string): Promise<MasterPengeluaranItem[]> {
  const LOCAL_MASTER_PENGELUARAN_KEY = 'offline_master_pengeluaran_items';
  if (!token) {
    return getLocalData<MasterPengeluaranItem[]>(LOCAL_MASTER_PENGELUARAN_KEY, DEFAULT_MASTER_PENGELUARAN);
  }
  try {
    const rawRows = await getSheetValues('MASTER PENGELUARAN!A1:G100', token);
    if (!rawRows || rawRows.length === 0) {
      console.log('[MASTER PENGELUARAN] No data returned from MASTER PENGELUARAN sheet, using fallback.');
      return getLocalData<MasterPengeluaranItem[]>(LOCAL_MASTER_PENGELUARAN_KEY, DEFAULT_MASTER_PENGELUARAN);
    }

    // Try to find the header row first. Look for keywords in first few rows.
    let headerRowIdx = -1;
    for (let i = 0; i < Math.min(rawRows.length, 5); i++) {
      const row = rawRows[i];
      const hasHeader = row.some(cell => {
        const val = String(cell || '').trim().toUpperCase();
        return val.includes('KODE') || val.includes('PAKAI') || val.includes('COST') || val.includes('CENTER') || val.includes('COA') || val.includes('ACCOUNT');
      });
      if (hasHeader) {
        headerRowIdx = i;
        break;
      }
    }

    let kodePakaiCol = 1; // Default Column B
    let costCenterCol = 3; // Default Column D
    let coaAccountCol = 4; // Default Column E

    if (headerRowIdx !== -1) {
      const headers = rawRows[headerRowIdx].map(h => String(h || '').trim().toUpperCase());
      headers.forEach((h, idx) => {
        if (h.includes('KODE') || h.includes('PAKAI')) {
          kodePakaiCol = idx;
        } else if (h.includes('COST') || h.includes('CENTER')) {
          costCenterCol = idx;
        } else if (h.includes('COA') || h.includes('ACCOUNT') || h.includes('REKENING')) {
          coaAccountCol = idx;
        }
      });
      console.log(`[MASTER PENGELUARAN] Mapped headers: kodePakaiCol=${kodePakaiCol}, costCenterCol=${costCenterCol}, coaAccountCol=${coaAccountCol}`);
    }

    const dataRows = headerRowIdx !== -1 ? rawRows.slice(headerRowIdx + 1) : rawRows;
    const items: MasterPengeluaranItem[] = [];

    dataRows.forEach(row => {
      const kp = String(row[kodePakaiCol] || '').trim();
      const cc = String(row[costCenterCol] || '').trim();
      const coa = String(row[coaAccountCol] || '').trim();

      // Skip empty or headers or templates
      if (!kp || kp === '' || kp.toUpperCase() === 'KODE PAKAI' || kp.toUpperCase() === 'KODE_PAKAI') {
        return;
      }

      items.push({
        kodePakai: kp,
        costCenter: cc || 'GUDANG UTAMA',
        coaAccount: coa || '11510-Persediaan'
      });
    });

    if (items.length === 0) {
      return getLocalData<MasterPengeluaranItem[]>(LOCAL_MASTER_PENGELUARAN_KEY, DEFAULT_MASTER_PENGELUARAN);
    }

    // Save fetched items locally so fallback is updated
    setLocalData(LOCAL_MASTER_PENGELUARAN_KEY, items);
    return items;
  } catch (err) {
    console.warn('Could not load MASTER PENGELUARAN from Google Sheets, using fallback:', err);
    return getLocalData<MasterPengeluaranItem[]>(LOCAL_MASTER_PENGELUARAN_KEY, DEFAULT_MASTER_PENGELUARAN);
  }
}




