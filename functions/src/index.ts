import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as sgMail from "@sendgrid/mail";

// Initialize the Firebase Admin SDK
admin.initializeApp();

// Set the SendGrid API Key from Firebase environment configuration
const SENDGRID_API_KEY = functions.config().sendgrid.key;
if (!SENDGRID_API_KEY) {
  console.error("SendGrid API key not configured. Please run 'firebase functions:config:set sendgrid.key=YOUR_KEY'");
} else {
  sgMail.setApiKey(SENDGRID_API_KEY);
}

/**
 * Cloud Function that triggers when a new appointment is created.
 *
 * This function sends a confirmation email to the patient using SendGrid.
 */
export const onAppointmentCreated = functions.firestore
  .document("appointments/{appointmentId}")
  .onCreate(async (snap, context) => {
    if (!SENDGRID_API_KEY) {
      console.log("SendGrid API Key not available. Email not sent.");
      return null; // Exit if the API key is not set
    }

    const appointment = snap.data();
    if (!appointment) {
      console.error("No data found in created appointment document.");
      return null;
    }

    const patientId = appointment.patientId;

    try {
      // Get the patient's user record to find their email address
      const userRecord = await admin.auth().getUser(patientId);
      const patientEmail = userRecord.email;

      if (!patientEmail) {
        console.error(`No email found for user ${patientId}.`);
        return null;
      }

      const startTime = new Date(appointment.startTime.seconds * 1000).toLocaleString();

      // Construct the email message
      const msg = {
        to: patientEmail,
        from: "imsiza94@gmail.com", // IMPORTANT: Replace with your verified SendGrid sender email
        subject: "Your Appointment has been Confirmed!",
        html: `
          <h1>Appointment Confirmation</h1>
          <p>Hi ${userRecord.displayName || 'there'},</p>
          <p>This is a confirmation for your upcoming appointment.</p>
          <p><strong>Doctor:</strong> ${appointment.doctorName}</p>
          <p><strong>Time:</strong> ${startTime}</p>
          <p>We look forward to seeing you!</p>
        `,
      };

      // Send the email
      await sgMail.send(msg);
      console.log(`Confirmation email sent to ${patientEmail} for appointment ${context.params.appointmentId}`);
      return null;

    } catch (error) {
      console.error("Error sending appointment confirmation email:", error);
      return null;
    }
  });
