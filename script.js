// Array global untuk menyimpan semua data. Ini adalah "database" sementara kita.
let allData = [];
// Variabel untuk melacak indeks data yang sedang diedit (-1 berarti mode tambah baru)
let editingIndex = -1;

// Konstanta untuk nama storage lokal
const LOCAL_STORAGE_KEY = 'appData';
const THEME_STORAGE_KEY = 'appTheme';

/* --- FUNGSI UTILITY --- */

/**
 * Mengambil referensi elemen DOM berdasarkan ID.
 * @param {string} id - ID elemen DOM.
 * @returns {HTMLElement} Elemen DOM.
 */
const getElement = (id) => document.getElementById(id);

/**
 * Mengatur teks konten dari elemen DOM.
 * @param {string} id - ID elemen DOM.
 * @param {string} text - Teks yang akan diatur.
 */
const setTextContent = (id, text) => {
    const element = getElement(id);
    if (element) element.textContent = text;
};

/**
 * Menyembunyikan semua pesan error validasi.
 */
const clearAllErrorMessages = () => {
    document.querySelectorAll('.error-message').forEach(span => span.textContent = '');
};

/* --- FUNGSI LOCAL STORAGE (NEW) --- */
/**
 * Menyimpan data ke Local Storage.
 */
function saveDataToLocalStorage() {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(allData));
    console.log("Data disimpan ke Local Storage.");
}

/**
 * Memuat data dari Local Storage.
 */
function loadDataFromLocalStorage() {
    const storedData = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (storedData) {
        allData = JSON.parse(storedData);
        console.log("Data dimuat dari Local Storage:", allData);
    } else {
        allData = [];
        console.log("Tidak ada data di Local Storage.");
    }
}

/**
 * Menyimpan tema ke Local Storage.
 * @param {string} theme - 'light' atau 'dark'.
 */
function saveThemeToLocalStorage(theme) {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
}

/**
 * Memuat tema dari Local Storage.
 * @returns {string} Tema yang tersimpan ('light' atau 'dark'), default 'light'.
 */
function loadThemeFromLocalStorage() {
    return localStorage.getItem(THEME_STORAGE_KEY) || 'light';
}

/* --- FUNGSI SIDEBAR & NAVIGASI --- */

/**
 * Membuka sidebar dengan mengatur lebar dan menggeser konten utama.
 */
function openNav() {
    getElement("mySidebar").style.width = "250px";
    getElement("main").style.marginLeft = "250px";
}

/**
 * Menutup sidebar dengan mengatur lebar ke nol dan mengembalikan posisi konten utama.
 */
function closeNav() {
    getElement("mySidebar").style.width = "0";
    getElement("main").style.marginLeft = "0";
}

/**
 * Menampilkan bagian konten tertentu berdasarkan ID dan menyembunyikan yang lain.
 * @param {string} sectionId - ID bagian konten yang akan ditampilkan.
 */
function showSection(sectionId) {
    // Sembunyikan semua bagian konten
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });

    // Tampilkan bagian yang dipilih
    getElement(sectionId).classList.add('active');

    // Tutup sidebar setelah memilih menu
    closeNav();

    // Logika tambahan berdasarkan bagian yang aktif
    if (sectionId === 'viewData') {
        renderDataTable(); // Perbarui tabel saat bagian "Lihat & Edit Data" dibuka
    } else if (sectionId === 'dashboard') {
        updateDashboardStats(); // Perbarui semua statistik dashboard saat bagian dashboard dibuka
    } else if (sectionId === 'dataEntry') {
        // Jika kembali ke form entri data, pastikan mode kembali ke 'tambah baru'
        // kecuali jika kita sedang dalam mode edit (yaitu editingIndex tidak -1)
        if (editingIndex === -1) {
            getElement('dataEntryForm').reset();
            setTextContent('formTitle', 'Formulir Entri Data');
            setTextContent('submitButton', 'Simpan Data');
        }
        clearAllErrorMessages(); // Bersihkan pesan error saat berpindah ke form
    }
}

/* --- FUNGSI VALIDASI DATA --- */

/**
 * Memvalidasi data input formulir.
 * @param {object} data - Objek data yang akan divalidasi.
 * @returns {boolean} True jika data valid, false jika tidak.
 */
