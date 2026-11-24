# ==============================================================================
# NKB MANUFACTURING SYSTEM -- READ-ONLY DEEP DNS INVESTIGATION
# Domain: m.nkbmanufacturing.com | Apex: nkbmanufacturing.com
# Target VPS IP: 187.77.143.211
# Nameservers: ns1.dns-parking.com, ns2.dns-parking.com
# ==============================================================================

$Domain = "m.nkbmanufacturing.com"
$ApexDomain = "nkbmanufacturing.com"
$TargetVPS = "187.77.143.211"
$OutputFile = "z:\HP Gaming Backup\Staff-Management-main\Staff-Management-main\dns_investigation_report.txt"

$Report = @()
$Report += "================================================================="
$Report += "NKB MANUFACTURING SYSTEM -- DEEP DNS INVESTIGATION REPORT"
$Report += "Generated: $(Get-Date -Format 'yyyy-MM-ddTHH:mm:sszzz')"
$Report += "Target Domain: $Domain"
$Report += "Apex Domain:   $ApexDomain"
$Report += "Target VPS IP: $TargetVPS"
$Report += "================================================================="
$Report += ""

Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host " NKB SYSTEM -- DEEP DNS INVESTIGATION" -ForegroundColor Cyan
Write-Host " Domain: $Domain" -ForegroundColor Cyan
Write-Host " Target VPS: $TargetVPS" -ForegroundColor Cyan
Write-Host "=================================================================" -ForegroundColor Cyan

function Query-Record {
    param(
        [string]$Name,
        [string]$Type,
        [string]$Server = $null,
        [string]$ServerLabel = "Default"
    )

    $header = ">>> Query: $Name [$Type] via $ServerLabel"
    if ($Server) { $header += " ($Server)" }
    Write-Host "`n$header" -ForegroundColor Yellow
    $script:Report += $header

    try {
        if ($Server) {
            $res = Resolve-DnsName -Name $Name -Type $Type -Server $Server -ErrorAction Stop
        } else {
            $res = Resolve-DnsName -Name $Name -Type $Type -ErrorAction Stop
        }

        foreach ($r in $res) {
            $entry = ""
            if ($r.Type -eq 'A') {
                $entry = "  -> Type: A | IP: $($r.IPAddress) | TTL: $($r.TimeToLive)s | Section: $($r.Section)"
            } elseif ($r.Type -eq 'AAAA') {
                $entry = "  -> Type: AAAA | IPv6: $($r.IPAddress) | TTL: $($r.TimeToLive)s"
            } elseif ($r.Type -eq 'CNAME') {
                $entry = "  -> Type: CNAME | Target: $($r.NameHost) | TTL: $($r.TimeToLive)s"
            } elseif ($r.Type -eq 'NS') {
                $entry = "  -> Type: NS | Nameserver: $($r.NameHost) | TTL: $($r.TimeToLive)s"
            } elseif ($r.Type -eq 'SOA') {
                $entry = "  -> Type: SOA | Primary: $($r.PrimaryServer) | Admin: $($r.NameAdministrator) | Serial: $($r.SerialNumber) | TTL: $($r.TimeToLive)s"
            } elseif ($r.Type -eq 'TXT') {
                $entry = "  -> Type: TXT | Strings: $($r.Strings -join ' ') | TTL: $($r.TimeToLive)s"
            } elseif ($r.Type -eq 'MX') {
                $entry = "  -> Type: MX | Exchange: $($r.NameExchange) | Pref: $($r.Preference) | TTL: $($r.TimeToLive)s"
            } else {
                $entry = "  -> Type: $($r.Type) | Data: $($r | Out-String)"
            }
            Write-Host $entry -ForegroundColor Green
            $script:Report += $entry
        }
    } catch {
        $errMsg = "  -> Result: NO_RECORD_FOUND / " + $_.Exception.Message
        Write-Host $errMsg -ForegroundColor DarkYellow
        $script:Report += $errMsg
    }
}

# 1. Resolve Nameserver IPs
Write-Host "`n--- [1] Resolving Authoritative Nameserver IPs ---" -ForegroundColor Cyan
Query-Record -Name "ns1.dns-parking.com" -Type "A" -ServerLabel "Default"
Query-Record -Name "ns2.dns-parking.com" -Type "A" -ServerLabel "Default"

