import ItemFormPage from "./ItemFormPage";
import type { ApiItem } from "../services/api";
import type { Item, PageName } from "../types";

interface EditItemPageProps {
  item: Item;
  onSaved: (item: ApiItem) => void;
  onCancel: () => void;
  onSignOut: () => void;
  onNavigate: (page: PageName) => void;
  onSettings?: () => void;
}

export default function EditItemPage(props: EditItemPageProps) {
  return <ItemFormPage mode="edit" {...props} />;
}
