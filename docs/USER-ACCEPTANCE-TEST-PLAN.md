# Better Life Clinic HMS — User Acceptance Test Plan

## 1. Purpose

This plan helps clinic staff and system owners verify that the HMS supports safe, traceable work before a release or rollout. It covers visible application pages and related API-backed workflows, with emphasis on the patient lifecycle, visit-linked invoices, role access, and specialty workflows.

This is a user acceptance plan, not a substitute for automated unit, integration, security, or performance testing. Clinical thresholds, critical-result escalation, emergency response, consent, privacy, retention, and downtime procedures must follow clinic-approved policies. Do not use real patient information in training or test environments.

For role-based operating instructions, see the [User Training Guide](./USER-TRAINING-GUIDE.md).

## 2. Scope and module inventory

| Area | Main application pages or workflow | Primary participants |
|---|---|---|
| Authentication and personal settings | Login, logout, current-user/session, password change, settings | All users; administrator |
| Dashboard and reports | Main dashboard, accounts/finance dashboard, pharmacy dashboard and statistics | Administrator, medical director, reception/cashier, pharmacist |
| Patient records | Patient search/list, registration, patient detail, visit and note views | Reception/cashier, nurse, doctor, administrator |
| Visits and appointments | Walk-in visits, appointment booking, check-in, queues, appointment updates/cancellation | Reception/cashier, nurse, doctor, administrator |
| Duty roster and staff scheduling | Duty-roster management, schedules, time-off requests and processing | Administrator, relevant staff/approver |
| Triage and vitals | Triage queue, recording vitals, doctor assignment/warning when no doctor is on duty | Nurse, doctor, administrator |
| Consultation and follow-up | Consultation queue, encounter notes, diagnosis, plan, follow-up records | Doctor, reception/cashier, administrator |
| Laboratory | Test catalogue and price, visit-linked test requests, request status, results and clinical review | Doctor, laboratory technician, administrator; nurse may view |
| Billing and accounts | Visit invoice, invoice items, payments, partial balances, finance/account reports | Reception/cashier, administrator |
| Prescriptions and pharmacy | Prescriptions, dispensing, OTC shop sales, stock receipts, inventory, suppliers, batch/expiry and sales reports | Doctor, pharmacist, reception/cashier, administrator |
| Maternity and obstetrics | Pregnancy profile, ANC visits, delivery and postnatal records, maternity statistics | Nurse, doctor, administrator |
| Theater | Procedure catalogue, maternity-procedure flag, rooms/resources, request review, scheduling, case progression and invoice charge | Doctor, anesthetist, nurse, administrator; reception/cashier for billing |
| Inpatient and emergency | Visit/admission, emergency/triage, discharge and related records where enabled | Nurse, doctor, administrator; reception/cashier as configured |
| Notifications | Inbox, unread count, read/mark-all-read and delete | All users as permitted |
| User and role administration | Staff accounts, active/inactive status, role assignment and access | Administrator |
| Supporting services | Reports, inventory, obstetrics and service workflows exposed by the backend | Test through the released user interface; involve IT for API-only functions |

**Role note:** the configured reception role is `RECEPTION_CASHIER` (combined reception and cashier). Do not create a separate cashier handoff in these tests. Some route guards and legacy role aliases also recognize names such as `RECEPTIONIST` and `CASHIER`; test the actual role assigned to each deployment account and record any mismatch between visible navigation and route/API authorization.

## 3. Roles and responsibilities

- **UAT coordinator:** prepares the environment, assigns test IDs, schedules sessions, tracks defects, and collects sign-off.
- **Reception/cashier tester:** patient registration, appointment and walk-in check-in, invoice review, payments, OTC checkout where assigned, and routing.
- **Nurse tester:** triage, vitals, queue handoff, ANC, delivery/postnatal scenarios within assigned scope.
- **Doctor tester:** consultation, notes, diagnoses, lab orders/results review, prescriptions, follow-up, and theater requests/case review.
- **Laboratory technician tester:** catalogue/request visibility, work queue, processing, result entry, completion, and correction/escalation according to clinic policy.
- **Pharmacist tester:** stock receipt, prescription review/dispensing, OTC stock/sale where assigned, expiry and sales reporting.
- **Administrator tester:** user/role access, settings/pricing, catalogues, rooms, schedules and configuration.
- **Medical director/clinical lead:** clinical workflow review, clinical safety approval, and acceptance of escalation and exception handling.
- **IT/support:** test data reset, environment/database/log support, access failures, and backend-only module verification.

