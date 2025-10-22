# COM3 Port Test
Write-Host "COM3 Test Basladi" -ForegroundColor Yellow

try {
    $port = New-Object System.IO.Ports.SerialPort "COM3", 9600, None, 8, One
    $port.Handshake = [System.IO.Ports.Handshake]::RequestToSend  # Hardware Flow Control
    $port.Open()
    
    if ($port.IsOpen) {
        Write-Host "Port acildi!" -ForegroundColor Green
        
        # Test text
        $port.WriteLine("TEST PRINTER")
        Start-Sleep -Seconds 1
        
        $port.Close()
        Write-Host "Test tamamlandi!" -ForegroundColor Green
    }
} catch {
    Write-Host "HATA: $($_.Exception.Message)" -ForegroundColor Red
}