function validateForm(data) {
    let isValid = true;
    clearAllErrorMessages(); // Bersihkan semua pesan error sebelumnya

    // Validasi Nama: tidak boleh kosong dan minimal 2 karakter
    if (!data.nama.trim()) {
        setTextContent('namaError', 'Nama tidak boleh kosong.');
        isValid = false;
    } else if (data.nama.trim().length < 2) {
        setTextContent('namaError', 'Nama minimal 2 karakter.');
        isValid = false;
    }

    // Validasi Email: format email dan tidak boleh kosong
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!data.email.trim()) {
        setTextContent('emailError', 'Email tidak boleh kosong.');
        isValid = false;
    } else if (!emailRegex.test(data.email)) {
        setTextContent('emailError', 'Format email tidak valid.');
        isValid = false;
    }

    // Validasi Telepon: opsional, tapi jika diisi harus angka (opsional: format spesifik)
    if (data.telepon.trim() && !/^\d{8,15}$/.test(data.telepon.trim())) { // Misal 8-15 digit
        setTextContent('teleponError', 'Nomor telepon harus berupa angka antara 8-15 digit.');
        isValid = false;
    }

    // Validasi Tanggal Lahir: tidak boleh di masa depan
    if (data.tanggal_lahir) {
        const today = new Date();
        const dob = new Date(data.tanggal_lahir);
        // Set waktu ke tengah malam untuk perbandingan yang akurat
        today.setHours(0, 0, 0, 0);
        dob.setHours(0, 0, 0, 0);

        if (dob > today) {
            setTextContent('tanggalLahirError', 'Tanggal lahir tidak boleh di masa depan.');
            isValid = false;
        }
    }

    return isValid;
}

/* --- FUNGSI MEMASUKKAN & MENGEDIT DATA --- */

// Event listener untuk submit formulir entri data
getElement('dataEntryForm').addEventListener('submit', function(event) {
    event.preventDefault(); // Mencegah form dari reload halaman

    // Ambil nilai dari input form
    const nama = getElement('nama').value;
    const email = getElement('email').value;
    const telepon = getElement('telepon').value;
    const tanggal_lahir = getElement('tanggal_lahir').value;
    const catatan = getElement('catatan').value;

    // Buat objek data baru
    const currentData = {
        nama,
        email,
        telepon,
        tanggal_lahir,
        catatan,
        timestamp: new Date().toISOString() // Tambahkan timestamp saat data dibuat/diperbarui
    };

    // Lakukan validasi data
    if (!validateForm(currentData)) {
        console.log("Validasi gagal. Data tidak disimpan/diperbarui.");
        return; // Hentikan proses jika validasi gagal
    }

    if (editingIndex === -1) {
        // MODE: Menambahkan data baru
        currentData.id = allData.length > 0 ? Math.max(...allData.map(d => d.id)) + 1 : 1;
        allData.push(currentData);
        alert('Data berhasil ditambahkan!');
    } else {
        // MODE: Mengedit data yang sudah ada
        currentData.id = allData[editingIndex].id; // Pertahankan ID asli
        allData[editingIndex] = currentData;
        alert('Data berhasil diperbarui!');
        editingIndex = -1; // Reset mode edit
        setTextContent('formTitle', 'Formulir Entri Data');
        setTextContent('submitButton', 'Simpan Data');
    }

    console.log("Semua Data Saat Ini:", allData);
    saveDataToLocalStorage(); // Simpan data setelah setiap perubahan
    this.reset(); // Reset form setelah submit atau update
    renderDataTable(); // Perbarui tabel data
    updateDashboardStats(); // Perbarui semua statistik dashboard
    clearAllErrorMessages(); // Pastikan pesan error terhapus setelah submit berhasil
});

/**
 * Mengisi formulir dengan data yang dipilih untuk diedit.
 * @param {number} index - Indeks data dalam array allData yang akan diedit.
 */
