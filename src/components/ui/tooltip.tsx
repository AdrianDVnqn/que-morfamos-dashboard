"use client"

import * as React from "react"
import * as TooltipPrimitive from "@radix-ui/react-tooltip"
import * as PopoverPrimitive from "@radix-ui/react-popover"

import { cn } from "@/lib/utils"

/**
 * Context to share the trigger mode (hover/click) with subcomponents.
 */
interface TooltipContextValue {
  triggerMode: "hover" | "click"
}

const TooltipContext = React.createContext<TooltipContextValue>({
  triggerMode: "hover",
})

/**
 * TooltipProvider – wraps Radix Tooltip.Provider.
 * Allows configuring the default delay for all tooltips (only affects hover mode).
 */
function TooltipProvider({
  delayDuration = 0,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Provider>) {
  return (
    <TooltipPrimitive.Provider
      data-slot="tooltip-provider"
      delayDuration={delayDuration}
      {...props}
    />
  )
}

/**
 * Tooltip – a wrapper that automatically switches between Tooltip (hover) and Popover (click).
 */
interface TooltipProps extends React.ComponentProps<typeof TooltipPrimitive.Root> {
  /**
   * Interaction mode for the tooltip.
   * "hover" – default Radix behaviour (show on hover/focus).
   * "click" – uses Radix Popover for robust click-to-toggle behavior.
   */
  trigger?: "hover" | "click"
}

function Tooltip({ trigger = "hover", ...props }: TooltipProps) {
  if (trigger === "click") {
    return (
      <TooltipContext.Provider value={{ triggerMode: "click" }}>
        <PopoverPrimitive.Root {...props}>
          {props.children}
        </PopoverPrimitive.Root>
      </TooltipContext.Provider>
    )
  }

  return (
    <TooltipProvider>
      <TooltipContext.Provider value={{ triggerMode: "hover" }}>
        <TooltipPrimitive.Root data-slot="tooltip" {...props} />
      </TooltipContext.Provider>
    </TooltipProvider>
  )
}

/**
 * TooltipTrigger – Renders either a TooltipTrigger or a PopoverTrigger based on context.
 */
function TooltipTrigger({
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Trigger>) {
  const { triggerMode } = React.useContext(TooltipContext)

  if (triggerMode === "click") {
    return <PopoverPrimitive.Trigger data-slot="tooltip-trigger" {...props} />
  }

  return <TooltipPrimitive.Trigger data-slot="tooltip-trigger" {...props} />
}

/**
 * TooltipContent – Renders either a TooltipContent or a PopoverContent.
 * Styles are shared to maintain visual consistency.
 */
function TooltipContent({
  className,
  sideOffset = 4,
  children,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Content>) {
  const { triggerMode } = React.useContext(TooltipContext)

  const commonClass = cn(
    "bg-foreground text-background animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 w-fit rounded-md px-3 py-1.5 text-xs text-balance select-none",
    className
  )

  if (triggerMode === "click") {
    return (
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          data-slot="tooltip-content"
          align="center"
          sideOffset={sideOffset}
          className={commonClass}
          {...props}
        >
          {children}
          <PopoverPrimitive.Arrow className="bg-foreground fill-foreground z-50 size-2.5 translate-y-[calc(-50%_-_2px)] rotate-45 rounded-[2px]" />
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    )
  }

  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        data-slot="tooltip-content"
        sideOffset={sideOffset}
        className={cn(commonClass, "origin-(--radix-tooltip-content-transform-origin)")}
        {...props}
      >
        {children}
        <TooltipPrimitive.Arrow className="bg-foreground fill-foreground z-50 size-2.5 translate-y-[calc(-50%_-_2px)] rotate-45 rounded-[2px]" />
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  )
}

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }
