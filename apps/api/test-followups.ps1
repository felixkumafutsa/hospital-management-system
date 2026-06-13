# PowerShell script to test Follow-up CRUD operations for Better Life Clinic HMS
# This script uses PowerShell's native Invoke-WebRequest instead of curl

$baseUrl = "http://localhost:4000/api/v1"
$authToken = ""  # You'll need to get this by logging in first

# First, let's test the health check (no auth required)
Write-Host "`n=== Testing Health Check ===" -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/health" -Method GET -UseBasicParsing
    Write-Host "✅ Health check passed: $($response.Content)" -ForegroundColor Green
} catch {
    Write-Host "❌ Health check failed: $_" -ForegroundColor Red
}

# To test the followup endpoints, you first need to authenticate to get a token
# Uncomment and run this login section first to get your auth token
<#
Write-Host "`n=== Logging in to get auth token ===" -ForegroundColor Cyan
$loginBody = @{
    email = "admin@betterlifeclinic.com"  # Replace with your admin credentials
    password = "yourpassword"             # Replace with your password
} | ConvertTo-Json

try {
    $loginResponse = Invoke-WebRequest -Uri "$baseUrl/auth/login" -Method POST -Body $loginBody -ContentType "application/json" -UseBasicParsing
    $loginData = $loginResponse.Content | ConvertFrom-Json
    $authToken = $loginData.data.token
    Write-Host "✅ Logged in successfully, token obtained" -ForegroundColor Green
} catch {
    Write-Host "❌ Login failed: $_" -ForegroundColor Red
    exit 1
}
#>

# Once you have the auth token, uncomment the following tests and run them:
<#
$headers = @{
    "Authorization" = "Bearer $authToken"
    "Content-Type" = "application/json"
}

# 1. Create a new follow-up (CREATE operation)
Write-Host "`n=== 1. Creating a new follow-up ===" -ForegroundColor Cyan
$createBody = @{
    patientId = "patient-id-here"  # Replace with an actual patient ID from your database
    doctorId = "doctor-id-here"    # Replace with an actual doctor ID from your database
    appointmentDate = (Get-Date).AddDays(30).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
    notes = "Follow-up appointment for post-surgery checkup"
    type = "CHECKUP"
    status = "SCHEDULED"
} | ConvertTo-Json

try {
    $createResponse = Invoke-WebRequest -Uri "$baseUrl/followups" -Method POST -Body $createBody -Headers $headers -UseBasicParsing
    $createData = $createResponse.Content | ConvertFrom-Json
    $followupId = $createData.data.id
    Write-Host "✅ Follow-up created with ID: $followupId" -ForegroundColor Green
    Write-Host "   $($createResponse.Content)"
} catch {
    Write-Host "❌ Create failed: $_" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $reader.BaseStream.Position = 0
        $reader.DiscardBufferedData()
        $responseBody = $reader.ReadToEnd()
        Write-Host "   Error details: $responseBody"
    }
}

# 2. Get all follow-ups (READ operation)
Write-Host "`n=== 2. Getting all follow-ups ===" -ForegroundColor Cyan
try {
    $allResponse = Invoke-WebRequest -Uri "$baseUrl/followups" -Method GET -Headers $headers -UseBasicParsing
    Write-Host "✅ Retrieved all follow-ups" -ForegroundColor Green
    $allData = $allResponse.Content | ConvertFrom-Json
    Write-Host "   Total follow-ups: $($allData.data.total)"
} catch {
    Write-Host "❌ Get all failed: $_" -ForegroundColor Red
}

# 3. Get upcoming follow-ups (READ operation)
Write-Host "`n=== 3. Getting upcoming follow-ups (next 60 days) ===" -ForegroundColor Cyan
try {
    $upcomingResponse = Invoke-WebRequest -Uri "$baseUrl/followups/upcoming?days=60" -Method GET -Headers $headers -UseBasicParsing
    Write-Host "✅ Retrieved upcoming follow-ups" -ForegroundColor Green
    $upcomingData = $upcomingResponse.Content | ConvertFrom-Json
    Write-Host "   Upcoming follow-ups in next 60 days: $($upcomingData.data.length)"
} catch {
    Write-Host "❌ Get upcoming failed: $_" -ForegroundColor Red
}

# 4. Get follow-up by ID (READ single operation)
if ($followupId) {
    Write-Host "`n=== 4. Getting follow-up by ID: $followupId ===" -ForegroundColor Cyan
    try {
        $getByIdResponse = Invoke-WebRequest -Uri "$baseUrl/followups/$followupId" -Method GET -Headers $headers -UseBasicParsing
        Write-Host "✅ Retrieved follow-up by ID" -ForegroundColor Green
    } catch {
        Write-Host "❌ Get by ID failed: $_" -ForegroundColor Red
    }
}

# 5. Update the follow-up (UPDATE operation)
if ($followupId) {
    Write-Host "`n=== 5. Updating follow-up: $followupId ===" -ForegroundColor Cyan
    $updateBody = @{
        notes = "Updated follow-up notes: Added reminder to bring test results"
        status = "CONFIRMED"
    } | ConvertTo-Json

    try {
        $updateResponse = Invoke-WebRequest -Uri "$baseUrl/followups/$followupId" -Method PUT -Body $updateBody -Headers $headers -UseBasicParsing
        Write-Host "✅ Follow-up updated successfully" -ForegroundColor Green
        Write-Host "   $($updateResponse.Content)"
    } catch {
        Write-Host "❌ Update failed: $_" -ForegroundColor Red
    }
}

# 6. Delete the follow-up (DELETE operation)
if ($followupId) {
    Write-Host "`n=== 6. Deleting follow-up: $followupId ===" -ForegroundColor Cyan
    try {
        $deleteResponse = Invoke-WebRequest -Uri "$baseUrl/followups/$followupId" -Method DELETE -Headers $headers -UseBasicParsing
        Write-Host "✅ Follow-up deleted successfully" -ForegroundColor Green
    } catch {
        Write-Host "❌ Delete failed: $_" -ForegroundColor Red
    }
}

Write-Host "`n=== All tests completed ===" -ForegroundColor Cyan
#>

Write-Host "`n`n=== Setup Instructions ===" -ForegroundColor Yellow
Write-Host "1. First, create a user in your database or use existing admin credentials"
Write-Host "2. Uncomment the login section and add your admin email/password"
Write-Host "3. Run the login section to get your auth token"
Write-Host "4. Uncomment the CRUD tests and add actual patient/doctor IDs from your database"
Write-Host "5. Run the full script to test all follow-up CRUD operations"
Write-Host "`nTo run this script: .\test-followups.ps1"