function editData(index) {
    editingIndex = index;
    const dataToEdit = allData[index];

    getElement('nama').value = dataToEdit.nama;
    getElement('email').value = dataToEdit.email;
    getElement('telepon').value = dataToEdit.telepon;
    getElement('tanggal_lahir').value = dataToEdit.tanggal_lahir;
    getElement('catatan').value = dataToEdit.catatan;

    setTextContent('formTitle', 'Formulir Edit Data');
    setTextContent('submitButton', 'Update Data');

    showSection('dataEntry');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * Menghapus data dari array allData.
 * @param {number} index - Indeks data dalam array allData yang akan dihapus.
 */
function deleteData(index) {
    if (confirm('Apakah Anda yakin ingin menghapus data ini? Aksi ini tidak dapat dibatalkan.')) {
        allData.splice(index, 1);
        alert('Data berhasil dihapus!');
        saveDataToLocalStorage(); // Simpan data setelah setiap perubahan
        renderDataTable();
        updateDashboardStats();
        if (editingIndex === index) { // Reset mode edit jika data yang dihapus adalah yang sedang diedit
            editingIndex = -1;
            getElement('dataEntryForm').reset();
            setTextContent('formTitle', 'Formulir Entri Data');
            setTextContent('submitButton', 'Simpan Data');
            clearAllErrorMessages();
        }
    }
}

/* --- FUNGSI MENAMPILKAN DATA DI TABEL --- */

/**
 * Merender (membuat ulang) tabel data dengan data terbaru dari allData.
 */
function renderDataTable() {
    const tableBody = document.querySelector('#dataTable tbody');
    tableBody.innerHTML = '';

    if (allData.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 20px; color: var(--text-dark);">Belum ada data tersedia.</td></tr>';
        return;
    }

    allData.forEach((data, index) => {
        const row = tableBody.insertRow();
        row.insertCell().textContent = data.id;
        row.insertCell().textContent = data.nama;
        row.insertCell().textContent = data.email;
        row.insertCell().textContent = data.telepon || '-';
        row.insertCell().textContent = data.tanggal_lahir || '-';

        const actionCell = row.insertCell();
        actionCell.classList.add('action-buttons');

        const editBtn = document.createElement('button');
        editBtn.textContent = 'Edit';
        editBtn.classList.add('edit-button');
        editBtn.onclick = () => editData(index);
        actionCell.appendChild(editBtn);

        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'Hapus';
        deleteBtn.classList.add('delete-button');
        deleteBtn.onclick = () => deleteData(index);
        actionCell.appendChild(deleteBtn);
    });
}

/* --- FUNGSI DASHBOARD --- */

/**
 * Menghitung usia dari tanggal lahir.
 * @param {string} dobString - Tanggal lahir dalam format YYYY-MM-DD.
 * @returns {number|string} Usia dalam tahun atau '-' jika tidak valid.
 */
function calculateAge(dobString) {
    if (!dobString) return '-';
    const dob = new Date(dobString);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
        age--;
    }
    return age;
}

/**
 * Memperbarui semua statistik dan informasi di dashboard.
 */
function updateDashboardStats() {
    setTextContent('totalDataCount', allData.length);

    const ages = allData
        .filter(d => d.tanggal_lahir)
        .map(d => calculateAge(d.tanggal_lahir))
        .filter(age => typeof age === 'number');

    if (ages.length > 0) {
        const sumAges = ages.reduce((sum, age) => sum + age, 0);
        const average = (sumAges / ages.length).toFixed(0);
        setTextContent('averageAge', average);
    } else {
        setTextContent('averageAge', '-');
    }

    const latestDataItem = allData.length > 0
        ? allData.reduce((prev, current) =>
            (prev.timestamp && current.timestamp && new Date(current.timestamp) > new Date(prev.timestamp)) ? current : prev
        ) : null;

    if (latestDataItem) {
        setTextContent('latestDataNama', latestDataItem.nama);
        setTextContent('latestDataEmail', latestDataItem.email);
        setTextContent('latestDataTelepon', latestDataItem.telepon || '-');
    } else {
        setTextContent('latestDataNama', '-');
        setTextContent('latestDataEmail', '-');
        setTextContent('latestDataTelepon', '-');
    }

    const emailDomains = {};
    allData.forEach(data => {
        if (data.email) {
            const domainMatch = data.email.match(/@([^.]+\.[a-zA-Z]{2,})$/);
            if (domainMatch && domainMatch[1]) {
                const domain = domainMatch[1].toLowerCase();
                emailDomains[domain] = (emailDomains[domain] || 0) + 1;
            }
        }
    });

    const emailDomainList = getElement('emailDomainDistribution');
    emailDomainList.innerHTML = '';

    const sortedDomains = Object.entries(emailDomains).sort(([, countA], [, countB]) => countB - countA);

    if (sortedDomains.length > 0) {
        sortedDomains.forEach(([domain, count]) => {
            const listItem = document.createElement('li');
            listItem.innerHTML = `<strong>${domain}</strong> <span>${count}</span>`;
            emailDomainList.appendChild(listItem);
        });
    } else {
        const listItem = document.createElement('li');
        listItem.textContent = 'Belum ada data email untuk analisis domain.';
        emailDomainList.appendChild(listItem);
    }
}

/* --- FUNGSI MENGEKSPOR DATA --- */

/**
 * Mengekspor semua data yang tersimpan ke format CSV.
 */
