let selectedPlatform = 'tiktok'; 
const platformBtns = document.querySelectorAll('.platform-btn');
const inputSection = document.getElementById('input-section');
const urlInput = document.getElementById('video-url');
const statusMsg = document.getElementById('status-message');
const resultContainer = document.getElementById('result-container');

platformBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        platformBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedPlatform = btn.getAttribute('data-platform');
        
        inputSection.classList.remove('hidden');
        const namaPlatform = selectedPlatform.charAt(0).toUpperCase() + selectedPlatform.slice(1);
        urlInput.placeholder = `Tautan video ${namaPlatform}...`;
        
        urlInput.value = '';
        statusMsg.classList.add('hidden');
        resultContainer.classList.add('hidden');
        urlInput.focus();
    });
});

document.getElementById('get-info-btn').addEventListener('click', async () => {
    const urlValue = urlInput.value.trim();
    const btnDown = document.getElementById('get-info-btn');

    statusMsg.classList.remove('hidden');
    resultContainer.classList.add('hidden');
    
    if (!selectedPlatform) {
        statusMsg.innerText = "⚠️ Pilih platform dulu di atas!";
        statusMsg.style.color = "#e74c3c";
        return;
    }

    if (!urlValue) {
        statusMsg.innerText = "⚠️ Tautan videonya tidak boleh kosong!";
        statusMsg.style.color = "#e74c3c";
        return;
    }

    btnDown.innerText = "Mencari...";
    statusMsg.innerText = `🔍 Sedang mencari data dari ${selectedPlatform}...`;
    statusMsg.style.color = "#4a90e2";

    try {
        const response = await fetch('/api/get-info', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: urlValue, platform: selectedPlatform })
        });

        const data = await response.json();

        if (data.success) {
            statusMsg.classList.add('hidden');
            resultContainer.classList.remove('hidden');
            
            document.getElementById('video-title').innerText = data.title;
            document.getElementById('video-thumb').src = data.thumbnail;
            
            const formatsList = document.getElementById('formats-list');
            formatsList.innerHTML = ''; 
            
            data.formats.forEach(fmt => {
                const btn = document.createElement('button');
                btn.className = 'format-btn';
                
                // --- LOGIKA PREMIUM (HANYA YOUTUBE 720p) ---
                let isPremium = false;
                // Cek apakah platform yang dipilih adalah YouTube DAN tingginya 720 ke atas
                if (selectedPlatform === 'youtube' && fmt.height >= 720) {
                    isPremium = true;
                    btn.innerHTML = `⭐ Premium ${fmt.label} <br> <span>${fmt.size}</span>`;
                    btn.style.borderColor = "#f39c12"; 
                    btn.style.color = "#f39c12";
                } else {
                    // JALUR GRATIS (Semua Sosmed lain & YT < 720p)
                    btn.innerHTML = `${fmt.label} <br> <span>${fmt.size}</span>`;
                }
                
                btn.onclick = () => {
                    const progressDiv = document.getElementById('download-progress');
                    progressDiv.classList.remove('hidden');
                    
                    if (isPremium) {
                        // JALUR CUAN (Dengan Hitung Mundur 5 Detik Buatan)
                        let timeLeft = 5;
                        progressDiv.innerHTML = `⏳ Menyiapkan video HD... Iklan muncul dalam ${timeLeft} detik.`;
                        progressDiv.style.color = "#f39c12";
                        
                        // Buka iklan Adsterra Ozi di tab baru
                        window.open('https://www.effectivegatecpm.com/tpqt0xke?key=bcb3609dcf1e2f1db3932fd01ace6203', '_blank');

                        // Memulai Timer
                        const countdown = setInterval(() => {
                            timeLeft -= 1;
                            progressDiv.innerHTML = `⏳ Menyiapkan video HD... Menuju tautan dalam ${timeLeft} detik.`;
                            
                            if (timeLeft <= 0) {
                                clearInterval(countdown);
                                progressDiv.innerHTML = `✅ Mengalihkan ke video... Klik "Titik Tiga" lalu pilih Download!`;
                                progressDiv.style.color = "#2ecc71";
                                
                                // Buka Video
                                openVideoLink(fmt.direct_url);
                                
                                setTimeout(() => { progressDiv.classList.add('hidden'); }, 4000);
                            }
                        }, 1000); // 1000ms = 1 detik

                    } else {
                        // JALUR GRATIS (Langsung Buka Tanpa Tunggu)
                        progressDiv.innerHTML = `✅ Membuka video... Klik ikon "Titik Tiga" di pojok kanan bawah video lalu pilih Download!`;
                        progressDiv.style.color = "#2ecc71";
                        
                        openVideoLink(fmt.direct_url);

                        setTimeout(() => { progressDiv.classList.add('hidden'); }, 4000);
                    }
                };
                formatsList.appendChild(btn);
            });
            
        } else {
            statusMsg.innerText = "❌ " + data.message;
            statusMsg.style.color = "#e74c3c";
        }
    } catch (error) {
        statusMsg.innerText = "❌ Gagal terhubung ke server.";
        statusMsg.style.color = "#e74c3c";
    } finally {
        btnDown.innerText = "Cari Video";
    }
});

// Fungsi Anti-403 Error & Buka Video
function openVideoLink(url) {
    const ghostLink = document.createElement('a');
    ghostLink.href = url;
    ghostLink.target = '_blank';
    ghostLink.rel = 'noreferrer'; // Trik jubat gaib agar server sosmed tidak memblokir Vercel
    document.body.appendChild(ghostLink);
    ghostLink.click();
    document.body.removeChild(ghostLink);
}

// Logika Saran Email 
document.getElementById('feedback-form').addEventListener('submit', async (e) => {
    e.preventDefault(); 
    const btnSubmit = e.target.querySelector('button');
    const nameVal = document.getElementById('feed-name').value;
    const emailVal = document.getElementById('feed-email').value;
    const msgVal = document.getElementById('feed-msg').value;
    
    btnSubmit.innerText = "Mengirim...";
    btnSubmit.style.background = "#f39c12"; 
    btnSubmit.style.color = "#fff";

    try {
        const response = await fetch('/api/send-feedback', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: nameVal, email: emailVal, message: msgVal })
        });
        const data = await response.json();
        if (data.success) {
            btnSubmit.innerText = "Terkirim!";
            btnSubmit.style.background = "#2ecc71"; 
        } else {
            btnSubmit.innerText = "Gagal!";
            btnSubmit.style.background = "#e74c3c"; 
        }
    } catch (error) {
        btnSubmit.innerText = "Error!";
        btnSubmit.style.background = "#e74c3c";
    }
    
    setTimeout(() => {
        e.target.reset();
        btnSubmit.innerText = "Kirim Saran";
        btnSubmit.style.background = "#e2e8f0";
        btnSubmit.style.color = "#475569";
    }, 3000);
});
