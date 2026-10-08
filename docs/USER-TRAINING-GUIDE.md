# Better Life Clinic HMS — User Training Guide

## 1. Aim and safety

Use this guide to onboard clinic staff to the HMS and practice role-based workflows. Train in a designated training/test environment first. Use synthetic patients only; do not practice on real patient records.

The HMS supports the clinic's work but does not replace professional judgement or approved clinical procedures. Follow current clinic policy for patient identification, consent, infection prevention, clinical thresholds, critical results, emergency escalation, medicine handling, surgery, privacy, retention, and downtime. If a screen or status conflicts with policy, pause and contact the supervisor; do not invent a workaround or enter false data.

Use the companion [User Acceptance Test Plan](./USER-ACCEPTANCE-TEST-PLAN.md) to conduct and record formal workflow testing.

## 2. Training preparation

### Before the session

The trainer or administrator should:

1. Confirm the training environment, release/build, browser/device and support contact.
2. Create a named test login for each trainee using that person's actual role. Do not share passwords or accounts.
3. Ensure the test environment has clearly marked synthetic patients, a duty roster, consultation/service prices, active lab catalogue entries, medicine stock with future expiry dates, and—if training theater—an available room, procedure catalogue, and distinct active surgeon and anesthetist test accounts.
4. Confirm trainees know how to reach the supervisor and how to report an error or suspected wrong-patient action.
5. Have trainees read the clinic's local policies for their duties. This guide is not a policy document.

### Suggested 1-day learning sequence

| Session | Suggested time | Audience | Practice |
|---|---:|---|---|
| Orientation, privacy and sign-in | 20 min | Everyone | Sign in/out, role access, protect credentials and screens |
| Patient identity and visit lifecycle | 45 min | Reception, nurse, doctor | Search/register, open patient, create visit, trace visit and invoice |
| Role workflows | 60 min | Each service team | Role-specific exercises below |
| Shared lifecycle and handoffs | 45 min | Reception, nursing, doctor, lab, pharmacy | Follow one synthetic patient through lab and no-lab paths |
| Maternity and theater | 40 min | Maternity clinicians, theater team, reception/cashier | ANC follow-up, C-section request/schedule/completion, delivery/postnatal |
| Billing, inventory and exception practice | 30 min | Reception/cashier, pharmacy, administrator | Partial payment, unpaid medicine gate, expired stock, reporting |
| Competency check and Q&A | 20 min | Everyone | Observe each trainee complete role checklist without prompting |

Allow additional time for local policies, translation/accessibility needs, and supervised practice. Training time is indicative, not a competence standard.

## 3. Navigation basics for all users

1. Open the approved HMS address and sign in with your named account.
2. Confirm your displayed name and role before handling a record.
3. Use only the menu items needed for your role. Common areas include patients, appointments, role dashboard, invoices/accounts, laboratory, pharmacy, maternity, theater, staff and settings.
4. Search for an existing patient before registering a new one. Confirm at least the clinic-approved identifiers on every patient/visit before entering or acting on information.
5. Open the relevant **visit**, not just the patient chart, when entering encounter-specific notes, requests, results, prescriptions, or charges. A patient can have multiple visits and invoices.
6. Save using the on-screen action and wait for confirmation. Reopen the record to verify it persisted. Do not repeatedly click a save/payment/dispense action when the screen is slow; check whether the first action completed.
7. Use the visit-note details/tooltips to review available visit and consultation notes. An empty note field is not a clinical finding.
8. Sign out when finished, especially on a shared workstation. Lock the workstation when stepping away.

If a menu item is missing, do not borrow another person's account. Ask the administrator to verify your assigned role and permissions.

## 4. Role-based workflows

### Reception and cashier (combined role)

**Patient intake and walk-in**

1. Search the patient list using the clinic's approved identifiers.
2. If no matching record exists, register the patient once and verify the generated patient number and details.
3. Create a new visit for this attendance. A returning patient needs a new visit for a new encounter; do not reuse or edit a completed prior visit.
4. Confirm the visit has its own invoice before sending the patient to the next service.
5. For a booked appointment, verify identity and appointment details, then check the patient in using the supported action. Confirm the correct linked visit/invoice.
6. Tell the patient where to go next using the local workflow. Never assign a doctor manually unless the screen and policy specifically permit it. If triage reports no doctor on duty, alert the designated supervisor.

