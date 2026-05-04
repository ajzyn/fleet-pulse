import { Outlet } from "react-router";

export function Layout() {
  return (
    <div className="app-layout">
      <header className="app-header">
        <h1>My App</h1>
      </header>
      <main className="app-content">
        <Outlet />
      </main>
      <footer className="app-footer">
        <p>&copy; 2026 My App. All rights reserved.</p>
      </footer>
    </div>
  );
}
