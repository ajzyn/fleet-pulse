import { Outlet } from "react-router";
import { Toaster } from "sonner";
import { Sidenav } from "~/components/sidenav/sidenav";

export default function AppLayout() {
  return (
    <div className="min-h-screen flex">
      <Sidenav />
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1">
          <Outlet />
        </main>
        <Toaster position="bottom-right" richColors closeButton />
      </div>
    </div>
  );
}
