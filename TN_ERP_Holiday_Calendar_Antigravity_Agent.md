# Tamil Nadu Holiday Calendar Integration — ERP Implementation Specification

## Purpose

Implement a company holiday-management system inside the **existing ERP codebase** so that:

- Employees can clearly see company holidays in the ERP calendar.
- Admin/HR can manage holidays from the backend/admin UI.
- Holidays are clearly classified as **Mandatory** or **Floater / Optional**.
- Tamil Nadu statutory holiday requirements are not confused with the full Tamil Nadu Government public-holiday calendar.
- Existing attendance, leave, payroll, calendar, employee, role/permission, notification, and dashboard flows must be reused instead of duplicated.
- Existing business logic, API conventions, design system, authentication, role handling, and database conventions must be preserved.

> **Important:** Before writing code, inspect the existing repository and locate the current calendar, leave, attendance, payroll, users/employees, permissions, notifications, and admin settings implementations. Extend the existing architecture. Do not create parallel modules when equivalent functionality already exists.

---

# 1. Legal / Policy Baseline for Tamil Nadu

For a private establishment in Tamil Nadu, do **not** treat the entire Tamil Nadu Government public-holiday list as automatically mandatory company holidays.

Under the **Tamil Nadu Industrial Establishments (National, Festival and Special Holidays) Act, 1958**, the statutory holiday baseline applicable to covered establishments includes:

### Fixed statutory holidays

1. **Republic Day — 26 January**
2. **May Day — 1 May**
3. **Independence Day — 15 August**
4. **Gandhi Jayanti — 2 October**

The Act also provides for:

5. **Five additional festival holidays**, specified for the establishment through the applicable statutory process.

Therefore the ERP must distinguish between:

- statutory mandatory holidays;
- company-selected statutory festival holidays;
- optional/floater holidays;
- additional company holidays;
- government-reference holidays that are not necessarily company holidays.

### Critical rule for implementation

A **Floater Holiday is a company HR-policy concept**, not a substitute for the statutory holiday requirement by default.

Do **not** automatically count employee-selected floater holidays toward the statutory five festival holidays unless the company has separately confirmed that treatment with its labour-compliance professional / competent authority.

The system should therefore model statutory status separately from employee choice.

---

# 2. 2026 Fixed Mandatory Holidays

Seed or ensure the following four statutory holidays exist for calendar year **2026**:

| Date | Holiday | Type | Statutory |
|---|---|---|---|
| 2026-01-26 | Republic Day | Mandatory | Yes |
| 2026-05-01 | May Day | Mandatory | Yes |
| 2026-08-15 | Independence Day | Mandatory | Yes |
| 2026-10-02 | Gandhi Jayanti | Mandatory | Yes |

These records should not be silently deletable by a normal admin.

If deletion is technically supported, require a privileged role, explicit warning, reason/audit entry, and confirmation. Prefer an **inactive/archive** mechanism over hard deletion.

---

# 3. Tamil Nadu 2026 Government Holiday Reference Pool

The Tamil Nadu Government's 2026 public-holiday notification contains the following dates.

These must be available to Admin/HR as a **reference/import pool**, but must **not** automatically become private-company mandatory holidays merely because they appear in the Government list.

| Date | Holiday |
|---|---|
| 2026-01-01 | New Year's Day |
| 2026-01-15 | Pongal |
| 2026-01-16 | Thiruvalluvar Day |
| 2026-01-17 | Uzhavar Thirunal |
| 2026-01-26 | Republic Day |
| 2026-02-01 | Thai Poosam |
| 2026-03-19 | Telugu New Year's Day |
| 2026-03-21 | Ramzan (Idul Fitr) |
| 2026-03-31 | Mahaveer Jayanthi |
| 2026-04-03 | Good Friday |
| 2026-04-14 | Tamil New Year's Day / Dr. B. R. Ambedkar's Birthday |
| 2026-05-01 | May Day |
| 2026-05-28 | Bakrid (Idul Azha) |
| 2026-06-26 | Muharram |
| 2026-08-15 | Independence Day |
| 2026-08-26 | Milad-un-Nabi |
| 2026-09-04 | Krishna Jayanthi |
| 2026-09-14 | Vinayakar Chathurthi |
| 2026-10-02 | Gandhi Jayanti |
| 2026-10-19 | Ayutha Pooja |
| 2026-10-20 | Vijaya Dasami |
| 2026-11-08 | Deepavali |
| 2026-12-25 | Christmas |

