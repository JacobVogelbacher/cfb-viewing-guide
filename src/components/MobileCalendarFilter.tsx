"use client";

import { useState } from "react";
import { ListFilter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export function MobileCalendarFilter({
  hideEspnPlus,
  onHideEspnPlusChange,
}: {
  hideEspnPlus: boolean;
  onHideEspnPlusChange: (value: boolean) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Filters"
              className={cn(
                "cursor-pointer border-zinc-200 text-zinc-700 hover:border-zinc-300 hover:bg-zinc-100 hover:text-zinc-900",
                (open || hideEspnPlus) &&
                  "border-emerald-300 bg-emerald-50 text-emerald-800 hover:border-emerald-400 hover:bg-emerald-100 hover:text-emerald-900",
              )}
            />
          }
        >
          <ListFilter aria-hidden />
        </PopoverTrigger>
        <PopoverContent
          align="start"
          side="bottom"
          sideOffset={6}
          className="w-auto min-w-[11.5rem] p-2"
        >
          <label className="flex cursor-pointer select-none items-center gap-2.5 rounded-md px-2 py-2 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50">
            <Checkbox
              checked={hideEspnPlus}
              onCheckedChange={(checked) =>
                onHideEspnPlusChange(checked === true)
              }
            />
            <span>Hide ESPN+</span>
          </label>
        </PopoverContent>
      </Popover>
    </div>
  );
}
