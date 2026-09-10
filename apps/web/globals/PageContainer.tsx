interface PageContainerProps {
    children: React.ReactNode;
    className?: string;
}

export default function PageContainer({
    children,
    className = "",
}: PageContainerProps) {
    return (
        <main
            className={`mx-auto w-full max-w-7xl px-6 ${className}`}
        >
            {children}
        </main>
    );
}