Use a second tester as an observer for at least one end-to-end patient journey. Testers must use their own role-specific accounts; never share accounts to bypass permissions.

## 4. Preconditions and test controls

Before a test cycle:

1. Record application build/version, environment, date/time zone, browser/device, and database/migration status.
2. Confirm the environment is isolated from production and that email/SMS/payment integrations cannot send real messages or move real funds.
3. Confirm test accounts exist and are active for administrator, reception/cashier, nurse, doctor, lab technician, pharmacist, and anesthetist if theater scheduling is in scope.
4. Confirm the deployment has the required configuration: consultation/service prices, active lab tests, active medicine batches with future expiry, procedure catalogue and maternity-delivery flag, available theater room, and doctor duty roster.
5. Record the configured fee/catalog values used in each test. Do not infer prices from a demonstration.
6. Create synthetic patient records with unique identifiers/email/phone and clearly recognizable test names. Use future-dated, non-production stock lots.
7. Agree on clinic-specific rules for critical laboratory results, identity verification, clinical review, partial payments, waivers, controlled medicines, surgery consent, cancellation, and downtime.
8. Keep a test log. Record expected result, actual result, pass/fail/blocked, evidence reference (not sensitive screenshots), defect ID, tester, timestamp, and cleanup status.
9. Avoid concurrent tests against the same patient, invoice, batch, appointment slot, or theater slot unless concurrency is the scenario.

## 5. Entry and exit criteria

### Entry criteria

- A release candidate is deployed to the agreed non-production environment.
- Role accounts and required catalogues/configuration are available.
- No known data migration or environment issue prevents core patient registration and visit creation.
- Clinical leads have approved the clinical policy assumptions used during UAT.

### Exit criteria

- All **Must-pass** scenarios below pass, or have a documented, explicitly accepted workaround approved by the clinic owner.
- No open critical or high-severity defect affecting patient identity, clinical data integrity, authorization/privacy, visit/invoice integrity, payment reconciliation, medicine expiry/dispensing, critical-result handling, or theater scheduling remains.
- Every failed, blocked, or skipped scenario has an owner and disposition.
- Test-generated records are reconciled and cleaned up or labelled/retained according to the test environment policy.
- Operational owners sign off their module and the clinical lead signs off clinical workflow and safety-sensitive exceptions.

## 6. Scenario catalogue

Mark a scenario **Pass** only when the expected outcome is observed in the UI and, for linked records, confirmed in the appropriate related screen/report. A result that requires silently editing the database is not a pass.

### A. Authentication, role access, and settings

| ID | Priority | Scenario and expected outcome |
|---|---|---|
| AUTH-01 | Must | Sign in with each test role; the correct user identity and role-specific navigation are shown. |
| AUTH-02 | Must | Sign out and attempt to use a protected page/API; access is denied or redirected to sign-in. |
| AUTH-03 | Must | Try a restricted screen/action with a different role. Both the UI and API reject unauthorized access; hiding a menu alone is not sufficient. |
| AUTH-04 | Must | Change password using the supported flow; new credentials work and old credentials no longer work. Follow clinic password policy. |
| AUTH-05 | Must | Verify an inactive staff account cannot sign in and that its role cannot be used to bypass access controls. |
| SET-01 | Should | Read configured prices/settings using an authorized account; unauthorized price changes are rejected and valid changes are visible to the next relevant workflow. |

### B. Patient registration and records

| ID | Priority | Scenario and expected outcome |
|---|---|---|
| PAT-01 | Must | Reception searches first for an existing synthetic patient, then registers a new patient with required demographic/contact details. A patient number is created and the patient is searchable. |
| PAT-02 | Must | Attempt registration with missing/invalid required fields and a duplicate unique identifier. The user receives a clear validation error; no duplicate/partial patient is created. |
| PAT-03 | Must | Open patient detail and confirm demographics, allergy information, visits, invoices, and available notes are attached to the correct patient. |
| PAT-04 | Must | Open visit-note tooltip/details for a visit with notes and one without notes. Notes are readable, correctly associated, and absent values do not display as misleading clinical content. |
| PAT-05 | Should | Update permitted patient details and verify changes persist without altering existing encounters or invoices. |

### C. Visits, appointments, triage, and queue

