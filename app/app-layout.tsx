import { Outlet } from "react-router";
import { Toaster } from "sonner";
import { Sidenav } from "~/components/sidenav/sidenav";
import { NavProgress } from "./components/feedback/nav-progress";
import { BottomNav } from "./components/sidenav/bottom-nav";
import { MobileTopbar } from "./components/sidenav/mobile-topbar";

export default function AppLayout() {
  return (
    <div className="min-h-screen flex">
      <NavProgress />
      <Sidenav />
      <div className="flex-1 flex flex-col min-w-0">
        <MobileTopbar />
        <main className="flex-1 pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0">
          <Outlet />
        </main>
        <BottomNav />
        <Toaster position="bottom-right" richColors closeButton mobileOffset={{ bottom: "5rem" }} />
      </div>
    </div>
  );
}
