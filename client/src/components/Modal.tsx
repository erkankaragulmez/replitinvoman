import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}

export function Modal({ isOpen, onClose, title, children, className }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className={cn(
          "bg-card rounded-lg shadow-xl border border-border w-full max-w-md max-h-[90vh] overflow-y-auto",
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-4 sm:p-6 border-b border-border">
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-accent rounded-md transition-colors touch-target"
            data-testid="modal-close"
          >
            <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
          </button>
        </div>
        <div className="p-4 sm:p-6">
          {children}
        </div>
      </div>
    </div>
  );
}
