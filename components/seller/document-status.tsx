/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { uploadSellerDocumentAction } from "@/lib/actions/seller-documents";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export function DocumentStatusList({ documents, sellerId }: { documents: any[], sellerId: string }) {
  const router = useRouter();
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);

  const missingDocs = [
    { type: "cnic_front", label: "CNIC Front" },
    { type: "cnic_back", label: "CNIC Back" }
  ].filter(req => !documents.find(d => d.doc_type === req.type));

  const handleReupload = async (e: React.ChangeEvent<HTMLInputElement>, docType: string) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    
    setUploadingDoc(docType);
    try {
      const formData = new FormData();
      formData.append("sellerId", sellerId);
      formData.append("docType", docType);
      formData.append("file", file);
      
      const res = await uploadSellerDocumentAction(formData);
      if (!res.success) {
        alert("Upload failed: " + res.error);
      } else {
        router.refresh();
      }
    } catch (err: any) {
      alert("Upload error: " + err.message);
    } finally {
      setUploadingDoc(null);
    }
  };

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    approved: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800",
  };

  return (
    <div className="space-y-4 text-left">
      <h3 className="font-bold text-lg">Your Documents</h3>
      
      <div className="space-y-3">
        {documents.map(doc => (
          <div key={doc.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-card border rounded-xl gap-4">
            <div>
              <p className="font-bold capitalize">{doc.doc_type.replace(/_/g, " ")}</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className={statusColors[doc.status] || ""}>
                  {doc.status}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {new Date(doc.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
            
            <div className="flex gap-2">
              {doc.url && (
                <a 
                  href={doc.url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className={buttonVariants({ variant: "outline", size: "sm" })}
                >
                  View
                </a>
              )}
              
              {(doc.status === "rejected" || doc.status === "pending") && (
                <div className="relative">
                  <Button variant="secondary" size="sm" disabled={uploadingDoc === doc.doc_type}>
                    {uploadingDoc === doc.doc_type ? <Loader2 className="w-4 h-4 animate-spin" /> : "Replace"}
                  </Button>
                  <input
                    type="file"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                    accept="image/jpeg, image/png, image/webp, application/pdf"
                    onChange={(e) => handleReupload(e, doc.doc_type)}
                    disabled={uploadingDoc === doc.doc_type}
                  />
                </div>
              )}
            </div>
          </div>
        ))}

        {missingDocs.length > 0 && (
          <div className="mt-6 p-4 border border-dashed rounded-xl bg-destructive/5 space-y-3">
            <h4 className="font-bold text-destructive">Missing Required Documents</h4>
            {missingDocs.map(missing => (
              <div key={missing.type} className="flex items-center justify-between">
                <span className="text-sm">{missing.label}</span>
                <div className="relative">
                  <Button variant="outline" size="sm" disabled={uploadingDoc === missing.type}>
                    {uploadingDoc === missing.type ? <Loader2 className="w-4 h-4 animate-spin" /> : "Upload"}
                  </Button>
                  <input
                    type="file"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                    accept="image/jpeg, image/png, image/webp, application/pdf"
                    onChange={(e) => handleReupload(e, missing.type)}
                    disabled={uploadingDoc === missing.type}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
