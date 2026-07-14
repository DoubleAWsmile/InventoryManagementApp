import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ThemeProvider } from "../theme/ThemeContext";
import { NotificationsProvider } from "../context/NotificationsContext";
import { InventoryPrefsProvider } from "../context/InventoryPrefsContext";
import type { Item, PageName } from "../types";
import { getCategories, getCurrentUser, getDashboard, getRooms, logout, type User } from "../services/api";
import { ApiError, UNAUTHORIZED_EVENT } from "../services/apiClient";
import { queryKeys } from "../queries/keys";
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
  const queryClient = useQueryClient();
	const sessionQuery = useQuery({
		queryKey: queryKeys.session,
		queryFn: async () => {
			try { return await getCurrentUser(); }
			catch (error) { if (error instanceof ApiError && error.status === 401) return null; throw error; }
		},
		staleTime: 10 * 60 * 1000,
	});
	const currentUser = sessionQuery.data ?? null;
	useQuery({ queryKey: queryKeys.categories, queryFn: getCategories, enabled: !!currentUser });
	useQuery({ queryKey: queryKeys.rooms, queryFn: getRooms, enabled: !!currentUser });
	useQuery({ queryKey: queryKeys.dashboard, queryFn: getDashboard, enabled: !!currentUser });
  const [authPage, setAuthPage] = useState<"signIn" | "createAccount">("signIn");
  const [currentPage, setCurrentPage] = useState<PageName>("dashboard");
  const [selectedItem, setSelectedItem] = useState<Item>(ALL_ITEMS[0]);
  const [searchQuery, setSearchQuery] = useState("");

  function selectItem(item: Item) {
    setSelectedItem(item);
    setCurrentPage("itemDetail");
  }

  useEffect(() => {
		const handleUnauthorized = () => queryClient.setQueryData(queryKeys.session, null);
		window.addEventListener(UNAUTHORIZED_EVENT, handleUnauthorized);
		return () => window.removeEventListener(UNAUTHORIZED_EVENT, handleUnauthorized);
	}, [queryClient]);

  async function signOut() {
		try { await logout(); } finally {
			queryClient.clear();
			queryClient.setQueryData(queryKeys.session, null);
		}
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

  if (sessionQuery.isPending) {
	return <div className="min-h-screen bg-background flex items-center justify-center text-sm text-muted-foreground">Loading session…</div>;
  }

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
        onSuccess={(user: User) => queryClient.setQueryData(queryKeys.session, user)}
        onCreateAccount={() => setAuthPage("createAccount")}
      />
    );
  }

  switch (currentPage) {
    case "settings":
      return <SettingsPage userEmail={currentUser.email} onSignOut={signOut} onNavigate={(p) => nav(p)} />;
    case "allItems":
      return <AllItemsPage onBack={() => setCurrentPage("dashboard")} onSignOut={signOut} onItemSelect={selectItem} onSettings={() => setCurrentPage("settings")} onNavigate={nav} />;
    case "itemDetail":
      return <ItemDetailPage key={String(selectedItem.id)} itemId={selectedItem.id} item={selectedItem} onBack={() => setCurrentPage("allItems")} onDeleted={() => setCurrentPage("allItems")} onSignOut={signOut} onItemSelect={selectItem} onSettings={() => setCurrentPage("settings")} />;
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