**Invoices and payments**

1. Open the invoice for the current visit and confirm patient, visit, invoice number and line items.
2. Check that charges correspond to services actually ordered or completed and that amounts match the displayed approved price.
3. Enter the received amount and payment method accurately, then confirm the payment record, amount paid, balance and invoice status.
4. A partial payment must leave a visible outstanding balance. Explain/escalate per clinic policy; do not mark an invoice paid or promise medicine release if the system shows it remains due.
5. For disputed charges, refunds, insurance, waivers, discounts, or an incorrect line, follow the authorized approval process. Do not delete or hide a charge to make totals appear correct.

**Medicine shop sale (if assigned)**

Use the authorized pharmacy shop flow for a walk-in purchase. Verify item, quantity, selling price and payment before completing sale. Confirm a sale record and stock reduction. Do not dispense prescription-only medication as an OTC sale.

### Nurse

1. Open the triage queue and verify the patient and active visit.
2. Record only measured/verified observations in the correct fields and units. Add relevant notes per policy.
3. Review values before saving. Correct errors using the supported correction workflow; do not overwrite another visit's vitals.
4. Verify the triage entry is attached to the intended visit.
5. Confirm the doctor assignment/queue result. If the system warns no doctor is on duty, follow escalation policy rather than selecting an unavailable clinician.
6. For maternity care, select the correct active pregnancy episode. Record each follow-up as a new ANC encounter so prior measurements and notes remain in history.
7. Record delivery and postnatal documentation only under the correct pregnancy/delivery. A C-section delivery must follow completion of its linked theater case.

### Doctor

1. Open your assigned queue/appointment and verify the patient and visit.
2. Review relevant patient history, allergy information, vitals and existing visit notes.
3. Record the consultation complaint, history, examination, notes, diagnosis and plan in their intended fields. Save and verify the entry.
4. If tests are clinically indicated, select the correct active catalogue tests and priority, link them to the current visit, and give the laboratory any required policy-compliant notes.
5. If results return, open the correct request/result, review them, document the clinical plan, and follow the locally approved critical-result escalation policy. A result entered by the lab is not necessarily clinically reviewed.
6. If medication is prescribed, select the correct medicine and enter clear directions, duration and quantity. Verify the prescription is attached to the active visit.
7. Record follow-up instructions/records where indicated and use the clinic-approved handoff to reception/cashier.
8. For a proposed C-section, choose a catalogue item flagged for maternity delivery and submit it for theater review. Do not tell the patient it is scheduled until theater staff have scheduled and confirmed the room/team/time.

### Laboratory technician

1. Open the laboratory queue and verify patient, visit, requested tests, priority and request notes.
2. Accept/process work using the request status action supported by the screen.
3. Enter a result for the correct requested test. Verify value, unit, interpretation, critical flag, and that the processor identity is correct.
4. Save each result and confirm it is attached to the correct request. Do not enter an unrequested test under a similar name.
5. Mark the request complete only when work is complete according to laboratory policy. Confirm the clinical team can see the result and use the established process for urgent/critical communication.
6. Report catalogue errors, duplicate codes, result corrections or invalid requests to the lab lead. Do not silently amend a result to bypass the correction/audit process.

### Pharmacist

**Prescription dispensing**

1. Find the prescription and verify the patient and visit before preparing medicine.
2. Confirm the prescription is valid, quantities and directions are clear, eligible batches are in date, and available stock is sufficient.
3. Check the visit invoice/payment state. The system may prevent dispensing while the medication balance is unpaid; do not bypass that control. Ask reception/cashier or a supervisor to resolve billing questions.
4. Dispense the correct quantity and lot through the supported workflow. Confirm the dispensed amount, prescription status and stock movement.
5. If stock is expired, short, or inconsistent, stop the dispense and follow pharmacy policy. Do not choose an expired lot or create an unrecorded stock adjustment.

