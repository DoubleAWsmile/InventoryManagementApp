import { useState } from "react";
import { ThemeProvider } from "../theme/ThemeContext";
import { NotificationsProvider } from "../context/NotificationsContext";
import { InventoryPrefsProvider } from "../context/InventoryPrefsContext";
import type { PageName } from "../types";
import LoginPage from "../components/LoginPage";
import CreateAccountPage from "../components/CreateAccountPage";
import DashboardPage from "../components/DashboardPage";
import AllItemsPage from "../components/AllItemsPage";
import ItemDetailPage from "../components/ItemDetailPage";
import SettingsPage from "../components/SettingsPage";
import RoomsPage from "../pages/RoomsPage";
import CategoriesPage from "../pages/CategoriesPage";
import AddItemPage from "../pages/AddItemPage";
import WishlistPage from "../pages/WishlistPage";
import ReportsPage from "../pages/ReportsPage";
import InventoryMapPage from "../pages/InventoryMapPage";
import SearchResultsPage from "../pages/SearchResultsPage";
import NotificationsPage from "../pages/NotificationsPage";

function AppRouter() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authPage, setAuthPage] = useState<"signIn" | "createAccount">("signIn");
  const [currentPage, setCurrentPage] = useState<PageName>("dashboard");
  const [selectedItemId, setSelectedItemId] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");

  function selectItem(id: number) {
    setSelectedItemId(id);
    setCurrentPage("itemDetail");
  }

  function signOut() {
    setIsLoggedIn(false);
    setCurrentPage("dashboard");
  }

  function nav(page: PageName, query?: string) {
    if (page === "itemDetail") { selectItem(1); return; }
    if (page === "searchResults" && query !== undefined) setSearchQuery(query);
    setCurrentPage(page);
  }

  const commonProps = {
    onSignOut: signOut,
    onNavigate: nav,
    onSettings: () => setCurrentPage("settings"),
  };

  if (!isLoggedIn) {
    if (authPage === "createAccount") {
      return (
        <CreateAccountPage
          onFinished={() => setAuthPage("signIn")}
          onBackToSignIn={() => setAuthPage("signIn")}
        />
      );
    }

    return (
      <LoginPage
        onSuccess={() => setIsLoggedIn(true)}
        onCreateAccount={() => setAuthPage("createAccount")}
      />
    );
  }

  switch (currentPage) {
    case "settings":
      return <SettingsPage onSignOut={signOut} onNavigate={(p) => nav(p)} />;
    case "allItems":
      return <AllItemsPage onBack={() => setCurrentPage("dashboard")} onSignOut={signOut} onItemSelect={selectItem} onSettings={() => setCurrentPage("settings")} onNavigate={nav} />;
    case "itemDetail":
      return <ItemDetailPage itemId={selectedItemId} onBack={() => setCurrentPage("allItems")} onSignOut={signOut} onItemSelect={selectItem} onSettings={() => setCurrentPage("settings")} />;
    case "rooms":
      return <RoomsPage {...commonProps} />;
    case "categories":
      return <CategoriesPage {...commonProps} />;
    case "addItem":
      return <AddItemPage {...commonProps} />;
    case "wishlist":
      return <WishlistPage {...commonProps} />;
    case "reports":
      return <ReportsPage {...commonProps} />;
    case "map":
      return <InventoryMapPage {...commonProps} />;
    case "searchResults":
      return <SearchResultsPage {...commonProps} initialQuery={searchQuery} />;
    case "notifications":
      return <NotificationsPage {...commonProps} />;
    default:
      return (
        <DashboardPage
          onSignOut={signOut}
          onNavigate={nav}
          onItemSelect={selectItem}
          onSettings={() => setCurrentPage("settings")}
        />
      );
  }
}

export default function App() {
  return (
    <ThemeProvider>
      <InventoryPrefsProvider>
        <NotificationsProvider>
          <AppRouter />
        </NotificationsProvider>
      </InventoryPrefsProvider>
    </ThemeProvider>
  );
}
