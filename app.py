from flask import Flask, render_template, request, jsonify, send_file, redirect
import yt_dlp
import urllib.request
import urllib.parse
from io import BytesIO
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
import requests # Alat Radar MB

app = Flask(__name__)

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/api/proxy-thumb')
def proxy_thumb():
    img_url = request.args.get('url')
    if not img_url:
        return redirect("https://via.placeholder.com/300x180?text=Tidak+Ada+Thumbnail")
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Referer': 'https://www.instagram.com/',
        }
        req = urllib.request.Request(img_url, headers=headers)
        with urllib.request.urlopen(req, timeout=5) as response:
            img_data = response.read()
            mime_type = response.headers.get('Content-Type', 'image/jpeg')
            return send_file(BytesIO(img_data), mimetype=mime_type)
    except Exception as e:
        return redirect("https://via.placeholder.com/300x180?text=Thumbnail+Privasi+(Aman)")

# FUNGSI RADAR: Mengecek MB secara real tanpa mendownload full video
def get_real_size(url):
    try:
        r = requests.head(url, timeout=2, allow_redirects=True)
        if 'Content-Length' in r.headers:
            size_bytes = int(r.headers['Content-Length'])
            return f"{round(size_bytes / (1024*1024), 2)} MB"
    except:
        pass
    return "Ukuran Asli" # Jika server sosmed benar-benar mengunci infonya

@app.route('/api/get-info', methods=['POST'])
def get_info():
    data = request.json
    url = data.get('url')
    platform = data.get('platform')
    
    if not url:
        return jsonify({'success': False, 'message': 'Tautan tidak boleh kosong!'})

    url = url.replace('https://x.com/', 'https://twitter.com/')
    url = url.replace('x.com', 'twitter.com')

    ydl_opts = {'quiet': True, 'no_warnings': True}

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
            
        title = info.get('title', f'Video {platform.capitalize()}')
        
        raw_thumb = info.get('thumbnail', '')
        if raw_thumb:
            safe_thumb_url = urllib.parse.quote(raw_thumb, safe='')
            thumbnail = f"/api/proxy-thumb?url={safe_thumb_url}"
        else:
            thumbnail = "https://via.placeholder.com/300x180?text=Thumbnail+Privasi+(Aman)"
        
        available_formats = []
        seen_res = set()
        
        for f in info.get('formats', []):
            h = f.get('height') or 0
            vcodec = f.get('vcodec')
            acodec = f.get('acodec')
            format_note = str(f.get('format_note', '')).lower()

            # Syarat lolos: Punya gambar & suara, ATAU khusus tiktok (watermark logic)
            if (vcodec != 'none' and acodec != 'none') or ('watermark' in format_note):
                # Batasi maksimal 720p agar Vercel aman
                if h <= 720: 
                    # Filter agar tidak duplikat resolusi
                    if h not in seen_res or h == 0:
                        if h > 0: seen_res.add(h)
                        
                        # Cek MB Real
                        size = f.get('filesize') or f.get('filesize_approx')
                        if size:
                            size_str = f"{round(size / (1024*1024), 2)} MB"
                        else:
                            size_str = get_real_size(f.get('url'))

                        # Penamaan Cerdas 
                        label = f"{h}p HD" if h >= 720 else (f"{h}p SD" if h > 0 else "Video Standar")
                        
                        # Khusus pemisah TikTok (No Watermark = Premium, Watermark = Gratis)
                        if 'watermark' in format_note and 'no' not in format_note:
                            label = "Dengan Watermark"
                        elif platform == 'tiktok':
                            label = "Tanpa Watermark (HD)"

                        available_formats.append({
                            'height': h,
                            'label': label,
                            'size': size_str,
                            'direct_url': f.get('url')
                        })
        
        # Jika benar-benar kosong (fallback darurat)
        if not available_formats:
            size_str = get_real_size(info.get('url'))
            available_formats.append({
                'height': 720,
                'label': 'Video Asli (Optimal)',
                'size': size_str,
                'direct_url': info.get('url')
            })

        # Urutkan dari HD ke rendah
        available_formats.sort(key=lambda x: x['height'], reverse=True)

        return jsonify({
            'success': True,
            'title': title,
            'thumbnail': thumbnail,
            'formats': available_formats
        })

    except Exception as e:
        return jsonify({'success': False, 'message': 'Gagal mengambil data. Pastikan link publik.'})

@app.route('/api/send-feedback', methods=['POST'])
def send_feedback():
    data = request.json
    sender_name = data.get('name')
    sender_email = data.get('email')
    message = data.get('message')

    if not sender_name or not sender_email or not message:
        return jsonify({'success': False, 'message': 'Data tidak lengkap!'})

    MY_EMAIL = os.getenv('EMAIL_ADDRESS')
    APP_PASSWORD = os.getenv('EMAIL_APP_PASSWORD')

    if not MY_EMAIL or not APP_PASSWORD:
        return jsonify({'success': False, 'message': 'ENV Vercel belum disetting.'})

    msg = MIMEMultipart()
    msg['From'] = f"{sender_name} via Downloader <{MY_EMAIL}>" 
    msg['To'] = MY_EMAIL
    msg['Subject'] = f"💡 Saran Baru dari: {sender_name}"
    msg['Reply-To'] = sender_email 

    body = f"Dari: {sender_name}\nEmail: {sender_email}\nPesan:\n{message}"
    msg.attach(MIMEText(body, 'plain'))

    try:
        server = smtplib.SMTP('smtp.gmail.com', 587)
        server.starttls()
        server.login(MY_EMAIL, APP_PASSWORD)
        server.send_message(msg)
        server.quit()
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, threaded=True)
