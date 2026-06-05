"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { POLICIES, type PolicyId } from "@/lib/policies";

type PolicyDialogProps = {
  policyId: PolicyId | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function PolicyDialog({
  policyId,
  open,
  onOpenChange,
}: PolicyDialogProps) {
  const policy = POLICIES.find((item) => item.id === policyId);

  if (!policy) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{policy.title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-5 text-sm leading-relaxed text-foreground/90">
          {policy.sections.map((section, index) => (
            <section key={index}>
              {section.heading ? (
                <h3 className="mb-2 font-semibold text-foreground">
                  {section.heading}
                </h3>
              ) : null}
              {section.paragraphs.map((paragraph, paragraphIndex) => (
                <p
                  key={paragraphIndex}
                  className={paragraphIndex > 0 ? "mt-2" : undefined}
                >
                  {paragraph}
                </p>
              ))}
            </section>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
