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
    const sheenId = `${gradientId}-sheen`;
    const mouseX = useRef(50);
    const mouseY = useRef(50);

    const animationProgress = useRef(0);

    const animationTarget = useRef(0);

    const animationFrame = useRef<number | null>(null);

    const [, forceRender] = useState(0);

    const isDisabled = disabled || isLoading;

    // The shape is drawn in real pixels (a pill with radius = height / 2), so it never
    // gets stretched on wide buttons; on hover its edges bulge towards the cursor.
    const nodeRef = useRef<HTMLElement | null>(null);
    const [box, setBox] = useState({ width: 0, height: 0 });

    useEffect(() => {
      const node = nodeRef.current;
      if (!node) return;
      const measure = () => setBox({ width: node.offsetWidth, height: node.offsetHeight });
      measure();
      const observer = new ResizeObserver(measure);
      observer.observe(node);
      return () => observer.disconnect();
    }, []);

    const setRefs = useCallback(
      (node: HTMLElement | null) => {
        nodeRef.current = node;
        if (typeof ref === "function") ref(node as HTMLButtonElement | null);
        else if (ref) ref.current = node as HTMLButtonElement | null;
      },
      [ref]
    );

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

    const { width, height } = box;
    const pillRadius = height / 2;
    const bulge = scaleAmount * height * 0.15;
    const influenceRadius = height * 1.6;
    const cursorX = (mouseX.current / 100) * width;

    const deform = (x: number, y: number) => {
      let influence = Math.max(0, Math.min(1, 1 - Math.abs(x - cursorX) / influenceRadius));
      influence = influence * influence * (3 - 2 * influence);
      const edgeFactor = pillRadius ? Math.abs(y - pillRadius) / pillRadius : 0;
      const offset = influence * edgeFactor * bulge * animationProgress.current;
      return { x, y: y < pillRadius ? y - offset : y + offset };
    };

    const pillPoints = (): Array<{ x: number; y: number }> => {
      if (!width || !height) return [];
      const left = pillRadius;
      const right = Math.max(pillRadius, width - pillRadius);
      const EDGE = 48;
      const ARC = 24;
      const result: Array<{ x: number; y: number }> = [];
      for (let i = 0; i <= EDGE; i++) result.push({ x: left + ((right - left) * i) / EDGE, y: 0 });
      for (let i = 1; i < ARC; i++) {
        const angle = -Math.PI / 2 + (Math.PI * i) / ARC;
        result.push({ x: right + pillRadius * Math.cos(angle), y: pillRadius + pillRadius * Math.sin(angle) });
      }
      for (let i = 0; i <= EDGE; i++) result.push({ x: right - ((right - left) * i) / EDGE, y: height });
      for (let i = 1; i < ARC; i++) {
        const angle = Math.PI / 2 + (Math.PI * i) / ARC;
        result.push({ x: left + pillRadius * Math.cos(angle), y: pillRadius + pillRadius * Math.sin(angle) });
      }
      return result.map((point) => deform(point.x, point.y));
    };

    const points = pillPoints();
    const buttonPath = points.length
      ? points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`).join(" ") + " Z"
      : "";

    const buttonBackground = (
      <svg
        className="
          absolute
          inset-0
          w-full
          h-full
          pointer-events-none
          overflow-visible
          drop-shadow-[0_8px_18px_rgba(79,70,229,0.35)]
        "
        viewBox={`0 0 ${width || 1} ${height || 1}`}
        aria-hidden="true"
      >
        <defs>
          <radialGradient
            id={gradientId}
            gradientUnits="userSpaceOnUse"
            cx={cursorX}
            cy={(mouseY.current / 100) * height}
            r={glowRadius}
          >
            {gradientStops.map((stop) => (
              <stop key={stop.offset} offset={stop.offset} stopColor={stop.color} />
            ))}
          </radialGradient>
          <linearGradient id={sheenId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.38" />
            <stop offset="45%" stopColor="#ffffff" stopOpacity="0.08" />
            <stop offset="55%" stopColor="#000000" stopOpacity="0" />
            <stop offset="100%" stopColor="#1e1b4b" stopOpacity="0.22" />
          </linearGradient>
        </defs>

        {buttonPath && <path d={buttonPath} fill={`url(#${gradientId})`} />}
        {buttonPath && <path d={buttonPath} fill={`url(#${sheenId})`} />}
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
      ref: setRefs,

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
