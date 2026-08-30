import menuItems from "@/components/MenuItems";

// Single source of truth for deriving the RBAC module matrix from the central
// MenuItems.jsx nav definition. Both the role-permissions page and its data
// hook must derive the exact same category/module list, or their merge logic
// (filling in defaults for modules missing from a stored permission doc) can
// silently disagree — so this function must never be duplicated.
export function getSystemModulesFromMenu() {
  const rawMenu = menuItems();
  const categories = [];

  rawMenu.forEach((cat) => {
    if (cat.children && cat.children.length > 0) {
      const items = cat.children.map((child) => ({
        key: child.key || child.path.split("/").pop(),
        name: child.title,
        description: child.description || `Manage ${child.title} access and features`,
      }));

      categories.push({
        category: cat.title,
        items,
      });
    } else if (cat.key !== "home" && cat.path !== "/dashboard/home") {
      categories.push({
        category: cat.title,
        items: [
          {
            key: cat.key || cat.path.split("/").pop(),
            name: cat.title,
            description: cat.description || `Manage ${cat.title} access and features`,
          },
        ],
      });
    }
  });

  return categories;
}

export default getSystemModulesFromMenu;
