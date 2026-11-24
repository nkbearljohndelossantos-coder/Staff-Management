# ==============================================================================
# NKB MANUFACTURING SYSTEM -- DNS RESOLUTION & CONFIGURATION AUDIT
# Domain: m.nkbmanufacturing.com
# Target VPS IP: 187.77.143.211
# ==============================================================================

$DOMAIN = "m.nkbmanufacturing.com"
$APEX_DOMAIN = "nkbmanufacturing.com"
$TARGET_IP = "187.77.143.211"
$OUTPUT_FILE = "z:\HP Gaming Backup\Staff-Management-main\Staff-Management-main\dns_audit_output.txt"

Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host " NKB SYSTEM -- DNS RESOLUTION AUDIT" -ForegroundColor Cyan
Write-Host " Target Domain: $DOMAIN" -ForegroundColor Cyan
Write-Host " Target VPS IP: $TARGET_IP" -ForegroundColor Cyan
Write-Host "=================================================================" -ForegroundColor Cyan

$REPORT = @()
$REPORT += "================================================================="
$REPORT += "NKB MANUFACTURING SYSTEM -- DNS RESOLUTION AUDIT REPORT"
$REPORT += "Timestamp: $(Get-Date -Format 'yyyy-MM-ddTHH:mm:sszzz')"
$REPORT += "Target Domain: $DOMAIN"
$REPORT += "Apex Domain:   $APEX_DOMAIN"
$REPORT += "Target VPS IP: $TARGET_IP"
$REPORT += "================================================================="

# 1. Check local resolver
Write-Host ""
Write-Host "[1/4] Querying Default Local DNS Resolver..." -ForegroundColor Yellow
$localA = Resolve-DnsName -Name $DOMAIN -Type A -ErrorAction SilentlyContinue
if ($localA) {
    $currentIPs = ($localA | Select-Object -ExpandProperty IPAddress) -join ", "
    Write-Host "  -> Resolved IP(s): $currentIPs" -ForegroundColor Green
    $REPORT += "Default DNS Resolver: $currentIPs"
} else {
    Write-Host "  -> No A record returned from local resolver." -ForegroundColor Red
    $REPORT += "Default DNS Resolver: NO_RECORD_FOUND"
}

# 2. Check Google Public DNS (8.8.8.8)
Write-Host ""
Write-Host "[2/4] Querying Google Public DNS (8.8.8.8)..." -ForegroundColor Yellow
$googleA = Resolve-DnsName -Name $DOMAIN -Type A -Server 8.8.8.8 -ErrorAction SilentlyContinue
if ($googleA) {
    $googleIPs = ($googleA | Select-Object -ExpandProperty IPAddress) -join ", "
    Write-Host "  -> Google DNS: $googleIPs" -ForegroundColor Green
    $REPORT += "Google DNS (8.8.8.8): $googleIPs"
} else {
    Write-Host "  -> Google DNS returned no record." -ForegroundColor Red
    $REPORT += "Google DNS (8.8.8.8): NO_RECORD_FOUND"
}

# 3. Check Cloudflare Public DNS (1.1.1.1)
Write-Host ""
Write-Host "[3/4] Querying Cloudflare Public DNS (1.1.1.1)..." -ForegroundColor Yellow
$cfA = Resolve-DnsName -Name $DOMAIN -Type A -Server 1.1.1.1 -ErrorAction SilentlyContinue
if ($cfA) {
    $cfIPs = ($cfA | Select-Object -ExpandProperty IPAddress) -join ", "
    Write-Host "  -> Cloudflare DNS: $cfIPs" -ForegroundColor Green
    $REPORT += "Cloudflare DNS (1.1.1.1): $cfIPs"
} else {
    Write-Host "  -> Cloudflare DNS returned no record." -ForegroundColor Red
    $REPORT += "Cloudflare DNS (1.1.1.1): NO_RECORD_FOUND"
}

# 4. Check Nameservers for nkbmanufacturing.com
Write-Host ""
Write-Host "[4/4] Querying Authoritative Nameservers for $APEX_DOMAIN..." -ForegroundColor Yellow
$nsRecords = Resolve-DnsName -Name $APEX_DOMAIN -Type NS -ErrorAction SilentlyContinue
if ($nsRecords) {
    $nsList = ($nsRecords | Select-Object -ExpandProperty NameHost) -join ", "
    Write-Host "  -> Authoritative NS: $nsList" -ForegroundColor Green
    $REPORT += "Nameservers (NS): $nsList"
} else {
    $REPORT += "Nameservers (NS): NOT_DETECTED"
}

# Check IP Alignment
$REPORT += "-----------------------------------------------------------------"
if ($googleIPs -contains $TARGET_IP -or $cfIPs -contains $TARGET_IP) {
    $REPORT += "ALIGNMENT STATUS: TARGET IP MATCHED ($TARGET_IP)"
    Write-Host ""
    Write-Host "[MATCH] Domain $DOMAIN points to Target VPS ($TARGET_IP)." -ForegroundColor Green
} else {
    $REPORT += "ALIGNMENT STATUS: PENDING_UPDATE (Currently points to $currentIPs, target is $TARGET_IP)"
    Write-Host ""
    Write-Host "[NOTICE] Domain $DOMAIN currently points to '$currentIPs' (Expected: $TARGET_IP)." -ForegroundColor DarkYellow
}
$REPORT += "================================================================="

$REPORT | Set-Content -Path $OUTPUT_FILE
Write-Host ""
Write-Host "DNS Audit output written to: $OUTPUT_FILE" -ForegroundColor Cyan
