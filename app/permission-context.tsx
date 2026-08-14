"use client";

import { createContext, useContext } from "react";
import { FULL_PERMISSION, type ModulePermission } from "./access-control";

const PermissionContext = createContext<ModulePermission>(FULL_PERMISSION);

export function PermissionProvider({ permission, children }: { permission: ModulePermission; children: React.ReactNode }) {
  return <PermissionContext.Provider value={permission}>{children}</PermissionContext.Provider>;
}

export function useCurrentPermission() {
  return useContext(PermissionContext);
}
