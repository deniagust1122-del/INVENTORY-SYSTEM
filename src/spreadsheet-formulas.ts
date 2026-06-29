export interface SpreadsheetFormula {
  title: string;
  description: string;
  formula: string;
  type: 'SUMIFS' | 'QUERY';
}

export const SPREADSHEET_FORMULAS: SpreadsheetFormula[] = [
  {
    title: 'Formula SUMIFS: Hitung Penerimaan per Kode Barang (Anti-Macet)',
    description: 'Menjumlahkan total kuantitas barang yang diterima dari sheet "PENERIMAAN" berdasarkan Kode Barang yang cocok dengan kolom B di sheet "MUTASI BARANG". Menggunakan referensi satu kolom penuh agar tidak rusak jika baris ditambah.',
    formula: '=SUMIFS(Penerimaan!$L:$L; Penerimaan!$I:$I; $B8)',
    type: 'SUMIFS'
  },
  {
    title: 'Formula SUMIFS: Hitung Total Nilai Penerimaan (Rupiah)',
    description: 'Menjumlahkan total nominal Rupiah penerimaan dari sheet "PENERIMAAN" (kolom P) berdasarkan Kode Barang (kolom I) yang cocok dengan kode di "MUTASI BARANG" (kolom B).',
    formula: '=SUMIFS(Penerimaan!$P:$P; Penerimaan!$I:$I; $B8)',
    type: 'SUMIFS'
  },
  {
    title: 'Formula SUMIFS: Hitung Pengeluaran per Kode Barang (Anti-Macet)',
    description: 'Menjumlahkan total kuantitas barang yang dikeluarkan dari sheet "PENGELUARAN" (kolom G) berdasarkan Kode Barang (kolom D) yang cocok dengan kode di "MUTASI BARANG" (kolom B).',
    formula: '=SUMIFS(Pengeluaran!$G:$G; Pengeluaran!$D:$D; $B8)',
    type: 'SUMIFS'
  },
  {
    title: 'Formula SUMIFS: Hitung Total Nilai Pengeluaran (Rupiah)',
    description: 'Menjumlahkan total nominal Rupiah pengeluaran dari sheet "PENGELUARAN" (kolom I) berdasarkan Kode Barang (kolom D) yang cocok dengan kode di "MUTASI BARANG" (kolom B).',
    formula: '=SUMIFS(Pengeluaran!$I:$I; Pengeluaran!$D:$D; $B8)',
    type: 'SUMIFS'
  },
  {
    title: 'Formula QUERY: Dashboard Mutasi Lengkap Otomatis',
    description: 'Satu formula ajaib untuk menarik data secara dinamis dari sheet "MUTASI BARANG" kolom B sampai R (Kode Barang, Nama, Satuan, Stok Awal, dll.), menyaring baris kategori kosong.',
    formula: '=QUERY(\'MUTASI BARANG\'!B2:R; "SELECT B, C, D, E, H, K, N WHERE B IS NOT NULL AND NOT C CONTAINS \'KOSONG\'"; 0)',
    type: 'QUERY'
  }
];
