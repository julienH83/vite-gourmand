# ============================================================
# Vite & Gourmand - Smoke Test Final (ECF)
# Usage : pwsh ./smoke-test.ps1
# ============================================================

$ErrorActionPreference = "Stop"
$BASE = "http://localhost:3000/api"
$PASS = "Admin123!@#"
$failed = @()
$passed = 0

function Test-Check {
    param([string]$Name, [scriptblock]$Block)
    try {
        & $Block
        $script:passed++
        Write-Host "  [PASS] $Name" -ForegroundColor Green
    } catch {
        $script:failed += $Name
        Write-Host "  [FAIL] $Name - $($_.Exception.Message)" -ForegroundColor Red
    }
}

function Invoke-Api {
    param(
        [string]$Method = "GET",
        [string]$Uri,
        [object]$Body,
        [string]$Token,
        [int]$ExpectedStatus = 200
    )
    $headers = @{ "Content-Type" = "application/json" }
    if ($Token) { $headers["Authorization"] = "Bearer $Token" }

    $params = @{
        Method  = $Method
        Uri     = "$BASE$Uri"
        Headers = $headers
        ErrorAction = "Stop"
    }
    if ($Body) {
        $params["Body"] = ($Body | ConvertTo-Json -Depth 10)
    }

    try {
        $resp = Invoke-WebRequest @params -UseBasicParsing
        if ($resp.StatusCode -ne $ExpectedStatus) {
            throw "Expected $ExpectedStatus, got $($resp.StatusCode)"
        }
        return ($resp.Content | ConvertFrom-Json)
    } catch {
        $status = $_.Exception.Response.StatusCode.value__
        if ($status -and $status -eq $ExpectedStatus) {
            $reader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
            $content = $reader.ReadToEnd()
            return ($content | ConvertFrom-Json)
        }
        throw $_
    }
}

