import React, { useEffect, useState, forwardRef, useRef, useCallback } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "@/utils/cn";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none",
  {
    variants: {
      variant: {
        default: "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md hover:shadow-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-300",
        destructive: "bg-gradient-to-r from-red-500 to-red-600 text-white shadow-md hover:shadow-lg",
        outline: "bg-transparent backdrop-blur-sm hover:bg-white/10 dark:hover:bg-white/5",
        secondary: "bg-gray-100/80 dark:bg-gray-800/80 backdrop-blur-sm text-gray-900 dark:text-white hover:bg-gray-200/90",
        ghost: "text-gray-900 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-100 dark:hover:bg-gray-700 dark:hover:text-gray-100",
        link: "text-blue-600 hover:underline",
      },
      size: {
        default: "h-10 py-2 px-4 text-sm",
        sm: "h-9 px-3 text-sm",
        lg: "h-11 px-8 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  isLoading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, isLoading = false, disabled, children, ...props }, ref) => {
    const isDisabled = disabled || isLoading;

    if (asChild) {
      const child = React.Children.only(children) as React.ReactElement<{
        className?: string;
      }>;
      return React.cloneElement(child, {
        ...props,
        ...child.props,
        className: cn(
          buttonVariants({ variant, size, className }),
          isDisabled && "opacity-50 pointer-events-none",
          child.props.className
        ),
        "aria-busy": isLoading || undefined,
        "aria-disabled": isDisabled || undefined,
        ...(ref ? { ref } : {}),
      } as React.Attributes & Record<string, unknown>);
    }

    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={isDisabled}
        aria-busy={isLoading || undefined}
        {...props}
      >
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";

export interface InteractiveButtonProps extends ButtonProps {
  scaleAmount?: number;
  glowRadius?: string;
  transitionDelay?: number;
  gradientStops?: Array<{ offset: string; color: string }>;
  contentClassName?: string;
}

const DEFAULT_GRADIENT_STOPS: Array<{ offset: string; color: string }> = [
  { offset: "10%", color: "#3b82f6" },
  { offset: "35%", color: "#6366f1" },
  { offset: "70%", color: "#8b5cf6" },
  { offset: "100%", color: "#2563eb" },
];

const InteractiveButton = forwardRef<HTMLButtonElement, InteractiveButtonProps>(
  (
    {
      className,
      style,
      variant,
      size,
      scaleAmount = 1,
      glowRadius = "100%",
      children,
      asChild = false,
      disabled,
      isLoading,
      transitionDelay = 0,
      gradientStops = DEFAULT_GRADIENT_STOPS,
      contentClassName,
      ...props
    },
    ref
  ) => {
    const gradientId = React.useId();
    const mouseX = useRef(50);
    const mouseY = useRef(50);

    const animationProgress = useRef(0);

    const animationTarget = useRef(0);

    const animationFrame = useRef<number | null>(null);

    const [, forceRender] = useState(0);

    const isDisabled = disabled || isLoading;

    const CENTER_X = 50;
    const CENTER_Y = 50;

    const HALF_WIDTH = 50;
    const HALF_HEIGHT = 32;

    const SQUIRCLE_POWER = 4;

    const strength = scaleAmount * 20;

    const radius = 25;

    const startAnimation = useCallback(() => {
      if (animationFrame.current !== null) {
        return;
      }

      const animate = () => {
        const current = animationProgress.current;
        const target = animationTarget.current;

        const next =
          current + (target - current) * 0.14;

        animationProgress.current = next;

        forceRender((value) => value + 1);

        if (Math.abs(target - next) < 0.001) {
          animationProgress.current = target;
          animationFrame.current = null;

          forceRender((value) => value + 1);

          return;
        }

        animationFrame.current =
          requestAnimationFrame(animate);
      };

      animationFrame.current =
        requestAnimationFrame(animate);
    }, []);

    useEffect(() => {
      return () => {
        if (animationFrame.current !== null) {
          cancelAnimationFrame(animationFrame.current);
        }
      };
    }, []);

    const handleMouseMove = (
      e: React.MouseEvent<HTMLElement>
    ) => {
      const rect =
        e.currentTarget.getBoundingClientRect();

      const x =
        ((e.clientX - rect.left) / rect.width) * 100;

      const y =
        ((e.clientY - rect.top) / rect.height) * 100;

      mouseX.current = x;
      mouseY.current = y;

      animationTarget.current = 1;

      startAnimation();
    };

    const handleMouseLeave = () => {
      animationTarget.current = 0;

      mouseX.current = 50;
      mouseY.current = 50;

      startAnimation();
    };

    const superellipsePoint = (t: number) => {
      const cos = Math.cos(t);
      const sin = Math.sin(t);

      const signX = Math.sign(cos);
      const signY = Math.sign(sin);

      const absCos = Math.abs(cos);
      const absSin = Math.abs(sin);

      const x =
        CENTER_X +
        signX *
          Math.pow(
            absCos,
            2 / SQUIRCLE_POWER
          ) *
          HALF_WIDTH;

      let y =
        CENTER_Y +
        signY *
          Math.pow(
            absSin,
            2 / SQUIRCLE_POWER
          ) *
          HALF_HEIGHT;

      const distance =
        Math.abs(x - mouseX.current);

      let influence =
        1 - distance / radius;

      influence = Math.max(
        0,
        Math.min(1, influence)
      );

      influence =
        influence *
        influence *
        (3 - 2 * influence);

      const verticalFactor =
        Math.pow(absSin, 0.5);

      const deformation =
        influence *
        verticalFactor *
        strength *
        animationProgress.current;

      if (y < CENTER_Y) {
        y -= deformation;
      } else {
        y += deformation;
      }

      return {
        x,
        y,
      };
    };

    const points = Array.from(
      { length: 121 },
      (_, index) => {
        const t =
          (index / 120) *
          Math.PI *
          2;

        return superellipsePoint(t);
      }
    );

    const buttonPath =
      points
        .map(
          (point, index) =>
            `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`
        )
        .join(" ") + " Z";

    const buttonBackground = (
      <svg
        className="
          absolute
          inset-0
          w-full
          h-full
          pointer-events-none
          overflow-visible
        "
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <defs>
          <radialGradient
            id={gradientId}
            gradientUnits="userSpaceOnUse"
            cx={`${mouseX.current}`}
            cy={`${mouseY.current}`}
            r={glowRadius}
          >
            {gradientStops.map((stop) => (
              <stop key={stop.offset} offset={stop.offset} stopColor={stop.color} />
            ))}
          </radialGradient>
        </defs>

        <path d={buttonPath} fill={`url(#${gradientId})`} />
      </svg>
    );

    const buttonStyle: React.CSSProperties = {
      position: "relative",

      background: "transparent",

      transition: "none",

      transitionDelay: `${transitionDelay}s`,

      ...style,
    };

    const wrapperClassName = cn(
      buttonVariants({ variant, size }),

      "!bg-none",
      "!bg-transparent",
      "!shadow-none",
      "hover:!shadow-none",

      "relative inline-flex",
      "items-center justify-center",
      "font-medium",
      "overflow-visible",
      "isolate",

      "focus-visible:outline-none",
      "focus-visible:ring-2",
      "focus-visible:ring-blue-500",
      "focus-visible:ring-offset-2",

      isDisabled && "opacity-50 pointer-events-none",

      className
    );

    const content = (
      <span
        className={cn(
          "relative z-20 flex h-full w-full items-center justify-center gap-2",
          contentClassName ?? "text-white"
        )}
      >
        {isLoading && (
          <Loader2
            className="mr-2 h-4 w-4 animate-spin"
            aria-hidden="true"
          />
        )}

        {children}
      </span>
    );

    const sharedProps = {
      ref,

      onMouseMove: handleMouseMove,

      onMouseLeave: handleMouseLeave,

      className: wrapperClassName,

      style: buttonStyle,

      role: "button",

      ...(isDisabled && {
        "aria-disabled": true,
      }),
    };

    if (asChild) {
      const child =
        React.Children.only(
          children
        ) as React.ReactElement<{
          className?: string;
          style?: React.CSSProperties;
          children?: React.ReactNode;
        }>;

      return React.cloneElement(child, {
        ...sharedProps,
        ...props,

        className: cn(
          child.props.className,
          sharedProps.className
        ),

        style: {
          ...sharedProps.style,
          ...child.props.style,
        },

        children: (
          <>
            {buttonBackground}

            <span
              className="
                relative
                z-20
                flex
                h-full
                w-full
                items-center
                justify-center
                gap-2
              "
            >
              {isLoading && (
                <Loader2
                  className="mr-2 h-4 w-4 animate-spin"
                  aria-hidden="true"
                />
              )}

              {child.props.children}
            </span>
          </>
        ),
      });
    }

    return (
      <button
        {...sharedProps}
        {...props}
        disabled={isDisabled}
      >
        {buttonBackground}

        {content}
      </button>
    );
  }
);

InteractiveButton.displayName =
  "InteractiveButton";

export { Button, InteractiveButton };
