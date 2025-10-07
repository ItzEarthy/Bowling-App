# Bowling App Log Monitor for Windows PowerShell
# Provides real-time log viewing and basic analysis

param(
    [string]$Command = "watch",
    [int]$Minutes = 60
)

$LogPaths = @{
    Backend = @{
        Combined = ".\logs\backend\combined.log"
        Error = ".\logs\backend\error.log" 
        Access = ".\logs\backend\access.log"
    }
    Frontend = @{
        Access = ".\logs\frontend\access.log"
        Error = ".\logs\frontend\error.log"
        Api = ".\logs\frontend\api_access.log"
    }
}

function Write-ColoredOutput {
    param(
        [string]$Message,
        [string]$Level = "info"
    )
    
    $color = switch ($Level) {
        "error" { "Red" }
        "warn" { "Yellow" }
        "info" { "Green" }
        "http" { "Magenta" }
        "debug" { "Cyan" }
        default { "White" }
    }
    
    Write-Host $Message -ForegroundColor $color
}

function Format-LogEntry {
    param(
        [string]$RawLine,
        [string]$Source
    )
    
    try {
        $logEntry = $RawLine | ConvertFrom-Json
        $timestamp = Get-Date $logEntry.timestamp -Format "yyyy-MM-dd HH:mm:ss"
        $level = if ($logEntry.level) { $logEntry.level } else { "info" }
        $message = if ($logEntry.message) { $logEntry.message } else { $RawLine }
        
        $formatted = "[$timestamp] [$($Source.ToUpper())] $($level.ToUpper()): $message"
        
        if ($logEntry.correlationId) {
            $formatted += " [CID: $($logEntry.correlationId)]"
        }
        
        if ($logEntry.userId) {
            $formatted += " [User: $($logEntry.userId)]"
        }
        
        if ($logEntry.statusCode) {
            $formatted += " [$($logEntry.statusCode)]"
        }
        
        Write-ColoredOutput $formatted $level
    }
    catch {
        $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        Write-Host "[$timestamp] [$($Source.ToUpper())] $RawLine"
    }
}

function Watch-AllLogs {
    Write-Host "🎳 Bowling App Log Monitor" -ForegroundColor Green
    Write-Host "Starting log monitoring..." -ForegroundColor Cyan
    Write-Host ""
    
    $jobs = @()
    
    # Monitor backend logs
    foreach ($logType in $LogPaths.Backend.Keys) {
        $logPath = $LogPaths.Backend[$logType]
        if (Test-Path $logPath) {
            $source = "backend-$($logType.ToLower())"
            $job = Start-Job -ScriptBlock {
                param($Path, $Source)
                Get-Content $Path -Wait -Tail 10 | ForEach-Object {
                    [PSCustomObject]@{
                        Source = $Source
                        Line = $_
                        Timestamp = Get-Date
                    }
                }
            } -ArgumentList $logPath, $source
            $jobs += $job
        }
        else {
            Write-Warning "Log file $logPath does not exist"
        }
    }
    
    # Monitor frontend logs
    foreach ($logType in $LogPaths.Frontend.Keys) {
        $logPath = $LogPaths.Frontend[$logType]
        if (Test-Path $logPath) {
            $source = "frontend-$($logType.ToLower())"
            $job = Start-Job -ScriptBlock {
                param($Path, $Source)
                Get-Content $Path -Wait -Tail 10 | ForEach-Object {
                    [PSCustomObject]@{
                        Source = $Source
                        Line = $_
                        Timestamp = Get-Date
                    }
                }
            } -ArgumentList $logPath, $source
            $jobs += $job
        }
        else {
            Write-Warning "Log file $logPath does not exist"
        }
    }
    
    try {
        while ($true) {
            foreach ($job in $jobs) {
                $results = Receive-Job $job -ErrorAction SilentlyContinue
                foreach ($result in $results) {
                    if ($result.Line) {
                        Format-LogEntry $result.Line $result.Source
                    }
                }
            }
            Start-Sleep -Milliseconds 100
        }
    }
    finally {
        Write-Host "`nStopping log monitoring..." -ForegroundColor Yellow
        $jobs | Remove-Job -Force
    }
}

