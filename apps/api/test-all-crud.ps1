c:\Users\felix\OneDrive\Documents\anga\Projects\Mern\better life clinic\betterlife-hms\apps\api\test-all-crud-fixed.ps1
# Comprehensive PowerShell script to test ALL CRUD operations for Better Life Clinic HMS
# Fixed version - no special characters that cause PowerShell parsing errors

$baseUrl = "http://localhost:4000"
$headers = @{
    "Content-Type" = "application/json"
}

# Helper function for API requests
function Invoke-ApiRequest {
    param(
        [string]$Method,
        [string]$Endpoint,
        [hashtable]$Headers,
        [PSObject]$Body = $null
    )
    
    $uri = "$baseUrl/$Endpoint"
    
    try {
        $params = @{
            Uri = $uri
            Method = $Method
            Headers = $Headers
            UseBasicParsing = $true
        }
        
        if ($Body) {
            $jsonBody = $Body | ConvertTo-Json -Depth 10
            $params["Body"] = $jsonBody
        }
        
        $response = Invoke-WebRequest @params
        return @{
            Success = $true
            StatusCode = $response.StatusCode
            Content = $response.Content | ConvertFrom-Json
            RawContent = $response.Content
        }
    }
    catch {
        return @{
            Success = $false
            ErrorMessage = $_.Exception.Message
            StatusCode = $_.Exception.Response.StatusCode.value__
            RawError = $_
        }
    }
}

Write-Host "`n=== Starting Comprehensive CRUD Tests for Better Life Clinic HMS ===" -ForegroundColor Cyan
$createdIds = @{}

# PHASE 1: PATIENTS CRUD
Write-Host "`n`n=== PHASE 1: PATIENTS CRUD ===" -ForegroundColor Yellow
$newPatient = @{
    firstName = "John"
    lastName = "Doe"
    email = "john.doe@test.com"
    phone = "+1234567890"
    dateOfBirth = "1990-01-15"
    gender = "MALE"
    address = "123 Test Street, Test City"
    emergencyContact = @{
        name = "Jane Doe"
        phone = "+0987654321"
        relationship = "Spouse"
    }
}

$createPatient = Invoke-ApiRequest -Method POST -Endpoint "patients" -Body $newPatient -Headers $headers
if ($createPatient.Success) {
    Write-Host "PASS: Patient created successfully" -ForegroundColor Green
    $createdIds['patient'] = $createPatient.Content.id
    Write-Host "   Patient ID: $($createdIds['patient'])"
} else {
    Write-Host "FAIL: Patient creation failed: $($createPatient.ErrorMessage)" -ForegroundColor Red
}

# Get all patients
$getPatients = Invoke-ApiRequest -Method GET -Endpoint "patients" -Headers $headers
if ($getPatients.Success) {
    Write-Host "PASS: Retrieved all patients" -ForegroundColor Green
} else {
    Write-Host "FAIL: Failed to get patients: $($getPatients.ErrorMessage)" -ForegroundColor Red
}

# Update patient
if ($createdIds['patient']) {
    $updatePatient = @{
        phone = "+1112223333"
        address = "456 Updated Street, New City"
    }
    $updateResult = Invoke-ApiRequest -Method PUT -Endpoint "patients/$($createdIds['patient'])" -Body $updatePatient -Headers $headers
    if ($updateResult.Success) {
        Write-Host "PASS: Patient updated successfully" -ForegroundColor Green
    } else {
        Write-Host "FAIL: Patient update failed: $($updateResult.ErrorMessage)" -ForegroundColor Red
    }
}

# PHASE 2: APPOINTMENTS CRUD
Write-Host "`n`n=== PHASE 2: APPOINTMENTS CRUD ===" -ForegroundColor Yellow
if ($createdIds['patient']) {
    $newAppointment = @{
        patientId = $createdIds['patient']
        doctorId = "test-doctor-001"
        appointmentDate = (Get-Date).AddDays(7).ToString("yyyy-MM-ddTHH:mm:ss")
        type = "CONSULTATION"
        status = "SCHEDULED"
        notes = "Regular checkup"
    }
    
    $createAppointment = Invoke-ApiRequest -Method POST -Endpoint "appointments" -Body $newAppointment -Headers $headers
    if ($createAppointment.Success) {
        Write-Host "PASS: Appointment created successfully" -ForegroundColor Green
        $createdIds['appointment'] = $createAppointment.Content.id
    } else {
        Write-Host "FAIL: Appointment creation failed: $($createAppointment.ErrorMessage)" -ForegroundColor Red
    }
}

