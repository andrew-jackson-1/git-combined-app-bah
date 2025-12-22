"use client";

import React, { useState } from "react";
import { DataExplorer } from "@/components/DataExplorer";
import { Button } from "@/components/ui/button";

export default function Home() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <Button onClick={() => setIsOpen(true)}>Open Cascade Explorer</Button>
      <DataExplorer open={isOpen} onOpenChange={setIsOpen} />
    </div>
  );
}

