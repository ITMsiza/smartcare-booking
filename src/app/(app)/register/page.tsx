
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/app/lib/firebase"; // Import Firebase auth
import { signInWithCustomToken } from "firebase/auth";

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    userType: "user",
    name: "",
    email: "",
    phone: "",
    password: "",
    specialization: "",
    license: "",
    hospital: "",
  });
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const router = useRouter();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSendOtp = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to send OTP");
      }

      setOtpSent(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, otp }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to verify OTP");
      }

      const { customToken } = await response.json();

      // Sign in with the custom token
      await signInWithCustomToken(auth, customToken);

      // Redirect based on user type
      if (formData.userType === "user") {
        router.push("/user-dashboard");
      } else if (formData.userType === "doctor") {
        router.push("/doctor-dashboard");
      } else if (formData.userType === "admin") {
        router.push("/admin-dashboard");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-100 to-pink-100 dark:from-gray-900 dark:to-indigo-800 flex flex-col justify-center items-center p-4">
      <div className="bg-white dark:bg-gray-800 p-8 sm:p-10 rounded-2xl shadow-xl w-full max-w-lg">
        <h1 className="text-3xl font-bold mb-8 text-center text-gray-800 dark:text-gray-100">Create Your Account</h1>
        
        {error && <p className="text-red-500 text-center mb-4">{error}</p>}

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="userType" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Register as</label>
            <select
              id="userType"
              value={formData.userType}
              onChange={handleInputChange}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md bg-gray-50 dark:bg-gray-700 dark:text-gray-200 transition"
            >
              <option value="user">Patient</option>
              <option value="doctor">Doctor</option>
              <option value="admin">Hospital Administrator</option>
            </select>
          </div>

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Full Name</label>
            <input id="name" type="text" placeholder="John Doe" required onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition"/>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email Address</label>
            <input id="email" type="email" placeholder="you@example.com" required onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition"/>
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Phone Number</label>
            <input id="phone" type="tel" placeholder="+1 (555) 123-4567" required onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition"/>
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
            <input type="password" id="password" placeholder="••••••••" required onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition"/>
          </div>

          {formData.userType === "doctor" && (
            <>
              <div>
                <label htmlFor="specialization" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Specialization</label>
                <input id="specialization" type="text" placeholder="e.g., Cardiology" required onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition"/>
              </div>
              <div>
                <label htmlFor="license" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Medical License Number</label>
                <input id="license" type="text" placeholder="123456789" required onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition"/>
              </div>
            </>
          )}

          {formData.userType === "admin" && (
            <div>
              <label htmlFor="hospital" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Hospital Name</label>
              <input id="hospital" type="text" placeholder="General Hospital" required onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition"/>
            </div>
          )}

          {otpSent && (
            <div>
              <label htmlFor="otp" className="block text-sm font-medium text-gray-700 dark:text-gray-300">One-Time Password (OTP)</label>
              <input id="otp" type="text" placeholder="123456" required onChange={(e) => setOtp(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition"/>
            </div>
          )}

          <div>
            {!otpSent ? (
              <button type="button" onClick={handleSendOtp} disabled={loading} className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors disabled:opacity-50">
                {loading ? "Sending..." : "Send OTP"}
              </button>
            ) : (
              <button type="submit" disabled={loading} className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors disabled:opacity-50">
                {loading ? "Verifying..." : "Register"}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