# PHASE 3: CONSULTATIONS CRUD
Write-Host "`n`n=== PHASE 3: CONSULTATIONS CRUD ===" -ForegroundColor Yellow
if ($createdIds['patient'] -and $createdIds['appointment']) {
    $newConsultation = @{
        patientId = $createdIds['patient']
        appointmentId = $createdIds['appointment']
        doctorId = "test-doctor-001"
        symptoms = "Mild headache and fatigue"
        diagnosis = "Tension headache"
        treatment = "Rest and hydration"
        notes = "Patient should follow up in 2 weeks"
    }
    
    $createConsultation = Invoke-ApiRequest -Method POST -Endpoint "consultations" -Body $newConsultation -Headers $headers
    if ($createConsultation.Success) {
        Write-Host "PASS: Consultation created successfully" -ForegroundColor Green
        $createdIds['consultation'] = $createConsultation.Content.id
    } else {
        Write-Host "FAIL: Consultation creation failed: $($createConsultation.ErrorMessage)" -ForegroundColor Red
    }
}

# PHASE 4: MATERNITY CRUD
Write-Host "`n`n=== PHASE 4: MATERNITY CRUD ===" -ForegroundColor Yellow
if ($createdIds['patient']) {
    $newMaternityRecord = @{
        patientId = $createdIds['patient']
        lmp = "2024-01-15"
        edd = "2024-10-22"
        parity = 0
        gravida = 1
        complications = @()
        currentWeeks = 24
        notes = "Healthy pregnancy"
    }
    
    $createMaternity = Invoke-ApiRequest -Method POST -Endpoint "maternity" -Body $newMaternityRecord -Headers $headers
    if ($createMaternity.Success) {
        Write-Host "PASS: Maternity record created successfully" -ForegroundColor Green
        $createdIds['maternity'] = $createMaternity.Content.id
    } else {
        Write-Host "FAIL: Maternity record creation failed: $($createMaternity.ErrorMessage)" -ForegroundColor Red
    }
}

# PHASE 5: VISITS CRUD
Write-Host "`n`n=== PHASE 5: VISITS CRUD ===" -ForegroundColor Yellow
if ($createdIds['patient']) {
    $newVisit = @{
        patientId = $createdIds['patient']
        doctorId = "test-doctor-001"
        visitDate = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss")
        type = "GENERAL"
        chiefComplaint = "Regular checkup"
        notes = "Patient is in good health"
    }
    
    $createVisit = Invoke-ApiRequest -Method POST -Endpoint "visits" -Body $newVisit -Headers $headers
    if ($createVisit.Success) {
        Write-Host "PASS: Visit created successfully" -ForegroundColor Green
        $createdIds['visit'] = $createVisit.Content.id
    } else {
        Write-Host "FAIL: Visit creation failed: $($createVisit.ErrorMessage)" -ForegroundColor Red
    }
}

# PHASE 6: LAB TESTS CRUD
Write-Host "`n`n=== PHASE 6: LABORATORY TESTS CRUD ===" -ForegroundColor Yellow
if ($createdIds['patient']) {
    $newLabTest = @{
        patientId = $createdIds['patient']
        testName = "Complete Blood Count"
        testCode = "CBC001"
        orderedById = "test-doctor-001"
        orderDate = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss")
        priority = "ROUTINE"
        notes = "Routine blood work"
    }
    
    $createLabTest = Invoke-ApiRequest -Method POST -Endpoint "lab/tests" -Body $newLabTest -Headers $headers
    if ($createLabTest.Success) {
        Write-Host "PASS: Lab test created successfully" -ForegroundColor Green
        $createdIds['labtest'] = $createLabTest.Content.id
    } else {
        Write-Host "FAIL: Lab test creation failed: $($createLabTest.ErrorMessage)" -ForegroundColor Red
    }
}

