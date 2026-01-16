<?php

namespace App\Services;

use Illuminate\Support\Facades\Crypt;

class CredentialEncryptionService
{
    /**
     * Encrypt a value
     */
    public function encrypt(string $value): string
    {
        return Crypt::encryptString($value);
    }

    /**
     * Decrypt a value
     */
    public function decrypt(string $encryptedValue): string
    {
        try {
            return Crypt::decryptString($encryptedValue);
        } catch (\Exception $e) {
            return '';
        }
    }
}
