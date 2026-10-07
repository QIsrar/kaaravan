"use client";

import * as React from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface CommandItemRegistration {
  id: string;
  groupId?: string;
  value: string;
  keywords: string;
  onSelect?: () => void;
}

interface CommandContextValue {
  search: string;
  setSearch: (v: string) => void;
  activeId: string | null;
  setActiveId: (id: string | null) => void;
  registerItem: (item: CommandItemRegistration) => () => void;
  visibleItemIds: string[];
  selectItem: (id: string) => void;
  isItemVisible: (id: string) => boolean;
  isGroupVisible: (groupId: string) => boolean;
  inputRef: React.RefObject<HTMLInputElement | null>;
}

const CommandContext = React.createContext<CommandContextValue | null>(null);

function useCommand() {
  const ctx = React.useContext(CommandContext);
  if (!ctx) {
    throw new Error("Command compound components must be used within <Command>");
  }
  return ctx;
}

interface CommandProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function Command({ className, children, ...props }: CommandProps) {
  const [search, setSearch] = React.useState("");
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [items, setItems] = React.useState<Map<string, CommandItemRegistration>>(new Map());
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  const registerItem = React.useCallback((item: CommandItemRegistration) => {
    setItems((prev) => {
      const next = new Map(prev);
      next.set(item.id, item);
      return next;
    });
    return () => {
      setItems((prev) => {
        const next = new Map(prev);
        next.delete(item.id);
        return next;
      });
    };
  }, []);

  const normalizedSearch = search.trim().toLowerCase();

  const visibleItemIds = React.useMemo(() => {
    const list: string[] = [];
    items.forEach((item, id) => {
      if (!normalizedSearch) {
        list.push(id);
      } else {
        const match =
          item.value.toLowerCase().includes(normalizedSearch) ||
          item.keywords.toLowerCase().includes(normalizedSearch);
        if (match) {
          list.push(id);
        }
      }
    });
    return list;
  }, [items, normalizedSearch]);

  const visibleGroups = React.useMemo(() => {
    const groupSet = new Set<string>();
    items.forEach((item, id) => {
      if (item.groupId && visibleItemIds.includes(id)) {
        groupSet.add(item.groupId);
      }
    });
    return groupSet;
  }, [items, visibleItemIds]);

  const selectItem = React.useCallback(
    (id: string) => {
      const item = items.get(id);
      if (item?.onSelect) {
        item.onSelect();
      }
    },
    [items]
  );

  const isItemVisible = React.useCallback(
    (id: string) => visibleItemIds.includes(id),
    [visibleItemIds]
  );

  const isGroupVisible = React.useCallback(
    (groupId: string) => visibleGroups.has(groupId),
    [visibleGroups]
  );

  // Sync activeId when visibleItemIds changes
  React.useEffect(() => {
    if (visibleItemIds.length > 0) {
      if (!activeId || !visibleItemIds.includes(activeId)) {
        setActiveId(visibleItemIds[0]);
      }
    } else {
      setActiveId(null);
    }
  }, [visibleItemIds, activeId]);

  return (
    <CommandContext.Provider
      value={{
        search,
        setSearch,
        activeId,
        setActiveId,
        registerItem,
        visibleItemIds,
        selectItem,
        isItemVisible,
        isGroupVisible,
        inputRef,
      }}
    >
      <div
        data-slot="command"
        className={cn(
          "flex flex-col w-full overflow-hidden rounded-2xl bg-transparent text-popover-foreground outline-none",
          className
        )}
        {...props}
      >
        {children}
      </div>
    </CommandContext.Provider>
  );
}

interface CommandInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  onValueChange?: (val: string) => void;
}

