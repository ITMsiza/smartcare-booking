
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  auth,
  getMultiFactorResolver,
  PhoneAuthProvider,
  PhoneMultiFactorGenerator,
  signInWithEmailAndPassword,
  RecaptchaVerifier,
} from "@/app/lib/firebase";
import type { MultiFactorResolver, MultiFactorInfo, User } from "firebase/auth";

// This function now expects the API to return a userType
async function setSession(idToken: string): Promise<any> {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ idToken }),
  });

  if (!response.ok) {
    throw new Error('Failed to set session cookie.');
  }

  return response.json(); // Returns { status: 'success', userType: '...' }
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [verificationId, setVerificationId] = useState<string | null>(null);
  const [mfaResolver, setMfaResolver] = useState<MultiFactorResolver | null>(
    null
  );
  const router = useRouter();

  // Updated to handle redirection based on userType
  const onSignInSuccess = async (user: User) => {
    try {
      const idToken = await user.getIdToken();
      const { userType } = await setSession(idToken);

      // Redirect based on the userType from the API
      switch (userType) {
        case 'user':
          router.push("/user-dashboard");
          break;
        case 'admin':
          router.push("/admin-dashboard");
          break;
        case 'doctor':
          router.push("/doctor-dashboard");
          break;
        default:
          router.push("/dashboard"); // Fallback
          break;
      }
    } catch (err: any) {
        setError("An error occurred during session creation.");
    }
  };

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      await onSignInSuccess(userCredential.user);
    } catch (err: any) {
      if (err.code === "auth/multi-factor-required") {
        const resolver = getMultiFactorResolver(auth, err);
        setMfaResolver(resolver);

        const phoneInfo = resolver.hints.find(
          (info) => info.factorId === PhoneMultiFactorGenerator.FACTOR_ID
        );
        if (!phoneInfo) {
          setError("This account does not have a phone number for MFA.");
          return;
        }

        const phoneAuthProvider = new PhoneAuthProvider(auth);
        const recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
          'size': 'invisible',
        });

        const verId = await phoneAuthProvider.verifyPhoneNumber(
          {
            multiFactorHint: phoneInfo as MultiFactorInfo,
            session: resolver.session
          },
          recaptchaVerifier
        );
        setVerificationId(verId);
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleMfaSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!mfaResolver || !verificationId) {
      setError("MFA process was not initiated correctly.");
      setLoading(false);
      return;
    }

    try {
      const cred = PhoneAuthProvider.credential(verificationId, otp);
      const multiFactorAssertion = PhoneMultiFactorGenerator.assertion(cred);
      const userCredential = await mfaResolver.resolveSignIn(multiFactorAssertion);
      await onSignInSuccess(userCredential.user);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-100 to-pink-100 dark:from-gray-900 dark:to-indigo-800 flex flex-col justify-center items-center p-4">
      <div className="bg-white dark:bg-gray-800 p-8 sm:p-10 rounded-2xl shadow-xl w-full max-w-md">
        <h1 className="text-3xl font-bold mb-8 text-center text-gray-800 dark:text-gray-100">
          {mfaResolver ? "Verify Your Identity" : "Welcome Back"}
        </h1>

        {error && <p className="text-red-500 text-center mb-4">{error}</p>}
        
        <div id="recaptcha-container"></div>

        {!mfaResolver ? (
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition"
              />
            </div>
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition"
              />
            </div>
            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-all"
              >
                {loading ? "Signing in..." : "Sign In"}
              </button>
            </div>
            <div className="text-center mt-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Don't have an account?{" "}
                <Link href="/register" className="font-medium text-indigo-600 hover:text-indigo-500">
                  Sign up
                </Link>
              </p>
            </div>
          </form>
        ) : (
          <form onSubmit={handleMfaSignIn} className="space-y-6">
            <p className="text-center text-sm text-gray-600 dark:text-gray-400">
              A verification code has been sent to your phone.
            </p>
            <div>
              <label
                htmlFor="otp"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Verification Code
              </label>
              <input
                id="otp"
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="123456"
                required
                className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition"
              />
            </div>
            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-all"
              >
                {loading ? "Verifying..." : "Verify and Sign In"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
