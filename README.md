# PureEHC — Secure Clinical Health Record System

PureEHC is a web-based electronic health record (EHR) system built for small clinics that can't afford large hospital-grade systems. It focuses on practical, layered security rather than relying on a single login screen to protect patient data.

## About the Project

Small clinics in the Philippines often manage patient records with little to no digital security. PureEHC was built to give these clinics an affordable, Firebase-powered system that still follows strong security practices — using a **Defense in Depth** approach, where multiple independent layers protect data so that one failure doesn't expose everything.

## Key Features

- **Google Sign-In authentication** — no separate passwords to manage
- **Role-Based Access Control (RBAC)** — Owner (doctor), Nurse, and Receptionist roles each see only what's relevant to them, enforced both in the interface and again at the function level
- **Audit trail** — every important action (logins, patient edits, prescriptions, appointments) is logged with who did it and when; only the clinic owner can view the full log
- **Immutable prescriptions** — once a prescription is created, it cannot be edited or deleted, preserving a tamper-evident medical history
- **Appointment conflict checking** — prevents double-booking the same date and time
- **Offline support** — uses Firestore's local cache so the app keeps working briefly during short internet drops
- **Input validation & rate limiting** — guards against malformed or spammed form submissions

## Tech Stack

- **Frontend:** HTML, CSS, JavaScript
- **Backend:** Firebase (Authentication + Firestore)
- **Security:** Firestore Security Rules enforcing role-based access server-side

## System Roles

| Role | Access |
|------|--------|
| Owner (Doctor) | Full access — patients, prescriptions, audit logs, staff management |
| Nurse | Clinical data — patients, visit notes |
| Receptionist | Scheduling and basic patient info only |

## Scope

This system is designed for a **single-provider small clinic**. It does not include lab integration, billing, insurance claims, or AI-assisted diagnosis — these are intentionally out of scope to keep the system focused and achievable.

## Status

This is a capstone project developed as part of the BSIT program. Core features (RBAC, audit logging, prescription records) are implemented and functional. Formal testing (unit, integration, system, and user acceptance) is planned as a next step.

