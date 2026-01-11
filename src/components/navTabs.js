import {
  ArrowPathIcon,
  ArchiveBoxIcon,
  BookOpenIcon,
  CalendarDaysIcon,
  Cog6ToothIcon,
} from "@heroicons/react/24/outline";

export const NAV_TABS = [
  {
    id: "catalog",
    label: "Catalog",
    path: "/catalog",
    Icon: BookOpenIcon,
  },
  {
    id: "random",
    label: "Random",
    path: "/random",
    Icon: ArrowPathIcon,
  },
  {
    id: "log",
    label: "Schedule",
    path: "/log",
    Icon: CalendarDaysIcon,
  },
  {
    id: "freezer",
    label: "Storage",
    path: "/freezer",
    Icon: ArchiveBoxIcon,
  },
  {
    id: "settings",
    label: "Settings",
    path: "/settings",
    Icon: Cog6ToothIcon,
  },
];