**Inventory and OTC**

1. Receive stock with the correct medicine, supplier, batch number, quantities, cost/selling price and expiry. Verify the saved lot and available balance.
2. Review inventory, low-stock, expiry and sales dashboards routinely according to local responsibility.
3. Complete an OTC transaction only for an eligible item and customer; verify price/payment, invoice or sale record and stock decrement.
4. Use approved inventory adjustment, return, expiry and reconciliation procedures. Every physical discrepancy must be reported and traceable.

### Anesthetist and theater team

1. Open the theater queue and verify the patient, visit, requested procedure and maternity status.
2. Review pending cases and coordinate with the responsible doctor and clinical lead. A pending request is not a scheduled operation.
3. Schedule only after confirming an available room, suitable time, active surgeon and distinct active anesthetist, and compliance with local theatre, consent and pre-operative checks.
4. Confirm the scheduled date/time, room, team and procedure price snapshot. Scheduling adds the configured procedure charge to the linked visit invoice; verify the correct patient/visit before confirming.
5. Update case status only at the appropriate operational point. Do not mark a procedure completed before the procedure has actually been completed.
6. For a C-section, complete the theater workflow before maternity staff record the linked delivery. Follow all clinical documentation and escalation policies outside this software guide.
7. Report room/staff conflicts, cancellation, rescheduling, or invoice discrepancies to the theater lead and reception/cashier.

### Administrator

1. Create named staff accounts and assign the least-privileged correct role. Verify sign-in and access using a test account before handing over credentials.
2. Deactivate accounts promptly when access should end. Do not delete historical clinical or financial records to remove a user's access.
3. Maintain consultation pricing and active catalogues (lab tests, procedures, maternity flag, rooms) under the clinic's approval process.
4. Confirm the maternity-delivery flag is set only on approved delivery procedures.
5. Maintain duty rosters and schedules; ensure that on-duty staff and role assignments reflect the actual rota.
6. Review dashboard/reports against source records; escalate mismatches instead of changing source data to make a report match.
7. Keep configuration changes, access changes and support actions in the authorized audit/change process. Never share admin credentials.

### Medical director/clinical lead

Review queue coverage, clinical documentation, escalation and critical-result processes, prescription appropriateness, maternity episode continuity, theater review and completed cases, and clinical sign-off for tested release changes. Approve local policies; the software cannot determine the clinic's clinical thresholds or standards.

## 5. Cross-team practice exercises

Use fresh synthetic patients for each exercise. The trainer observes; staff should use their own role accounts and pass the record to the next role.

### Exercise A — Outpatient visit with laboratory tests

1. Reception searches/registers a synthetic patient, creates a visit, and confirms its invoice.
2. Nurse records vitals and confirms doctor assignment or follows the no-doctor warning procedure.
3. Doctor records the consultation and orders a test from the catalogue.
4. Lab technician processes the request, enters a synthetic result and marks the request complete.
5. Doctor reviews the result and records the plan.
6. If prescribed, doctor creates the linked prescription.
7. Reception/cashier confirms visit charges and records the authorized payment.
8. Pharmacist verifies payment/eligibility, dispenses from in-date stock, and confirms the visit/prescription state.
9. Together, verify one patient identity, one visit, its invoice, correct line items, payment balance, lab result and stock movement.

### Exercise B — Visit without laboratory tests and partial payment

1. Reception creates a separate walk-in visit and confirms its invoice.
2. Nurse triages; doctor consults without ordering a lab test and records a prescription.
3. Reception/cashier accepts payment for services while leaving the medicine charge unpaid.
4. Confirm invoice balance/status are accurate and pharmacist cannot bypass the outstanding medication balance.
5. Complete payment through the approved process, dispense, and verify the correct balance and final workflow state.
6. Confirm no lab request/charge exists for this visit.

### Exercise C — OTC sale

1. Pharmacist/authorized shop user selects an in-date OTC item and quantity for a synthetic customer.
2. Confirm the price and payment, complete the sale, and verify a sale/invoice record and stock decrement.
3. Compare dashboard sales and inventory with the test transaction.

### Exercise D — Maternity ANC through vaginal delivery and postnatal