Do not add **1 April 2026 — Annual Closing of Accounts** to the normal company holiday pool by default; the Tamil Nadu notification marks it specifically for Commercial Banks and Co-operative Banks.

---

# 4. Holiday Classification Model

Do not implement holiday type as one overloaded boolean.

Use a model that separates:

1. **How the company treats the day**
2. **Whether it has statutory significance**
3. **Whether an employee has a choice**

Recommended conceptual fields:

```ts
holidayType:
  | "MANDATORY"
  | "FLOATER"
  | "COMPANY"
  | "REFERENCE"

statutoryType:
  | "FIXED_NATIONAL"
  | "STATUTORY_FESTIVAL"
  | "SPECIAL_GOVT_DECLARED"
  | "NONE"
```

If the existing codebase uses enums/constants differently, follow the existing convention rather than introducing inconsistent naming.

### Meaning

#### MANDATORY

A company-wide paid holiday.

Examples:

- Republic Day
- May Day
- Independence Day
- Gandhi Jayanti
- the five festival holidays finally approved/specifed for the establishment
- any additional holiday the company intentionally makes mandatory

Employee behaviour:

- No leave application should be required.
- Day must be shown as a holiday in employee calendar.
- Attendance must not mark the employee absent merely because no attendance exists.
- It should normally not consume leave balance.

#### FLOATER

An optional holiday that an eligible employee may choose from an Admin-published pool.

Examples could include:

- Good Friday
- Ramzan
- Bakrid
- Krishna Jayanthi
- Vinayakar Chathurthi
- Christmas
- other culturally/religiously relevant dates

Floater behaviour must be configurable by company policy.

Employee should see:

- holiday name;
- date;
- `Floater` badge;
- whether they have selected it;
- remaining floater entitlement;
- selection/cancellation deadline where applicable.

#### COMPANY

An additional company-wide paid holiday that is not being represented as a statutory mandatory holiday.

Examples:

- New Year's Day
- company anniversary
- year-end shutdown

#### REFERENCE

A Government-listed or HR-reference date that is visible to admins when constructing the calendar but is not yet active as an employee holiday.

REFERENCE dates should not affect:

- attendance;
- payroll;
- leave balances;
- working-day calculations.

---

# 5. Admin / HR Holiday Management

Add or extend an Admin/HR page such as:

`Settings → Holiday Calendar`

or reuse the most appropriate existing admin navigation.

Admin must be able to:

- select calendar year;
- view all configured holidays;
- create a holiday;
- edit a holiday;
- archive/deactivate a holiday;
- import from the Tamil Nadu Government reference list;
- classify as Mandatory / Floater / Company;
- set statutory classification;
- publish/unpublish the annual calendar;
- configure employee visibility;
- configure location/branch applicability if the ERP already supports locations;
- configure department/team applicability only if such scoping already exists and is genuinely required;
- add internal notes;
- store source/reference information;
- see who created/updated the record;
- see audit history if the ERP has an audit framework.

### Suggested admin table

| Date | Holiday | Type | Statutory | Applies To | Status | Actions |
|---|---|---|---|---|---|---|

Use clear badges:

- `Mandatory`
- `Floater`
- `Company Holiday`
- `Statutory`
- `Draft`
- `Published`

Do not rely on colour alone to communicate meaning.

---

# 6. Mandatory Holiday Backend Rules

The following four fixed statutory dates must be protected in backend validation:

```text
26 January
1 May
15 August
2 October
```

For those records:

- default `holidayType = MANDATORY`;
- default `statutoryType = FIXED_NATIONAL`;
- must be paid holiday records;
- must not consume employee leave;
- normal admin should receive a warning if attempting to change their statutory status;
- system should not allow accidental conversion to FLOATER;
- do not hard-code only the year 2026; generate/validate these dates for every supported calendar year.

The database is the source of truth for the effective company calendar, but backend validation must protect statutory fixed dates.

---

# 7. Five Statutory Festival Holidays

Admin/HR must be able to mark selected festival holidays as:

```text
statutoryType = STATUTORY_FESTIVAL
holidayType = MANDATORY
```

For each calendar year, provide an admin compliance summary:

```text
Fixed statutory holidays: 4 / 4
Statutory festival holidays: X / 5
Total statutory configured: X / 9
```

Examples of holidays a company might choose include:

- Pongal
- Tamil New Year
- Ayutha Pooja
- Deepavali
- Christmas

This list is only an example and must **not** be hard-coded as the statutory five.

