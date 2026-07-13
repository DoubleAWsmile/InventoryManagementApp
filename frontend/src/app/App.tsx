import { useState } from "react";
import { ThemeProvider } from "../theme/ThemeContext";
import { NotificationsProvider } from "../context/NotificationsContext";
import { InventoryPrefsProvider } from "../context/InventoryPrefsContext";
import type { Item, PageName } from "../types";
import type { User } from "../services/api";
import LoginPage from "../pages/LoginPage";
import CreateAccountPage from "../pages/CreateAccountPage";
import DashboardPage from "../pages/DashboardPage";
import AllItemsPage from "../pages/AllItemsPage";
import ItemDetailPage from "../pages/ItemDetailPage";
import SettingsPage from "../pages/SettingsPage";
import RoomsPage from "../pages/RoomsPage";
import CategoriesPage from "../pages/CategoriesPage";
import AddItemPage from "../pages/AddItemPage";
import WishlistPage from "../pages/WishlistPage";
import ReportsPage from "../pages/ReportsPage";
import InventoryMapPage from "../pages/InventoryMapPage";
import SearchResultsPage from "../pages/SearchResultsPage";
import NotificationsPage from "../pages/NotificationsPage";
import { ALL_ITEMS } from "../data/items";

function AppRouter() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authPage, setAuthPage] = useState<"signIn" | "createAccount">("signIn");
  const [currentPage, setCurrentPage] = useState<PageName>("dashboard");
  const [selectedItem, setSelectedItem] = useState<Item>(ALL_ITEMS[0]);
  const [searchQuery, setSearchQuery] = useState("");

  function selectItem(item: Item) {
    setSelectedItem(item);
    setCurrentPage("itemDetail");
  }

  function signOut() {
    setCurrentUser(null);
    setCurrentPage("dashboard");
  }

  function nav(page: PageName, query?: string) {
    if (page === "itemDetail") { selectItem(ALL_ITEMS[0]); return; }
    if (page === "searchResults" && query !== undefined) setSearchQuery(query);
    setCurrentPage(page);
  }

  const commonProps = {
    onSignOut: signOut,
    onNavigate: nav,
    onSettings: () => setCurrentPage("settings"),
  };

  if (!currentUser) {
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
        onSuccess={setCurrentUser}
        onCreateAccount={() => setAuthPage("createAccount")}
      />
    );
  }

  switch (currentPage) {
    case "settings":
      return <SettingsPage onSignOut={signOut} onNavigate={(p) => nav(p)} />;
    case "allItems":
      return <AllItemsPage userId={currentUser.id} onBack={() => setCurrentPage("dashboard")} onSignOut={signOut} onItemSelect={selectItem} onSettings={() => setCurrentPage("settings")} onNavigate={nav} />;
    case "itemDetail":
      return <ItemDetailPage key={String(selectedItem.id)} itemId={selectedItem.id} item={selectedItem} userId={currentUser.id} onBack={() => setCurrentPage("allItems")} onDeleted={() => setCurrentPage("allItems")} onSignOut={signOut} onItemSelect={selectItem} onSettings={() => setCurrentPage("settings")} />;
    case "rooms":
      return <RoomsPage {...commonProps} />;
    case "categories":
      return <CategoriesPage {...commonProps} />;
    case "addItem":
      return <AddItemPage userId={currentUser.id} {...commonProps} />;
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
          userId={currentUser.id}
          displayName={currentUser.displayName}
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
