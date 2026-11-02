# Telegram Mini App — GitHub Pages Static Build

Thư mục này chứa toàn bộ mã nguồn tĩnh (HTML, CSS, JavaScript) của **Telegram Mini App** đã được tối ưu và đóng gói hoàn chỉnh để tải trực tiếp lên GitHub Pages.

---

### Cấu trúc thư mục:
- `index.html`: File khởi động chính của ứng dụng Mini App.
- `404.html`: Hỗ trợ định tuyến Single Page Application trên GitHub Pages.
- `.nojekyll`: Tắt bộ xử lý Jekyll của GitHub để đảm bảo nạp đầy đủ các file CSS/JS.
- `assets/`: Chứa file mã nguồn giao diện (`.js`) và định dạng phong cách Cyberpunk (`.css`).

---

### Hướng dẫn Up lên GitHub Pages (2 Cách)

#### Cách 1: Kéo thả trực tiếp trên trình duyệt Web (Nhanh nhất - 30 giây)
1. Đăng nhập vào [GitHub.com](https://github.com/) -> Bấm **New repository** (đặt tên ví dụ: `shop-miniapp`, để chế độ **Public**).
2. Tại trang Repository mới tạo, bấm **"uploading an existing file"** (hoặc nút **Add file** -> **Upload files**).
3. Mở thư mục `githubpage` trên máy tính của bạn, chọn tất cả các file (`index.html`, `404.html`, `.nojekyll`, thư mục `assets`) và kéo thả vào trình duyệt.
4. Bấm nút màu xanh **"Commit changes"**.
5. Bật GitHub Pages:
   - Vào tab **Settings** của Repo -> Chọn mục **Pages** ở menu bên trái.
   - Tại phần **Build and deployment**:
     - **Source**: Chọn `Deploy from a branch`.
     - **Branch**: Chọn nhánh `main` và thư mục `/ (root)`.
     - Bấm **Save**.
   - Sau khoảng 10 giây, GitHub sẽ cấp cho bạn link trang web:
     👉 `https://<tai-khoan-github>.github.io/shop-miniapp/`

---

#### Cách 2: Sử dụng Git Command Line
Mở Terminal tại thư mục `githubpage` và chạy các lệnh sau:
```bash
cd githubpage
git init
git add .
git commit -m "feat: deploy telegram mini app to github pages"
git branch -M main
git remote add origin https://github.com/<tai-khoan-github>/<ten-repo>.git
git push -u origin main --force
```

---

### Cài đặt vào Telegram Bot (@BotFather)
1. Bật máy chủ Backend và Tunnel trên máy tính:
   ```bash
   npm run dev:backend
   npm run tunnel
   ```
   *(Nhận đường link Tunnel, ví dụ: `https://abc-xyz.trycloudflare.com`)*

2. Mở bot **@BotFather** trên Telegram -> `/mybots` -> Chọn Bot của bạn.
3. Chọn **Bot Settings** -> **Menu Button** -> **Configure menu button**.
4. Dán link GitHub Pages kèm đường dẫn Tunnel API:
   ```text
   https://<tai-khoan-github>.github.io/<ten-repo>/?apiUrl=https://abc-xyz.trycloudflare.com
   ```

Khi bạn mở bot trên Telegram và bấm nút Menu:
- Mini App sẽ mở lên từ GitHub Pages.
- Tự động nhận diện tài khoản Telegram của bạn và đăng nhập tức thì.
- Kết nối tới Backend và cơ sở dữ liệu trên máy tính của bạn an toàn 100%!