### Validation

Before publishing a calendar, if fewer than five `STATUTORY_FESTIVAL` holidays are configured, show a prominent compliance warning:

> Only X of 5 statutory festival holidays have been configured for this year.

Do not silently auto-select five festivals for the company.

Allow an authorised admin to save a draft even when incomplete, but make the warning visible.

---

# 8. Floater Holiday Configuration

Add an annual Floater Policy configuration if the existing leave-policy system does not already cover it.

Suggested fields:

```ts
year
enabled
annualEntitlement
selectionMode
allowCancellation
selectionDeadlineDays
cancellationDeadlineDays
requiresApproval
carryForwardAllowed
```

Recommended default concepts:

```text
annualEntitlement = configurable
requiresApproval = configurable
carryForwardAllowed = false unless current company policy says otherwise
```

Do not invent the company's number of floater days.

Admin must explicitly configure the entitlement.

---

# 9. Employee Floater Selection

If Floater holidays are enabled, provide an employee flow integrated with the existing leave/calendar system.

Example employee experience:

### My Holidays

- Mandatory Holidays
- Company Holidays
- Available Floaters
- My Selected Floaters

For each floater:

```text
Christmas
25 Dec 2026
[Floater]

Available to select
```

After selection:

```text
Christmas
25 Dec 2026
[Floater] [Selected]
```

### Selection rules

Backend must verify:

- holiday is currently active and published;
- holiday type is FLOATER;
- employee is eligible;
- employee has remaining floater quota;
- duplicate selection is prevented;
- date has not passed;
- selection deadline is respected;
- cancellation rules are respected;
- branch/location applicability is respected if applicable.

Never trust frontend-only validation.

---

# 10. Calendar UI

Integrate holidays into the **existing company/employee calendar** rather than creating a disconnected calendar unless no calendar currently exists.

The calendar should visually distinguish:

- Mandatory Holiday
- Floater Holiday
- Selected Floater
- Company Holiday
- Leave
- Weekend
- Attendance status

Clicking a holiday should open a clean detail panel/modal:

```text
Pongal
Thursday, 15 January 2026

Type: Mandatory Holiday
Statutory: Festival Holiday
Paid Holiday: Yes
```

Example Floater:

```text
Christmas
Friday, 25 December 2026

Type: Floater Holiday
Status: Available
Floater balance: 1 remaining

[Select Floater]
```

Avoid clutter. Follow the ERP's existing design system.

---

# 11. Employee Dashboard Awareness

If the ERP already has a dashboard, add a compact:

## Upcoming Holidays

Show the next 3–5 relevant holidays.

Example:

```text
Upcoming Holidays

26 Aug   Milad-un-Nabi       Floater
14 Sep   Vinayakar Chathurthi Floater
02 Oct   Gandhi Jayanti      Mandatory
19 Oct   Ayutha Pooja        Mandatory
```

When a floater is selected:

```text
25 Dec   Christmas           Floater • Selected
```

Do not show unpublished/reference-only holidays to normal employees.

---

# 12. Attendance Integration

Holiday configuration must affect attendance correctly.

### Mandatory / Company-wide paid holiday

For an applicable employee:

- do not mark absent because there is no check-in;
- do not require leave;
- day should be represented as Holiday;
- working-day calculations should exclude the date where appropriate.

### Selected Floater

For an employee who selected that floater:

- treat date as paid holiday according to company policy;
- do not mark absent;
- do not consume standard Casual/Sick/Earned Leave unless company policy intentionally models it that way.

For an employee who did **not** select the floater:

- date remains a normal working day unless another rule applies.

This distinction must be employee-specific.

---

# 13. Payroll Integration

Inspect existing payroll working-day and payable-day calculations before making changes.

Mandatory/company holidays must not accidentally reduce salary for salaried employees.

Selected floater holidays must be treated according to the configured paid-holiday policy.

Do not rewrite payroll architecture. Introduce a reusable holiday-resolution service/helper and make existing payroll calculations consume it where required.

Recommended conceptual API:

```ts
resolveEmployeeDayStatus(employeeId, date)
```

Possible output:

```ts
{
  isWorkingDay: false,
  dayType: "MANDATORY_HOLIDAY",
  holidayId: "...",
  paid: true
}
```

For unselected floater:

```ts
{
  isWorkingDay: true,
  dayType: "WORKING_DAY"
}
```

Adapt this to current architecture.

---

# 14. Leave Integration

Do not create a duplicate leave type if the current leave module can model floater entitlement correctly.

