import { lazy, Suspense, useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ThemeProvider } from "../theme/ThemeContext";
import { NotificationsProvider } from "../context/NotificationsContext";
import { InventoryPrefsProvider } from "../context/InventoryPrefsContext";
import type { Item, PageName } from "../types";
import {
  getCategories,
  getCurrentUser,
  getDashboard,
  getRooms,
  logout,
  type ApiItem,
  type User,
} from "../services/api";
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
import EditItemPage from "../pages/EditItemPage";
import WishlistPage from "../pages/WishlistPage";
import ReportsPage from "../pages/ReportsPage";
import InventoryMapPage from "../pages/InventoryMapPage";
import SearchResultsPage from "../pages/SearchResultsPage";
import NotificationsPage from "../pages/NotificationsPage";
import CollectionDetailPage from "../pages/CollectionDetailPage";
import { ALL_ITEMS, toDisplayItem } from "../data/items";
import { appRuntime } from "../config/runtime";
import { downloadRouteAction } from "./webRoutes";

const DownloadPage = lazy(() => import("../pages/DownloadPage"));

function AppRouter() {
  const queryClient = useQueryClient();
  const sessionQuery = useQuery({
    queryKey: queryKeys.session,
    queryFn: async () => {
      try {
        return await getCurrentUser();
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) return null;
        throw error;
      }
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
  const [selectedCollectionId, setSelectedCollectionId] = useState("");

  function selectItem(item: Item) {
    setSelectedItem(item);
    setCurrentPage("itemDetail");
  }

  useEffect(() => {
    const handleUnauthorized = () => {
      queryClient.removeQueries({ predicate: (query) => query.queryKey[0] !== "session" });
      queryClient.setQueryData(queryKeys.session, null);
    };
    window.addEventListener(UNAUTHORIZED_EVENT, handleUnauthorized);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, handleUnauthorized);
  }, [queryClient]);

  async function signOut() {
    try {
      await logout();
    } finally {
      queryClient.clear();
      queryClient.setQueryData(queryKeys.session, null);
    }
    setCurrentPage("dashboard");
  }

  function nav(page: PageName, query?: string) {
    if (page === "itemDetail") {
      const cached = queryClient.getQueryData<ApiItem[]>(["search-items"]);
      const match = cached?.find((item) => item.id === query);
      selectItem(match ? toDisplayItem(match) : ALL_ITEMS[0]);
      return;
    }
    if (page === "searchResults" && query !== undefined) setSearchQuery(query);
    if ((page === "categoryDetail" || page === "roomDetail") && query) setSelectedCollectionId(query);
    setCurrentPage(page);
  }

  const commonProps = {
    onSignOut: signOut,
    onNavigate: nav,
    onSettings: () => setCurrentPage("settings"),
  };

  if (sessionQuery.isPending) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-sm text-muted-foreground">
        Loading session…
      </div>
    );
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
        onSuccess={(user: User) => {
          queryClient.removeQueries({ predicate: (query) => query.queryKey[0] !== "session" });
          queryClient.setQueryData(queryKeys.session, user);
        }}
        onCreateAccount={() => setAuthPage("createAccount")}
      />
    );
  }

  switch (currentPage) {
    case "settings":
      return <SettingsPage userEmail={currentUser.email} onSignOut={signOut} onNavigate={nav} />;
    case "allItems":
      return (
        <AllItemsPage
          onBack={() => setCurrentPage("dashboard")}
          onSignOut={signOut}
          onItemSelect={selectItem}
          onSettings={() => setCurrentPage("settings")}
          onNavigate={nav}
        />
      );
    case "itemDetail":
      return (
        <ItemDetailPage
          key={String(selectedItem.id)}
          itemId={selectedItem.id}
          item={selectedItem}
          onBack={() => setCurrentPage("allItems")}
          onDeleted={() => setCurrentPage("allItems")}
          onEdit={() => setCurrentPage("editItem")}
          onSignOut={signOut}
          onItemSelect={selectItem}
          onSettings={() => setCurrentPage("settings")}
          onNavigate={nav}
        />
      );
    case "editItem":
      return (
        <EditItemPage
          item={selectedItem}
          onSaved={(updated) => {
            setSelectedItem(toDisplayItem(updated));
            setCurrentPage("itemDetail");
          }}
          onCancel={() => setCurrentPage("itemDetail")}
          {...commonProps}
        />
      );
    case "rooms":
      return <RoomsPage {...commonProps} />;
    case "categories":
      return <CategoriesPage {...commonProps} />;
    case "categoryDetail":
      return (
        <CollectionDetailPage
          kind="category"
          collectionId={selectedCollectionId}
          onItemSelect={selectItem}
          {...commonProps}
        />
      );
    case "roomDetail":
      return (
        <CollectionDetailPage
          kind="room"
          collectionId={selectedCollectionId}
          onItemSelect={selectItem}
          {...commonProps}
        />
      );
    case "addItem":
      return <AddItemPage {...commonProps} />;
    case "wishlist":
      return <WishlistPage {...commonProps} />;
    case "reports":
      return <ReportsPage {...commonProps} />;
    case "map":
      return <InventoryMapPage {...commonProps} />;
    case "searchResults":
      return (
        <SearchResultsPage
          key={searchQuery}
          {...commonProps}
          initialQuery={searchQuery}
          onItemSelect={selectItem}
        />
      );
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
  const webRoute =
    typeof window === "undefined" ? "ignore" : downloadRouteAction(window.location.pathname, appRuntime);
  if (webRoute === "render") {
    return (
      <Suspense
        fallback={
          <div className="min-h-screen bg-background flex items-center justify-center text-sm text-muted-foreground">
            Loading…
          </div>
        }
      >
        <DownloadPage />
      </Suspense>
    );
  }
  if (webRoute === "redirect") {
    window.history.replaceState(null, "", "/");
  }

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
