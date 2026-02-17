# Deployment Guide for jol3.com

Your site is built and ready to deploy! The build files are in the `out` directory.

## ⚠️ IMPORTANT SECURITY NOTE
You shared your password publicly. **Change it immediately** after deployment via cPanel!

---

## Option 1: Use Cyberduck or FileZilla (EASIEST - RECOMMENDED)

### Using Cyberduck (Mac):
1. **Download Cyberduck** (if not installed): https://cyberduck.io
2. **Create new connection**:
   - Protocol: SFTP (SSH File Transfer Protocol)
   - Server: jol3.com
   - Port: 2222
   - Username: Try both:
     - `jol3`
     - `jol3@da7id.com` (if first doesn't work)
   - Password: `(u#_*r)L16I*`
3. **Connect** and if asked about SSH keys, click "Allow"
4. **Navigate** to `public_html` folder (create if it doesn't exist)
5. **Upload** everything from the `out` folder to `public_html`
6. **Done!** Visit https://jol3.com

### Using FileZilla:
1. **Download FileZilla**: https://filezilla-project.org
2. **Site Manager** → New Site:
   - Protocol: SFTP
   - Host: jol3.com
   - Port: 2222
   - Logon Type: Normal
   - Username: `jol3` (or `jol3@da7id.com`)
   - Password: `(u#_*r)L16I*`
3. **Connect**
4. **Upload** contents of `out/` to `public_html/`

---

## Option 2: Set up SSH Keys (More Secure)

If you want automated deployments:

1. **Generate SSH key** (if you don't have one):
   ```bash
   ssh-keygen -t ed25519 -C "jol3@jol3.com"
   ```

2. **Copy your public key**:
   ```bash
   cat ~/.ssh/id_ed25519.pub
   ```

3. **Add to cPanel**:
   - Log into cPanel
   - Go to "SSH Access" or "Manage SSH Keys"
   - Add your public key
   - Authorize it

4. **Then run**:
   ```bash
   ./deploy.sh
   ```

---

## Option 3: Manual cPanel File Manager

1. Log into cPanel at https://jol3.com/cpanel (or your hosting's cPanel URL)
2. Open "File Manager"
3. Navigate to `public_html`
4. Delete existing files (if any)
5. Upload the entire contents of the `out` folder
6. Done!

---

## What to Upload

Upload **EVERYTHING** inside the `out` folder to `public_html`:
- `index.html`
- `404.html`
- `index.txt`
- `_next/` folder
- `icons/` folder
- `jol3_gif/` folder
- `resume/` folder
- `wallpapers/` folder

## After Deployment

1. Visit https://jol3.com to see your site
2. Test all windows and features
3. **CHANGE YOUR PASSWORD** via cPanel → "Password & Security"
4. If anything doesn't work, check:
   - All files uploaded correctly
   - `.htaccess` file if needed for routing
   - File permissions (usually 644 for files, 755 for folders)

---

## Rebuilding After Changes

If you make changes to your site:

```bash
# 1. Make your changes
# 2. Rebuild
npm run build

# 3. Re-upload the out/ folder using your preferred method above
```

---

## Need Help?

Contact your brother or hosting support if:
- Can't connect via SFTP
- Need to reset password
- Site not loading after upload