| ID | Priority | Scenario and expected outcome |
|---|---|---|
| VIS-01 | Must | Reception creates a new walk-in visit for a registered patient. A visit-linked invoice exists immediately; verify exactly one invoice per visit. |
| VIS-02 | Must | Create a subsequent visit for the same patient. It has a new visit and its own invoice; prior visit history and invoice remain unchanged. |
| APT-01 | Must | Book an appointment, confirm date/time/patient, and check in the patient. Check-in links or creates the correct visit and visit invoice. |
| APT-02 | Should | Update, cancel, or mark an appointment no-show using permitted controls. The resulting status is clear and the patient is not incorrectly left in an active queue. |
| TRI-01 | Must | Nurse records the permitted vital set against the correct visit. Values and notes persist and are visible to the clinical user. |
| TRI-02 | Must | With an active doctor on duty, complete triage and verify the assigned doctor/consultation queue is correct. |
| TRI-03 | Must | With no doctor on duty, triage provides a clear assignment warning and does not silently assign an unavailable doctor. Follow the clinic escalation procedure. |
| TRI-04 | Must | Try malformed or out-of-range values per validation rules. Invalid data is rejected and previously saved vitals are not silently overwritten. |

### D. Consultation, follow-up, and clinical record continuity

| ID | Priority | Scenario and expected outcome |
|---|---|---|
| CON-01 | Must | Doctor opens the assigned patient/visit from the queue, records complaint/history/examination/clinical notes/plan and diagnosis, and saves. The record remains attached to that visit. |
| CON-02 | Must | Open the patient/visit from another permitted clinical view and verify the notes are present and correctly attributed. |
| CON-03 | Must | Record a follow-up where indicated. Confirm patient, originating visit, responsible doctor, date, and status; verify it appears in the follow-up view. |
| CON-04 | Should | Review a visit with no lab request and no prescription. The doctor can complete the documented plan without phantom lab or medicine charges. |
| CON-05 | Must | Attempt to edit or view clinical notes as a role without permission. Access is denied and the event is handled according to audit policy. |

### E. Laboratory

| ID | Priority | Scenario and expected outcome |
|---|---|---|
| LAB-01 | Must | Authorized user creates a catalogue test with unique code, category, unit/reference interval if applicable, and price. It appears in the active test list. |
| LAB-02 | Must | Attempt to create a duplicate code, invalid price, or invalid required field. The operation is rejected with no misleading success message. |
| LAB-03 | Must | Doctor orders one or more active tests for the correct visit. The request contains the selected tests, priority and notes; the visit invoice receives one matching charge per ordered test. |
| LAB-04 | Must | Try a nonexistent/inactive test or wrong visit. The request is rejected and no request items or invoice charges are created. |
| LAB-05 | Must | Lab technician finds a pending request, changes it to processing, and records the result for each ordered test. Patient, visit, test, units, interpretation, and processor are correct. |
| LAB-06 | Must | Complete the request and verify results become available to the authorized clinical user and visit state/queue reflects the result workflow. |
| LAB-07 | Must | Mark a synthetic result critical and follow the clinic-approved notification/escalation and doctor-review process. Do not invent thresholds in UAT. Confirm acknowledgement and traceability. |
| LAB-08 | Must | Doctor reviews the result and records the interpretation/plan in the appropriate clinical record. If the released system provides a separate result-review status, verify its authorized actor and audit details; otherwise record that limitation as a product gap rather than treating lab completion as clinical review. |
| LAB-09 | Must | Test missing, duplicate, or unrequested result entries and invalid status transitions. The system blocks or clearly reports invalid actions without losing saved results. |
| LAB-10 | Should | Update a test price as an authorized administrator. Existing invoice lines retain the amount already charged; future requests use the new catalogue price. |

### F. Billing, accounts, and payments

| ID | Priority | Scenario and expected outcome |
|---|---|---|
| BILL-01 | Must | Verify a new visit invoice starts with correct patient/visit and no duplicate invoice. |
| BILL-02 | Must | Add the selected consultation, laboratory, procedure, and medication services through their originating workflows. The invoice totals and line references match the actual services, quantities, and configured prices. |
| BILL-03 | Must | Record a full payment using an allowed payment method. Receipt/payment record, paid amount, balance, and invoice status reconcile. |
| BILL-04 | Must | Record a partial payment covering services but not medicines. Invoice remains partially paid with the correct outstanding balance; medicines are not treated as paid. |
| BILL-05 | Must | Attempt payment greater than the balance, zero/negative payment, invalid method, or duplicate submission. The system rejects/guards the action and does not double-post. |
| BILL-06 | Must | Verify invoice list/search and accounts totals agree with the patient/visit invoice and recorded payments. |
| BILL-07 | Should | Exercise approved waiver/insurance/refund/adjustment paths only if configured; verify required authorization and audit trail. |

### G. Prescriptions, pharmacy, inventory, and OTC sales

