import SidenavList from "./sidenav-list";

export function Sidenav() {
  return (
    <aside className="hidden md:flex flex-col w-60 shrink-0 border-r border-[var(--gray-a4)] px-3 py-4">
      <div className="px-2 mb-6">
        <p className="font-semibold tracking-tight text-[var(--gray-12)]">FleetPulse</p>
      </div>
      <SidenavList />
    </aside>
  );
}
