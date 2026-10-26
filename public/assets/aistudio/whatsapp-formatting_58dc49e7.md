---
name: whatsapp-formatting
description: Aturan format teks WhatsApp (bold, italic, strikethrough, monospace, list, blockquote, inline code) yang BERBEDA dari Markdown standar. Gunakan skill ini setiap kali user meminta menulis, membuat draft, atau memformat pesan/teks untuk WhatsApp — termasuk broadcast, balasan chat, pesan promosi, pengumuman grup, atau template WA lainnya — supaya sintaks yang dipakai benar-benar valid di WhatsApp, bukan sintaks Markdown biasa (misal **bold** atau # heading yang TIDAK berlaku di WhatsApp).
---
 
# WhatsApp Text Formatting
 
WhatsApp punya sintaks formatting sendiri yang mirip tapi tidak sama dengan Markdown standar. Jangan pakai sintaks Markdown biasa (`**bold**`, `` `code` `` multi-baris, `#` heading, dll) karena tidak akan ter-render di WhatsApp.
 
## Sintaks yang valid
 
| Format | Sintaks | Contoh |
|---|---|---|
| Bold | satu bintang di awal & akhir | `*text*` |
| Italic | garis bawah (underscore) di awal & akhir | `_text_` |
| Strikethrough | tilde di awal & akhir | `~text~` |
| Monospace | tiga backtick di awal & akhir | ` ```text``` ` |
| Inline code | satu backtick di awal & akhir | `` `text` `` |
| Bulleted list | `*` atau `-` diikuti spasi, di awal baris | `* item` atau `- item` |
| Numbered list | angka, titik, spasi, di awal baris | `1. item` |
| Blockquote | `>` diikuti spasi, di awal baris | `> teks` |
 
Catatan: tidak ada heading (`#`), tidak ada link markdown `[text](url)`, tidak ada bold+italic gabungan dengan sintaks khusus — WhatsApp hanya mendukung daftar di atas.
 
## Aturan kritis: satu blok paragraf
 
**Formatting HANYA berlaku jika penanda pembuka dan penutup berada dalam satu blok paragraf yang sama** — tidak boleh terpisah oleh baris baru (enter/newline).
 
Contoh yang GAGAL (tidak akan bold, karena "halo" dan "dunia" terpisah newline):
```
*halo
dunia*
```
 
Contoh yang BENAR:
```
*halo dunia*
```
 
Ini berarti saat menulis pesan WA dengan format campuran, pastikan setiap penanda format menutup di baris yang sama dengan pembukanya. Kalau butuh bold di beberapa baris terpisah (misal judul lalu isi), beri tanda bintang terpisah per baris, bukan membentang lintas baris:
 
```
*Judul Promo*
Diskon 50% untuk semua produk!
```
 
bukan:
 
```
*Judul Promo
Diskon 50% untuk semua produk!*
```
 
## Cara menerapkan
 
Saat diminta menulis draft pesan, broadcast, atau balasan WhatsApp:
1. Gunakan sintaks tabel di atas, bukan Markdown standar.
2. Terapkan formatting per baris/blok — cek ulang bahwa setiap pasangan penanda (`*...*`, `_..._`, dll) tidak melompati newline.
3. Untuk list dan blockquote, pastikan setiap baris item dimulai dengan penanda yang benar (`* `, `- `, `1. `, `> `).
4. Jangan gunakan format Markdown yang tidak didukung WhatsApp (heading, link berlabel, bold ganda `**`).
