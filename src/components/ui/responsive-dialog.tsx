import * as React from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';

interface ResponsiveDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

/**
 * Renders a Dialog on desktop and a bottom-sheet Drawer on mobile.
 * Drop-in replacement for Dialog — same API shape.
 */
function ResponsiveDialog({ children, ...props }: ResponsiveDialogProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return <Drawer {...props}>{children}</Drawer>;
  }

  return <Dialog {...props}>{children}</Dialog>;
}

function ResponsiveDialogTrigger({ children, ...props }: React.ComponentPropsWithoutRef<typeof DialogTrigger>) {
  const isMobile = useIsMobile();
  return isMobile ? <DrawerTrigger {...props}>{children}</DrawerTrigger> : <DialogTrigger {...props}>{children}</DialogTrigger>;
}

function ResponsiveDialogContent({ children, className, ...props }: React.ComponentPropsWithoutRef<typeof DialogContent>) {
  const isMobile = useIsMobile();
  if (isMobile) {
    return <DrawerContent className={className}>{children}</DrawerContent>;
  }
  return <DialogContent className={className} {...props}>{children}</DialogContent>;
}

function ResponsiveDialogHeader({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  const isMobile = useIsMobile();
  return isMobile ? <DrawerHeader {...props}>{children}</DrawerHeader> : <DialogHeader {...props}>{children}</DialogHeader>;
}

function ResponsiveDialogTitle({ children, ...props }: React.ComponentPropsWithoutRef<typeof DialogTitle>) {
  const isMobile = useIsMobile();
  if (isMobile) {
    return <DrawerTitle {...props}>{children}</DrawerTitle>;
  }
  return <DialogTitle {...props}>{children}</DialogTitle>;
}

function ResponsiveDialogDescription({ children, ...props }: React.ComponentPropsWithoutRef<typeof DialogDescription>) {
  const isMobile = useIsMobile();
  if (isMobile) {
    return <DrawerDescription {...props}>{children}</DrawerDescription>;
  }
  return <DialogDescription {...props}>{children}</DialogDescription>;
}

function ResponsiveDialogClose({ children, ...props }: React.ComponentPropsWithoutRef<typeof DialogClose>) {
  const isMobile = useIsMobile();
  return isMobile ? <DrawerClose {...props}>{children}</DrawerClose> : <DialogClose {...props}>{children}</DialogClose>;
}

function ResponsiveDialogFooter({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  const isMobile = useIsMobile();
  if (isMobile) {
    return <DrawerFooter {...props}>{children}</DrawerFooter>;
  }
  return <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2" {...props}>{children}</div>;
}

export {
  ResponsiveDialog,
  ResponsiveDialogTrigger,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogDescription,
  ResponsiveDialogClose,
  ResponsiveDialogFooter,
};
