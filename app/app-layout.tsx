import { Outlet } from "react-router";
import { Toaster } from "sonner";
import { Sidenav } from "~/components/sidenav/sidenav";
import { NavProgress } from "./components/feedback/nav-progress";
import { MobileNav } from "./components/sidenav/mobile-nav";

export default function AppLayout() {
  return (
    <div className="min-h-screen flex">
      <NavProgress />
      <Sidenav />
      <div className="flex-1 flex flex-col min-w-0">
        <MobileNav />
        <main className="flex-1">
          <Outlet />
        </main>
        <Toaster position="bottom-right" richColors closeButton />
      </div>
    </div>
  );
}
