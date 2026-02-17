# Manual Deployment Guide for jol3.com

## Quick Fix for Icon Permission Issues

Since you have an SSH terminal open, here's the fastest way to fix the permissions:

### Option 1: Run Permission Fix Script (Recommended)

1. **Upload the fix script to your server:**
   ```bash
   # From your local terminal (in the jol3 project directory)
   scp -P 2222 fix-permissions.sh jol3@jol3.com:~/
   ```

2. **In your SSH terminal on the server, run:**
   ```bash
   chmod +x ~/fix-permissions.sh
   ~/fix-permissions.sh
   ```

3. **Test the site:**
   - Visit https://jol3.com
   - All icons should now load correctly

---

### Option 2: Manual Permission Fix (If Option 1 Doesn't Work)

**In your SSH terminal on the server, run these commands:**

```bash
# Navigate to your web directory
cd ~/public_html

# Fix all directory permissions
find . -type d -exec chmod 755 {} \;

# Fix all file permissions
find . -type f -exec chmod 644 {} \;

# Specifically fix icons
chmod 755 icons
chmod 644 icons/*.png

# Verify icon permissions
ls -la icons/
```

---

### Option 3: Full Re-Upload via cPanel File Manager

1. **Build the site locally:**
   ```bash
   npm run build
   ```

2. **Upload via cPanel:**
   - Log into cPanel at your hosting provider
   - Open File Manager
   - Navigate to `public_html`
   - Delete old files (keep backups!)
   - Upload all files from the `out` directory
   - Make sure the `icons` folder and all `.png` files are uploaded

3. **Fix permissions via cPanel:**
   - Select the `icons` folder → Change Permissions → 755
   - Select all files in `icons` → Change Permissions → 644

---

## Verify Deployment

After fixing permissions, test these URLs:
- https://jol3.com/ (should load main page)
- https://jol3.com/icons/folder.png (should load image)
- https://jol3.com/icons/notepad.png (should load image)
- https://jol3.com/icons/url-shortcut.png (should load image)
- https://jol3.com/icons/brainjar.png (should load image)

All should return **200 OK** status (you can check in browser dev tools or with curl).

---

## Common Issues

**If icons still don't load:**

1. **Check ModSecurity settings in cPanel:**
   - Navigate to Security → ModSecurity
   - Temporarily disable to test if it's blocking PNG files
   - If this fixes it, whitelist your domain

2. **Check .htaccess file:**
   ```bash
   # In SSH, check if .htaccess exists
   cat ~/public_html/.htaccess
   ```
   - Look for rules that might block image files
   - Comment out suspicious rules with `#`

3. **Contact hosting support:**
   - Mention that PNG files in `/icons` directory return 403/406 errors
   - Ask them to check ModSecurity rules
   - Request they verify directory/file permissions

---

## Need Help?

If you encounter issues:
1. Check the browser console for specific error messages
2. Run `ls -la ~/public_html/icons/` in SSH to verify files and permissions
3. Check server error logs via cPanel
