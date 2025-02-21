Write-Host "启动后端服务..."
Start-Process -FilePath "python" -ArgumentList "backend/app.py" -WorkingDirectory (Get-Location)

Write-Host "启动前端服务..."
Start-Process -FilePath "npm" -ArgumentList "start" -WorkingDirectory (Get-Location)

Write-Host "服务已启动！"
Write-Host "前端地址: http://localhost:3000"
Write-Host "后端地址: http://localhost:5000"