function Get-Token {
    param([string]$Email)
    $resp = Invoke-Api -Method POST -Uri "/auth/login" -Body @{
        email    = $Email
        password = $PASS
    }
    return $resp.token
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  SMOKE TEST - Vite et Gourmand (ECF)" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# ---- 1. Health ----
Write-Host "[1/11] Health" -ForegroundColor Yellow
Test-Check "GET /health" {
    $r = Invoke-Api -Uri "/health"
    if (-not $r.status) { throw "Missing status field" }
}

# ---- 2. Login 3 roles ----
Write-Host "[2/11] Auth - Login 3 roles" -ForegroundColor Yellow
$tokenAdmin = $null; $tokenEmployee = $null; $tokenUser = $null

Test-Check "Login admin" {
    $script:tokenAdmin = Get-Token "admin@vitegourmand.fr"
    if (-not $script:tokenAdmin) { throw "No token" }
}
Test-Check "Login employee" {
    $script:tokenEmployee = Get-Token "employe@vitegourmand.fr"
    if (-not $script:tokenEmployee) { throw "No token" }
}
Test-Check "Login user" {
    $script:tokenUser = Get-Token "user@vitegourmand.fr"
    if (-not $script:tokenUser) { throw "No token" }
}

# ---- 3. GET /menus ----
Write-Host "[3/11] Menus" -ForegroundColor Yellow
$menuId = $null; $stockBefore = 0

Test-Check "GET /menus returns array" {
    $r = Invoke-Api -Uri "/menus"
    if ($r.Count -lt 1) { throw "Empty menus" }
    $script:menuId = $r[0].id
    $script:stockBefore = $r[0].stock
}

Test-Check "GET /menus/:id" {
    $r = Invoke-Api -Uri "/menus/$script:menuId"
    if (-not $r.id) { throw "Missing id" }
}

# ---- 4. POST /orders - create order ----
Write-Host "[4/11] Create Order" -ForegroundColor Yellow
$orderId = $null

Test-Check "POST /orders (user)" {
    $futureDate = (Get-Date).AddDays(10).ToString("yyyy-MM-dd")
    $r = Invoke-Api -Method POST -Uri "/orders" -Token $tokenUser -Body @{
        menu_id             = $menuId
        nb_persons          = 20
        delivery_address    = "1 Place de la Bourse"
        delivery_city       = "Bordeaux"
        delivery_date       = $futureDate
        delivery_time       = "12:00"
        delivery_distance_km = 5
    } -ExpectedStatus 201
    $script:orderId = $r.id
    if (-not $script:orderId) { throw "No order id" }
}

# ---- 5. Stock decremented ----
Write-Host "[5/11] Stock verification" -ForegroundColor Yellow
Test-Check "Stock decremented by 1" {
    $r = Invoke-Api -Uri "/menus/$script:menuId"
    if ($r.stock -ne ($script:stockBefore - 1)) {
        throw "Expected stock $($script:stockBefore - 1), got $($r.stock)"
    }
}

# ---- 6. GET /orders - staff fields ----
Write-Host "[6/11] Orders staff view" -ForegroundColor Yellow
Test-Check "GET /orders (employee) has staff fields" {
    $r = Invoke-Api -Uri "/orders" -Token $tokenEmployee
    if ($r.Count -lt 1) { throw "No orders" }
    $first = $r[0]
    if (-not $first.user_first_name -and -not $first.first_name) { throw "Missing user name fields" }
}

# ---- 7. Invalid transition ----
Write-Host "[7/11] Invalid status transition" -ForegroundColor Yellow
Test-Check "PUT status en_attente -> livree = 400" {
    Invoke-Api -Method PUT -Uri "/orders/$script:orderId/status" -Token $tokenEmployee -Body @{
        status = "livree"
    } -ExpectedStatus 400
}

# ---- 8. Legal endpoints ----
Write-Host "[8/11] Legal pages" -ForegroundColor Yellow
Test-Check "GET /legal/mentions_legales (underscore)" {
    $r = Invoke-Api -Uri "/legal/mentions_legales"
    if (-not $r.title) { throw "Missing title" }
}
Test-Check "GET /legal/mentions-legales (tiret -> normalized)" {
    $r = Invoke-Api -Uri "/legal/mentions-legales"
    if (-not $r.title) { throw "Missing title" }
}
Test-Check "GET /legal/cgv" {
    $r = Invoke-Api -Uri "/legal/cgv"
    if (-not $r.title) { throw "Missing title" }
}

# ---- 9. Cancel order + stock restore ----
Write-Host "[9/11] Cancel order + stock restore" -ForegroundColor Yellow
Test-Check "POST /orders/:id/cancel (user)" {
    Invoke-Api -Method POST -Uri "/orders/$script:orderId/cancel" -Token $tokenUser
}
Test-Check "Stock restored after cancel" {
    $r = Invoke-Api -Uri "/menus/$script:menuId"
    if ($r.stock -ne $script:stockBefore) {
        throw "Expected stock $($script:stockBefore), got $($r.stock)"
    }
}

# ---- 10. Analytics (admin only) ----
Write-Host "[10/11] Analytics (admin)" -ForegroundColor Yellow
Test-Check "GET /analytics/orders-by-menu (admin)" {
    Invoke-Api -Uri "/analytics/orders-by-menu" -Token $tokenAdmin
}
Test-Check "GET /analytics/revenue (admin)" {
    Invoke-Api -Uri "/analytics/revenue" -Token $tokenAdmin
}
Test-Check "GET /analytics/revenue (employee) = 403" {
    Invoke-Api -Uri "/analytics/revenue" -Token $tokenEmployee -ExpectedStatus 403
}

# ---- 11. Auth guards ----
Write-Host "[11/11] Auth guards" -ForegroundColor Yellow
Test-Check "GET /orders without token = 401" {
    Invoke-Api -Uri "/orders" -ExpectedStatus 401
}

# ---- Results ----
Write-Host "`n========================================" -ForegroundColor Cyan
$total = $passed + $failed.Count
Write-Host "  Results: $passed/$total passed" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

if ($failed.Count -eq 0) {
    Write-Host "`n  ALL CHECKS PASSED`n" -ForegroundColor Green
    exit 0
} else {
    Write-Host "`n  FAILED ($($failed.Count)):" -ForegroundColor Red
    $failed | ForEach-Object { Write-Host "    - $_" -ForegroundColor Red }
    Write-Host ""
    exit 1
}
