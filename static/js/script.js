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
                
                // --- LOGIKA PREMIUM (Iklan) vs GRATIS ---
                let isPremium = false;
                // Jika 720p ATAU Tanpa Watermark ATAU Asli = Premium
                if (fmt.height >= 720 || fmt.label.includes('Tanpa Watermark') || fmt.label.includes('Asli')) {
                    isPremium = true;
                    btn.innerHTML = `⭐ ${fmt.label} <br> <span>${fmt.size}</span>`;
                    btn.style.borderColor = "#f39c12"; 
                    btn.style.color = "#f39c12";
                } else {
                    // Yang Gratis (144p - 480p, atau Dengan Watermark)
                    btn.innerHTML = `${fmt.label} <br> <span>${fmt.size}</span>`;
                }
                
                btn.onclick = () => {
                    document.getElementById('download-progress').classList.remove('hidden');
                    
                    if (isPremium) {
                        // JALUR CUAN: Buka link Adsterra Ozi
                        window.open('https://www.effectivegatecpm.com/tpqt0xke?key=bcb3609dcf1e2f1db3932fd01ace6203', '_blank'); 
                    }
                    
                    // JALUR ANTI-403 ERROR (Trik Ghost Link no-referrer)
                    const ghostLink = document.createElement('a');
                    ghostLink.href = fmt.direct_url;
                    ghostLink.target = '_blank';
                    ghostLink.rel = 'noreferrer'; // Ini sihir yang menghapus jejak Vercel agar TikTok tidak marah
                    document.body.appendChild(ghostLink);
                    ghostLink.click();
                    document.body.removeChild(ghostLink);

                    setTimeout(() => {
                        document.getElementById('download-progress').classList.add('hidden');
                    }, 5000);
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

// Logika Saran Email (Tetap sama)
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
