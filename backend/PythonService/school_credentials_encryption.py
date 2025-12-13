"""
Encryption utilities for school credentials
Sử dụng AES-256 để mã hóa username/password
"""

from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.backends import default_backend
import base64
import os


class CredentialsEncryption:
    """
    Encrypt/Decrypt school credentials using AES-256
    """
    
    def __init__(self, secret_key: str = None):
        """
        Initialize with secret key
        If no key provided, use environment variable or generate one
        """
        if secret_key is None:
            secret_key = os.getenv('ENCRYPTION_SECRET_KEY', 'default-secret-key-change-in-production')
        
        # Derive encryption key from secret
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=b'agent-for-edu-salt',  # In production, use random salt per user
            iterations=100000,
            backend=default_backend()
        )
        key = base64.urlsafe_b64encode(kdf.derive(secret_key.encode()))
        self.cipher = Fernet(key)
    
    def encrypt(self, plaintext: str) -> str:
        """Encrypt plaintext to ciphertext"""
        if not plaintext:
            return ""
        
        encrypted = self.cipher.encrypt(plaintext.encode())
        return base64.urlsafe_b64encode(encrypted).decode()
    
    def decrypt(self, ciphertext: str) -> str:
        """Decrypt ciphertext to plaintext"""
        if not ciphertext:
            return ""
        
        try:
            decoded = base64.urlsafe_b64decode(ciphertext.encode())
            decrypted = self.cipher.decrypt(decoded)
            return decrypted.decode()
        except Exception as e:
            print(f"Decryption error: {e}")
            return ""


# Global instance
encryption = CredentialsEncryption()


def encrypt_credentials(username: str, password: str) -> tuple:
    """
    Encrypt username and password
    Returns: (encrypted_username, encrypted_password)
    """
    return (
        encryption.encrypt(username),
        encryption.encrypt(password)
    )


def decrypt_credentials(encrypted_username: str, encrypted_password: str) -> tuple:
    """
    Decrypt username and password
    Returns: (username, password)
    """
    return (
        encryption.decrypt(encrypted_username),
        encryption.decrypt(encrypted_password)
    )


# Test
if __name__ == "__main__":
    # Test encryption
    username = "20120001"
    password = "mypassword123"
    
    print("Original:")
    print(f"  Username: {username}")
    print(f"  Password: {password}")
    
    # Encrypt
    enc_user, enc_pass = encrypt_credentials(username, password)
    print("\nEncrypted:")
    print(f"  Username: {enc_user}")
    print(f"  Password: {enc_pass}")
    
    # Decrypt
    dec_user, dec_pass = decrypt_credentials(enc_user, enc_pass)
    print("\nDecrypted:")
    print(f"  Username: {dec_user}")
    print(f"  Password: {dec_pass}")
    
    # Verify
    assert username == dec_user
    assert password == dec_pass
    print("\n✅ Encryption/Decryption test passed!")