Preferred order:

1. inspect current leave-policy architecture;
2. reuse entitlement/balance services where possible;
3. add Floater as a dedicated policy only when needed;
4. ensure floater selection appears in leave/holiday history without being confused with ordinary leave.

Admin/HR should be able to see:

- employee;
- floater selected;
- selection date;
- status;
- cancellation, if any;
- remaining entitlement.

---

# 15. Working on a Statutory Holiday

The underlying Tamil Nadu Act contains special requirements when an employee is required to work on a statutory holiday, including notice and compensation/substituted-holiday provisions.

Do **not** silently implement a simplistic `holiday = working day` switch.

If the ERP already has Comp Off / holiday-work / overtime functionality, integrate with it.

If it does not, structure the backend so a future workflow can support:

```text
Holiday Work Assignment
→ Employee
→ Holiday
→ Reason
→ Notice date/time
→ Compensation option
→ Double wages OR substituted paid holiday
→ Substitute date
→ Approval/audit
```

For now, if the company does not want the full workflow, show an Admin warning before marking an applicable statutory holiday as a working day.

---

# 16. Special Government-Declared Holidays

The Act allows the Government to declare additional special holidays in relevant circumstances.

The system therefore must support Admin creating:

```text
holidayType = MANDATORY
statutoryType = SPECIAL_GOVT_DECLARED
```

with:

```text
sourceTitle
sourceReference
notificationDate
notes
```

Do not hard-code election/special holidays years in advance.

---

# 17. Suggested Data Model

Adapt to the existing database naming standards.

## holidays

```text
id
name
date
year
holiday_type
statutory_type
is_paid
is_active
publication_status
description
source_title
source_reference
location_id / scope fields if applicable
created_by
updated_by
created_at
updated_at
```

Recommended publication status:

```text
DRAFT
PUBLISHED
ARCHIVED
```

### Constraints

Prefer:

```text
unique(date, applicable_scope)
```

where appropriate.

Avoid duplicate active company holidays for the same date/scope.

---

## holiday_policy

Only if required by current architecture:

```text
id
year
floater_enabled
floater_entitlement
floater_requires_approval
allow_floater_cancellation
floater_selection_deadline_days
floater_cancellation_deadline_days
created_by
updated_by
created_at
updated_at
```

---

## employee_floater_selections

```text
id
employee_id
holiday_id
status
selected_at
cancelled_at
approved_by
approved_at
notes
created_at
updated_at
```

Possible statuses:

```text
SELECTED
PENDING
APPROVED
CANCELLED
REJECTED
```

Only include statuses actually required by the company's approval flow.

---

# 18. Backend APIs / Services

Follow existing routing/controller/service/repository conventions.

Conceptual endpoints only:

```http
GET    /holidays?year=2026
POST   /holidays
PATCH  /holidays/:id
DELETE /holidays/:id
POST   /holidays/:id/publish

GET    /holiday-policy?year=2026
PATCH  /holiday-policy/:year

GET    /employees/me/holidays?year=2026
GET    /employees/me/floaters?year=2026
POST   /employees/me/floaters/:holidayId/select
DELETE /employees/me/floaters/:holidayId/select
```

Do not introduce these exact routes if equivalent endpoints already exist.

### Required backend validation

- role/permission checks;
- mandatory statutory date protection;
- annual floater quota;
- duplicate selection prevention;
- date validity;
- published/active checks;
- employee applicability;
- transactional update where balance/selection is affected;
- server-side year/date consistency;
- audit information.

---

# 19. Permissions

Reuse existing RBAC.

Suggested capabilities:

```text
holiday.view
holiday.manage
holiday.publish
holiday.policy.manage
holiday.floater.select
holiday.audit.view
```

Do not create new permission infrastructure if the ERP already has role/permission checks.

Typical access:

### Employee

- view published applicable holidays;
- select/cancel own floaters within policy;
- see own floater balance.

### HR / Admin

- CRUD holiday configuration;
- configure floaters;
- publish annual calendar;
- inspect employee selections.

### Super Admin

- override protected operations where business policy allows;
- access audit trail.

---

# 20. Notifications

Reuse existing notification infrastructure if present.

Useful events:

### When yearly calendar is published

```text
The 2026 Company Holiday Calendar is now available.
```

### Before an upcoming mandatory holiday

```text
Reminder: Gandhi Jayanti is a company holiday on Friday, 2 October.
```

### Floater reminder

