$port = 8080
$baseDir = "c:\Users\jono\.antigravity-ide\fx-swap-piggybank"
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")
try {
    $listener.Start()
    Write-Host "Server started on http://localhost:$port/"
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response
        
        $urlPath = [System.Uri]::UnescapeDataString($request.Url.LocalPath).Trim()
        Write-Host "Received request for UrlPath: '$urlPath'"
        
        if ([string]::IsNullOrEmpty($urlPath) -or $urlPath -eq "/") {
            $urlPath = "/index.html"
            Write-Host "Redirected empty/root path to: '$urlPath'"
        }
        
        $relPath = $urlPath -replace '^/', ''
        $relPath = $relPath -replace '/', '\'
        
        $localPath = "$baseDir\$relPath"
        $localPath = [System.IO.Path]::GetFullPath($localPath)
        
        Write-Host "Mapped relPath: '$relPath' to localPath: '$localPath'"
        
        if (-not $localPath.StartsWith($baseDir)) {
            Write-Host "Security violation: localPath '$localPath' is outside baseDir '$baseDir'"
            $response.StatusCode = 403
            $response.OutputStream.Close()
            continue
        }
        
        if (Test-Path $localPath -PathType Leaf) {
            Write-Host "Serving file: '$localPath'"
            $bytes = [System.IO.File]::ReadAllBytes($localPath)
            $ext = [System.IO.Path]::GetExtension($localPath).ToLower()
            
            $mimeTypes = @{
                ".html" = "text/html; charset=utf-8"
                ".css"  = "text/css; charset=utf-8"
                ".js"   = "application/javascript; charset=utf-8"
                ".png"  = "image/png"
                ".jpg"  = "image/jpeg"
                ".jpeg" = "image/jpeg"
                ".gif"  = "image/gif"
                ".svg"  = "image/svg+xml"
                ".ico"  = "image/x-icon"
            }
            $contentType = $mimeTypes[$ext]
            if ($null -eq $contentType) {
                $contentType = "application/octet-stream"
            }
            
            $response.ContentType = $contentType
            $response.ContentLength64 = $bytes.Length
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
        } else {
            Write-Host "File not found: '$localPath'"
            $response.StatusCode = 404
            $errorMessage = "File not found: $urlPath (LocalPath: $localPath)"
            $errBytes = [System.Text.Encoding]::UTF8.GetBytes($errorMessage)
            $response.ContentType = "text/plain; charset=utf-8"
            $response.ContentLength64 = $errBytes.Length
            $response.OutputStream.Write($errBytes, 0, $errBytes.Length)
        }
        $response.OutputStream.Close()
    }
} catch {
    Write-Error $_
} finally {
    $listener.Stop()
}
