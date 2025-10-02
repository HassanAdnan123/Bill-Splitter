"use client";

import { useBillContext } from "@/context/BillContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function PerHeadItemsPage() {
  const { items, setItems, totals } = useBillContext();

  const addItem = () => {
    setItems([...items, { id: Date.now().toString(), name: "", price: 0 }]);
  };
  const updateItem = (id: string, field: "name" | "price", value: string | number) => {
    setItems(items.map((it) => (it.id === id ? { ...it, [field]: value } : it)));
  };
  const removeItem = (id: string) => {
    if (items.length > 1) setItems(items.filter((i) => i.id !== id));
  };

  const hasUserInput = items.some((i) => i.name.trim() || i.price > 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-md mx-auto">
        <Card className="animate-in fade-in-50 duration-300">
          <CardHeader>
            <CardTitle>Add Items</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {items.map((item) => (
              <div key={item.id} className="flex gap-2 items-end">
                <div className="flex-1">
                  <Label htmlFor={`item-name-${item.id}`}>Item Name</Label>
                  <Input
                    id={`item-name-${item.id}`}
                    placeholder="e.g., Tea"
                    value={item.name}
                    onChange={(e) => updateItem(item.id, "name", e.target.value)}
                  />
                </div>
                <div className="w-24">
                  <Label htmlFor={`item-price-${item.id}`}>Price</Label>
                  <Input
                    id={`item-price-${item.id}`}
                    type="number"
                    placeholder="0"
                    value={item.price || ""}
                    onChange={(e) => updateItem(item.id, "price", Number.parseFloat(e.target.value) || 0)}
                  />
                </div>
                {items.length > 1 && (
                  <Button variant="outline" size="sm" onClick={() => removeItem(item.id)} className="mb-0">
                    ×
                  </Button>
                )}
              </div>
            ))}

            <Button variant="outline" onClick={addItem} className="w-full bg-transparent">
              <Plus className="w-4 h-4 mr-2" />
              Add Item
            </Button>

            <div className="flex justify-between items-center pt-4 border-t">
              <span className="text-lg font-semibold">Total:</span>
              <span className="text-2xl font-bold text-blue-600">{totals.itemsTotal.toFixed(2)}</span>
            </div>

            <div className="flex gap-2">
              {hasUserInput && (
                <Link href="/">
                  <Button variant="outline" className="flex-1 bg-transparent">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                </Link>
              )}
              <Link href="/per-head/people" className="flex-1">
                <Button className="w-full" disabled={!items.some((it) => it.name.trim() && it.price > 0)}>
                  Next
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