```text
Christmas is available as a floater holiday on 25 December.
You have 1 floater remaining.
```

Do not introduce noisy daily notifications.

---

# 21. Auditability

Holiday calendars affect attendance and payroll, so Admin changes should be traceable.

Where an audit system exists, record:

- old value;
- new value;
- changed by;
- timestamp;
- holiday;
- reason for sensitive overrides.

Particularly audit:

- Mandatory → non-mandatory changes;
- publication;
- unpublishing;
- deletion/archive;
- statutory classification;
- date changes;
- employee floater overrides.

---

# 22. 2026 Recommended Initial Configuration

This is an **implementation starting point**, not an instruction to silently decide company HR policy.

## Fixed statutory mandatory records

```text
2026-01-26  Republic Day       MANDATORY / FIXED_NATIONAL
2026-05-01  May Day            MANDATORY / FIXED_NATIONAL
2026-08-15  Independence Day   MANDATORY / FIXED_NATIONAL
2026-10-02  Gandhi Jayanti     MANDATORY / FIXED_NATIONAL
```

## Suggested candidates for the five statutory festival holidays

Present these to Admin as suggestions rather than locking them:

```text
2026-01-15  Pongal
2026-04-14  Tamil New Year
2026-10-19  Ayutha Pooja
2026-11-08  Deepavali
2026-12-25  Christmas
```

Admin must review/confirm the company's actual compliant list.

## Other Government holidays

Import as `REFERENCE` by default.

Admin may promote a reference holiday to:

```text
FLOATER
COMPANY
MANDATORY
```

subject to company policy and legal compliance.

---

# 23. Weekend Behaviour

Do not assume Monday–Friday or Monday–Saturday.

Read the company's existing work-week configuration.

When a holiday falls on an existing weekly off:

- still show the holiday on the calendar;
- do not automatically grant a substitute day unless company policy says so;
- do not automatically remove its statutory classification;
- payroll/attendance should not double-count the day.

For example, Independence Day in 2026 falls on **Saturday** and Deepavali falls on **Sunday**. The system should display the holiday correctly without inventing a Monday substitute.

---

# 24. UI / UX Requirements

Keep the UI:

- modern;
- minimal;
- professional;
- consistent with the existing ERP;
- mobile responsive;
- accessible;
- understandable without reading legal text.

### Admin

Use:

- calendar + table views where useful;
- concise filters;
- clear type badges;
- year selector;
- `Add Holiday`;
- `Import TN Holidays`;
- compliance summary.

Example summary:

```text
2026 Holiday Compliance

Fixed statutory     4 / 4
Festival statutory  5 / 5
Floaters configured 6
Calendar            Published
```

### Employee

Prioritise:

1. upcoming holiday;
2. holiday type;
3. selected floater state;
4. remaining floater count.

Employees should not be exposed to unnecessary admin/legal complexity.

---

# 25. Do Not Do These

- Do not mark every Tamil Nadu Government public holiday as mandatory for the private company.
- Do not treat `Floater` and `Statutory Festival Holiday` as the same concept.
- Do not allow frontend flags to be the only source of validation.
- Do not hard-code five festival choices as law.
- Do not deduct normal leave for mandatory paid holidays.
- Do not mark employees absent on applicable mandatory holidays.
- Do not alter payroll calculations without tracing existing working-day logic.
- Do not create a second leave/calendar/permissions system.
- Do not hard-delete statutory holiday history without auditability.
- Do not assume weekend substitute holidays.
- Do not expose draft/reference-only holidays as company holidays to employees.
- Do not break existing API contracts or business flows unnecessarily.

---

# 26. Testing Requirements

Add tests in the repository's existing testing framework.

At minimum cover:

### Backend

- Republic Day cannot accidentally become Floater.
- May Day resolves as mandatory.
- Independence Day resolves as mandatory even when it is Saturday.
- Gandhi Jayanti resolves as mandatory.
- duplicate floater selection fails.
- employee cannot exceed floater entitlement.
- unselected floater remains a working day for that employee.
- selected floater resolves as holiday for that employee.
- inactive/unpublished holiday does not affect normal employee calendar.
- reference holiday does not affect attendance.
- payroll working-day calculation respects applicable holidays.
- statutory festival count appears correctly.
- authorisation rules are enforced.

### Frontend

- employee sees only published/applicable holidays;
- badges render correctly;
- selected floater state is visible;
- remaining entitlement updates after selection/cancellation;
- Admin receives warning when statutory festival count is below 5;
- calendar/table remains responsive.

