import * as React from "react";
import { Textarea, TextareaProps } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const AutoGrowTextarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    const internalRef = React.useRef<HTMLTextAreaElement>(null);
    React.useImperativeHandle(ref, () => internalRef.current!);

    const handleInput = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      const textarea = event.currentTarget;
      textarea.style.height = "auto";
      textarea.style.height = `${textarea.scrollHeight}px`;
      if (props.onChange) {
        props.onChange(event);
      }
    };

    React.useEffect(() => {
      const textarea = internalRef.current;
      if (textarea) {
        textarea.style.height = "auto";
        textarea.style.height = `${textarea.scrollHeight}px`;
      }
    }, [props.value]);

    return (
      <Textarea
        ref={internalRef}
        className={cn("resize-none overflow-hidden", className)}
        {...props}
        onChange={handleInput}
      />
    );
  }
);

AutoGrowTextarea.displayName = "AutoGrowTextarea";

export { AutoGrowTextarea };