# 2. Authoritative Queries: ns1.dns-parking.com
Write-Host "`n--- [2] Authoritative Queries (ns1.dns-parking.com) ---" -ForegroundColor Cyan
Query-Record -Name $Domain -Type "A" -Server "ns1.dns-parking.com" -ServerLabel "Auth NS1"
Query-Record -Name $Domain -Type "AAAA" -Server "ns1.dns-parking.com" -ServerLabel "Auth NS1"
Query-Record -Name $Domain -Type "CNAME" -Server "ns1.dns-parking.com" -ServerLabel "Auth NS1"
Query-Record -Name $Domain -Type "TXT" -Server "ns1.dns-parking.com" -ServerLabel "Auth NS1"

# 3. Authoritative Queries: ns2.dns-parking.com
Write-Host "`n--- [3] Authoritative Queries (ns2.dns-parking.com) ---" -ForegroundColor Cyan
Query-Record -Name $Domain -Type "A" -Server "ns2.dns-parking.com" -ServerLabel "Auth NS2"
Query-Record -Name $Domain -Type "AAAA" -Server "ns2.dns-parking.com" -ServerLabel "Auth NS2"
Query-Record -Name $Domain -Type "CNAME" -Server "ns2.dns-parking.com" -ServerLabel "Auth NS2"
Query-Record -Name $Domain -Type "TXT" -Server "ns2.dns-parking.com" -ServerLabel "Auth NS2"

# 4. Apex Domain Context & Wildcard Behavior on Authoritative Nameservers
Write-Host "`n--- [4] Apex Domain Authority & Wildcard Behavior ---" -ForegroundColor Cyan
Query-Record -Name $ApexDomain -Type "SOA" -Server "ns1.dns-parking.com" -ServerLabel "Auth NS1"
Query-Record -Name $ApexDomain -Type "A" -Server "ns1.dns-parking.com" -ServerLabel "Auth NS1"
Query-Record -Name $ApexDomain -Type "CNAME" -Server "ns1.dns-parking.com" -ServerLabel "Auth NS1"
Query-Record -Name "wildcard-probe-check-nkb-999.nkbmanufacturing.com" -Type "A" -Server "ns1.dns-parking.com" -ServerLabel "Auth NS1 (Wildcard Probe)"

# 5. Public Resolvers Re-check
Write-Host "`n--- [5] Public Recursive Resolvers (Google, Cloudflare, Quad9) ---" -ForegroundColor Cyan
Query-Record -Name $Domain -Type "A" -Server "8.8.8.8" -ServerLabel "Google Public DNS"
Query-Record -Name $Domain -Type "AAAA" -Server "8.8.8.8" -ServerLabel "Google Public DNS"
Query-Record -Name $Domain -Type "CNAME" -Server "8.8.8.8" -ServerLabel "Google Public DNS"

Query-Record -Name $Domain -Type "A" -Server "1.1.1.1" -ServerLabel "Cloudflare Public DNS"
Query-Record -Name $Domain -Type "AAAA" -Server "1.1.1.1" -ServerLabel "Cloudflare Public DNS"
Query-Record -Name $Domain -Type "CNAME" -Server "1.1.1.1" -ServerLabel "Cloudflare Public DNS"

Query-Record -Name $Domain -Type "A" -Server "9.9.9.9" -ServerLabel "Quad9 DNS"

# 6. Analysis & Summary
$script:Report += ""
$script:Report += "================================================================="
$script:Report += "INVESTIGATION SUMMARY & VERDICT"
$script:Report += "================================================================="
$script:Report += "Target VPS IP: $TargetVPS"
$script:Report += "Parking IP 1:  191.101.228.134 (Hostinger Parked Domain System)"
$script:Report += "Parking IP 2:  91.108.100.217 (Hostinger Parked Domain System)"
$script:Report += "================================================================="

$script:Report | Set-Content -Path $OutputFile -Encoding ASCII

Write-Host ""
Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host " Investigation completed! Full report saved to:" -ForegroundColor Green
Write-Host " $OutputFile" -ForegroundColor Green
Write-Host "=================================================================" -ForegroundColor Cyan
