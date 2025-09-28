import base64
import os
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.backends import default_backend

def generate_vapid_keys():
    """Generate VAPID key pair for push notifications"""
    
    # Generate private key
    private_key = ec.generate_private_key(ec.SECP256R1(), default_backend())
    
    # Get public key
    public_key = private_key.public_key()
    
    # Serialize private key
    private_pem = private_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption()
    )
    
    # Serialize public key in uncompressed format for VAPID
    public_bytes = public_key.public_bytes(
        encoding=serialization.Encoding.X962,
        format=serialization.PublicFormat.UncompressedPoint
    )
    
    # Convert to base64url format (remove padding)
    public_key_b64 = base64.urlsafe_b64encode(public_bytes).decode('utf-8').rstrip('=')
    private_key_b64 = base64.urlsafe_b64encode(private_pem).decode('utf-8').rstrip('=')
    
    print("VAPID Keys Generated Successfully!")
    print("=" * 50)
    print(f"NEXT_PUBLIC_VAPID_PUBLIC_KEY={public_key_b64}")
    print(f"VAPID_PRIVATE_KEY={private_key_b64}")
    print("=" * 50)
    print("Add these environment variables to your Vercel project:")
    print("1. Go to your Vercel dashboard")
    print("2. Navigate to Project Settings > Environment Variables")
    print("3. Add both keys as shown above")
    print("4. Redeploy your application")

if __name__ == "__main__":
    generate_vapid_keys()
