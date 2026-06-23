import type * as React from 'react'
import type { VariantProps } from 'class-variance-authority'
import type { LucideProps } from 'lucide-react'

import { cva } from 'class-variance-authority'
import { LoaderCircleIcon, LoaderPinwheelIcon } from 'lucide-react'

import { Spinner } from '@workspace/ui/components/spinner'
import { cn } from '@workspace/ui/lib/utils'

const spinnerVariants = cva('', {
  variants: {
    size: {
      default: 'size-6',
      xs: 'size-4',
      sm: 'size-5',
      lg: 'size-8',
      xl: 'size-10',
    },
  },
  defaultVariants: {
    size: 'default',
  },
})

type SpinnerIconProps = VariantProps<typeof spinnerVariants> & Omit<LucideProps, 'size'>
type SpinnerDivProps = VariantProps<typeof spinnerVariants> & React.ComponentProps<'div'>
type SpinnerSvgProps = VariantProps<typeof spinnerVariants> & React.ComponentProps<'svg'>

const LoaderSpinner = ({ size, className, ...props }: SpinnerSvgProps) => {
  return <Spinner data-slot="loader-spinner" className={cn(spinnerVariants({ size, className }))} {...props} />
}

const CircleSpinner = ({ size, className, ...props }: SpinnerIconProps) => {
  return (
    <LoaderCircleIcon
      data-slot="circle-spinner"
      className={cn('animate-spin', spinnerVariants({ size, className }))}
      role="status"
      aria-label="Loading"
      {...props}
    />
  )
}

const PinwheelSpinner = ({ size, className, ...props }: SpinnerIconProps) => {
  return (
    <LoaderPinwheelIcon
      data-slot="pinwheel-spinner"
      className={cn('animate-spin', spinnerVariants({ size, className }))}
      role="status"
      aria-label="Loading"
      {...props}
    />
  )
}

const CircleSpinner2 = ({ size, className, ...props }: SpinnerDivProps) => {
  const borderWidth = {
    xs: 'border-[2px]',
    sm: 'border-[2px]',
    default: 'border-[2px]',
    lg: 'border-[3px]',
    xl: 'border-[3px]',
  } satisfies Record<NonNullable<SpinnerDivProps['size']>, string>

  const border = size ? borderWidth[size] : borderWidth.default

  return (
    <div
      data-slot="circle-spinner2"
      className={cn(
        'animate-spin rounded-full border-current/10 border-t-current border-b-current',
        border,
        spinnerVariants({
          size,
          className,
        }),
      )}
      role="status"
      aria-label="Loading"
      {...props}
    />
  )
}

// https://www.shadcnui-blocks.com/components/spinner
const SwirlingSpinner = ({ size, className, ...props }: SpinnerSvgProps) => {
  return (
    <>
      <style>
        {`@keyframes spin {
            to {
              transform: rotate(360deg);
            }
          }
        
          @keyframes spin2 {
            0% {
              stroke-dasharray: 1, 800;
              stroke-dashoffset: 0;
            }
            50% {
              stroke-dasharray: 400, 400;
              stroke-dashoffset: -200px;
            }
            100% {
              stroke-dasharray: 800, 1;
              stroke-dashoffset: -800px;
            }
          }
        
          .spin2 {
            transform-origin: center;
            animation: spin2 1.5s ease-in-out infinite,
              spin 2s linear infinite;
            animation-direction: alternate;
          }`}
      </style>
      <svg
        data-slot="swirling-spinner"
        viewBox="0 0 500 500"
        className={cn(spinnerVariants({ size, className }))}
        role="status"
        aria-label="Loading"
        xmlns="http://www.w3.org/2000/svg"
        {...props}
      >
        <circle
          className="spin2"
          cx="250"
          cy="250"
          fill="none"
          r="200"
          strokeWidth="50"
          strokeDasharray="700 1400"
          strokeLinecap="round"
          stroke="currentColor"
        />
      </svg>
    </>
  )
}

// https://www.kibo-ui.com/components/spinner
const EllipsisSpinner = ({ size, className, ...props }: SpinnerSvgProps) => {
  return (
    <svg
      data-slot="ellipsis-spinner"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      className={cn(spinnerVariants({ size, className }))}
      role="status"
      aria-label="Loading"
      {...props}
    >
      <circle cx="4" cy="12" fill="currentColor" r="2">
        <animate
          attributeName="cy"
          begin="0;ellipsis3.end+0.25s"
          calcMode="spline"
          dur="0.6s"
          id="ellipsis1"
          keySplines=".33,.66,.66,1;.33,0,.66,.33"
          values="12;6;12"
        />
      </circle>
      <circle cx="12" cy="12" fill="currentColor" r="2">
        <animate
          attributeName="cy"
          begin="ellipsis1.begin+0.1s"
          calcMode="spline"
          dur="0.6s"
          keySplines=".33,.66,.66,1;.33,0,.66,.33"
          values="12;6;12"
        />
      </circle>
      <circle cx="20" cy="12" fill="currentColor" r="2">
        <animate
          attributeName="cy"
          begin="ellipsis1.begin+0.2s"
          calcMode="spline"
          dur="0.6s"
          id="ellipsis3"
          keySplines=".33,.66,.66,1;.33,0,.66,.33"
          values="12;6;12"
        />
      </circle>
    </svg>
  )
}

