import { useRef } from "react";
import { useRoomDocuments, useUploadDocument, useDeleteDocument, getDocumentSignedUrl, type DealRoomDocument } from "@/hooks/useDealRooms";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, Download, Trash2, FileText } from "lucide-react";
import { toast } from "sonner";

export function DocumentsList({ roomId }: { roomId: string }) {
  const { data = [] } = useRoomDocuments(roomId);
  const upload = useUploadDocument(roomId);
  const del = useDeleteDocument(roomId);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDownload = async (path: string) => {
    try {
      const url = await getDocumentSignedUrl(path);
      window.open(url, "_blank");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erro ao baixar arquivo";
      toast.error(msg);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <input ref={inputRef} type="file" className="hidden" onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) upload.mutate(f);
        }} />
        <Button size="sm" onClick={() => inputRef.current?.click()} disabled={upload.isPending}>
          <Upload className="h-4 w-4" />Upload
        </Button>
      </div>
      <div className="space-y-2">
        {data.map((d: DealRoomDocument) => (
          <Card key={d.id} className="border shadow-none">
            <CardContent className="p-3 flex items-center gap-3">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{d.title}</p>
                <p className="text-xs text-muted-foreground">{((d.file_size ?? 0) / 1024).toFixed(1)} KB · {d.uploaded_by_side === "seller" ? "Vendedor" : "Comprador"}</p>
              </div>
              <Button variant="ghost" size="icon-sm" onClick={() => handleDownload(d.file_path)}><Download className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon-sm" onClick={() => del.mutate({ id: d.id, file_path: d.file_path })}><Trash2 className="h-4 w-4" /></Button>
            </CardContent>
          </Card>
        ))}
        {!data.length && <p className="text-sm text-muted-foreground italic text-center py-6">Nenhum documento</p>}
      </div>
    </div>
  );
}
