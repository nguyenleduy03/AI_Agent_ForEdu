"""
Generate encryption key for OAuth tokens
"""
from cryptography.fernet import Fernet

print("=" * 60)
print("🔐 Generating Encryption Key for OAuth Tokens")
print("=" * 60)

key = Fernet.generate_key().decode()

print(f"\nYour encryption key:")
print(f"\n{key}\n")

print("Add this to your .env file:")
print(f"ENCRYPTION_KEY={key}")

print("\n" + "=" * 60)
print("✅ Done! Keep this key secure and never commit to Git!")
print("=" * 60)