# PHASE 7: REVENUE TRACKING CRUD
Write-Host "`n`n=== PHASE 7: REVENUE TRACKING CRUD ===" -ForegroundColor Yellow
$newRevenueEntry = @{
    date = (Get-Date).ToString("yyyy-MM-dd")
    source = "CONSULTATION"
    description = "General consultation fees"
    amount = 150.00
    paymentMethod = "CREDIT_CARD"
    reference = if ($createdIds['invoice']) { $createdIds['invoice'] } else { "test-rev-001" }
}

$createRevenue = Invoke-ApiRequest -Method POST -Endpoint "revenue" -Body $newRevenueEntry -Headers $headers
if ($createRevenue.Success) {
    Write-Host "PASS: Revenue entry created successfully" -ForegroundColor Green
    $createdIds['revenue'] = $createRevenue.Content.id
} else {
    Write-Host "FAIL: Revenue entry creation failed: $($createRevenue.ErrorMessage)" -ForegroundColor Red
}

# PHASE 8: BILLING AND INVOICES CRUD
Write-Host "`n`n=== PHASE 8: BILLING AND INVOICES CRUD ===" -ForegroundColor Yellow
if ($createdIds['patient']) {
    $newInvoice = @{
        patientId = $createdIds['patient']
        invoiceNumber = "INV-2024-001"
        issueDate = (Get-Date).ToString("yyyy-MM-dd")
        dueDate = (Get-Date).AddDays(30).ToString("yyyy-MM-dd")
        items = @(
            @{
                description = "Consultation Fee"
                quantity = 1
                unitPrice = 150.00
                total = 150.00
            }
        )
        subtotal = 150.00
        tax = 15.00
        totalAmount = 165.00
        status = "UNPAID"
        notes = "First consultation"
    }
    
    $createInvoice = Invoke-ApiRequest -Method POST -Endpoint "billing/invoices" -Body $newInvoice -Headers $headers
    if ($createInvoice.Success) {
        Write-Host "PASS: Invoice created successfully" -ForegroundColor Green
        $createdIds['invoice'] = $createInvoice.Content.id
    } else {
        Write-Host "FAIL: Invoice creation failed: $($createInvoice.ErrorMessage)" -ForegroundColor Red
    }
}

# Summary of created resources
Write-Host "`n`n=== TEST SUMMARY ===" -ForegroundColor Cyan
Write-Host "Created resources:" -ForegroundColor White
foreach ($key in $createdIds.Keys) {
    Write-Host "   $key : $($createdIds[$key])" -ForegroundColor Gray
}

# Cleanup section - uncomment to delete test data
<#
Write-Host "`n`n=== CLEANING UP TEST DATA ===" -ForegroundColor Yellow
$cleanupOrder = @('invoice', 'revenue', 'labtest', 'visit', 'maternity', 'consultation', 'appointment', 'patient')
foreach ($key in $cleanupOrder) {
    if ($createdIds[$key]) {
        $deleteEndpoint = switch ($key) {
            'patient' { "patients/$($createdIds[$key])" }
            'appointment' { "appointments/$($createdIds[$key])" }
            'consultation' { "consultations/$($createdIds[$key])" }
            'maternity' { "maternity/$($createdIds[$key])" }
            'visit' { "visits/$($createdIds[$key])" }
            'labtest' { "lab/tests/$($createdIds[$key])" }
            'revenue' { "revenue/$($createdIds[$key])" }
            'invoice' { "billing/invoices/$($createdIds[$key])" }
        }
        
        $deleteResult = Invoke-ApiRequest -Method DELETE -Endpoint $deleteEndpoint -Headers $headers
        if ($deleteResult.Success) {
            Write-Host "PASS: Deleted $key : $($createdIds[$key])" -ForegroundColor Green
        } else {
            Write-Host "FAIL: Failed to delete $key : $($createdIds[$key])" -ForegroundColor Red
        }
    }
}
#>

Write-Host "`n`n=== ALL CRUD TESTS COMPLETED ===" -ForegroundColor Cyan