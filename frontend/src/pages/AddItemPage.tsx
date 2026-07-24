import ItemFormPage from "./ItemFormPage";
import type { PageName } from "../types";

export interface AddItemPageProps {
  onSignOut: () => void;
  onNavigate: (page: PageName, value?: string) => void;
  onSettings?: () => void;
}

export default function AddItemPage(props: AddItemPageProps) {
  return (
    <ItemFormPage
      mode="create"
      {...props}
      onSaved={() => props.onNavigate("allItems")}
      onCancel={() => props.onNavigate("allItems")}
    />
  );
}