| ID | Priority | Scenario and expected outcome |
|---|---|---|
| RX-01 | Must | Doctor creates a prescription attached to the correct visit with medicine, directions, duration and quantity. The invoice includes one corresponding medication line, not a duplicate. |
| RX-02 | Must | Pharmacist opens a pending prescription and confirms patient, prescribed items, quantity, available lots and payment state before dispensing. |
| RX-03 | Must | Attempt to dispense when the medication portion remains unpaid. Dispensing is blocked or follows the explicitly configured clinic policy; the balance is not bypassed by paying unrelated visit services. |
| RX-04 | Must | Dispense a valid paid prescription from eligible stock. Quantities decrease by the correct amount; prescription state/dispensed amount and responsible user are recorded. |
| RX-05 | Must | Attempt to dispense an expired batch or more than available stock. The transaction is blocked and stock is not reduced incorrectly. |
| RX-06 | Must | Receive a new medicine batch with supplier, batch number, quantity, cost/selling price and expiry. Stock, inventory transaction and supplier association are visible. |
| RX-07 | Must | Verify low-stock, expiry, current inventory and sales values against the test batch/transactions. |
| RX-08 | Should | Sell an OTC item to a synthetic walk-in customer through the authorized shop flow. Confirm payment, invoice/sale record, stock deduction and sales report. |
| RX-09 | Should | Test duplicate batch number, inactive medicine, invalid quantity and stock adjustment/return according to the clinic's approval controls. |

### H. Maternity and obstetrics

| ID | Priority | Scenario and expected outcome |
|---|---|---|
| MAT-01 | Must | Register a synthetic pregnancy/first ANC encounter with the correct patient and available pregnancy details. An ANC record, visit and invoice are linked; configured ANC/consultation charge is correct. |
| MAT-02 | Must | Record a follow-up ANC for the same pregnancy. It creates a distinct ANC record, visit and invoice and preserves earlier observations/history. |
| MAT-03 | Must | Verify active pregnancy list shows one latest ANC row per active pregnancy, not duplicate rows for each follow-up. Open history and confirm it is scoped to that pregnancy episode. |
| MAT-04 | Must | Record a vaginal delivery for the appropriate active pregnancy. Delivery, maternity profile, visit and invoice are consistent; pregnancy state changes according to workflow. |
| MAT-05 | Must | Record a postnatal encounter linked to the correct delivery. It has its own visit/invoice and does not overwrite ANC or delivery. |
| MAT-06 | Must | Attempt C-section delivery recording before an associated theater case is complete. The system blocks it with a clear explanation. |
| MAT-07 | Should | Start a new pregnancy episode for a patient with a previous completed pregnancy. New ANC records link to the new profile; previous pregnancy history remains accessible. |
| MAT-08 | Must | Validate that sensitive maternity records and actions are visible only to permitted roles and are accurately linked to the patient. |

### I. Theater

| ID | Priority | Scenario and expected outcome |
|---|---|---|
| THR-01 | Must | Administrator configures a procedure catalogue item, expected duration, price and maternity-delivery flag. Non-maternity procedures remain distinguishable. |
| THR-02 | Must | Create a maternity theater request using a flagged procedure. It is pending review/scheduling and creates a linked delivery visit and invoice with no procedure fee charged before scheduling. |
| THR-03 | Must | Attempt a maternity request with an unflagged/inactive procedure. It is rejected and no partial case/visit/invoice remains. |
| THR-04 | Must | Attempt to schedule without an available room, valid active surgeon, distinct active anesthetist, or required date. Scheduling is rejected with no procedure invoice charge. |
| THR-05 | Must | Schedule a valid case. Confirm room/staff/time, no overlap, status and price snapshot; the procedure charge is added once to the correct visit invoice at scheduling. |
| THR-06 | Must | Attempt another case in the same room and overlapping time. The second schedule is rejected; its invoice remains uncharged. |
| THR-07 | Must | Progress a case through allowed states. Invalid transitions are blocked; completion permits a linked C-section delivery record to reuse the theater visit. |
| THR-08 | Should | Cancel a pending/scheduled case under approved policy. Confirm status and visit/invoice consequences are clear, auditable, and not silently destructive. |

### J. Staff, roster, scheduling, notifications, reports and supporting modules