function Analyze-Logs {
    param([int]$Minutes)
    
    Write-Host "📊 Log Analysis (Last $Minutes minutes)" -ForegroundColor Blue
    Write-Host ""
    
    $since = (Get-Date).AddMinutes(-$Minutes)
    $analysis = @{
        Errors = 0
        Warnings = 0
        Requests = 0
        SlowRequests = 0
        AuthEvents = 0
        CorrelationIds = @{}
        Users = @{}
        StatusCodes = @{}
    }
    
    # Analyze backend logs
    $backendCombined = $LogPaths.Backend.Combined
    if (Test-Path $backendCombined) {
        $content = Get-Content $backendCombined
        
        foreach ($line in $content) {
            try {
                $logEntry = $line | ConvertFrom-Json
                $logTime = Get-Date $logEntry.timestamp
                
                if ($logTime -ge $since) {
                    if ($logEntry.level -eq "error") { $analysis.Errors++ }
                    if ($logEntry.level -eq "warn") { $analysis.Warnings++ }
                    if ($logEntry.level -eq "http") { $analysis.Requests++ }
                    if ($logEntry.correlationId) { $analysis.CorrelationIds[$logEntry.correlationId] = $true }
                    if ($logEntry.userId) { $analysis.Users[$logEntry.userId] = $true }
                    if ($logEntry.statusCode) { 
                        $analysis.StatusCodes[$logEntry.statusCode] = ($analysis.StatusCodes[$logEntry.statusCode] ?? 0) + 1 
                    }
                    if ($logEntry.responseTime -and $logEntry.responseTime -gt 1000) {
                        $analysis.SlowRequests++
                    }
                    if ($logEntry.action -and $logEntry.action -in @("LOGIN_SUCCESS", "LOGOUT", "TOKEN_REFRESH")) {
                        $analysis.AuthEvents++
                    }
                }
            }
            catch {
                # Skip non-JSON lines
            }
        }
    }
    
    # Display analysis
    Write-Host "📈 Summary:" -ForegroundColor Green
    Write-Host "  Total Requests: $($analysis.Requests)"
    Write-Host "  Unique Users: $($analysis.Users.Count)"
    Write-Host "  Unique Sessions: $($analysis.CorrelationIds.Count)"
    Write-Host "  Auth Events: $($analysis.AuthEvents)"
    
    if ($analysis.Errors -gt 0) {
        Write-Host "  Errors: $($analysis.Errors)" -ForegroundColor Red
    } else {
        Write-Host "  Errors: 0" -ForegroundColor Green
    }
    
    if ($analysis.Warnings -gt 0) {
        Write-Host "  Warnings: $($analysis.Warnings)" -ForegroundColor Yellow
    } else {
        Write-Host "  Warnings: 0" -ForegroundColor Green
    }
    
    if ($analysis.SlowRequests -gt 0) {
        Write-Host "  Slow Requests (>1s): $($analysis.SlowRequests)" -ForegroundColor Yellow
    }
    
    if ($analysis.StatusCodes.Count -gt 0) {
        Write-Host ""
        Write-Host "📊 Status Codes:" -ForegroundColor Blue
        foreach ($code in $analysis.StatusCodes.Keys | Sort-Object) {
            $count = $analysis.StatusCodes[$code]
            $color = if ($code -ge 400) { "Red" } elseif ($code -ge 300) { "Yellow" } else { "Green" }
            Write-Host "  $code`: $count" -ForegroundColor $color
        }
    }
}

function Show-Help {
    Write-Host "🎳 Bowling App Log Monitor" -ForegroundColor Green
    Write-Host ""
    Write-Host "Usage:" -ForegroundColor Cyan
    Write-Host "  .\scripts\log-monitor.ps1 [command] [options]"
    Write-Host ""
    Write-Host "Commands:" -ForegroundColor Cyan
    Write-Host "  watch                 Watch all logs in real-time (default)"
    Write-Host "  analyze [minutes]     Analyze logs from the last N minutes (default: 60)"
    Write-Host "  help                  Show this help message"
    Write-Host ""
    Write-Host "Examples:" -ForegroundColor Cyan
    Write-Host "  .\scripts\log-monitor.ps1                    # Watch all logs"
    Write-Host "  .\scripts\log-monitor.ps1 analyze            # Analyze last 60 minutes"
    Write-Host "  .\scripts\log-monitor.ps1 analyze -Minutes 30 # Analyze last 30 minutes"
    Write-Host ""
    Write-Host "Log Files:" -ForegroundColor Cyan
    Write-Host "  Backend: .\logs\backend\combined.log, error.log, access.log"
    Write-Host "  Frontend: .\logs\frontend\access.log, error.log, api_access.log"
}

# Main execution
switch ($Command.ToLower()) {
    "watch" {
        Watch-AllLogs
    }
    "analyze" {
        Analyze-Logs $Minutes
    }
    "help" {
        Show-Help
    }
    default {
        Write-Host "Unknown command: $Command" -ForegroundColor Red
        Show-Help
        exit 1
    }
}