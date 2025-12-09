export function Footer() {
  return (
    <footer className="h-[48px] border-t bg-background flex items-center">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Veblika. All rights reserved.
          </div>
          
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <a href="/privacy" className="hover:text-foreground transition-colors">
              Privacy Policy
            </a>
            <a href="/terms" className="hover:text-foreground transition-colors">
              Terms of Service
            </a>
            <a href="/support" className="hover:text-foreground transition-colors">
              Support
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
