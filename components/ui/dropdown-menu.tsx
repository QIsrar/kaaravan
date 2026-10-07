import * as React from "react"
import { Menu as MenuPrimitive } from "@base-ui/react/menu"
import { cn } from "@/lib/utils"

function DropdownMenu(props: React.ComponentProps<typeof MenuPrimitive.Root>) {
  return <MenuPrimitive.Root data-slot="dropdown-menu" {...props} />
}

function DropdownMenuTrigger(props: React.ComponentProps<typeof MenuPrimitive.Trigger>) {
  return <MenuPrimitive.Trigger data-slot="dropdown-menu-trigger" {...props} />
}

function DropdownMenuContent({
  className,
  align = "end",
  sideOffset = 8,
  ...props
}: React.ComponentProps<typeof MenuPrimitive.Popup> & {
  align?: "start" | "end" | "center"
  sideOffset?: number
}) {
  return (
    <MenuPrimitive.Portal>
      <MenuPrimitive.Positioner side="bottom" align={align} sideOffset={sideOffset} className="z-50 outline-none">
        <MenuPrimitive.Popup
          data-slot="dropdown-menu-content"
          className={cn(
            "glass-dropdown min-w-56 rounded-2xl border-[1.5px] border-border bg-popover/70 backdrop-blur-xl backdrop-saturate-150 p-1.5 text-popover-foreground",
            "data-[starting-style]:opacity-0 data-[starting-style]:scale-95 data-[ending-style]:opacity-0 data-[ending-style]:scale-95 transition-all duration-150 ease-out",
            className
          )}
          {...props}
        />
      </MenuPrimitive.Positioner>
    </MenuPrimitive.Portal>
  )
}

function DropdownMenuItem({ className, ...props }: React.ComponentProps<typeof MenuPrimitive.Item>) {
  return (
    <MenuPrimitive.Item
      data-slot="dropdown-menu-item"
      className={cn(
        "flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-foreground cursor-pointer outline-none transition-colors data-[highlighted]:bg-primary/10 data-[highlighted]:text-primary hover:bg-primary/10 hover:text-primary active:bg-primary/15",
        className
      )}
      {...props}
    />
  )
}

function DropdownMenuLinkItem({ className, ...props }: React.ComponentProps<typeof MenuPrimitive.LinkItem>) {
  return (
    <MenuPrimitive.LinkItem
      data-slot="dropdown-menu-link-item"
      className={cn(
        "flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-foreground cursor-pointer outline-none transition-colors data-[highlighted]:bg-primary/10 data-[highlighted]:text-primary hover:bg-primary/10 hover:text-primary active:bg-primary/15",
        className
      )}
      {...props}
    />
  )
}

function DropdownMenuLabel({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dropdown-menu-label"
      className={cn("px-3 py-2", className)}
      {...props}
    />
  )
}

function DropdownMenuSeparator({ className, ...props }: React.ComponentProps<typeof MenuPrimitive.Separator>) {
  return (
    <MenuPrimitive.Separator
      data-slot="dropdown-menu-separator"
      className={cn("my-1.5 h-px bg-border", className)}
      {...props}
    />
  )
}

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLinkItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
}
