"""
Verify OAuth Configuration
Kiểm tra xem tất cả config đã đúng chưa
"""
import os
from dotenv import load_dotenv

print("=" * 60)
print("🔍 Verifying OAuth Configuration")
print("=" * 60)
print()

# Load .env
load_dotenv('backend/PythonService/.env')

# Check required variables
required_vars = {
    'GOOGLE_OAUTH_CLIENT_ID': 'OAuth Client ID',
    'GOOGLE_OAUTH_CLIENT_SECRET': 'OAuth Client Secret',
    'GOOGLE_OAUTH_REDIRECT_URI': 'Redirect URI',
    'ENCRYPTION_KEY': 'Encryption Key',
    'OAUTH_SERVICE_PORT': 'OAuth Service Port',
    'FRONTEND_URL': 'Frontend URL',
    'SPRING_BOOT_URL': 'Spring Boot URL'
}

all_good = True

for var, name in required_vars.items():
    value = os.getenv(var)
    
    if not value:
        print(f"❌ {name}: NOT SET")
        all_good = False
    elif value in ['YOUR_CLIENT_SECRET_HERE', 'WILL_GENERATE_BELOW', 'your_encryption_key_here']:
        print(f"⚠️  {name}: PLACEHOLDER VALUE (needs update)")
        all_good = False
    else:
        # Mask sensitive values
        if 'SECRET' in var or 'KEY' in var:
            masked = value[:10] + '...' + value[-4:] if len(value) > 14 else '***'
            print(f"✅ {name}: {masked}")
        else:
            print(f"✅ {name}: {value}")

print()
print("=" * 60)

if all_good:
    print("✅ All OAuth configuration is correct!")
    print()
    print("Next steps:")
    print("1. Run database migration:")
    print("   backend/SpringService/agentforedu/database_migration_google_oauth.sql")
    print()
    print("2. Start services:")
    print("   .\\start-with-oauth.ps1")
    print()
    print("3. Test OAuth:")
    print("   http://localhost:3000 → Settings → Connect Google")
else:
    print("❌ Configuration incomplete!")
    print()
    print("Please update backend/PythonService/.env with:")
    print("- Your actual Client Secret from Google Console")
    print("- Generated Encryption Key")
    print()
    print("Run: python generate-encryption-key.py")

print("=" * 60)