export function CommandInput({
  className,
  placeholder,
  value,
  onValueChange,
  ...props
}: CommandInputProps) {
  const { search, setSearch, activeId, setActiveId, visibleItemIds, selectItem, inputRef } =
    useCommand();

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (visibleItemIds.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      const currentIndex = activeId ? visibleItemIds.indexOf(activeId) : -1;
      const nextIndex = currentIndex < visibleItemIds.length - 1 ? currentIndex + 1 : 0;
      setActiveId(visibleItemIds[nextIndex]);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const currentIndex = activeId ? visibleItemIds.indexOf(activeId) : -1;
      const prevIndex = currentIndex > 0 ? currentIndex - 1 : visibleItemIds.length - 1;
      setActiveId(visibleItemIds[prevIndex]);
    } else if (e.key === "Enter" && activeId) {
      e.preventDefault();
      selectItem(activeId);
    }
  };

  return (
    <div className="relative flex items-center border-b border-border/80 px-3 py-2">
      <Search className="w-4 h-4 shrink-0 text-muted-foreground me-2 pointer-events-none" />
      <input
        ref={inputRef}
        type="text"
        dir="auto"
        value={value !== undefined ? value : search}
        onChange={(e) => {
          const val = e.target.value;
          setSearch(val);
          onValueChange?.(val);
        }}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={cn(
          "w-full bg-transparent text-xs text-foreground placeholder:text-muted-foreground outline-none border-none p-0 focus:ring-0",
          className
        )}
        {...props}
      />
    </div>
  );
}

interface CommandListProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function CommandList({ className, children, ...props }: CommandListProps) {
  return (
    <div
      role="listbox"
      className={cn("max-h-64 overflow-y-auto p-1.5 space-y-1 outline-none", className)}
      {...props}
    >
      {children}
    </div>
  );
}

interface CommandEmptyProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function CommandEmpty({ className, children, ...props }: CommandEmptyProps) {
  const { visibleItemIds } = useCommand();

  if (visibleItemIds.length > 0) return null;

  return (
    <div
      className={cn("py-6 text-center text-xs text-muted-foreground", className)}
      {...props}
    >
      {children}
    </div>
  );
}

const GroupContext = React.createContext<string | undefined>(undefined);

interface CommandGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  heading?: React.ReactNode;
  children: React.ReactNode;
}

export function CommandGroup({ heading, className, children, ...props }: CommandGroupProps) {
  const groupId = React.useId();
  const { isGroupVisible, search } = useCommand();

  const isVisible = !search.trim() || isGroupVisible(groupId);

  if (!isVisible) return null;

  return (
    <GroupContext.Provider value={groupId}>
      <div className={cn("space-y-0.5", className)} {...props}>
        {heading && (
          <div className="px-2.5 pt-2 pb-1 text-[11px] font-bold text-muted-foreground uppercase tracking-wider text-start">
            {heading}
          </div>
        )}
        <div>{children}</div>
      </div>
    </GroupContext.Provider>
  );
}

interface CommandItemProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
  keywords?: string[];
  disabled?: boolean;
  onSelect?: () => void;
  children: React.ReactNode;
}

export function CommandItem({
  value,
  keywords = [],
  disabled = false,
  onSelect,
  className,
  children,
  ...props
}: CommandItemProps) {
  const id = React.useId();
  const groupId = React.useContext(GroupContext);
  const { registerItem, activeId, setActiveId, isItemVisible } = useCommand();

  const keywordsStr = React.useMemo(() => {
    return [value, ...keywords].join(" ");
  }, [value, keywords]);

  React.useEffect(() => {
    if (disabled) return;
    return registerItem({
      id,
      groupId,
      value,
      keywords: keywordsStr,
      onSelect,
    });
  }, [id, groupId, value, keywordsStr, onSelect, disabled, registerItem]);

  const isVisible = isItemVisible(id);
  if (!isVisible) return null;

  const isActive = activeId === id;

  return (
    <div
      role="option"
      aria-selected={isActive}
      data-highlighted={isActive}
      onClick={() => {
        if (!disabled && onSelect) {
          onSelect();
        }
      }}
      onMouseEnter={() => {
        if (!disabled) {
          setActiveId(id);
        }
      }}
      className={cn(
        "relative flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs cursor-pointer select-none transition-colors outline-none",
        isActive
          ? "bg-primary/10 text-primary font-medium"
          : "text-foreground hover:bg-muted/60",
        disabled && "pointer-events-none opacity-50",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CommandSeparator({ className }: { className?: string }) {
  return <div className={cn("h-px bg-border/60 my-1 -mx-1", className)} />;
}
