import * as React from 'react';
import { Loader2 } from 'lucide-react';
import { Button, type ButtonProps } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface LoadingButtonProps extends ButtonProps {
  isLoading?: boolean;
  loadingText?: string;
}

const LoadingButton = React.forwardRef<HTMLButtonElement, LoadingButtonProps>(
  ({ isLoading = false, loadingText, children, disabled, className, ...props }, ref) => {
    return (
      <Button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(isLoading && 'cursor-wait', className)}
        {...props}
      >
        {isLoading && (
          <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
        )}
        {isLoading ? (loadingText || children) : children}
      </Button>
    );
  }
);
LoadingButton.displayName = 'LoadingButton';

export { LoadingButton };
