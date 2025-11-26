# Competency-Based Education (CBE) Assessment & Credential Platform

## Overview

This project is a proof-of-concept Assessment & Credential Platform aligned with Kenyan Competency-Based Education/Curriculum (CBE/CBC) practices. It's a hybrid system designed to manage the lifecycle of creating educational content, assessing students, and issuing verifiable digital credentials.

## Key Features

-   **Course and Module Management:** Admins create courses, and Leads design modules with detailed rubrics.
-   **Flexible Assessments:** Supports mixed submission types including multiple-choice questions (MCQs), text, files, images, audio, video, and external links.
-   **Formative and Summative Scoring:** A weighted scoring system with customizable descriptors (e.g., Exceeds Expectation, Meets Expectation).
-   **Digital Credentials Wallet:** Students can view, download, import, and share their issued micro-credentials.
-   **Automated Credential Issuance:**
    -   Micro-credentials are automatically issued for each module passed.
    -   A course-level stackable credential is automatically issued upon completion of all active modules in a course.
-   **Blockchain-Anchored Credentials:** Credentials are Blockcerts-compatible (JSON-LD) and anchored on the Sepolia testnet for verification.
-   **Role-Based Access Control:** Different user roles (Admin, Lead, Assessor, Student) with specific permissions.
-   **Verification System:** Employers and other third parties can verify credentials through a built-in verifier.

## User Roles

-   **Admin**: Manages the platform, creates courses, appoints Course Leads, and manages Assessor accounts.
-   **Lead**: Owns a course, creates modules, defines rubrics, and assigns Assessors.
-   **Assessor (Grader)**: Creates assessments, enrolls students in modules, grades submissions, and records observations.
-   **Student**: Submits assessments and manages their credentials through a personal digital wallet.

## Technology Stack

-   **Frontend:** React (Next.js), Tailwind CSS
-   **Backend:** Node.js, Express
-   **Database:** PostgreSQL with Prisma ORM
-   **Smart Contracts:** Solidity (for CredentialRegistry), Hardhat
-   **Blockchain Interaction:** ethers.js
-   **Object Storage:** Cloudinary (for media uploads)
-   **Containerization:** Docker