function exportToCSV() {
    if (allData.length === 0) {
        alert('Tidak ada data untuk diekspor.');
        return;
    }

    const headers = ['ID', 'Nama', 'Email', 'Telepon', 'Tanggal Lahir', 'Catatan', 'Timestamp'];
    const csvRows = [];

    csvRows.push(headers.join(','));

    for (const data of allData) {
        const escapeCSV = (value) => {
            if (value === null || value === undefined) return '';
            const stringValue = String(value);
            if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n') || stringValue.includes('\r')) {
                return `"${stringValue.replace(/"/g, '""')}"`;
            }
            return stringValue;
        };

        const values = [
            escapeCSV(data.id),
            escapeCSV(data.nama),
            escapeCSV(data.email),
            escapeCSV(data.telepon),
            escapeCSV(data.tanggal_lahir),
            escapeCSV(data.catatan),
            escapeCSV(data.timestamp)
        ];
        csvRows.push(values.join(','));
    }

    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'data_aplikasi_export.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    alert('Data berhasil diekspor ke CSV!');
}

/**
 * Mengekspor semua data yang tersimpan ke format JSON.
 */
function exportToJSON() {
    if (allData.length === 0) {
        alert('Tidak ada data untuk diekspor.');
        return;
    }

    const jsonString = JSON.stringify(allData, null, 2);

    const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'data_aplikasi_export.json');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    alert('Data berhasil diekspor ke JSON!');
}

/* --- FUNGSI PENGATURAN (NEW) --- */

/**
 * Mengatur tema aplikasi (terang atau gelap).
 * @param {string} theme - 'light' atau 'dark'.
 */
function setTheme(theme) {
    const body = document.body;
    const themeLightBtn = getElement('themeLightBtn');
    const themeDarkBtn = getElement('themeDarkBtn');

    if (theme === 'dark') {
        body.classList.remove('theme-light');
        body.classList.add('theme-dark');
        themeLightBtn.classList.remove('active');
        themeDarkBtn.classList.add('active');
    } else {
        body.classList.remove('theme-dark');
        body.classList.add('theme-light');
        themeLightBtn.classList.add('active');
        themeDarkBtn.classList.remove('active');
    }
    saveThemeToLocalStorage(theme); // Simpan preferensi tema
}

/**
 * Menghapus semua data yang tersimpan di Local Storage dan mereset aplikasi.
 */
function clearAllData() {
    if (confirm('PERINGATAN: Ini akan menghapus SEMUA data secara permanen dari browser Anda. Lanjutkan?')) {
        if (prompt('Untuk mengkonfirmasi, ketik "HAPUS" di bawah:') === 'HAPUS') {
            allData = [];
            localStorage.removeItem(LOCAL_STORAGE_KEY); // Hapus dari Local Storage
            alert('Semua data berhasil dihapus!');
            // Reset UI
            getElement('dataEntryForm').reset();
            setTextContent('formTitle', 'Formulir Entri Data');
            setTextContent('submitButton', 'Simpan Data');
            editingIndex = -1;
            renderDataTable();
            updateDashboardStats();
            clearAllErrorMessages();
            // Kembali ke dashboard setelah hapus
            showSection('dashboard');
        } else {
            alert('Konfirmasi tidak cocok. Pembatalan penghapusan data.');
        }
    }
}

/* --- INISIALISASI APLIKASI --- */

// Jalankan fungsi ini saat DOM selesai dimuat
document.addEventListener('DOMContentLoaded', () => {
    loadDataFromLocalStorage(); // Muat data saat aplikasi dimulai
    const savedTheme = loadThemeFromLocalStorage(); // Muat preferensi tema
    setTheme(savedTheme); // Terapkan tema yang tersimpan

    // Update UI pengaturan tema untuk menunjukkan tema yang aktif
    if (savedTheme === 'dark') {
        getElement('themeDarkBtn').classList.add('active');
        getElement('themeLightBtn').classList.remove('active');
    } else {
        getElement('themeLightBtn').classList.add('active');
        getElement('themeDarkBtn').classList.remove('active');
    }

    // Atur tanggal pembuatan aplikasi secara dinamis (opsional, bisa juga statis)
    // const appCreated = new Date(2025, 6, 14); // Bulan 0-11, jadi 6 untuk Juli
    // setTextContent('appCreationDate', appCreated.toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' }));

    // Event listener untuk tombol hapus semua data
    getElement('clearAllDataBtn').addEventListener('click', clearAllData);

    showSection('dashboard'); // Tampilkan bagian dashboard pertama kali
    updateDashboardStats(); // Perbarui statistik dashboard
});
