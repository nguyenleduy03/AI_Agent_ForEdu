@echo off
echo ============================================================
echo  Google Cloud Services Setup
echo ============================================================
echo.

echo Step 1: Installing Google Cloud libraries...
cd backend\PythonService
pip install google-cloud-vision google-cloud-translate google-cloud-speech google-cloud-texttospeech google-cloud-language

echo.
echo ============================================================
echo Step 2: Configuration
echo ============================================================
echo.
echo Please add your Google Cloud credentials to .env file:
echo.
echo Option 1 - API Key:
echo   GOOGLE_CLOUD_API_KEY=your_api_key_here
echo.
echo Option 2 - Service Account (recommended):
echo   GOOGLE_APPLICATION_CREDENTIALS=path/to/service-account.json
echo.
echo ============================================================
echo Step 3: Enable APIs on Google Cloud Console
echo ============================================================
echo.
echo Visit: https://console.cloud.google.com/apis/library
echo.
echo Enable these APIs:
echo   - Cloud Vision API
echo   - Cloud Translation API
echo   - Cloud Speech-to-Text API
echo   - Cloud Text-to-Speech API
echo   - Cloud Natural Language API
echo.
echo ============================================================
echo Setup Complete!
echo ============================================================
echo.
echo To start the service:
echo   python google_cloud_service.py
echo.
echo To test:
echo   python test_google_cloud.py
echo.
pause
