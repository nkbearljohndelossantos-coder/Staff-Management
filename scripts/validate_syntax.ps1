# ==============================================================================
# NKB SYSTEM -- POWERSHELL PARSER VALIDATION
# Tests AST parsing without executing scripts or touching network/files
# ==============================================================================

$scripts = @(
    "z:\HP Gaming Backup\Staff-Management-main\Staff-Management-main\scripts\inspect_vps_phase1.ps1",
    "z:\HP Gaming Backup\Staff-Management-main\Staff-Management-main\scripts\check_dns.ps1",
    "z:\HP Gaming Backup\Staff-Management-main\Staff-Management-main\scripts\deep_dns_investigation.ps1",
    "z:\HP Gaming Backup\Staff-Management-main\Staff-Management-main\scripts\inspect_vps_phase1_5.ps1"
)

$resultFile = "z:\HP Gaming Backup\Staff-Management-main\Staff-Management-main\scripts\syntax_validation_result.txt"
$totalErrors = 0
$output = @()

foreach ($script in $scripts) {
    if (Test-Path $script) {
        $tokens = $null
        $errors = $null
        [System.Management.Automation.Language.Parser]::ParseFile((Resolve-Path $script), [ref]$tokens, [ref]$errors) | Out-Null
        
        $baseName = Split-Path $script -Leaf
        if ($errors.Count -gt 0) {
            $totalErrors += $errors.Count
            $msg = "[-] $baseName : FAILED with $($errors.Count) error(s):"
            Write-Host $msg -ForegroundColor Red
            $output += $msg
            foreach ($err in $errors) {
                $detail = "    Line $($err.Extent.StartLineNumber): $($err.Message)"
                Write-Host $detail -ForegroundColor Red
                $output += $detail
            }
        } else {
            $msg = "[+] $baseName : PowerShell syntax validation PASSED (0 errors, $($tokens.Count) tokens)"
            Write-Host $msg -ForegroundColor Green
            $output += $msg
        }
    } else {
        $msg = "[!] File not found: $script"
        Write-Host $msg -ForegroundColor Yellow
        $output += $msg
    }
}

$output | Set-Content -Path $resultFile -Encoding ASCII

if ($totalErrors -gt 0) {
    exit 1
} else {
    Write-Host "`nAll PowerShell scripts validated with 0 syntax errors." -ForegroundColor Green
    exit 0
}