const EllipsisSpinner2 = ({ size, className, ...props }: SpinnerDivProps) => {
  const sizeConfig = {
    xs: { size: 'gap-0.75 [&>div]:size-0.75' },
    sm: { size: 'gap-0.75 [&>div]:size-0.75' },
    default: { size: 'gap-1 [&>div]:size-1' },
    lg: { size: 'gap-1.5 [&>div]:size-1.25' },
    xl: { size: 'gap-1.5 [&>div]:size-1.75' },
  } satisfies Record<NonNullable<SpinnerDivProps['size']>, { size: string }>

  const config = size ? sizeConfig[size] : sizeConfig.default

  return (
    <div
      data-slot="ellipsis-spinner2"
      className={cn('flex items-center', config.size, spinnerVariants({ size, className }))}
      role="status"
      aria-label="Loading"
      {...props}
    >
      <style>{`
        .bounce-dot {
          animation: bounce 1s ease-in-out infinite;
        }
        .bounce-dot:nth-child(1) {
          animation-delay: 0.2s;
        }
        .bounce-dot:nth-child(2) {
          animation-delay: 0.4s;
        }
        .bounce-dot:nth-child(3) {
          animation-delay: 0.6s;
        }

        @keyframes bounce {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-100%);
          }
        }
      `}</style>

      <div className={'bounce-dot rounded-full bg-current'} />
      <div className={'bounce-dot rounded-full bg-current'} />
      <div className={'bounce-dot rounded-full bg-current'} />
    </div>
  )
}

// https://www.kibo-ui.com/components/spinner
const RingSpinner = ({ size, className, ...props }: SpinnerSvgProps) => (
  <svg
    data-slot="ring-spinner"
    stroke="currentColor"
    viewBox="0 0 44 44"
    xmlns="http://www.w3.org/2000/svg"
    className={cn(spinnerVariants({ size, className }))}
    role="status"
    aria-label="Loading"
    {...props}
  >
    <g fill="none" fillRule="evenodd" strokeWidth="2">
      <circle cx="22" cy="22" r="1">
        <animate
          attributeName="r"
          begin="0s"
          calcMode="spline"
          dur="1.8s"
          keySplines="0.165, 0.84, 0.44, 1"
          keyTimes="0; 1"
          repeatCount="indefinite"
          values="1; 20"
        />
        <animate
          attributeName="stroke-opacity"
          begin="0s"
          calcMode="spline"
          dur="1.8s"
          keySplines="0.3, 0.61, 0.355, 1"
          keyTimes="0; 1"
          repeatCount="indefinite"
          values="1; 0"
        />
      </circle>
      <circle cx="22" cy="22" r="1">
        <animate
          attributeName="r"
          begin="-0.9s"
          calcMode="spline"
          dur="1.8s"
          keySplines="0.165, 0.84, 0.44, 1"
          keyTimes="0; 1"
          repeatCount="indefinite"
          values="1; 20"
        />
        <animate
          attributeName="stroke-opacity"
          begin="-0.9s"
          calcMode="spline"
          dur="1.8s"
          keySplines="0.3, 0.61, 0.355, 1"
          keyTimes="0; 1"
          repeatCount="indefinite"
          values="1; 0"
        />
      </circle>
    </g>
  </svg>
)

// https://www.kibo-ui.com/components/spinner
const BarsSpinner = ({ size, className, ...props }: SpinnerSvgProps) => (
  <svg
    data-slot="bars-spinner"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    className={cn(spinnerVariants({ size, className }))}
    role="status"
    aria-label="Loading"
    {...props}
  >
    <style>{`
      .spinner-bar {
        animation: spinner-bars-animation .8s linear infinite;
        animation-delay: -.8s;
      }
      .spinner-bars-2 {
        animation-delay: -.65s;
      }
      .spinner-bars-3 {
        animation-delay: -0.5s;
      }
      @keyframes spinner-bars-animation {
        0% {
          y: 1px;
          height: 22px;
        }
        93.75% {
          y: 5px;
          height: 14px;
          opacity: 0.2;
        }
      }
    `}</style>
    <rect className="spinner-bar" fill="currentColor" height="22" width="6" x="1" y="1" />
    <rect className="spinner-bar spinner-bars-2" fill="currentColor" height="22" width="6" x="9" y="1" />
    <rect className="spinner-bar spinner-bars-3" fill="currentColor" height="22" width="6" x="17" y="1" />
  </svg>
)

// https://www.kibo-ui.com/components/spinner
const InfiniteSpinner = ({ size, className, ...props }: SpinnerSvgProps) => (
  <svg
    data-slot="infinite-spinner"
    preserveAspectRatio="xMidYMid"
    viewBox="0 0 100 100"
    xmlns="http://www.w3.org/2000/svg"
    className={cn(spinnerVariants({ size, className }))}
    role="status"
    aria-label="Loading"
    {...props}
  >
    <path
      d="M24.3 30C11.4 30 5 43.3 5 50s6.4 20 19.3 20c19.3 0 32.1-40 51.4-40 C88.6 30 95 43.3 95 50s-6.4 20-19.3 20C56.4 70 43.6 30 24.3 30z"
      fill="none"
      stroke="currentColor"
      strokeDasharray="205.271142578125 51.317785644531256"
      strokeLinecap="round"
      strokeWidth="10"
      style={{
        transform: 'scale(0.8)',
        transformOrigin: '50px 50px',
      }}
    >
      <animate
        attributeName="stroke-dashoffset"
        dur="2s"
        keyTimes="0;1"
        repeatCount="indefinite"
        values="0;256.58892822265625"
      />
    </path>
  </svg>
)

export {
  LoaderSpinner,
  CircleSpinner,
  PinwheelSpinner,
  CircleSpinner2,
  SwirlingSpinner,
  EllipsisSpinner,
  EllipsisSpinner2,
  RingSpinner,
  BarsSpinner,
  InfiniteSpinner,
  spinnerVariants,
}
