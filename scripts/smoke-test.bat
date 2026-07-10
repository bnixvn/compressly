@echo off
REM Smoke test cho API Compressly. Cần server dang chay tai localhost:3000.
set KEY=sk_demo_4f3c9a
set URL=http://localhost:3000

if not exist test-assets mkdir test-assets

echo [1] GET /api/v1
curl -s %URL%/api/v1
echo.

echo [2] compress (thieu key -> 401)
curl -s -o /dev/null -w "HTTP %{http_code}\n" -X POST %URL%/api/v1/images/compress -F "file=@test-assets/sample.jpg"

echo [3] compress (co key)
curl -s -D - -o test-assets/out-compress.jpg -X POST %URL%/api/v1/images/compress ^
  -H "Authorization: Bearer %KEY%" -F "file=@test-assets/sample.jpg" | findstr /I "HTTP/ X-"
echo.

echo [4] convert/webp
curl -s -D - -o test-assets/out.webp -X POST %URL%/api/v1/images/convert/webp ^
  -H "Authorization: Bearer %KEY%" -F "file=@test-assets/sample.png" | findstr /I "HTTP/ X-"
echo.

echo [5] optimize mode=webp quality=70
curl -s -D - -o test-assets/out-opt.webp -X POST %URL%/api/v1/images/optimize ^
  -H "Authorization: Bearer %KEY%" -F "file=@test-assets/sample.jpg" -F "mode=webp" -F "quality=70" | findstr /I "HTTP/ X-"
echo.

echo [6] reject GIF (415)
curl -s -o /dev/null -w "HTTP %{http_code}\n" -X POST %URL%/api/v1/images/compress ^
  -H "Authorization: Bearer %KEY%" -F "file=@test-assets/sample.gif"
