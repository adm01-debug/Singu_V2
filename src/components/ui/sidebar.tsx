/**
 * Sidebar — re-export agregador.
 *
 * Implementação dividida em módulos focados (<400 linhas cada):
 * - sidebar/sidebar-context.tsx — Provider, hook, constantes
 * - sidebar/sidebar-layout.tsx   — Sidebar, Trigger, Rail, Inset, Input, Header, Footer, Separator, Content
 * - sidebar/sidebar-group.tsx    — Group, GroupLabel, GroupAction, GroupContent
 * - sidebar/sidebar-menu.tsx     — Menu, MenuItem, MenuButton, MenuAction, MenuBadge, MenuSkeleton, MenuSub*
 *
 * API pública 100% compatível com a versão monolítica anterior.
 */
export {
  SidebarProvider,
  useSidebar,
} from "./sidebar/sidebar-context";

export {
  Sidebar,
  SidebarTrigger,
  SidebarRail,
  SidebarInset,
  SidebarInput,
  SidebarHeader,
  SidebarFooter,
  SidebarSeparator,
  SidebarContent,
} from "./sidebar/sidebar-layout";

export {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupAction,
  SidebarGroupContent,
} from "./sidebar/sidebar-group";

export {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from "./sidebar/sidebar-menu";
