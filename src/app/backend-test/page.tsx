"use client";

import { useState } from "react";
import { checkBackendHealth } from "@/lib/api";

export default function BackendTestPage() {
  const [result, setResult] = useState("Not tested yet");

  const testBackend = async () => {
    try {
      const data = await checkBackendHealth();
      setResult(JSON.stringify(data));
    } catch (error) {
      setResult("Connection failed");
      console.error(error);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-black text-white">
      <h1 className="text-3xl font-bold">Backend Connection Test</h1>

      <button
        onClick={testBackend}
        className="rounded-xl bg-white px-6 py-3 text-black"
      >
        Test Backend
      </button>

      <p>{result}</p>
    </main>
  );
}