---

# 27. Implementation Sequence for the Agent

Follow this order.

## Phase 1 — Repository discovery

Inspect:

- DB schema/migrations;
- employee model;
- roles and permissions;
- calendar;
- attendance;
- leave;
- payroll;
- dashboard;
- notifications;
- API architecture;
- frontend component/design patterns;
- testing setup.

Document the exact existing files/modules you plan to change.

## Phase 2 — Design

Before coding, produce a short implementation plan containing:

- existing components/services to reuse;
- DB changes;
- backend changes;
- frontend changes;
- attendance impact;
- payroll impact;
- leave impact;
- migration/seed approach;
- risks.

## Phase 3 — Backend

Implement:

- schema/migration;
- holiday service;
- admin CRUD;
- statutory validation;
- floater policy;
- employee floater selection;
- attendance/calendar resolution;
- permissions.

## Phase 4 — Frontend

Implement:

- Admin Holiday Calendar;
- year/filter controls;
- compliance summary;
- employee calendar badges;
- upcoming holidays widget;
- floater-selection experience.

## Phase 5 — Integrations

Verify:

- attendance;
- leave;
- payroll;
- dashboard;
- notifications.

## Phase 6 — Tests

Run:

- existing regression tests;
- new holiday tests;
- frontend typecheck/build;
- backend tests;
- linting.

Fix regressions rather than suppressing them.

---

# 28. Acceptance Criteria

The task is complete when:

- [ ] Admin can manage yearly company holidays.
- [ ] Mandatory and Floater are distinct backend concepts.
- [ ] Statutory significance is stored separately from holiday type.
- [ ] Four fixed statutory holidays are protected by backend validation.
- [ ] Admin can configure five statutory festival holidays.
- [ ] ERP warns if fewer than five statutory festival holidays are configured.
- [ ] Tamil Nadu Government holidays can be imported as reference records.
- [ ] Government-reference dates do not automatically become employee holidays.
- [ ] Admin can promote reference dates to Floater / Company / Mandatory as appropriate.
- [ ] Floater entitlement is configurable.
- [ ] Employees can see remaining floater entitlement.
- [ ] Employees can select eligible floater holidays.
- [ ] Backend prevents excess/duplicate floater selection.
- [ ] Calendar clearly labels holiday types.
- [ ] Dashboard shows upcoming holidays.
- [ ] Attendance does not mark applicable mandatory holidays absent.
- [ ] Selected floater affects only the selecting employee where applicable.
- [ ] Payroll working-day logic correctly recognises applicable paid holidays.
- [ ] Unpublished holidays are hidden from normal employees.
- [ ] Existing flows and UI conventions remain intact.
- [ ] Relevant automated tests pass.
- [ ] Admin changes are auditable where the ERP supports auditing.

---

# 29. Official References

Use these as the legal/reference basis when implementing. If legal rules or annual holiday notifications change, update the ERP configuration rather than assuming this document remains current forever.

### Tamil Nadu Industrial Establishments (National, Festival and Special Holidays) Act, 1958

India Code:

https://www.indiacode.nic.in/bitstream/123456789/13151/1/tnie_national-festival-and-special-holidays-act_1958.pdf

Relevant concepts include:

- Section 3 — four fixed dates + five festival holidays;
- Section 4 — employer holiday statement/display requirement;
- Section 5 — paid holidays and rules when employees work on applicable holidays.

### Tamil Nadu Government Public Holidays — 2026

G.O.(Ms.) No.708, Public (Miscellaneous) Department, dated 11 November 2025:

https://www.tn.gov.in/sites/default/holidays/public_e_708_2025.pdf

Treat this list as a Government holiday/reference list. It is **not** a blanket rule that every private IT company must close on every listed date.

---

# 30. Final Instruction to the Coding Agent

Implement this feature against the **actual existing ERP architecture**.

Do not blindly copy the proposed tables, API paths, or component names. They are conceptual requirements.

Your priorities are:

1. preserve current business flow;
2. reuse existing modules;
3. enforce holiday rules in the backend;
4. make Mandatory vs Floater immediately understandable to employees;
5. protect attendance/payroll correctness;
6. keep HR/Admin configuration flexible;
7. keep statutory status auditable;
8. build a clean modern UI consistent with the current ERP;
9. make the annual calendar data-driven so 2027+ requires configuration/data updates rather than source-code changes.

Before modifying files, inspect the codebase and present the implementation plan with the exact files/modules you intend to touch.
