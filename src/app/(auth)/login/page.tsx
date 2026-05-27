import { Suspense } from "react";
import { googleEnabled } from "@/lib/auth";
import { LoginForm } from "./login-form";

// Suspense wrap necessario porque useSearchParams() exige boundary durante
// prerender estatico no Next.js 15.
export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <Suspense fallback={null}>
        <LoginForm googleEnabled={googleEnabled} />
      </Suspense>
    </div>
  );
}
