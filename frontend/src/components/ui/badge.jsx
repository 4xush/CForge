import * as React from "react"

const badgeVariants = {
    primary: "bg-indigo-100 text-indigo-800",
    secondary: "bg-gray-100 text-gray-800",
    success: "bg-green-100 text-green-800",
    warning: "bg-yellow-100 text-yellow-800",
    danger: "bg-red-100 text-red-800",
    outline: "border border-current bg-transparent"
}

const Badge = React.forwardRef(({
    className = "",
    variant = "primary",
    children,
    ...props
}, ref) => {
    return (
        <div
            ref={ref}
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-sm font-medium ${badgeVariants[variant]} ${className}`}
            {...props}
        >
            {children}
        </div>
    )
})

Badge.displayName = "Badge"

export { Badge, badgeVariants }