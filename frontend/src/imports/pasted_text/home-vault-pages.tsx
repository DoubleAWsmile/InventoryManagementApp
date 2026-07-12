Implement the main navigation tabs as real working pages/components in the HomeVault React/TypeScript app, except for Inventory Map for now.

The current navigation has:

Inventory Map
Rooms
Categories
Add New Item
Wishlist
Reports

Do not implement Inventory Map yet. Keep it visible in the navigation, but make it show a “Coming soon” state if clicked.

Goal:
When the user clicks each navigation tab/card, the app should switch to the correct page while keeping the same HomeVault design system, top navigation, theme system, spacing, cards, rounded corners, and visual polish.

Pages to implement:

Rooms Page
Create a page where users can manage spaces in their home.

Include:

Page title: “Rooms”
Subtitle: “Organize your inventory by location.”
Room cards for Bedroom, Office, Garage, Kitchen, Living Room, Closet, Utility Room, Hall Closet
Each room card should show:
room name
item count
estimated total value
recently added item
small icon
Include buttons:
Add Room
View Items
Edit Room
Add a “Rooms Overview” stats section showing total rooms, most used room, rooms with missing info, and total items across rooms
Clicking a room can show a selected-room detail panel or placeholder list of items in that room
Categories Page
Create a page where users can organize inventory by item type.

Include:

Page title: “Categories”
Subtitle: “Group items by type and purpose.”
Category cards for Electronics, Tools, Clothing, Documents, Cables, Safety, Household Supplies, Furniture
Each category card should show:
category name
item count
estimated value
top room/location
small icon
Include buttons:
Add Category
Manage Tags
View Items
Add a small chart or visual breakdown placeholder showing category distribution
Add a category list/table section for easier scanning
Add New Item Page
Create a polished item creation form.

Include:

Page title: “Add New Item”
Subtitle: “Log a new item into your home inventory.”
Large form card with fields:
Item Name
Category dropdown
Room / Location dropdown
Quantity
Estimated Value
Purchase Date
Condition dropdown
Brand
Model
Serial Number
Description
Notes
Add a photo/image upload placeholder area
Add tag input area with example tags:
Warranty
Expensive
Frequently Used
Travel
Include buttons:
Save Item
Save and Add Another
Cancel
Include a side preview card that updates visually with placeholder item data
No real backend needed yet; use local mock state or placeholder behavior
Wishlist Page
Create a page for items the user wants or needs to buy.

Include:

Page title: “Wishlist”
Subtitle: “Track items you need, want, or plan to replace.”
Wishlist item cards or table rows with:
item name
priority: Low / Medium / High
category
desired room/location
estimated cost
reason/notes
status: Needed, Wanted, Planned, Purchased
Example wishlist items:
Label Maker — Medium — Office — $35 — Needed for organizing storage bins
Storage Bins — High — Garage — $60 — Needed for garage organization
Backup Hard Drive — High — Office — $120 — Needed for important files
Extra Phone Charger — Low — Bedroom — $20 — Convenience item
Include filters:
Priority
Category
Status
Include buttons:
Add Wishlist Item
Mark Purchased
Move to Inventory
Include a small stats section:
Total Wishlist Items
Estimated Cost
High Priority Items
Purchased This Month
Reports Page
Create a dashboard-style reports and insights page.

Include:

Page title: “Reports”
Subtitle: “Understand your inventory, value, and organization trends.”
Summary stat cards:
Total Items
Total Estimated Value
Most Valuable Category
Items Missing Info
Recently Added
Include analytics sections:
Items by Room bar chart placeholder
Items by Category chart placeholder
Inventory Value by Category chart placeholder
Recent Activity list
Missing Information report
Include report cards:
“Inventory Summary”
“Value Breakdown”
“Missing Info”
“Warranty & Receipts”
Include buttons:
Export Report
Download CSV
View Full Analytics
Charts can use realistic placeholder data for now

Inventory Map behavior:

Keep the Inventory Map tab visible
When clicked, show a simple Coming Soon page
Page title: “Inventory Map”
Subtitle: “A visual map of where your items are located is coming soon.”
Include a placeholder illustration/card
Do not build map functionality yet

Navigation behavior:

Clicking each tab should actually change the displayed page
The active tab should visually highlight
Add New Item should remain visually prominent as the primary action
Keep navigation consistent across dashboard and all new pages
Keep the Settings button working if it already exists

Code structure:
Use separate page components:
src/pages/RoomsPage.tsx
src/pages/CategoriesPage.tsx
src/pages/AddItemPage.tsx
src/pages/WishlistPage.tsx
src/pages/ReportsPage.tsx
src/pages/InventoryMapPage.tsx

Use reusable components where useful:
src/components/PageHeader.tsx
src/components/StatCard.tsx
src/components/RoomCard.tsx
src/components/CategoryCard.tsx
src/components/ItemForm.tsx
src/components/WishlistItemCard.tsx
src/components/ReportCard.tsx

Implementation requirements:

Use React TypeScript functional components
Use local state for navigation for now
Do not add backend/database logic yet
Use mock placeholder data arrays inside each page or a separate mock data file
Make sure the code builds successfully
Keep the theme system working across every new page
Replace hardcoded colors with existing CSS variables/theme tokens wherever possible
Keep the UI production-ready and consistent with the current HomeVault design