1. Nurse/doctor records the first ANC for a synthetic patient and verifies profile, visit and invoice.
2. Record a second ANC follow-up. Open the pregnancy history and verify both encounters are present and the active-pregnancy dashboard has a single current row.
3. Record vaginal delivery under the correct pregnancy, then create postnatal follow-up linked to that delivery.
4. Verify each event is retained, linked to the correct patient/episode and has a distinct encounter/invoice as applicable.

### Exercise E — C-section theater handoff

1. Clinician submits a pending theater request using an approved maternity-delivery procedure.
2. Theater team reviews the case and schedules room/time with an active surgeon and a distinct active anesthetist.
3. Verify overlapping cases are rejected and the procedure charge is added once only when scheduled.
4. Progress the case through actual states and complete it only after the procedure is completed.
5. Maternity clinician records the C-section delivery against the linked theater visit.
6. Reception/cashier verifies invoice and payment state. Confirm no premature delivery record or duplicate procedure charge exists.

## 6. Daily operating habits

- Verify patient identity and visit before every clinical, billing, laboratory, or dispensing action.
- Use a separate visit for each new attendance; do not recycle a previous encounter.
- Record information at the time of the work and in the correct person's account.
- Reopen important saves and compare related records rather than relying only on a success toast.
- Preserve original records and use authorized correction workflows.
- Never share passwords, leave records open on a public screen, or export patient data to personal devices.
- Report wrong-patient, missing/duplicate charge, critical-result, expired-stock, access, or theater safety issues immediately to the designated lead.
- At shift handover, communicate pending work through approved clinical/operational channels; do not assume that an unfinished queue item has been handled.

## 7. Troubleshooting and escalation

| Situation | User action |
|---|---|
| Sign-in fails or account appears inactive | Stop repeated attempts; contact the administrator. Never use another person's account. |
| Patient/visit cannot be found or identity conflicts | Pause work and ask reception/supervisor to reconcile identity before creating another record. |
| Save/payment/order appears stuck | Check the record once for completion before retrying. Record time and reference; contact support if uncertain. |
| Wrong patient, duplicate encounter, or incorrect clinical entry | Stop further actions, notify the clinical lead promptly, and use the approved correction process. Do not delete or conceal the event. |
| Invoice total/payment does not reconcile | Do not collect/record a guessed amount. Ask reception/cashier lead or finance owner to reconcile and document the resolution. |
| Medicine batch is expired, short, or inconsistent | Do not dispense from it. Quarantine/escalate per pharmacy policy and inform the pharmacy lead. |
| Lab result is missing, unexpected, or critical | Follow approved clinical escalation immediately; contact the ordering clinician/lab lead. Do not rely solely on an in-app status. |
| Theater resource/time conflict or role unavailable | Leave case pending and contact the theater lead/administrator. Do not mark it scheduled as a workaround. |
| Network/application unavailable | Follow clinic downtime procedure, keep any permitted downtime record secure, and reconcile into the HMS only when authorized service is restored. Avoid duplicate entry and do not use unapproved personal notes/storage. |

When reporting an issue, include module, time, your role, synthetic patient/visit reference if in training, what you were doing, what you expected and what happened. Do not include passwords or unnecessary patient details.

## 8. Competency checklist and training record

A trainee is ready for supervised live work only after the relevant supervisor observes the trainee complete applicable tasks correctly, without borrowing credentials or bypassing controls. Define any additional competency checks locally, especially for clinical and medication tasks.

| Trainee | Role | Sign in/access verified | Role workflow observed | Patient/visit identity checks | Correct handoff | Exceptions/escalation explained | Supervisor/date | Refresher due |
|---|---|---|---|---|---|---|---|---|
|  |  |  |  |  |  |  |  |  |

## 9. Refresher training

Provide role-specific refresher training when a staff member changes role, the interface or workflow materially changes, an audit/UAT identifies recurring errors, or a safety/financial incident reveals a training need. Reconfirm access, patient/visit verification, escalation, and correction procedures after relevant changes. Record attendance and any follow-up competency assessment using the clinic's controlled training records.
