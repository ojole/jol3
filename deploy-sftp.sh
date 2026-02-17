#!/bin/bash

# SFTP Deployment script for jol3.com
echo "🚀 Deploying jol3.com via SFTP..."

# Configuration
SERVER="jol3.com"
PORT="2222"
USER="jol3"
PASSWORD='(u#_*r)L16I*'
REMOTE_DIR="public_html"

# Check if build exists
if [ ! -d "out" ]; then
    echo "❌ Build directory not found. Run 'npm run build' first."
    exit 1
fi

echo "📦 Found build directory with $(find out -type f | wc -l) files"

# Create SFTP batch commands
cat > /tmp/sftp-deploy.txt << 'EOFSFTP'
-mkdir public_html
cd public_html
put -r out/*
bye
EOFSFTP

echo "📤 Uploading files..."

# Use lftp for more reliable SFTP transfer
lftp -u ${USER},${PASSWORD} -p ${PORT} sftp://${SERVER} << EOFSFTP
set sftp:auto-confirm yes
set ssl:verify-certificate no
mirror --reverse --delete --verbose ./out/ ./public_html/
bye
EOFSFTP

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Deployment successful!"
    echo "🌐 Your site should be live at https://jol3.com"
    echo ""
    echo "⚠️  IMPORTANT: Change your password immediately via cPanel!"
else
    echo ""
    echo "❌ Deployment failed. You may need to:"
    echo "1. Install lftp: brew install lftp"
    echo "2. Or use FileZilla/Cyberduck to manually upload the 'out' folder"
    echo "   Server: jol3.com"
    echo "   Port: 2222  "
    echo "   Protocol: SFTP"
    echo "   Username: jol3"
    echo "   Remote folder: public_html"
fi
