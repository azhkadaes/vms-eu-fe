import { useState } from "react";
import { Camera, ScanLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/** Numeric/alphanumeric booking-code entry dialog. */
export function CodeInputDialog({
  open,
  onOpenChange,
  title,
  description,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  title: string;
  description?: string;
  onSubmit: (code: string) => Promise<{ ok: boolean; message: string }>;
}) {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      setError("Please enter a booking code.");
      return;
    }
    setLoading(true);
    setError(null);
    const result = await onSubmit(code.trim());
    setLoading(false);
    if (result.ok) {
      setCode("");
      onOpenChange(false);
    } else {
      setError(result.message);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) {
          setCode("");
          setError(null);
        }
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="booking-code">Booking Code</Label>
            <Input
              id="booking-code"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="e.g. BK100000"
              className="h-12 font-mono text-lg tracking-widest"
              autoFocus
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="h-11 sm:h-10">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="h-11 sm:h-10">
              {loading ? "Verifying..." : "Submit"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** Mock QR scan dialog (no real camera library — keeps deps light). */
export function QrScanDialog({
  open,
  onOpenChange,
  title,
  onSubmit,
  simulatedCodes = [],
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  title: string;
  onSubmit: (code: string) => Promise<{ ok: boolean; message: string }>;
  simulatedCodes?: string[];
}) {
  const [manual, setManual] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (code: string) => {
    setLoading(true);
    setError(null);
    const result = await onSubmit(code);
    setLoading(false);
    if (result.ok) {
      setManual("");
      onOpenChange(false);
    } else {
      setError(result.message);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) {
          setManual("");
          setError(null);
        }
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">{title}</DialogTitle>
          <DialogDescription>
            Point the camera at a visitor's QR code, or enter the code manually.
          </DialogDescription>
        </DialogHeader>

        <div className="relative aspect-square overflow-hidden rounded-xl border border-dashed border-primary/40 bg-muted/40">
          <div className="absolute inset-0 grid place-items-center text-muted-foreground">
            <div className="flex flex-col items-center gap-2">
              <Camera className="h-10 w-10" />
              <p className="text-sm">Camera preview area</p>
            </div>
          </div>
          <div className="absolute inset-6 rounded-lg border-2 border-primary/60" />
          <ScanLine className="absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 animate-pulse text-primary" />
        </div>

        {simulatedCodes.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Simulate scan
            </p>
            <div className="flex flex-wrap gap-2">
              {simulatedCodes.slice(0, 3).map((c) => (
                <Button
                  key={c}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => submit(c)}
                  disabled={loading}
                >
                  {c}
                </Button>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="qr-manual">Or enter code manually</Label>
          <div className="flex gap-2">
            <Input
              id="qr-manual"
              value={manual}
              onChange={(e) => setManual(e.target.value.toUpperCase())}
              placeholder="BK100000"
              className="h-11 font-mono"
            />
            <Button
              type="button"
              onClick={() => manual && submit(manual)}
              disabled={loading || !manual}
              className="h-11"
            >
              Verify
            </Button>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
      </DialogContent>
    </Dialog>
  );
}
