export interface AppSheetStep {
  step: number;
  title: string;
  description: string;
  substeps: string[];
}

export const APPSHEET_GUIDE_INDONESIAN: AppSheetStep[] = [
  {
    step: 1,
    title: 'Hubungkan Spreadsheet ke AppSheet',
    description: 'Menghubungkan spreadsheet "4. Inventory" sebagai basis data utama aplikasi mobile AppSheet.',
    substeps: [
      'Buka portal resmi AppSheet di https://www.appsheet.com/ dan login dengan akun Google Anda.',
      'Klik tombol "Create" di pojok kiri atas -> Pilih "App" -> Pilih "Start with existing data".',
      'Beri nama aplikasi Anda, misalnya "Sistem Scan Gudang", dan pilih kategori "Logistics & Inventory".',
      'Klik "Choose your data" dan pilih spreadsheet Anda: "4. Inventory" (ID: 1Qd3WWCAgsftGsVf1VMX-ZXgopA9QzYPL33VvpHMgn9o).',
      'AppSheet akan otomatis membaca lembar kerja. Tambahkan tabel "Pengeluaran" dan "MasterBarang" ke dalam aplikasi Anda.'
    ]
  },
  {
    step: 2,
    title: 'Aktifkan Fitur Scan Barcode Kamera',
    description: 'Mengonfigurasi kolom Kode Barang di form Pengeluaran agar dapat memicu kamera HP untuk scan barcode secara langsung.',
    substeps: [
      'Di dashboard AppSheet, masuk ke menu "Data" -> pilih tabel "Pengeluaran" -> klik "Columns" untuk melihat daftar kolom.',
      'Cari kolom bernama "Kode Barang" (atau "KODE BARANG" / "Col D"). Klik ikon Pensil (Edit) di sebelah kiri kolom tersebut.',
      'Pastikan Type kolom diatur sebagai Ref (hubungkan ke tabel "MasterBarang") agar AppSheet dapat menarik nama barang secara otomatis setelah scan.',
      'Scroll ke bawah di bagian pengaturan kolom, temukan opsi bernama "Scan?" (atau "Searchable" & "Barcode Scan"). Centang kotak "Scan?".',
      'Klik "Done" di pojok kanan bawah jendela edit kolom, lalu klik tombol "Save" di pojok kanan atas dashboard AppSheet untuk menyimpan perubahan.'
    ]
  },
  {
    step: 3,
    title: 'Logika Auto-Deduct (Pengurangan Stok Otomatis)',
    description: 'Memastikan stok barang di database MasterBarang otomatis berkurang real-time begitu barcode di-scan.',
    substeps: [
      'Pendekatan Terbaik (Hybrid): Di Google Sheets, kolom "PENGELUARAN Jumlah" pada sheet "MasterBarang" dipasangi formula SUMIFS: =SUMIFS(Pengeluaran!$G$4:$G; Pengeluaran!$D$4:$D; B2).',
      'Ketika petugas memindai barcode Kode Barang di AppSheet dan menginput Jumlah Pengeluaran, AppSheet langsung meng-append baris baru ke sheet "Pengeluaran".',
      'Google Sheets akan langsung menghitung total pengeluaran dan mengurangi "Stok Akhir" di sheet "MasterBarang" secara otomatis.',
      'Alternatif Formula AppSheet (Jika ingin kalkulasi murni di AppSheet): Di kolom "Stok Akhir" tabel MasterBarang AppSheet, masukkan rumus AppSheet Formula: [Stok Awal] + SUM(SELECT(Penerimaan[Jumlah], [Kode Barang] = [_THISROW].[Kode Barang])) - SUM(SELECT(Pengeluaran[Jumlah], [Kode Barang] = [_THISROW].[Kode Barang])).'
    ]
  },
  {
    step: 4,
    title: 'Desain UX Form Pengeluaran agar Cepat & Responsif',
    description: 'Mempercepat alur kerja petugas gudang saat memproses banyak pengeluaran sekaligus.',
    substeps: [
      'Masuk ke menu "UX" -> pilih "Views" -> Klik "+ New View".',
      'Beri nama View: "Scan Pengeluaran", pilih For data: "Pengeluaran", dan ubah View type menjadi form.',
      'Di bagian Form View Options, aktifkan opsi "Auto-save" dan "Auto-reopen" agar form otomatis terbuka kembali setelah submit untuk scan barang berikutnya.',
      'Pasang aplikasi AppSheet di Handphone petugas gudang (tersedia di Play Store / App Store) dan uji coba pemindaian barcode fisik barang!'
    ]
  }
];
