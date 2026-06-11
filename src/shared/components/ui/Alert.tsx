import * as React from 'react';
import { cn } from '@/shared/lib/utils';

const Alert = React.forwardRef<
	HTMLDivElement,
	React.HTMLAttributes<HTMLDivElement> & {
		variant?: 'default' | 'destructive' | 'warning' | 'success';
	}
>(({ className, variant = 'default', ...props }, ref) => {
	const variantStyles = {
		default: 'border-gray-200 bg-white text-gray-900',
		destructive: 'border-red-200 bg-red-50 text-red-900',
		warning: 'border-yellow-200 bg-yellow-50 text-yellow-900',
		success: 'border-green-200 bg-green-50 text-green-900',
	};

	return (
		<div
			ref={ref}
			role="alert"
			className={cn(
				'relative w-full rounded-lg border px-4 py-3',
				variantStyles[variant],
				className,
			)}
			{...props}
		/>
	);
});
Alert.displayName = 'Alert';

const AlertTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
	({ className, ...props }, ref) => (
		<h5
			ref={ref}
			className={cn('mb-1 font-medium leading-none tracking-tight', className)}
			{...props}
		/>
	),
);
AlertTitle.displayName = 'AlertTitle';

const AlertDescription = React.forwardRef<
	HTMLParagraphElement,
	React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
	<div ref={ref} className={cn('text-sm', className)} {...props} />
));
AlertDescription.displayName = 'AlertDescription';

export { Alert, AlertTitle, AlertDescription };