| ID | Priority | Scenario and expected outcome |
|---|---|---|
| ADM-01 | Must | Administrator creates/updates a test staff account with the correct role and active state. The user can access permitted workflows and not restricted workflows. |
| ADM-02 | Must | Deactivate a test account and verify sign-in/access is blocked without deleting historical records. |
| ROST-01 | Must | Configure an on-duty doctor roster and verify triage assignment uses the expected active clinician and time window. Invalid dates/staff are rejected. |
| SCH-01 | Should | Create/update a staff schedule and submit a time-off request; verify authorized approval/processing and status. If a function is not exposed in this release, mark blocked/not in scope rather than assuming it works. |
| NOT-01 | Should | Generate/receive an available notification, read it, mark all read, and verify unread count. Confirm one user cannot read another user's private notifications. |
| REP-01 | Must | Compare dashboard/reports with known synthetic visits, invoices, payments, lab charges, pharmacy receipts/sales, and stock. Totals must reconcile for the report period/time zone. |
| SUP-01 | Should | Verify each enabled service, inventory, obstetrics, emergency, inpatient, and discharge workflow using a business-approved scenario. Where only API support exists or no released screen is available, record the scenario as blocked pending a supported UI/workflow definition. |

### K. Resilience, data quality and end-to-end workflow

| ID | Priority | Scenario and expected outcome |
|---|---|---|
| E2E-01 | Must | **Lab path:** register/check in → invoice → triage/doctor assignment → consultation → lab order and charge → processing/result/review → reception payment → prescription if ordered → pharmacy dispense when eligible → visit completion. Each step retains the same patient and visit identity. |
| E2E-02 | Must | **No-lab path:** walk-in visit → invoice → triage → consultation → prescription → partial/full payment handling → eligible dispensing → completion. No lab request or charge appears. |
| E2E-03 | Must | **Service-only payment:** pay consultation/lab charges while medicine remains unpaid. Remaining invoice balance is accurate and dispensing remains gated according to configured policy. |
| E2E-04 | Must | **Maternity C-section:** ANC episode → pending theater review → approved catalog/room/team schedule → procedure invoice charge → case progression/completion → delivery record on the linked visit. |
| E2E-05 | Must | Refresh/reopen patient, visit, invoice and dashboard pages during a workflow. Persisted records remain consistent; no action is duplicated by refresh. |
| E2E-06 | Should | Simulate a recoverable network/session interruption before and after a save. User can determine whether the action committed and safely retry without duplicate charges/records. |
| E2E-07 | Should | Confirm that test cleanup removes synthetic patients, visits, invoices/payments, catalog items, procedures, stock lots and test staff where permitted. |

## 7. Defect handling and severity

- **Critical:** credible patient-safety risk, wrong-patient data, unauthorized exposure/change, duplicate/incorrect financial posting that cannot be reconciled, unsafe expiry dispensing, lost clinical record, or bypass of critical workflow control. Stop the affected test and escalate immediately.
- **High:** core workflow blocked, incorrect patient/visit linkage, material invoice/stock mismatch, invalid theater assignment/overlap, or a role can perform a restricted action. Do not sign off the affected module.
- **Medium:** important function is unreliable or confusing but a controlled workaround exists without compromising clinical or financial integrity.
- **Low:** cosmetic or minor usability issue with no meaningful workflow/data impact.

For each defect record: ID, severity, module, build/environment, tester and role, preconditions, numbered reproduction steps, expected vs actual result, timestamp/time zone, synthetic record references, evidence location, workaround, owner and retest result. Never place real patient identifiers or clinical data in a defect ticket.

## 8. UAT execution record and sign-off

Copy this table into the clinic's controlled test log for each scenario:

| Scenario ID | Build/environment | Tester/role | Result (Pass/Fail/Blocked/Not run) | Evidence reference | Defect ID | Retest result |
|---|---|---|---|---|---|---|
|  |  |  |  |  |  |  |

Module sign-off:

| Owner | Module(s) | Decision (Accept/Accept with approved conditions/Reject) | Open defects/conditions | Name and date |
|---|---|---|---|---|
| Reception/cashier lead | Patient intake, appointments, billing |  |  |  |
| Nursing lead | Triage, vitals, maternity |  |  |  |
| Medical/clinical lead | Consultation, lab review, prescriptions, emergency/inpatient, theater |  |  |  |
| Laboratory lead | Catalogue, requests, results and review handoff |  |  |  |
| Pharmacy lead | Inventory, dispensing, OTC, expiry and sales |  |  |  |
| Finance lead | Invoices, payments and reconciliation |  |  |  |
| Administrator/IT | Access, settings, reports, schedules, migration and recovery |  |  |  |
| UAT coordinator | Overall exit criteria and evidence |  |  |  |

Acceptance applies only to the tested build and configuration. Retest affected scenarios after a fix; rerun the end-to-end workflows when a change touches shared visit, invoice, identity, permission, status, or inventory logic.
