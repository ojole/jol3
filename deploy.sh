#!/bin/bash

# Deployment script for jol3.com
# This will upload your site to your hosting server

echo "🚀 Deploying jol3.com to hosting server..."

# Configuration
SERVER="jol3.com"
PORT="2222"
USER="jol3"
PASSWORD='(u#_*r)L16I*'
REMOTE_DIR="public_html"
SSH_OPTS="-o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null"

# Check if build exists
if [ ! -d "out" ]; then
    echo "❌ Build directory not found. Run 'npm run build' first."
    exit 1
fi

echo "📦 Found build directory with $(find out -type f | wc -l) files"

# Create expect script for deployment
expect << EOF
set timeout 300
log_user 1

# Try first username
puts "🔍 Testing connection with username: ${USER}\n"
spawn ssh ${SSH_OPTS} -p ${PORT} ${USER}@${SERVER} "mkdir -p ${REMOTE_DIR} && ls -la ${REMOTE_DIR}"
expect {
    "yes/no" {
        send "yes\r"
        exp_continue
    }
    "password:" {
        send "${PASSWORD}\r"
        expect {
            -re "public_html|total" {
                puts "\n✅ Successfully connected! Deploying files...\n"
            }
            "Permission denied" {
                puts "\n❌ Authentication failed\n"
                exit 1
            }
            timeout {
                puts "\n❌ Connection successful but couldn't access ${REMOTE_DIR}\n"
                exit 1
            }
        }
    }
    "Permission denied" {
        puts "\n❌ Authentication failed with username ${USER}\n"
        exit 1
    }
    timeout {
        puts "\n❌ Connection timeout\n"
        exit 1
    }
}

# Deploy files using rsync over SSH
puts "\n📤 Uploading files to ${SERVER}...\n"
spawn rsync -avz --delete -e "ssh ${SSH_OPTS} -p ${PORT}" ./out/ ${USER}@${SERVER}:${REMOTE_DIR}/
expect {
    "yes/no" {
        send "yes\r"
        exp_continue
    }
    "password:" {
        send "${PASSWORD}\r"
        expect {
            -re "total size|sent.*received" {
                puts "\n\n✅ Deployment successful!\n"
                puts "🌐 Your site should be live at https://jol3.com\n"
                puts "\n⚠️  IMPORTANT: Change your password immediately via cPanel!\n"
            }
            timeout {
                puts "\n❌ Deployment timeout\n"
                exit 1
            }
        }
    }
    timeout {
        puts "\n❌ Connection timeout\n"
        exit 1
    }
}

EOF

# Check if expect failed
if [ $? -ne 0 ]; then
    echo ""
    echo "❌ Deployment failed. Trying alternative username..."

    USER="jol3@da7id.com"

    expect << EOF
set timeout 300
log_user 1

puts "\n🔍 Testing connection with username: ${USER}\n"
spawn rsync -avz --delete -e "ssh ${SSH_OPTS} -p ${PORT}" ./out/ ${USER}@${SERVER}:${REMOTE_DIR}/
expect {
    "yes/no" {
        send "yes\r"
        exp_continue
    }
    "password:" {
        send "${PASSWORD}\r"
        expect {
            -re "total size|sent.*received" {
                puts "\n\n✅ Deployment successful with username ${USER}!\n"
                puts "🌐 Your site should be live at https://jol3.com\n"
                puts "\n⚠️  IMPORTANT: Change your password immediately via cPanel!\n"
            }
            timeout {
                puts "\n❌ Deployment timeout\n"
                exit 1
            }
        }
    }
    timeout {
        puts "\n❌ Connection timeout\n"
        exit 1
    }
}
EOF
fi

echo ""
echo "✅ Deployment complete!"
