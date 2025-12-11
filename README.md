# SmartCare Booking
A multi-role medical appointment booking system for Patients, Doctors, and Admins built with Next.js and Firebase.

## Live Demo
https://smartcare-booking-v16e.vercel.app

## Demo Accounts

### Patient
- **Email:** imsiza94@gmail.com  
- **Password:** 111111  

### Doctor
- **Email:** itmsiza1994@gmail.com  
- **Password:** 222222  

### Admin
- **Email:** phahlay@gmail.com  
- **Password:** 333333 

## Features

### Patient
- Login and access patient dashboard  
- Book appointments  
- View upcoming and past appointments  
- View doctor profiles and ratings  
- View doctor specialties  
- Ratings appear on appointments  

### Doctor
- Manage appointments  
- View patient history  
- Update records  
- Set availability  
- Update doctor profile  

### Admin
- Manage doctors  
- Manage users  
- Manage hospital records  
- View feedback  

### System
- Multi-role login system  
- Fully responsive design  
- Firebase backend (Auth, Firestore)

## Tech Stack
- **Frontend:** Next.js, React, Tailwind CSS  
- **Backend:** Firebase Authentication, Firestore, Firebase Admin  
- **Deployment:** Vercel  

## Screenshots
### Login Page
<img width="1366" height="686" alt="Login" src="https://github.com/user-attachments/assets/ccb2f483-5cda-42da-bfd6-65d1b8a41bda" />

### Patient Dashboard
<img width="1366" height="768" alt="PatientDashboard" src="https://github.com/user-attachments/assets/14c4bda2-794b-4c26-9fbd-1ef586c6e531" />
<img width="1366" height="768" alt="PatientDashboard Continuation" src="https://github.com/user-attachments/assets/285a6e0f-94af-41c4-bc0c-646d4dd96099" />

### Doctor Dashboard
<img width="1366" height="684" alt="DoctorDashboard" src="https://github.com/user-attachments/assets/f5dfbfa2-ec5c-455b-b79c-c2fd5da80cd8" />
<img width="1366" height="683" alt="DoctorDashboard Continuation" src="https://github.com/user-attachments/assets/32c7ec1c-6336-4c9a-9773-7dde83c63b4d" />

### Admin Dashboard
<img width="1366" height="690" alt="Screenshot (45)" src="https://github.com/user-attachments/assets/11635cd7-1fd7-4565-92ab-159a958f250c" />
<img width="1366" height="688" alt="Screenshot (46)" src="https://github.com/user-attachments/assets/e50cbf5d-731b-4687-b390-205139b6a020" />
<img width="1366" height="686" alt="Screenshot (47)" src="https://github.com/user-attachments/assets/4cc4e419-5d42-497b-b8cd-59aa78e6ff86" />

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/ITMsiza/smartcare-booking.git

2. Go into the folder: cd smartcare-booking
3. Install packages: npm install
4. Add your Firebase keys in .env.local
5. Start development: npm run dev
6. Open: http://localhost:3000

---

# **8. How the System Works (Simple Explanation)**

```markdown
## How It Works

- Users log in using their role-specific credentials  
- Patient books an appointment → Doctor receives it  
- Doctor updates records → Patient can view history  
- Admin oversees all system data  
