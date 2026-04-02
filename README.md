# QR-Based Attendance Management System

## Overview
The QR-Based Attendance Management System is a secure web application developed to automate and manage student attendance using dynamically generated QR codes. The system supports role-based access for Admin, Faculty, and Students, and is deployed as a cloud-based web application using Netlify and Supabase.

This project was developed as part of the Secure Software Engineering course.

---

## Features

### User Management
- Admin can add, update, and remove users (Students and Faculty)
- Role-based access control (Admin, Faculty, Student)
- Secure authentication using Supabase Auth
- Profile management for users

### QR-Based Attendance System
- Faculty generates a time-limited QR code for attendance
- Students scan QR code to mark attendance
- QR code expires after a specific time to prevent misuse
- Faculty confirms attendance before final submission

### Attendance Management
- Attendance stored per session, course, and student
- Prevents duplicate attendance marking
- Attendance status: Present, Late, Absent
- Attendance records stored securely in database

### Reports
- Student attendance report
- Course/class attendance report
- Attendance percentage calculation
- Session-wise attendance tracking

### Security Features
This system includes multiple secure software engineering features:
- Role-Based Access Control (RBAC)
- Row Level Security (RLS) policies in database
- Brute force login detection (failed login tracking)
- Account lock mechanism
- Audit logging system (user actions logged)
- Secure authentication (Supabase)
- HTTPS secure communication (Netlify)
- QR code expiry mechanism
- Input validation and access control policies

### Audit Logging
The system logs important actions such as:
- Login attempts
- QR generation
- Attendance marking
- User creation/deletion
- Admin actions

---

## System Architecture
