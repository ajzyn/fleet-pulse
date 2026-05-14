import { Outlet } from "react-router";
import { Toaster } from "sonner";

export default function AppLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-gray-200 dark:border-gray-800 px-6 py-4">
        <p className="font-semibold tracking-tight">FleetPulse</p>
      </header>
      <main className="flex-1">
        <Outlet />
        <Toaster position="bottom-right" richColors closeButton />
      </main>
    </div>
  );
}
